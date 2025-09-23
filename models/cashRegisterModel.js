import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['paiement', 'depot', 'retrait'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: String,
  paymentMethod: {
    type: String,
    enum: ['espèces', 'mobile_money', 'carte', 'chèque'],
    required: function() { return this.type === 'paiement'; }
  },
  reference: String,
  operator: String,
  commandeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commande'
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;