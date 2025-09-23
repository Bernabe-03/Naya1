
import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: false,
    default: '' 
  },
  phone: {
    type: String, 
    required: false
  },
  email: { 
    type: String, 
    required: false,
    default: '' 
  },
  password: { 
    type: String, 
    required: false 
  },
  adresse: { 
    type: String, 
    default: '' 
  },
  profilePhoto: { 
    type: String, 
    default: '' 
  },
  role: { 
    type: String, 
    enum: ['client', 'manager', 'admin', 'coursier'], 
    required: true 
  }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);
export default User;


