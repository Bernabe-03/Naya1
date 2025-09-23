import mongoose from 'mongoose';

const trashItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    required: true,
    enum: ['inbox', 'commande']
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  deletedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('TrashItem', trashItemSchema);

