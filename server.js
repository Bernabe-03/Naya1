
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@googlemaps/google-maps-services-js';

// Modèles
import User from './models/userModel.js';
import Expedition from './models/Expedition.js';
import Destination from './models/Destination.js';
import Colis from './models/Colis.js';
import Commande from './models/Commande.js';
import Coursier from './models/Coursier.js';
import { generateCommandeId } from './models/Counter.js';
import managerRouter from './routes/managerRoutes.js';

// Middleware
import { 
  adminProtect, 
  managerProtect, 
  protect,
  optionalProtect 
} from './middleware/authMiddleware.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Configuration de Multer
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Connexion à MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
// Configuration CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', 
  'https://naya-nine.vercel.app', 
  'https://naya1.onrender.com'   
];

const corsOptions = {
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (comme Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Origin bloqué par CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/manager', managerRouter);
// Connexion à la base de données
(async () => {
  try {
    await connectDB();
    console.log('✅ Connecté à MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur en cours d'exécution sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Échec connexion MongoDB:', error.message);
    process.exit(1);
  }
})();
app.use((req, res, next) => {
  const phoneRoutes = [
    '/api/auth/check-user',
    '/api/auth/register',
    '/api/auth/login',
    '/api/manager/coursiers'
  ];

  if (phoneRoutes.some(route => req.path.startsWith(route))) {
    if (req.body.phone) {
      let cleaned = req.body.phone.replace(/\D/g, '');
      
      if (cleaned.startsWith('225') && cleaned.length === 13) {
        req.body.phone = cleaned;
      } else if (cleaned.length === 10) {
        req.body.phone = '225' + cleaned;
      } else if (cleaned.length === 13 && !cleaned.startsWith('225')) {
        req.body.phone = '225' + cleaned.substring(3);
      } else {
        req.body.phone = cleaned;
      }
    }
  }
  next();
});
const validatePhone = (phone) => /^225(01|05|07)\d{8}$/.test(phone);
// Routes d'authentification
app.post('/api/auth/check-user', async (req, res) => {
  try {
    const { phone, role } = req.body;
    
    if (!validatePhone(phone)) {
      return res.status(400).json({ 
        message: "Numéro invalide. Format attendu: 10 chiffres après 225 (ex: 2250700000000)" 
      });
    }
    
    const user = await User.findOne({ phone, role });
    res.json({ exists: !!user });
  } catch (error) {
    console.error('Erreur vérification utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});
app.post('/api/auth/register', async (req, res) => {
  try {
    let { fullName, phone, email = '', password, adresse = '', role = 'client' } = req.body;
    
    const errors = [];
    
    if (!fullName || fullName.trim().length < 2) {
      errors.push("Le nom complet est requis (min. 2 caractères)");
    }
    
    if (!phone || !validatePhone(phone)) {
      errors.push("Numéro invalide. Format: 10 chiffres après 225 (ex: 2250700000000)");
    }
    
    if (!password || password.length < 8) {
      errors.push("Le mot de passe doit contenir au moins 8 caractères");
    }
    
    const validRoles = ['client', 'manager', 'admin', 'coursier'];
    if (!validRoles.includes(role)) {
      errors.push("Rôle invalide");
    }
    
    if (validatePhone(phone)) {
      const existingPhone = await User.findOne({ phone, role });
      if (existingPhone) errors.push("Ce numéro est déjà utilisé pour ce rôle");
    }
    
    if (email) {
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        errors.push("Adresse e-mail invalide");
      } else {
        const existingEmail = await User.findOne({ email, role });
        if (existingEmail) errors.push("Cet email est déjà utilisé pour ce rôle");
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const userData = {
      fullName,
      phone,
      email,
      adresse,
      password: hashedPassword,
      role
    };

    const user = await User.create(userData);

    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      adresse: user.adresse,
      role: user.role,
      token
    });
    
  } catch (error) {
    console.error('Erreur inscription:', error);
    
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(400).json({ errors: ['Ce numéro est déjà utilisé'] });
    }
    
    res.status(500).json({
      errors: ['Erreur serveur lors de la création du compte'],
      message: error.message
    });
  }
});
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;
    
    if (!identifier || !password || !role) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    
    const normalizePhone = (phone) => {
      const cleaned = (phone || '').replace(/\D/g, '');
      if (cleaned.length === 10 && ['01','05','07'].includes(cleaned.substring(0,2))) {
        return '225' + cleaned;
      }
      if (cleaned.length === 13 && cleaned.startsWith('225') && ['01','05','07'].includes(cleaned.substring(3,5))) {
        return cleaned;
      }
      return null;
    };
    
    const normalizedPhone = normalizePhone(identifier);
    
    if (!normalizedPhone) {
      return res.status(400).json({ message: 'Numéro de téléphone invalide' });
    }
    
    const user = await User.findOne({ phone: normalizedPhone, role });
    
    if (!user) {
      return res.status(401).json({ message: 'Identifiants incorrects ou rôle invalide' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }
    
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );
    
    res.json({
      _id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      adresse: user.adresse,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});
// Route pour les utilisateurs connectés
app.post('/api/commandes', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const { 
      expedition, 
      destination, 
      colis, 
      acceptCGU 
    } = req.body;

    const commandeId = await generateCommandeId();
    
    const expeditionDoc = new Expedition({
      nomComplet: expedition.nomComplet,
      telephone: expedition.telephone,
      adresse: expedition.adresse || '',
      email: expedition.email || '',
      commandeId
    });

    const destinationDoc = new Destination({
      nomComplet: destination.nomComplet,
      telephone: destination.telephone,
      whatsapp: destination.whatsapp,
      adresse: destination.adresse,
      commandeId
    });

    // Validation de la date de livraison
    let dateLivraisonValide;
    try {
      dateLivraisonValide = new Date(colis.dateLivraison);
      if (isNaN(dateLivraisonValide.getTime())) {
        throw new Error('Date invalide');
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Date de livraison invalide",
        error: error.message
      });
    }

    const colisDoc = new Colis({
      description: colis.description,
      type: colis.type,
      nombre: colis.nombre,
      poids: colis.poids || 0,
      dimensions: colis.dimensions || '',
      valeur: colis.valeur || 0,
      assurance: colis.assurance || false,
      dateLivraison: dateLivraisonValide,
      heureLivraison: colis.heureLivraison, 
      instructions: colis.instructions || '',
      commandeId
    });

    const [savedExpedition, savedDestination, savedColis] = await Promise.all([
      expeditionDoc.save(),
      destinationDoc.save(),
      colisDoc.save()
    ]);

    const commande = new Commande({
      userId,
      commandeId,
      status: 'En attente',
      expedition: savedExpedition._id,
      destination: savedDestination._id,
      colis: savedColis._id,
      acceptCGU
    });
    
    const savedCommande = await commande.save();

    res.status(201).json({
      success: true,
      message: "Commande créée avec succès",
      commande: {
        ...savedCommande.toObject(),
        expedition: savedExpedition.toObject(),
        destination: savedDestination.toObject(),
        colis: savedColis.toObject()
      }
    });
    
  } catch (error) {
    console.error("Erreur création commande:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de la commande",
      error: error.message
    });
  }
});
// Route pour les invités (sans authentification)
app.post('/api/guest/commandes', optionalProtect, async (req, res) => {
  try {
    const userId = req.user?._id || null;
    
    const { 
      expedition, 
      destination, 
      colis, 
      acceptCGU 
    } = req.body;

    const commandeId = await generateCommandeId();
    
    const expeditionDoc = new Expedition({
      nomComplet: expedition.nomComplet,
      telephone: expedition.telephone,
      adresse: expedition.adresse || '',
      email: expedition.email || '',
      commandeId
    });

    const destinationDoc = new Destination({
      nomComplet: destination.nomComplet,
      telephone: destination.telephone,
      whatsapp: destination.whatsapp,
      adresse: destination.adresse,
      commandeId
    });

    // Validation de la date de livraison
    let dateLivraisonValide;
    try {
      dateLivraisonValide = new Date(colis.dateLivraison);
      if (isNaN(dateLivraisonValide.getTime())) {
        throw new Error('Date invalide');
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Date de livraison invalide",
        error: error.message
      });
    }

    const colisDoc = new Colis({
      description: colis.description,
      type: colis.type,
      nombre: colis.nombre,
      poids: colis.poids || 0,
      dimensions: colis.dimensions || '',
      valeur: colis.valeur || 0,
      assurance: colis.assurance || false,
      dateLivraison: dateLivraisonValide,
      heureLivraison: colis.heureLivraison, 
      instructions: colis.instructions || '',
      commandeId
    });

    const [savedExpedition, savedDestination, savedColis] = await Promise.all([
      expeditionDoc.save(),
      destinationDoc.save(),
      colisDoc.save()
    ]);

    const commande = new Commande({
      userId,
      commandeId,
      status: 'En attente',
      expedition: savedExpedition._id,
      destination: savedDestination._id,
      colis: savedColis._id,
      acceptCGU
    });
    
    const savedCommande = await commande.save();

    res.status(201).json({
      success: true,
      message: "Commande créée avec succès",
      commande: {
        ...savedCommande.toObject(),
        expedition: savedExpedition.toObject(),
        destination: savedDestination.toObject(),
        colis: savedColis.toObject()
      }
    });
    
  } catch (error) {
    console.error("Erreur création commande invité:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de la commande",
      error: error.message
    });
  }
});
// Route pour récupérer les commandes d'un utilisateur
app.get('/api/commandes/user/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Vérifier que l'utilisateur connecté est bien celui demandé
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const commandes = await Commande.find({ userId })
      .populate('expedition')
      .populate('destination')
      .populate('colis')
      .sort({ createdAt: -1 });
    
    res.json(commandes);
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer les coursiers
app.get('/api/manager/coursiers', managerProtect, async (req, res) => {
  try {
    const coursiers = await Coursier.find();
    res.json(coursiers);
  } catch (error) {
    console.error('Erreur récupération coursiers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour calculer le prix de livraison
app.get('/api/calculate-delivery-price', async (req, res) => {
  const { origin, destination } = req.query;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'Les adresses d\'origine et de destination sont requises' });
  }

  try {
    const client = new Client({});
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    const [originGeocode, destGeocode] = await Promise.all([
      client.geocode({ params: { address: origin + ', Abidjan, Côte d\'Ivoire', key: apiKey } }),
      client.geocode({ params: { address: destination + ', Abidjan, Côte d\'Ivoire', key: apiKey } })
    ]);

    const originLocation = originGeocode.data.results[0]?.geometry?.location;
    const destLocation = destGeocode.data.results[0]?.geometry?.location;

    if (!originLocation || !destLocation) {
      return res.status(400).json({ error: 'Impossible de localiser une des adresses' });
    }

    const distanceResponse = await client.distancematrix({
      params: {
        origins: [`${originLocation.lat},${originLocation.lng}`],
        destinations: [`${destLocation.lat},${destLocation.lng}`],
        key: apiKey,
        mode: 'driving',
        region: 'ci'
      }
    });

    const distance = distanceResponse.data.rows[0]?.elements[0]?.distance?.value;

    if (!distance) {
      return res.status(400).json({ error: 'Impossible de calculer la distance' });
    }

    const distanceKm = distance / 1000;
    const price = 1000 + (100 * distanceKm);

    res.json({
      distance: distanceKm.toFixed(2) + ' km',
      price: Math.round(price),
      formattedPrice: `${Math.round(price)} FCFA`
    });

  } catch (error) {
    console.error('Erreur calcul prix livraison:', error);
    res.status(500).json({ error: 'Erreur lors du calcul du prix' });
  }
});

// Gestion des erreurs
app.get('/', (req, res) => res.json({ 
  status: 'success', 
  message: 'API NAYA Livraison', 
  version: '1.0.0' 
}));

app.use((req, res) => res.status(404).json({ error: 'Route non trouvée' }));
app.use((error, req, res, next) => {
  console.error('🔥 Erreur serveur:', error.stack);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: error.message
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'ID invalide',
      details: 'Le format de l\'ID est incorrect'
    });
  }
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token invalide',
      details: 'Le token d\'authentification est invalide'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expiré',
      details: 'Le token d\'authentification a expiré'
    });
  }
  
  // Erreur par défaut
  res.status(500).json({
    error: 'Erreur interne du serveur',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
  });
});
