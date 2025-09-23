import express from 'express';
import { 
  getUserCommandes, 
  updateUser, 
  changePassword 
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();

router.get('/:id/commandes', protect, getUserCommandes);
router.put('/:id', protect, updateUser);
router.put('/:id/password', protect, changePassword);

export default router;