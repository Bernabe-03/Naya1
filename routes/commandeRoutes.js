
import { Router } from 'express';
import {
  createCommande,
  getCommandes,
  getCommandeById,
  getCommandeByRef,
  getUserCommandes,
  updateCommande,
  updateCommandeStatus,
  deleteCommande
} from '../controllers/commandeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

//middleware d'authentification aux routes
router.route('/')
  .post(protect, createCommande)
  .get(protect, getCommandes);

router.route('/user/:userId')
  .get(protect, getUserCommandes);

router.route('/:id')
  .get(protect, getCommandeById)
  .put(protect, updateCommande)
  .delete(protect, deleteCommande);

router.route('/ref/:ref')
  .get(protect, getCommandeByRef);

router.route('/:id/status')
  .patch(protect, updateCommandeStatus);

export default router;
