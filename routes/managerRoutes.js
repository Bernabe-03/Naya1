import express from 'express';
import {
  getManagerInbox,
  addToManagerInbox,
  getPendingOrders,
  assignCoursier,
  validateOrder,
  cancelOrder,
  getTrash,
  restoreFromTrash,
  emptyTrash,
  moveToTrash,
  getCoursiers,
  createCoursier,
  updateCoursier,
  updateCoursierStatus,
  deleteCoursier,
  getOrderHistory,
  getRestoredOrders,
  markOrderAsViewed
} from '../controllers/managerController.js';

const router = express.Router();

// Routes inbox
router.get('/inbox', getManagerInbox);
router.post('/inbox', addToManagerInbox);

// Routes commandes
router.get('/orders/pending', getPendingOrders);
router.get('/orders/history', getOrderHistory);
router.get('/orders/restored', getRestoredOrders);
router.patch('/orders/:id/assign-coursier', assignCoursier);
router.patch('/orders/:id/validate', validateOrder);
router.patch('/orders/:id/cancel', cancelOrder);
router.patch('/orders/:id/mark-viewed', markOrderAsViewed);
// Routes corbeille
router.get('/trash', getTrash);
router.patch('/trash/:id/restore', restoreFromTrash);
router.delete('/trash', emptyTrash);
router.post('/move-to-trash', moveToTrash);

// Routes coursiers
router.get('/coursiers', getCoursiers);
router.post('/coursiers', createCoursier);
router.put('/coursiers/:id', updateCoursier);
router.patch('/coursiers/:id/status', updateCoursierStatus);
router.delete('/coursiers/:id', deleteCoursier);

export default router;