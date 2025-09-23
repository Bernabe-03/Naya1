import mongoose from 'mongoose';

const livraisonSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  heure: { type: String, required: true },
  instructions: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Livraison', livraisonSchema);