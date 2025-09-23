
import mongoose from 'mongoose';
const commandeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  commandeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['En attente', 'Confirmée', 'Annulée', 'En cours', 'Livrée', 'Échouée'],
    default: 'En attente',
    required: true
  },
  expedition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expedition',
    required: true
  },
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    required: true
  },
  colis: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Colis',
    required: true
  },
  prix: {
    type: Number,
    default: 0
  },
  paiement: {
    mode: {
      type: String,
      enum: ['espèces', 'mobile money', 'carte bancaire']
    },
    status: {
      type: String,
      enum: ['En attente', 'Validée', 'Annulée', 'Livrée'],
      default: 'En attente'
    },
    montant: Number,
    dateValidation: Date
  },
    acceptCGU: {
      type: Boolean,
      required: [true, "L'acceptation des CGU est obligatoire"]
    },
    prixLivraison: Number,
    dateValidation: Date,
    dateAnnulation: Date,
    transactionId: String
  },
{
  timestamps: true,
  versionKey: false
});
const Commande = mongoose.model('Commande', commandeSchema);

export default Commande;

