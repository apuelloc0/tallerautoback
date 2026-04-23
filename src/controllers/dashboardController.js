import supabase from '../config/db.js';
import { CLIENTS_TABLE } from '../models/Client.js';
import { USERS_TABLE } from '../models/User.js';

/** GET /api/dashboard - Estadísticas para el panel de inicio */
export const getStats = async (req, res, next) => {
  try {
    // Consultas paralelas en Supabase
    const [clients, orders, inventory, technicians] = await Promise.all([
      supabase.from(CLIENTS_TABLE).select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('service_orders').select('status'),
      supabase.from('inventory').select('stock, min_stock'),
      supabase.from(USERS_TABLE).select('*', { count: 'exact', head: true }).eq('role', 'TECNICO').eq('active', true)
    ]);

    if (clients.error || orders.error || inventory.error) throw new Error('Error consultando estadísticas');

    const totalClients = clients.count || 0;
    const activeOrders = orders.data.filter(o => o.status !== 'ENTREGADO').length;
    const readyToDeliver = orders.data.filter(o => o.status === 'LISTO').length;
    
    // Alertas de inventario
    const lowStockAlerts = inventory.data.filter(i => i.stock <= i.min_stock).length;

    const totalTechnicians = technicians.count || 0;

    res.json({
      ok: true,
      data: {
        kpis: {
          clients: totalClients,
          activeOrders,
          readyToDeliver,
          technicians: totalTechnicians
        },
        alerts: {
          lowStock: lowStockAlerts
        }
      },
    });
  } catch (err) {
    next(err);
  }
};
