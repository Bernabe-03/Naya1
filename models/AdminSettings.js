import mongoose from 'mongoose';

const adminSettingsSchema = new mongoose.Schema({
  siteTitle: { type: String, default: 'NAYA Livraison' },
  maintenanceMode: { type: Boolean, default: false },
  commissionRate: { type: Number, default: 15 },
  currency: { type: String, default: 'FCFA' }
}, { timestamps: true });

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);
export default AdminSettings;