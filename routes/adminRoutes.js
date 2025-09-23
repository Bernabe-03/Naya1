import express from 'express';
import { adminProtect } from '../middleware/authMiddleware.js';
import User from '../models/userModel.js';
import ActivityLog from '../models/ActivityLog.js';
import Commande from '../models/Commande.js';
import AdminSettings from '../models/AdminSettings.js';

const router = express.Router();

// Statistiques globales
router.get('/stats', adminProtect, async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const managersCount = await User.countDocuments({ role: 'manager' });
    const ordersCount = await Commande.countDocuments();
    const activeManagers = await User.countDocuments({ 
      role: 'manager', 
      status: 'online' 
    });

    res.json({
      totalUsers: usersCount,
      totalManagers: managersCount,
      totalOrders: ordersCount,
      activeManagers
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Journal d'activité
router.get('/activity-logs', adminProtect, async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    let dateFilter = {};
    
    if (period === 'day') {
      dateFilter = { timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } };
    } else if (period === 'week') {
      dateFilter = { timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (period === 'month') {
      dateFilter = { timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    }
    
    const logs = await ActivityLog.find(dateFilter)
      .populate('userId', 'fullName role')
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Gestion des managers
router.get('/managers', adminProtect, async (req, res) => {
  try {
    const managers = await User.find({ role: 'manager' })
      .select('-password');
    
    res.json(managers);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/managers', adminProtect, async (req, res) => {
  try {
    const { fullName, phone, email, password } = req.body;
    const manager = await User.create({
      fullName,
      phone,
      email,
      password,
      role: 'manager'
    });
    
    res.status(201).json(manager);
  } catch (error) {
    res.status(500).json({ error: 'Erreur création manager' });
  }
});

router.delete('/managers/:id', adminProtect, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression manager' });
  }
});

// Paramètres admin
router.get('/settings', adminProtect, async (req, res) => {
  try {
    const settings = await AdminSettings.findOne();
    res.json(settings || {});
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/settings', adminProtect, async (req, res) => {
  try {
    const settings = await AdminSettings.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour' });
  }
});

export default router;