
import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

export const generateCommandeId = async () => {
  try {
    const year = new Date().getFullYear();
    const counterName = `commande_${year}`;
    
    const result = await Counter.findOneAndUpdate(
      { _id: counterName },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    return `nay/${year}-${result.seq.toString().padStart(5, '0')}-ci`;
  } catch (error) {
    console.error("Erreur génération ID commande:", error);
    return `nay-${Date.now()}`;
  }
};

export default Counter;