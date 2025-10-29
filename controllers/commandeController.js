import ManagerInbox from '../models/ManagerInbox.js';
import Commande from '../models/Commande.js';
import TrashItem from '../models/TrashItem.js';

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

// Nouvelle fonction pour assigner un coursier
export const assignCoursier = async (req, res) => {
  try {
    const { id } = req.params;
    const { coursier, status } = req.body;

    // Récupérer la commande avec les données liées
    const commande = await Commande.findById(id)
      .populate('expedition')
      .populate('destination')
      .populate('colis')
      .populate('userId');

    if (!commande) {
      return res.status(404).json({ error: "Commande non trouvée" });
    }

    // Mettre à jour la commande avec les informations du coursier
    commande.status = status || "Assignée";
    commande.coursier = coursier;
    commande.dateAssignation = new Date();
    
    await commande.save();

    res.json({ 
      success: true,
      message: "Coursier assigné avec succès",
      commande
    });

  } catch (error) {
    console.error("Erreur assignation coursier:", error);
    
    let errorMessage = "Erreur serveur lors de l'assignation du coursier";
    
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
    
    // Sauvegarder dans l'historique avec toutes les informations
    const inboxItem = new ManagerInbox({
      type: 'commande',
      action: 'annulation',
      commandeId: updatedCommande.commandeId,
      client: commande.expedition?.nomComplet || "Client inconnu",
      date: new Date(),
      details: `Commande annulée - Motif: ${reason || 'Non spécifié'}`,
      status: 'done',
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
      }
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