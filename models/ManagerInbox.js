import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({

  fullName: { 
    type: String, 
    required: true },

  phone: {
     type: String, 
     required: true, 
     unique: true 
    },

  email: { type: String },
  adresse: { type: String },
  password: { type: String,
     required: true },
  role: { 
    type: String, 
    enum: ['client', 'manager'], 
    default: 'client' 
  },
  profilePhoto: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;

