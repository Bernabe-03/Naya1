import ManagerInbox from '../models/ManagerInbox.js';
import Commande from '../models/Commande.js';
import TrashItem from '../models/TrashItem.js';
import Coursier from '../models/Coursier.js';

// CORRECTION : Fonction getCoursiers simplifiée et robuste
export const getCoursiers = async (req, res) => {
  try {
    console.log('🔍 Début récupération coursiers...');
    const coursiers = await Coursier.find().sort({ nomComplet: 1 });
    console.log(`✅ ${coursiers.length} coursiers trouvés`);
    
    res.json({
      success: true,
      data: coursiers,
      count: coursiers.length
    });
  } catch (error) {
    console.error('❌ Erreur détaillée récupération coursiers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur interne du serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
};

// CORRECTION : Fonction createCoursier simplifiée
export const createCoursier = async (req, res) => {
  try {
    const { nomComplet, telephone, statut } = req.body;

    // Validation
    if (!nomComplet || nomComplet.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Le nom complet est obligatoire'
      });
    }

    if (!telephone || telephone.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Le numéro de téléphone est obligatoire'
      });
    }

    // Nettoyer le numéro de téléphone
    const cleanedPhone = telephone.replace(/\D/g, '');
    
    const coursier = new Coursier({
      nomComplet: nomComplet.trim(),
      telephone: cleanedPhone,
      statut: statut || 'actif'
    });

    await coursier.save();
    
    console.log(`✅ Coursier créé: ${coursier.nomComplet}`);
    
    res.status(201).json({
      success: true,
      message: 'Coursier créé avec succès',
      data: coursier
    });

  } catch (error) {
    console.error('❌ Erreur création coursier:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Un coursier avec ce numéro de téléphone existe déjà'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création du coursier',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// CORRECTION : Fonction updateCoursier
export const updateCoursier = async (req, res) => {
  try {
    const { id } = req.params;
    const { nomComplet, telephone, statut } = req.body;

    if (!nomComplet || nomComplet.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Le nom complet est obligatoire'
      });
    }

    if (!telephone || telephone.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Le numéro de téléphone est obligatoire'
      });
    }

    const cleanedPhone = telephone.replace(/\D/g, '');

    const coursier = await Coursier.findByIdAndUpdate(
      id,
      {
        nomComplet: nomComplet.trim(),
        telephone: cleanedPhone,
        statut: statut || 'actif'
      },
      { 
        new: true,
        runValidators: true 
      }
    );

    if (!coursier) {
      return res.status(404).json({
        success: false,
        error: 'Coursier non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Coursier modifié avec succès',
      data: coursier
    });

  } catch (error) {
    console.error('❌ Erreur modification coursier:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Un coursier avec ce numéro de téléphone existe déjà'
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'ID de coursier invalide'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la modification du coursier',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateCoursierStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    
    if (!statut || !['actif', 'inactif', 'congé', 'suspendu'].includes(statut)) {
      return res.status(400).json({ 
        success: false,
        error: 'Statut invalide. Doit être: actif, inactif, congé ou suspendu' 
      });
    }
    
    const coursier = await Coursier.findByIdAndUpdate(
      id, 
      { statut }, 
      { new: true }
    );
    
    if (!coursier) {
      return res.status(404).json({ 
        success: false,
        error: 'Coursier non trouvé' 
      });
    }
    
    res.json({
      success: true,
      message: `Statut du coursier modifié à: ${statut}`,
      data: coursier
    });
  } catch (error) {
    console.error('❌ Erreur modification statut coursier:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'ID de coursier invalide' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la modification du statut',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteCoursier = async (req, res) => {
  try {
    const { id } = req.params;
    const coursier = await Coursier.findByIdAndDelete(id);
    
    if (!coursier) {
      return res.status(404).json({ 
        success: false,
        error: 'Coursier non trouvé' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Coursier supprimé avec succès',
      data: coursier 
    });
  } catch (error) {
    console.error('❌ Erreur suppression coursier:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'ID de coursier invalide' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la suppression du coursier',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Vos autres fonctions existantes...
export const getManagerInbox = async (req, res) => {
  try {
    const items = await ManagerInbox.find().sort({ date: -1 });
    res.json(items);
  } catch (error) {
    console.error('Erreur récupération inbox:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const addToManagerInbox = async (req, res) => {
  try {
    const { message, sender } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message requis" });
    }

    const newMessage = await ManagerInbox.create({
      message,
      sender: sender || "Système"
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Erreur ajout inbox:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getPendingOrders = async (req, res) => {
  try {
    const commandes = await Commande.find({ status: 'En attente' })
      .populate('expedition')
      .populate('destination')
      .populate('colis')
      .sort({ createdAt: -1 });

    res.json(commandes);
  } catch (error) {
    console.error("Erreur récupération commandes en attente:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const assignCoursier = async (req, res) => {
  try {
    const { id } = req.params;
    const { coursier, status } = req.body;

    if (!coursier || !coursier.nom || !coursier.telephone) {
      return res.status(400).json({
        error: "Les informations du coursier sont obligatoires"
      });
    }

    const commande = await Commande.findById(id)
      .populate('expedition')
      .populate('destination')
      .populate('colis')
      .populate('userId');

    if (!commande) {
      return res.status(404).json({ error: "Commande non trouvée" });
    }

    commande.status = status || "En cours";
    commande.coursier = coursier;
    await commande.save();

    const messagePourDestinataire = `🚚 **NAYA LIVRAISON - VOTRE COMMANDE EST EN ROUTE !** 🚚

Bonjour ${commande.destination?.nomComplet},

Nous sommes ravis de vous informer que votre commande #${commande.commandeId} a été assignée à un coursier et est en cours de livraison !

📦 **DÉTAILS DE LA COMMANDE :**
• Numéro de commande : #${commande.commandeId}
• Expéditeur : ${commande.expedition?.nomComplet}
• Description du colis : ${commande.colis?.description || 'Non spécifiée'}
• Type de colis : ${commande.colis?.type || 'Non spécifié'}

👨‍💼 **VOTRE COURSIER :**
• Nom : ${coursier.nom}
• Téléphone : ${coursier.telephone}

📅 **LIVRAISON PRÉVUE :**
• Date : ${commande.colis?.dateLivraison ? new Date(commande.colis.dateLivraison).toLocaleDateString('fr-FR') : 'À confirmer'}
• Heure : ${commande.colis?.heureLivraison || 'À confirmer'}

📍 **ADRESSE DE LIVRAISON :**
${commande.destination?.adresse || 'Adresse non spécifiée'}

Le coursier vous contactera directement pour confirmer la livraison. Vous pouvez également le joindre au ${coursier.telephone}.

Merci pour votre confiance ! ✨

— L'équipe NAYA Livraison`;

    const inboxItem = new ManagerInbox({
      type: 'commande',
      action: 'assignation_coursier',
      commandeId: commande.commandeId,
      client: commande.expedition?.nomComplet || 'Client inconnu',
      date: new Date(),
      details: `Coursier assigné: ${coursier.nom} (${coursier.telephone})`,
      status: 'done',
      coursier: coursier,
      expedition: {
        nomComplet: commande.expedition?.nomComplet,
        telephone: commande.expedition?.telephone,
        adresse: commande.expedition?.adresse
      },
      destination: {
        nomComplet: commande.destination?.nomComplet,
        whatsapp: commande.destination?.whatsapp,
        adresse: commande.destination?.adresse
      },
      colis: {
        description: commande.colis?.description,
        type: commande.colis?.type,
        dateLivraison: commande.colis?.dateLivraison,
        heureLivraison: commande.colis?.heureLivraison
      },
      messageEnvoye: messagePourDestinataire
    });
    
    await inboxItem.save();

    res.json({
      success: true,
      message: "Coursier assigné avec succès",
      commande,
      whatsappMessage: messagePourDestinataire
    });

  } catch (error) {
    console.error("Erreur assignation coursier:", error);
    res.status(500).json({ 
      error: "Erreur lors de l'assignation du coursier",
      details: error.message
    });
  }
};

export const validateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    if (!price || isNaN(price) || price < 500) {
      return res.status(400).json({
        error: "Prix invalide. Doit être un nombre >= 500 FCFA"
      });
    }

    const commande = await Commande.findById(id)
      .populate('expedition')
      .populate('destination')
      .populate('colis')
      .populate('userId');

    if (!commande) {
      return res.status(404).json({ error: "Commande non trouvée" });
    }

    commande.status = "Confirmée";
    commande.prix = price;
    commande.paiement = {
      prixLivraison: price,
      mode: "espèces",
      status: "Validée",
      dateValidation: new Date()
    };
    
    await commande.save();

    const clientName = commande.expedition?.nomComplet || 
                      (commande.userId ? commande.userId.fullName : "Client inconnu");

    const inboxItem = new ManagerInbox({
      type: 'commande',
      action: 'validation',
      commandeId: commande.commandeId,
      client: clientName,
      date: new Date(),
      details: `Commande validée - Prix: ${price} FCFA`,
      status: 'done',
      price: price,
      expediteur: commande.expedition?.nomComplet || "Non spécifié",
      destinataire: commande.destination?.nomComplet || "Non spécifié",
      detailsColis: `${commande.colis?.description || ''} (${commande.colis?.type || ''})`
    });
    
    await inboxItem.save();

    res.json({ 
      success: true,
      message: "Commande validée avec succès",
      commande
    });

  } catch (error) {
    console.error("Erreur validation commande:", error);
    
    let errorMessage = "Erreur serveur lors de la validation";
    
    if (error.name === 'ValidationError') {
      errorMessage = "Erreur de validation des données";
    } else if (error.name === 'CastError') {
      errorMessage = "ID de commande invalide";
    }
    
    res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const commande = await Commande.findById(id)
      .populate('expedition')
      .populate('destination');
    
    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    const updatedCommande = await Commande.findByIdAndUpdate(
      id,
      { 
        status: 'Annulée',
        dateAnnulation: new Date(),
        annulationReason: reason
      },
      { new: true }
    );
    
    const inboxItem = new ManagerInbox({
      type: 'commande',
      action: 'annulation',
      commandeId: updatedCommande.commandeId,
      client: commande.expedition?.nomComplet || "Client inconnu",
      date: new Date(),
      details: `Commande annulée - Motif: ${reason || 'Non spécifié'}`
    });
    await inboxItem.save();

    res.json(updatedCommande);
  } catch (error) {
    console.error('Erreur annulation commande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getTrash = async (req, res) => {
  try {
    const trashItems = await TrashItem.find().sort({ deletedAt: -1 });
    res.json(trashItems);
  } catch (error) {
    console.error('Erreur récupération corbeille:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const restoreFromTrash = async (req, res) => {
  try {
    const { id } = req.params;
    const trashItem = await TrashItem.findById(id);
    
    if (!trashItem) {
      return res.status(404).json({ error: 'Élément non trouvé' });
    }

    switch (trashItem.itemType) {
      case 'inbox':
        await ManagerInbox.create(trashItem.data);
        break;
      case 'commande':
        await Commande.create(trashItem.data);
        break;
    }

    await TrashItem.findByIdAndDelete(id);
    res.json({ message: 'Élément restauré avec succès' });
  } catch (error) {
    console.error('Erreur restauration élément:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const emptyTrash = async (req, res) => {
  try {
    await TrashItem.deleteMany({});
    res.json({ message: 'Corbeille vidée avec succès' });
  } catch (error) {
    console.error('Erreur vidage corbeille:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const moveToTrash = async (req, res) => {
  try {
    const { itemId, itemType } = req.body;
    
    let itemData;
    switch (itemType) {
      case 'inbox':
        itemData = await ManagerInbox.findByIdAndDelete(itemId);
        break;
      case 'commande':
        itemData = await Commande.findByIdAndDelete(itemId);
        break;
      default:
        return res.status(400).json({ error: 'Type invalide' });
    }

    if (!itemData) {
      return res.status(404).json({ error: 'Élément non trouvé' });
    }

    const trashItem = new TrashItem({
      itemType,
      itemId,
      data: itemData.toObject(),
      deletedAt: new Date()
    });

    await trashItem.save();
    res.json({ message: 'Élément déplacé dans la corbeille' });
  } catch (error) {
    console.error('Erreur déplacement corbeille:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};