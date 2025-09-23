import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
// Middleware adminProtect
export const adminProtect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Accès refusé - Rôle admin requis" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur vérification admin:', error);
    res.status(401).json({ message: "Token invalide" });
  }
};
export const managerProtect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Accès non autorisé - Token manquant"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !['manager', 'admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé - Rôle insuffisant"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur vérification manager:', error);
    res.status(401).json({
      success: false,
      message: "Token invalide ou expiré"
    });
  }
};
// Middleware principal
export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Token invalide" });
  }
};
export const optionalProtect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        // Vérification que l'utilisateur existe et a les champs requis
        if (user) {
          req.user = {
            _id: user._id,
            fullName: user.fullName || 'Utilisateur',
            phone: user.phone,
            email: user.email,
            adresse: user.adresse,
            role: user.role
          };
        }
      } catch (error) {
        console.log('Token invalide, commande en tant qu\'invité');
      }
    }
    next();
  } catch (error) {
    console.error('Erreur authentification optionnelle:', error);
    next();
  }
};

