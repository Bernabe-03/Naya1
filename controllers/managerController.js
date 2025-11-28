import ManagerInbox from '../models/ManagerInbox.js';
import Commande from '../models/Commande.js';
import TrashItem from '../models/TrashItem.js';
import Coursier from '../models/Coursier.js';

// Fonction getCoursiers simplifiée et robuste - CORRIGÉE
export const getCoursiers = async (req, res) => {
  try {
    console.log('🔍 Début récupération coursiers...');
    const coursiers = await Coursier.find().sort({ nomComplet: 1 });
    console.log(`✅ ${coursiers.length} coursiers trouvés`);

    // ****************************************************************************
    // ÉTANT DONNÉ LA NATURE DE L'ERREUR DE FRONTEND, ON OPTE POUR LE RENVOI DIRECT:
    res.json(coursiers); 
    // ****************************************************************************
  } catch (error) {
    console.error('❌ Erreur récupération coursiers:', error);
    
    // Renvoyer une réponse d'erreur 500 avec un tableau vide
    res.status(500).json({ 
      success: false,
      data: [], // Assure que le frontend peut toujours utiliser Array.isArray() ou .length
      count: 0,
      error: 'Erreur interne du serveur'
    });
  }
};
// Même format pour l'historique
export const getManagerInbox = async (req, res) => {
  try {
    const items = await ManagerInbox.find().sort({ date: -1 });
    res.json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (error) {
    console.error('Erreur récupération inbox:', error);
    res.status(500).json({ 
      success: false,
      data: [],
      error: 'Erreur serveur' 
    });
  }
};
// Fonction createCoursier (Non modifiée - Déjà correcte)
export const createCoursier = async (req, res) => {
  try {
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
// Fonction updateCoursier (Non modifiée - Déjà correcte)
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
// Fonction pour récupérer l'historique des commandes traitées (Non modifiée - Déjà correcte)
export const getOrderHistory = async (req, res) => {
  try {
    console.log('📋 Récupération historique commandes...');
    
    // Récupérer toutes les commandes qui ne sont plus "En attente"
    const commandes = await Commande.find({ 
      status: { $ne: 'En attente' } 
    })
      .populate('expedition')
      .populate('destination')
      .populate('colis')
      .sort({ updatedAt: -1 });

    console.log(`✅ ${commandes.length} commandes dans l'historique`);
    
    res.json({
      success: true,
      data: commandes,
      count: commandes.length,
      message: `${commandes.length} commandes récupérées de l'historique`
    });
  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    res.status(500).json({ 
      success: false,
      data: [],
      count: 0,
      error: 'Erreur lors de la récupération de l\'historique'
    });
  }
};
// NOUVEAU : Fonction pour récupérer les commandes restaurées - CORRIGÉE (ajout d'un tableau dans l'erreur)
export const getRestoredOrders = async (req, res) => {
  try {
    console.log('🔄 Récupération des commandes restaurées...');
    
    // Récupérer les commandes qui ont été restaurées
    const commandes = await Commande.find({ 
      restored: true,
      status: 'En attente'
    })
      .populate('expedition')
      .populate('destination')
      .populate('colis')
      .sort({ restoredAt: -1 });

    console.log(`✅ ${commandes.length} commandes restaurées trouvées`);
    
    res.json(commandes);
  } catch (error) {
    console.error('❌ Erreur récupération commandes restaurées:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des commandes restaurées',
      data: [] // Ajout d'un tableau vide en cas d'erreur
    });
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
    const commandes = await Commande.find({ 
      status: 'En attente',
      restored: { $ne: true } // Exclure les commandes restaurées
    })
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

    console.log('🔍 Début assignation coursier:', { id, coursier, status });

    // Validation robuste des données
    if (!coursier || typeof coursier !== 'object') {
      return res.status(400).json({ 
        success: false,
        error: "Données du coursier manquantes ou invalides" 
      });
    }

    if (!coursier.nomComplet || !coursier.telephone) {
      return res.status(400).json({ 
        success: false,
        error: "Les informations du coursier (nom et téléphone) sont obligatoires" 
      });
    }

    // Recherche de la commande avec gestion d'erreur améliorée
    let commande;
    try {
      commande = await Commande.findById(id)
        .populate('expedition')
        .populate('destination')
        .populate('colis')
        .populate('userId');
    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError);
      return res.status(500).json({ 
        success: false,
        error: "Erreur d'accès à la base de données" 
      });
    }

    if (!commande) {
      console.log('❌ Commande non trouvée:', id);
      return res.status(404).json({ 
        success: false,
        error: "Commande non trouvée" 
      });
    }

    console.log('✅ Commande trouvée:', commande.commandeId);

    // Mise à jour de la commande
    try {
      commande.status = status || "En cours";
      commande.coursier = {
        nomComplet: coursier.nomComplet,
        telephone: coursier.telephone
      };
      commande.dateAssignation = new Date();
      
      await commande.save();
      console.log('✅ Commande mise à jour avec succès');
    } catch (updateError) {
      console.error('❌ Erreur mise à jour commande:', updateError);
      return res.status(500).json({ 
        success: false,
        error: "Erreur lors de la mise à jour de la commande" 
      });
    }

    // ⭐⭐ CORRECTION : Construction du message WhatsApp avec les bonnes données ⭐⭐
    const messagePourDestinataire = `🚚 **NAYA SERVICE DE LIVRAISON!** 🚚

Bonjour ${commande.destination?.nomComplet || 'cher client'},

Nous sommes ravis de vous informer que votre commande #${commande.commandeId} a été assignée à un coursier et est en cours de livraison !

📦 **DÉTAILS DE LA COMMANDE :**
• Numéro de commande : #${commande.commandeId}
• Expéditeur : ${commande.expedition?.nomComplet || 'Non spécifié'}
• Description du colis : ${commande.colis?.description || 'Non spécifiée'}
• Type de colis : ${commande.colis?.type || 'Non spécifié'}

👨‍💼 **VOTRE COURSIER :**
• Nom : ${coursier.nomComplet}
• Téléphone : ${coursier.telephone}

📅 **LIVRAISON PRÉVUE :**
• Date : ${commande.colis?.dateLivraison ? new Date(commande.colis.dateLivraison).toLocaleDateString('fr-FR') : 'À confirmer'}
• Heure : ${commande.colis?.heureLivraison || 'À confirmer'}

📍 **ADRESSE DE LIVRAISON :**
${commande.destination?.adresse || 'Adresse non spécifiée'}

Le coursier vous contactera directement pour confirmer la livraison. Vous pouvez également le joindre au ${coursier.telephone}.

Merci pour votre confiance ! ✨

— L'équipe NAYA Livraison`;

    // Enregistrement dans l'historique
    try {
      const inboxItem = new ManagerInbox({
        type: 'commande',
        action: 'assignation_coursier',
        commandeId: commande.commandeId,
        client: commande.expedition?.nomComplet || 'Client inconnu',
        date: new Date(),
        details: `Coursier assigné: ${coursier.nomComplet} (${coursier.telephone})`,
        status: 'done',
        coursier: {
          nomComplet: coursier.nomComplet,  
          telephone: coursier.telephone
        },
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
      console.log('✅ Entrée historique créée');
    } catch (inboxError) {
      console.error('❌ Erreur création historique:', inboxError);
      // On ne bloque pas l'assignation si l'historique échoue
    }

    res.json({
      success: true,
      message: "Coursier assigné avec succès",
      commande,
      whatsappMessage: messagePourDestinataire
    });

  } catch (error) {
    console.error("❌ Erreur générale assignation coursier:", error);
    res.status(500).json({ 
      success: false,
      error: "Erreur lors de l'assignation du coursier",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    let restoredItem;

    if (trashItem.itemType === 'commande') {
      // Restaurer la commande avec le marqueur restored
      restoredItem = await Commande.create({
        ...trashItem.data,
        _id: undefined, // Laisser MongoDB générer un nouvel ID
        restored: true,
        restoredAt: new Date(),
        status: 'En attente'
      });
    } else {
      return res.status(400).json({ error: 'Type non supporté' });
    }

    await TrashItem.findByIdAndDelete(id);
    
    res.json({ 
      message: 'Élément restauré avec succès',
      restoredOrder: restoredItem 
    });
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
// Route pour marquer une commande comme vue
export const markOrderAsViewed = async (req, res) => {
  try {
    const { id } = req.params;
    
    const commande = await Commande.findByIdAndUpdate(
      id,
      { 
        viewed: true,
        viewedAt: new Date()
      },
      { new: true }
    );
    
    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    res.json({ 
      success: true, 
      message: 'Commande marquée comme vue',
      commande 
    });
  } catch (error) {
    console.error('Erreur marquage commande vue:', error);
    res.status(500).json({ 
      error: 'Erreur lors du marquage de la commande comme vue' 
    });
  }
};