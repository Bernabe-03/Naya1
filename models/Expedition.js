
import mongoose from 'mongoose';

const expeditionSchema = new mongoose.Schema({
  nomComplet: { type: String, required: true },
  telephone: { type: String, required: true },
  adresse: { type: String },
  email: { type: String },
  commandeId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Expedition', expeditionSchema);