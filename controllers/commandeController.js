
import Expedition from '../models/Expedition.js';
import Destination from '../models/Destination.js';
import Colis from '../models/Colis.js';
import Commande from '../models/Commande.js';
import ManagerInbox from '../models/ManagerInbox.js';
import { generateCommandeId } from '../models/Counter.js';

/**
 * 📦 Crée une nouvelle commande
 */
export const createCommande = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId || null;

    const { 
      status = 'En attente',
      expedition, 
      destination, 
      colis, 
      acceptCGU 
    } = req.body;

    const errors = [];

    // ✅ Validation des données requises (sans description)
    if (!expedition?.nomComplet) errors.push("Le nom de l'expéditeur est requis");
    if (!expedition?.telephone) errors.push("Le téléphone de l'expéditeur est requis");
    if (!destination?.nomComplet) errors.push("Le nom du destinataire est requis");
    if (!destination?.telephone) errors.push("Le téléphone du destinataire est requis");
    if (!destination?.whatsapp) errors.push("Le WhatsApp du destinataire est requis");
    if (!destination?.adresse) errors.push("L'adresse de destination est requise");
    // SUPPRIMÉ: Validation de la description
    if (!colis?.dateLivraison) errors.push("La date de livraison est requise");
    if (!colis?.heureLivraison) errors.push("L'heure de livraison est requise");
    if (!acceptCGU) errors.push("Vous devez accepter les conditions générales d'utilisation");

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Certains champs obligatoires sont manquants",
        errors
      });
    }

    // ✅ Génération d'un ID unique pour la commande
    const commandeId = await generateCommandeId();

    // ✅ Création des sous-documents liés
    const expeditionDoc = new Expedition({
      nomComplet: expedition.nomComplet.trim(),
      telephone: expedition.telephone,
      adresse: expedition.adresse?.trim() || "Adresse non spécifiée",
      commandeId
    });

    const destinationDoc = new Destination({
      nomComplet: destination.nomComplet.trim(),
      telephone: destination.telephone,
      whatsapp: destination.whatsapp,
      adresse: destination.adresse?.trim() || "Adresse non spécifiée",
      commandeId
    });

    const colisDoc = new Colis({
      description: colis.description, // PLUS de trim()
      type: colis.type || "Plis",
      nombre: Number(colis.nombre) || 1,
      valeur: Number(colis.valeur) || 0,
      assurance: Boolean(colis.assurance) || false,
      dateLivraison: new Date(colis.dateLivraison),
      heureLivraison: colis.heureLivraison,
      instructions: colis.instructions?.trim() || "Aucune instruction",
      commandeId
    });

    // ✅ Sauvegarde simultanée des sous-documents
    const [savedExpedition, savedDestination, savedColis] = await Promise.all([
      expeditionDoc.save(),
      destinationDoc.save(),
      colisDoc.save()
    ]);

    // ✅ Création de la commande principale
    const commande = new Commande({
      userId,
      commandeId,
      status,
      expedition: savedExpedition._id,
      destination: savedDestination._id,
      colis: savedColis._id,
      acceptCGU
    });

    const savedCommande = await commande.save();

    // ✅ Notification interne pour les managers
    const inboxItem = new ManagerInbox({
      type: 'commande',
      action: 'creation',
      commandeId: savedCommande.commandeId,
      client: expedition.nomComplet,
      date: new Date(),
      details: 'Nouvelle commande créée',
      status: 'pending'
    });

    await inboxItem.save();

    // ✅ Réponse finale
    res.status(201).json({
      success: true,
      message: "Commande créée avec succès",
      commande: {
        ...savedCommande.toObject(),
        expedition: savedExpedition,
        destination: savedDestination,
        colis: savedColis
      }
    });

  } catch (error) {
    console.error("Erreur création commande:", error);

    res.status(error.name === 'ValidationError' ? 400 : 500).json({
      success: false,
      message: error.name === 'ValidationError'
        ? "Erreur de validation des données"
        : "Erreur serveur lors de la création de la commande",
      error: error.message
    });
  }
};

/**
 * ✅ Validation commande + ajout du prix
 */
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

/**
 * 🔍 Récupère toutes les commandes
 */
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

/**
 * 🔍 Récupère une commande par ID
 */
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

/**
 * 🔍 Récupère une commande par référence
 */
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

/**
 * 👤 Récupère toutes les commandes d'un utilisateur
 */
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

/**
 * ✏️ Mise à jour d'une commande
 */
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

/**
 * 🔄 Mise à jour du statut d'une commande
 */
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

/**
 * ❌ Suppression complète d'une commande et ses sous-documents
 */
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