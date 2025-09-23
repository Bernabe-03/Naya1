import Expedition from '../models/Expedition.js';
import Destination from '../models/Destination.js';
import Colis from '../models/Colis.js';
import Commande from '../models/Commande.js';
import ManagerInbox from '../models/ManagerInbox.js';
import { generateCommandeId } from '../models/Counter.js';

export const createCommande = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : req.body.userId || null;
    
    const { 
      status = 'En attente',
      expedition, 
      destination, 
      colis, 
      acceptCGU 
    } = req.body;
    
    const errors = [];
    if (!expedition?.nomComplet) errors.push("Le nom de l'expéditeur est requis");
    if (!expedition?.telephone) errors.push("Le téléphone de l'expéditeur est requis");
    if (!destination?.nomComplet) errors.push("Le nom du destinataire est requis");
    if (!destination?.telephone) errors.push("Le téléphone du destinataire est requis");
    if (!destination?.whatsapp) errors.push("Le WhatsApp du destinataire est requis");
    if (!destination?.adresse) errors.push("L'adresse de destination est requise");
    if (!colis?.description) errors.push("La description du colis est requise");
    if (!colis?.dateLivraison) errors.push("La date de livraison est requise");
    if (!colis?.heureLivraison) errors.push("L'heure de livraison est requise");

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Données manquantes",
        errors
      });
    }

    const commandeId = await generateCommandeId();
    
    const expeditionDoc = new Expedition({
      nomComplet: expedition.nomComplet,
      telephone: expedition.telephone,
      adresse: expedition.adresse || "Adresse non spécifiée",
      commandeId
    });

    const destinationDoc = new Destination({
      nomComplet: destination.nomComplet,
      telephone: destination.telephone,
      whatsapp: destination.whatsapp,
      adresse: destination.adresse || "Adresse non spécifiée",
      commandeId
    });
    
    const colisDoc = new Colis({
      description: colis.description,
      type: colis.type,
      nombre: colis.nombre,
      poids: colis.poids || 0,
      dimensions: colis.dimensions || "",
      valeur: colis.valeur || 0,
      assurance: colis.assurance || false,
      dateLivraison: new Date(colis.dateLivraison),
      heureLivraison: colis.heureLivraison,
      instructions: colis.instructions || "Aucune instruction",
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

    const inboxItem = new ManagerInbox({
      type: 'commande',
      action: 'creation',
      commandeId: savedCommande.commandeId,
      client: `${expedition.nomComplet}`,
      date: new Date(),
      details: 'Nouvelle commande créée',
      status: 'pending'
    });
    
    await inboxItem.save();
    
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
    
    let status = 500;
    let message = "Erreur serveur lors de la création de la commande";
    
    if (error.name === 'ValidationError') {
      status = 400;
      message = "Erreur de validation des données";
    }
    
    res.status(status).json({
      success: false,
      message,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const validateOrderWithPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    const commande = await Commande.findByIdAndUpdate(
      id,
      { 
        status: "Confirmée",
        "paiement.montant": price,
        "paiement.mode": "espèces"
      },
      { new: true }
    );

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    res.status(200).json(commande);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCommandes = async (req, res) => {
  try {
    const commandes = await Commande.find()
      .populate('expedition')
      .populate('destination')
      .populate('colis')
      .sort({ date_creation: -1 });
    
    res.status(200).json({
      success: true,
      count: commandes.length,
      commandes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCommandeById = async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id)
      .populate('expedition')
      .populate('destination')
      .populate('colis');

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    res.status(200).json({
      success: true,
      commande
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCommandeByRef = async (req, res) => {
  try {
    const commande = await Commande.findOne({ commandeId: req.params.ref })
      .populate('expedition')
      .populate('destination')
      .populate('colis');

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    res.status(200).json({
      success: true,
      commande
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getUserCommandes = async (req, res) => {
  try {
    const userId = req.params.userId;
    const commandes = await Commande.find({ userId })
    .populate('expedition')
    .populate('destination')
    .populate('colis')
    .sort({ createdAt: -1 })
    .lean();
  
  // Ajouter le champ createdAt formaté
  const formattedCommandes = commandes.map(commande => ({
    ...commande,
    date: commande.createdAt
  }));
  
  res.json(formattedCommandes);
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateCommande = async (req, res) => {
  try {
    const commande = await Commande.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('expedition')
    .populate('destination')
    .populate('colis');

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    res.status(200).json({
      success: true,
      message: "Commande mise à jour avec succès",
      commande
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateCommandeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const commande = await Commande.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    res.status(200).json({
      success: true,
      message: "Statut de commande mis à jour",
      commande
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteCommande = async (req, res) => {
  try {
    const commande = await Commande.findByIdAndDelete(req.params.id);

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    await Promise.all([
      Expedition.deleteOne({ commandeId: commande.commandeId }),
      Destination.deleteOne({ commandeId: commande.commandeId }),
      Colis.deleteOne({ commandeId: commande.commandeId })
    ]);

    res.status(200).json({
      success: true,
      message: "Commande et données associées supprimées avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

