import mongoose from 'mongoose';

const coursierSchema = new mongoose.Schema({
  nomComplet: {
    type: String,
    required: [true, 'Le nom complet est obligatoire'],
    trim: true
  },
  telephone: {
    type: String,
    required: [true, 'Le numéro de téléphone est obligatoire'],
    unique: true,
    trim: true
  },
  statut: {
    type: String,
    enum: {
      values: ['actif', 'inactif', 'congé', 'suspendu'],
      message: 'Le statut doit être actif, inactif, congé ou suspendu'
    },
    default: 'actif'
  }
}, {
  timestamps: true
});
// Index pour le téléphone
coursierSchema.index({ telephone: 1 }, { unique: true });

export default mongoose.model('Coursier', coursierSchema);