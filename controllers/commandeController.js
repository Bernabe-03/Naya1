import Expedition from '../models/Expedition.js';
import Destination from '../models/Destination.js';
import Colis from '../models/Colis.js';
import Commande from '../models/Commande.js';
import ManagerInbox from '../models/ManagerInbox.js';
import { generateCommandeId } from '../models/Counter.js';

/**
 * 📦 Crée une nouvelle commande (Version corrigée)
 */
export const createCommande = async (req, res) => {
  try {
    // 🔧 CORRECTION: Gérer explicitement l'absence d'utilisateur
    const userId = req.user?._id || null;

    console.log('📥 Création commande - User ID:', userId);

    const { 
      status = 'En attente',
      expedition, 
      destination, 
      colis, 
      acceptCGU 
    } = req.body;

    console.log('📦 Données reçues:', { expedition, destination, colis, acceptCGU });

    const errors = [];

    // Validation renforcée
    if (!expedition?.nomComplet?.trim()) errors.push("Le nom de l'expéditeur est requis");
    if (!expedition?.telephone?.trim()) errors.push("Le téléphone de l'expéditeur est requis");
    if (!expedition?.adresse?.trim()) errors.push("L'adresse de l'expéditeur est requise");
    
    if (!destination?.nomComplet?.trim()) errors.push("Le nom du destinataire est requis");
    if (!destination?.whatsapp?.trim()) errors.push("Le WhatsApp du destinataire est requis");
    if (!destination?.adresse?.trim()) errors.push("L'adresse de destination est requise");
    
    if (!colis?.description?.trim()) errors.push("La description du colis est requise");
    if (!colis?.nombre || colis.nombre <= 0) errors.push("Le nombre de colis doit être supérieur à zéro");
    if (!colis?.dateLivraison) errors.push("La date de livraison est requise");
    if (!colis?.heureLivraison) errors.push("L'heure de livraison est requise");
    
    if (!acceptCGU) errors.push("Vous devez accepter les conditions générales d'utilisation");

    if (errors.length > 0) {
      console.log('❌ Erreurs de validation:', errors);
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants",
        errors
      });
    }

    // Générer l'ID commande
    const commandeId = await generateCommandeId();
    console.log('🆔 Commande ID généré:', commandeId);

    // Préparation des données
    const expeditionData = {
      nomComplet: expedition.nomComplet.trim(),
      telephone: expedition.telephone,
      adresse: expedition.adresse.trim(),
      commandeId
    };

    const destinationData = {
      nomComplet: destination.nomComplet.trim(),
      whatsapp: destination.whatsapp,
      adresse: destination.adresse.trim(),
      commandeId
    };

    const colisData = {
      description: colis.description,
      type: colis.type || "Colis",
      nombre: Number(colis.nombre) || 1,
      valeur: colis.valeur ? Number(colis.valeur) : 0,
      assurance: colis.assurance || false,
      dateLivraison: new Date(colis.dateLivraison),
      heureLivraison: colis.heureLivraison,
      instructions: colis.instructions?.trim() || "",
      commandeId
    };

    console.log('💾 Sauvegarde des sous-documents...');

    // Sauvegarde en parallèle avec gestion d'erreur
    let savedExpedition, savedDestination, savedColis;
    
    try {
      [savedExpedition, savedDestination, savedColis] = await Promise.all([
        new Expedition(expeditionData).save(),
        new Destination(destinationData).save(),
        new Colis(colisData).save()
      ]);
    } catch (saveError) {
      console.error('❌ Erreur sauvegarde sous-documents:', saveError);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la sauvegarde des données",
        error: saveError.message
      });
    }

    console.log('✅ Sous-documents sauvegardés');

    // Création de la commande principale
    const commandeData = {
      userId,
      commandeId,
      status,
      expedition: savedExpedition._id,
      destination: savedDestination._id,
      colis: savedColis._id,
      acceptCGU
    };

    let savedCommande;
    try {
      savedCommande = await new Commande(commandeData).save();
      console.log('✅ Commande principale sauvegardée:', savedCommande._id);
    } catch (commandeError) {
      console.error('❌ Erreur sauvegarde commande:', commandeError);
      
      // Nettoyer les sous-documents en cas d'échec
      await Promise.allSettled([
        Expedition.findByIdAndDelete(savedExpedition._id),
        Destination.findByIdAndDelete(savedDestination._id),
        Colis.findByIdAndDelete(savedColis._id)
      ]);
      
      throw commandeError;
    }

    // Population des données
    const commandeComplete = await Commande.findById(savedCommande._id)
      .populate('expedition')
      .populate('destination')
      .populate('colis');

    // Historique Manager (optionnel)
    try {
      await new ManagerInbox({
        type: 'commande',
        action: 'creation',
        commandeId,
        client: expedition.nomComplet,
        date: new Date(),
        details: `Nouvelle commande ${commandeId} créée ${userId ? '(utilisateur connecté)' : '(invité)'}`,
        status: 'pending'
      }).save();
      console.log('✅ Historique manager créé');
    } catch (inboxError) {
      console.warn('⚠️ Erreur création historique manager:', inboxError);
      // Ne pas bloquer la réponse pour cette erreur
    }

    // Réponse finale
    res.status(201).json({
      success: true,
      message: userId ? "Commande créée avec succès" : "Commande invité créée avec succès",
      commande: commandeComplete
    });

  } catch (error) {
    console.error("❌ Erreur création commande:", error);
    
    // Gestion spécifique des erreurs
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Erreur de validation des données",
        errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Une commande avec cet ID existe déjà"
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de la commande",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};
// Les autres fonctions restent inchangées...
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

    if (!commande)
      return res.status(404).json({ success: false, message: "Commande non trouvée" });

    res.status(200).json({ success: true, commande });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCommandes = async (req, res) => {
  try {
    const commandes = await Commande.find()
      .populate('expedition destination colis')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: commandes.length,
      commandes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCommandeById = async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id)
      .populate('expedition destination colis');

    if (!commande)
      return res.status(404).json({ success: false, message: "Commande non trouvée" });

    res.status(200).json({ success: true, commande });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCommandeByRef = async (req, res) => {
  try {
    const commande = await Commande.findOne({ commandeId: req.params.ref })
      .populate('expedition destination colis');

    if (!commande)
      return res.status(404).json({ success: false, message: "Commande non trouvée" });

    res.status(200).json({ success: true, commande });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserCommandes = async (req, res) => {
  try {
    const { userId } = req.params;

    const commandes = await Commande.find({ userId })
      .populate('expedition destination colis')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = commandes.map(cmd => ({
      ...cmd,
      date: cmd.createdAt
    }));

    res.json({ success: true, commandes: formatted });
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCommande = async (req, res) => {
  try {
    const commande = await Commande.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('expedition destination colis');

    if (!commande)
      return res.status(404).json({ success: false, message: "Commande non trouvée" });

    res.status(200).json({
      success: true,
      message: "Commande mise à jour avec succès",
      commande
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    if (!commande)
      return res.status(404).json({ success: false, message: "Commande non trouvée" });

    res.status(200).json({
      success: true,
      message: "Statut de commande mis à jour",
      commande
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCommande = async (req, res) => {
  try {
    const commande = await Commande.findByIdAndDelete(req.params.id);

    if (!commande)
      return res.status(404).json({ success: false, message: "Commande non trouvée" });

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
    res.status(500).json({ success: false, message: error.message });
  }
};