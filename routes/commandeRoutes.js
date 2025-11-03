// import { Router } from 'express';
// import {
//   createCommande,
//   getCommandes,
//   getCommandeById,
//   getCommandeByRef,
//   getUserCommandes,
//   updateCommande,
//   updateCommandeStatus,
//   deleteCommande
// } from '../controllers/commandeController.js';
// import { protect, optionalProtect } from '../middleware/authMiddleware.js'; 

// const router = Router();

// // 🔧 CORRECTION: Ajout de logs pour le débogage
// router.use((req, res, next) => {
//   console.log(`📦 CommandeRouter: ${req.method} ${req.path}`);
//   next();
// });

// // Routes principales
// router.route('/')
//   .post(protect, createCommande) 
//   .get(protect, getCommandes);

// // 🔧 CORRECTION: Route guest bien définie
// router.route('/guest')
//   .post(optionalProtect, createCommande);

// router.route('/user/:userId')
//   .get(protect, getUserCommandes);

// router.route('/:id')
//   .get(protect, getCommandeById)
//   .put(protect, updateCommande)
//   .delete(protect, deleteCommande);

// router.route('/ref/:ref')
//   .get(protect, getCommandeByRef);

// router.route('/:id/status')
//   .patch(protect, updateCommandeStatus);

// export default router;




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
import { protect, optionalProtect } from '../middleware/authMiddleware.js'; 

const router = Router();

// 🔧 CORRECTION: Ajout de logs pour le débogage
router.use((req, res, next) => {
  console.log(`📦 CommandeRouter: ${req.method} ${req.path}`);
  next();
});

// Routes principales
router.route('/')
  .post(protect, createCommande) 
  .get(protect, getCommandes);

// ⭐ CORRECTION: Route guest CORRECTE - POST uniquement
router.post('/guest', optionalProtect, createCommande);

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