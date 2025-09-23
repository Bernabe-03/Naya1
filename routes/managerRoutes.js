import express from 'express';
import {
  getManagerInbox,
  addToManagerInbox,
  getPendingOrders,
  validateOrder,
  updateOrder,
  cancelOrder,
  getTrash,
  restoreFromTrash,
  emptyTrash,
  moveToTrash
} from '../controllers/managerController.js';
import { managerProtect } from '../middleware/authMiddleware.js';
const router = express.Router();
// Gestionnaire d'erreurs global pour cette route
const handleErrors = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    console.error('Erreur dans la route manager:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
router.post('/inbox', managerProtect, handleErrors(addToManagerInbox));
router.get('/inbox', managerProtect, handleErrors(getManagerInbox));
router.get('/orders/pending', managerProtect, handleErrors(getPendingOrders));
router.patch('/orders/:id/validate', managerProtect, handleErrors(validateOrder));
router.patch('/orders/:id', managerProtect, handleErrors(updateOrder));
router.patch('/orders/:id/cancel', managerProtect, handleErrors(cancelOrder));
router.get('/trash', managerProtect, handleErrors(getTrash));
router.patch('/trash/:id/restore', managerProtect, handleErrors(restoreFromTrash));
router.delete('/trash', managerProtect, handleErrors(emptyTrash));
router.post('/move-to-trash', managerProtect, handleErrors(moveToTrash));

export default router;
