
import mongoose from 'mongoose';
const colisSchema = new mongoose.Schema({
  description: { 
    type: String,
  },
  type: { 
    type: String, 
    enum: {
      values: ['Plis', 'léger', 'moyen', 'lourd'],
      message: "Type de colis invalide"
    }, 
    default: 'Plis',
    required: true
  },
  nombre: { 
    type: Number, 
    min: [1, "Le nombre de colis doit être au moins 1"],
    default: 1,
    required: true
  },
  valeur: {
    type: Number,
    min: [0, "La valeur ne peut pas être négative"]
  },
  assurance: { 
    type: Boolean, 
    default: false 
  },
  dateLivraison: { 
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: "Date de livraison invalide"
    }
  },
  heureLivraison: { 
    type: String, 
    required: [true, "L'heure de livraison est requise"],
    validate: {
      validator: v => /^([01]\d|2[0-3])h([0-5]\d)$/.test(v),
      message: "Format d'heure invalide (HHhMM)"
    }
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: [500, "Les instructions ne peuvent pas dépasser 500 caractères"]
  },
  commandeId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});
export default mongoose.model('Colis', colisSchema);