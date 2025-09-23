import mongoose from 'mongoose';

const destinationSchema = new mongoose.Schema({
  nomComplet: { type: String, required: true },
  telephone: { type: String, required: true },
  whatsapp: { type: String, required: true },
  adresse: { type: String, required: true },
  commandeId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Destination', destinationSchema);