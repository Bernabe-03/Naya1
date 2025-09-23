import mongoose from 'mongoose';

const coursierSchema = mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String 
  },
  adresse: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['Disponible', 'En livraison', 'Indisponible'], 
    default: 'Disponible' 
  },
  position: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, {
  timestamps: true
});

const Coursier = mongoose.model('Coursier', coursierSchema);

export default Coursier;