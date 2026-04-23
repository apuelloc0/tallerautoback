import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import clientRoutes from './clientRoutes.js';
import vehicleRoutes from './vehicleRoutes.js';
import serviceOrderRoutes from './serviceOrderRoutes.js';
import billingRoutes from './billingRoutes.js';
import inventoryRoutes from './inventoryRoutes.js'; // Asegúrate de importar esto
import invitationRoutes from './invitationRoutes.js';
import workshopConfigRoutes from './workshopConfigRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/service-orders', serviceOrderRoutes);
router.use('/inventory', inventoryRoutes); // Agregamos la ruta
router.use('/billing', billingRoutes);
router.use('/invitations', invitationRoutes);
router.use('/workshop-config', workshopConfigRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;