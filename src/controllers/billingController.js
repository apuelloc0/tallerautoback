import supabase from '../config/db.js';
import { PAYMENTS_TABLE } from '../models/Payment.js';
import { CLIENTS_TABLE } from '../models/Client.js';
import { WORKSHOP_CONFIG_TABLE } from '../models/WorkshopConfig.js';
import { getPublicPath } from '../config/upload.js';
import PDFDocument from 'pdfkit';
import { loadInstitutionGeneral, drawReportHeader, drawGeneratedFooter } from '../utils/reportLayout.js';

/** Listar facturas con información de cliente y orden */
export const listInvoices = async (req, res, next) => {
  try {
    const { status, clientId } = req.query;
    let query = supabase
      .from('invoices')
      .select('*, clients(*), service_orders(*)');

    // SEGURIDAD SaaS: Filtrar por taller
    if (req.user.role === 'SUPER_ADMIN') {
      const filterWsId = req.query.workshopId || req.query.workshop_id;
      query = filterWsId ? query.eq('workshop_id', filterWsId) : query.is('workshop_id', null);
    } else {
      query = query.eq('workshop_id', req.user.workshop_id);
    }

    if (status) query = query.eq('status', status);
    if (clientId) query = query.eq('client_id', clientId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

/** Crear factura basada en los ítems de una orden de servicio */
export const createInvoice = async (req, res, next) => {
  try {
    const { order_id, labor_cost } = req.body;

    // 1. Obtener la orden y sus ítems
    const { data: order, error: orderError } = await supabase
      .from('service_orders')
      .select('*, order_items(*)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) return res.status(404).json({ ok: false, message: 'Orden no encontrada' });

    // 2. Obtener configuración para el IVA
    // SEGURIDAD SaaS: Usar la tasa configurada en el taller del usuario, no una global con ID 1
    const taxPercentage = req.user.tax_rate || 16;

    // 3. Calcular totales
    const partsTotal = order.order_items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
    const labor = Number(labor_cost) || 0;
    const subtotal = partsTotal + labor;
    const tax = subtotal * (Number(taxPercentage) / 100);
    const total = subtotal + tax;

    // 4. Insertar factura
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert([{
        order_id,
        client_id: order.client_id,
        workshop_id: order.workshop_id || req.user.workshop_id, // Fallback al taller del usuario
        subtotal_usd: subtotal,
        tax_usd: tax,
        total_usd: total,
        status: 'PENDIENTE'
      }])
      .select()
      .single();

    if (invError) {
      console.error('❌ Error de Supabase al generar factura:', invError);
      return res.status(400).json({ ok: false, message: invError.message });
    }

    res.status(201).json({ ok: true, data: invoice, message: 'Factura generada exitosamente.' });
  } catch (err) {
    next(err);
  }
};

/** Registrar un pago a una factura */
export const addPayment = async (req, res, next) => {
  try {
    const { invoice_id, amount_usd, payment_method, reference_number } = req.body;
    const workshop_id = req.user.workshop_id;

    // SEGURIDAD SaaS: Verificar que la factura pertenezca al taller del usuario
    if (req.user.role !== 'SUPER_ADMIN') {
      const { data: invoiceCheck, error: checkError } = await supabase
        .from('invoices')
        .select('workshop_id')
        .eq('id', invoice_id)
        .single();

      if (checkError || !invoiceCheck || invoiceCheck.workshop_id !== workshop_id) {
        return res.status(403).json({ ok: false, message: 'No tiene permiso para registrar pagos en esta factura.' });
      }
    }

    const { data: payment, error } = await supabase
      .from(PAYMENTS_TABLE)
      .insert([{
        invoice_id,
        amount_usd,
        workshop_id, // Aislamiento del pago por taller
        payment_method,
        reference_number,
        paid_at: new Date()
      }])
      .select()
      .single();

    if (error) throw error;

    // Actualizar estado de la factura si el pago es total (simplificado)
    await supabase.from('invoices').update({ status: 'PAGADA' }).eq('id', invoice_id);

    res.status(201).json({ ok: true, data: payment, message: 'Pago registrado.' });
  } catch (err) {
    next(err);
  }
};

/** PDF: Generar Factura de Taller */
export const invoicePdf = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener factura con todo el detalle relacional
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients(*),
        workshops(*),
        service_orders(
          *,
          vehicles(*),
          order_items(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !invoice) return res.status(404).json({ ok: false, message: 'Factura no encontrada' });

    // SEGURIDAD SaaS: Verificar pertenencia antes de generar PDF
    if (req.user.role !== 'SUPER_ADMIN' && invoice.workshop_id !== req.user.workshop_id) {
      return res.status(403).json({ ok: false, message: 'No tiene permiso para ver esta factura.' });
    }

    const filename = `factura-${invoice.id.slice(0, 8)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // SEGURIDAD SaaS: Cargamos la info del taller desde la relación de la factura
    const workshopInfo = invoice.workshops || {
      workshop_name: req.user.workshop_name,
      address: req.user.address,
      phone: req.user.phone,
      rif: req.user.rif || ''
    };

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    drawReportHeader(doc, {
      institution: workshopInfo,
      reportTitle: 'FACTURA DE SERVICIO',
      reportSubtitle: `Factura N°: ${invoice.id.slice(0, 8)}`
    });

    const left = doc.page.margins.left;
    const usableW = doc.page.width - left - doc.page.margins.right;

    // Datos del Cliente y Vehículo
    doc.fontSize(10).font('Helvetica-Bold').text('CLIENTE:', left, doc.y + 10);
    doc.font('Helvetica').text(`${invoice.clients.first_name} ${invoice.clients.last_name} - ID: ${invoice.clients.id_number || 'S/D'}`);
    
    doc.font('Helvetica-Bold').text('VEHÍCULO:', left, doc.y + 5);
    const v = invoice.service_orders.vehicles;
    doc.font('Helvetica').text(`${v.brand} ${v.model} (${v.year}) - PLACA: ${v.plate}`);

    doc.moveDown();
    doc.moveTo(left, doc.y).lineTo(left + usableW, doc.y).stroke();
    doc.moveDown(0.5);

    // Cabecera de tabla de ítems
    const yTable = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Descripción', left, yTable);
    doc.text('Cant.', left + 250, yTable, { width: 40, align: 'right' });
    doc.text('Precio', left + 300, yTable, { width: 60, align: 'right' });
    doc.text('Total', left + 380, yTable, { width: 60, align: 'right' });
    
    doc.moveDown(0.5);

    // Listar repuestos y servicios
    doc.font('Helvetica');
    invoice.service_orders.order_items.forEach(item => {
      const yRow = doc.y;
      doc.text(item.description, left, yRow, { width: 240 });
      doc.text(item.quantity.toString(), left + 250, yRow, { width: 40, align: 'right' });
      doc.text(`$${Number(item.price).toLocaleString()}`, left + 300, yRow, { width: 60, align: 'right' });
      doc.text(`$${(Number(item.price) * item.quantity).toLocaleString()}`, left + 380, yRow, { width: 60, align: 'right' });
      doc.moveDown(0.5);
    });

    // Como no hay columna de mano de obra, calculamos la diferencia si el total no coincide con los repuestos
    const partsTotal = invoice.service_orders.order_items.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
    const laborDiff = Number(invoice.subtotal_usd) - partsTotal;

    if (laborDiff > 0) {
      const yRow = doc.y;
      doc.text('Mano de obra y servicios técnicos', left, yRow, { width: 240 });
      doc.text('1', left + 250, yRow, { width: 40, align: 'right' });
      doc.text(`$${laborDiff.toLocaleString()}`, left + 300, yRow, { width: 60, align: 'right' });
      doc.text(`$${laborDiff.toLocaleString()}`, left + 380, yRow, { width: 60, align: 'right' });
      doc.moveDown(0.5);
    }

    doc.moveDown();
    doc.moveTo(left + 250, doc.y).lineTo(left + usableW, doc.y).stroke();
    doc.moveDown(0.5);

    // Totales
    const finalX = left + 300;
    doc.text('SUBTOTAL:', finalX, doc.y, { width: 70, align: 'right' });
    doc.text(`$${Number(invoice.subtotal_usd).toLocaleString()}`, left + 380, doc.y - 12, { width: 60, align: 'right' });
    
    doc.moveDown(0.2);
    doc.text('IVA:', finalX, doc.y, { width: 70, align: 'right' });
    doc.text(`$${Number(invoice.tax_usd).toLocaleString()}`, left + 380, doc.y - 12, { width: 60, align: 'right' });

    doc.moveDown(0.2);
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('TOTAL:', finalX, doc.y, { width: 70, align: 'right' });
    doc.text(`$${Number(invoice.total_usd).toLocaleString()}`, left + 380, doc.y - 14, { width: 60, align: 'right' });

    drawGeneratedFooter(doc);
    doc.end();
  } catch (err) {
    if (!res.headersSent) next(err);
  }
};
