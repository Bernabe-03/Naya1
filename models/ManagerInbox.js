import mongoose from 'mongoose';

const managerInboxSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['commande']
  },
  action: {
    type: String,
    required: true,
    enum: ['assignation_coursier', 'annulation', 'validation']
  },
  commandeId: {
    type: String,
    required: true
  },
  client: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'done'],
    default: 'done'
  },
  // ⭐ CORRECTION : Utiliser nomComplet au lieu de nom ⭐
  coursier: {
    nomComplet: String,  // Changé de 'nom' à 'nomComplet'
    telephone: String,
    vehicule: String
  },
  expedition: {
    nomComplet: String,
    telephone: String,
    adresse: String
  },
  destination: {
    nomComplet: String,
    whatsapp: String,
    adresse: String
  },
  colis: {
    description: String,
    type: String,
    dateLivraison: Date,
    heureLivraison: String
  },
  messageEnvoye: String,
  price: Number
}, {
  timestamps: true
});
export default mongoose.model('ManagerInbox', managerInboxSchema);