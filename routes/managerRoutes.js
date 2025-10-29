import express from 'express';
import {
  getManagerInbox,
  addToManagerInbox,
  getPendingOrders,
  assignCoursier,
  cancelOrder,
  getTrash,
  restoreFromTrash,
  emptyTrash,
  moveToTrash,
  validateOrder,
  getCoursiers,
  createCoursier,
  updateCoursier,
  updateCoursierStatus,
  deleteCoursier
} from '../controllers/managerController.js';

const router = express.Router();

// Routes existantes
router.get('/inbox', getManagerInbox);
router.post('/inbox', addToManagerInbox);
router.get('/orders/pending', getPendingOrders);
router.patch('/orders/:id/assign-coursier', assignCoursier);
router.patch('/orders/:id/validate', validateOrder);
router.patch('/orders/:id/cancel', cancelOrder);
router.get('/trash', getTrash);
router.patch('/trash/:id/restore', restoreFromTrash);
router.delete('/trash', emptyTrash);
router.post('/move-to-trash', moveToTrash);

// Routes coursiers - CORRIGÉES
router.get('/coursiers', getCoursiers);
router.post('/coursiers', createCoursier);
router.put('/coursiers/:id', updateCoursier);
router.patch('/coursiers/:id/status', updateCoursierStatus);
router.delete('/coursiers/:id', deleteCoursier);

export default router;