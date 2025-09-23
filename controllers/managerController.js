
import ManagerInbox from '../models/ManagerInbox.js';
import Commande from '../models/Commande.js';
import TrashItem from '../models/TrashItem.js';
import Expedition from '../models/Expedition.js';
import Destination from '../models/Destination.js';
import Colis from '../models/Colis.js';
import User from '../models/userModel.js';

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
    const newItem = new ManagerInbox(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Erreur création item inbox:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getPendingOrders = async (req, res) => {
  try {
    const orders = await Commande.find({ status: 'En attente' })
      .populate('expedition')
      .populate('destination')
      .populate('colis')
      .populate('userId');
      
    res.json(orders);
  } catch (error) {
    console.error('Erreur récupération commandes en attente:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const validateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    // Validation du prix
    if (!price || isNaN(price) || price < 500) {
      return res.status(400).json({
        error: "Prix invalide. Doit être un nombre >= 500 FCFA"
      });
    }

    // Récupérer la commande avec les données liées
    const commande = await Commande.findById(id)
      .populate('expedition')
      .populate('destination')
      .populate('colis')
      .populate('userId');

    if (!commande) {
      return res.status(404).json({ error: "Commande non trouvée" });
    }

    // Si la commande a un utilisateur associé, vérifier et compléter les champs manquants
    if (commande.userId) {
      let needsUpdate = false;
      
      if (!commande.userId.fullName) {
        commande.userId.fullName = "Client inconnu";
        needsUpdate = true;
      }
      
      if (!commande.userId.phone) {
        commande.userId.phone = "Non spécifié";
        needsUpdate = true;
      }
      
      if (!commande.userId.role) {
        commande.userId.role = "client";
        needsUpdate = true;
      }
      
      // Sauvegarder les modifications si nécessaire
      if (needsUpdate) {
        await commande.userId.save();
      }
    }

    // Mettre à jour la commande
    commande.status = "Confirmée";
    commande.prix = price;
    commande.paiement = {
      prixLivraison: price,
      mode: "espèces",
      status: "Validée",
      dateValidation: new Date()
    };
    
    await commande.save();

    // Déterminer le nom du client
    const clientName = commande.expedition?.nomComplet || 
                      (commande.userId ? commande.userId.fullName : "Client inconnu");

    // Ajouter à l'historique
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
    
    // Gestion d'erreur détaillée
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

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Récupération de la commande existante pour comparaison
    const existingOrder = await Commande.findById(id);
    if (!existingOrder) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const updatedCommande = await Commande.findByIdAndUpdate(id, updates, { new: true })
    .populate('expedition')
    .populate('destination')
    .populate('colis');

    // Détection des changements
    const changes = {};
    for (const key in updates) {
      if (JSON.stringify(existingOrder[key]) !== JSON.stringify(updates[key])) {
        changes[key] = {
          old: existingOrder[key],
          new: updates[key]
        };
      }
    }

    // Création de la notification
    const inboxItem = new ManagerInbox({
      type: 'commande',
      action: 'modification',
      commandeId: updatedCommande.commandeId,
      client: updatedCommande.expedition?.nomComplet || "Client inconnu",
      date: new Date(),
      details: `Commande modifiée - ${Object.keys(changes).length} changement(s)`,
      changes: changes
    });
    
    await inboxItem.save();
    res.json(updatedCommande);
  } catch (error) {
    console.error('Erreur modification commande:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message
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