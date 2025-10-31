// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
// // Middleware adminProtect
// export const adminProtect = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
    
//     if (!token) {
//       return res.status(401).json({ message: "Token manquant" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId);
    
//     if (!user || user.role !== 'admin') {
//       return res.status(403).json({ message: "Accès refusé - Rôle admin requis" });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     console.error('Erreur vérification admin:', error);
//     res.status(401).json({ message: "Token invalide" });
//   }
// };
// export const managerProtect = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
    
//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: "Accès non autorisé - Token manquant"
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId).select('-password');
    
//     if (!user || !['manager', 'admin'].includes(user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: "Accès refusé - Rôle insuffisant"
//       });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     console.error('Erreur vérification manager:', error);
//     res.status(401).json({
//       success: false,
//       message: "Token invalide ou expiré"
//     });
//   }
// };
// // Middleware principal
// export const protect = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
    
//     if (!token) {
//       return res.status(401).json({ message: "Token manquant" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId);
    
//     if (!user) {
//       return res.status(401).json({ message: "Utilisateur non trouvé" });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     console.error(error);
//     res.status(401).json({ message: "Token invalide" });
//   }
// };
// export const optionalProtect = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
    
//     if (token) {
//       try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const user = await User.findById(decoded.userId).select('-password');
        
//         // Vérification que l'utilisateur existe et a les champs requis
//         if (user) {
//           req.user = {
//             _id: user._id,
//             fullName: user.fullName || 'Utilisateur',
//             phone: user.phone,
//             email: user.email,
//             adresse: user.adresse,
//             role: user.role
//           };
//         }
//       } catch (error) {
//         console.log('Token invalide, commande en tant qu\'invité');
//       }
//     }
//     next();
//   } catch (error) {
//     console.error('Erreur authentification optionnelle:', error);
//     next();
//   }
// };





import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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
    console.log('Middleware managerProtect appelé');
    
    let token = req.headers.authorization;
    
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    
    if (!token) {
      console.log('Aucun token trouvé');
      return res.status(401).json({ error: 'Accès non autorisé' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token décodé:', decoded);
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log('Utilisateur non trouvé');
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    
    if (user.role !== 'manager' && user.role !== 'admin') {
      console.log('Rôle insuffisant:', user.role);
      return res.status(403).json({ error: 'Accès réservé aux managers' });
    }
    
    req.user = user;
    console.log('Accès autorisé pour:', user.fullName, user.role);
    next();
  } catch (error) {
    console.error('Erreur middleware manager:', error);
    return res.status(401).json({ error: 'Token invalide' });
  }
};
// Middleware principal
export const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    
    console.log('🔐 Middleware protect appelé - Token reçu:', token ? 'Oui' : 'Non');
    
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    
    if (!token) {
      console.log('❌ Aucun token trouvé');
      return res.status(401).json({ 
        success: false,
        message: "Accès non autorisé - Token manquant" 
      });
    }
    
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token décodé:', decoded);
    
    // Trouver l'utilisateur
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return res.status(401).json({ 
        success: false,
        message: "Utilisateur non trouvé" 
      });
    }
    
    req.user = {
      _id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      adresse: user.adresse,
      role: user.role
    };
    
    console.log('✅ Utilisateur authentifié:', user.fullName, user.role);
    next();
  } catch (error) {
    console.error('❌ Erreur middleware protect:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Session expirée - Veuillez vous reconnecter" 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Token invalide" 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      message: "Erreur d'authentification" 
    });
  }
};
export const optionalProtect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    
    console.log('🔐 Middleware optionalProtect - Token reçu:', token ? 'Oui' : 'Non');
    
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user) {
          req.user = {
            _id: user._id,
            fullName: user.fullName || 'Utilisateur',
            phone: user.phone,
            email: user.email,
            adresse: user.adresse,
            role: user.role
          };
          console.log('✅ Utilisateur authentifié (optionnel):', user.fullName);
        }
      } catch (tokenError) {
        console.log('⚠️ Token invalide, continuation en tant qu\'invité');
        // Ne pas bloquer la requête, continuer sans utilisateur
      }
    } else {
      console.log('🔓 Aucun token, continuation en tant qu\'invité');
    }
    
    // Si pas de token ou token invalide, req.user reste undefined
    next();
  } catch (error) {
    console.error('❌ Erreur middleware optionalProtect:', error);
    // En cas d'erreur grave, continuer quand même
    next();
  }
};