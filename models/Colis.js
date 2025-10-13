
// import mongoose from 'mongoose';

// const colisSchema = new mongoose.Schema({
//   description: { 
//     type: String, 
//     required: [true, "La description du colis est requise"],
//     trim: true,
//     minlength: [5, "La description doit contenir au moins 5 caractères"]
//   },
//   type: { 
//     type: String, 
//     enum: {
//       values: ['Plis', 'léger', 'moyen', 'lourd'],
//       message: "Type de colis invalide"
//     }, 
//     default: 'Plis',
//     required: true
//   },
//   nombre: { 
//     type: Number, 
//     min: [1, "Le nombre de colis doit être au moins 1"],
//     default: 1,
//     required: true
//   },
//   poids: {
//     type: Number,
//     min: [0, "Le poids ne peut pas être négatif"]
//   },
//   dimensions: {
//     type: String,
//     match: [/^\d+x\d+x\d+$/, "Format de dimensions invalide (LxlxH)"]
//   },
//   valeur: {
//     type: Number,
//     min: [0, "La valeur ne peut pas être négative"]
//   },
//   assurance: { 
//     type: Boolean, 
//     default: false 
//   },
//   dateLivraison: { 
//     type: Date,
//     required: true,
//     validate: {
//       validator: function(v) {
//         return v instanceof Date && !isNaN(v);
//       },
//       message: "Date de livraison invalide"
//     }
//   },
//   heureLivraison: { 
//     type: String, 
//     required: [true, "L'heure de livraison est requise"],
//     validate: {
//       validator: v => /^([01]\d|2[0-3]):([0-5]\d)$/.test(v),
//       message: "Format d'heure invalide (HH:MM)"
//     }
//   },
//   instructions: {
//     type: String,
//     maxlength: [500, "Les instructions ne peuvent dépasser 500 caractères"]
//   },
//   commandeId: {
//     type: String,
//     required: true,
//     index: true
//   }
// }, {
//   timestamps: true
// });

// export default mongoose.model('Colis', colisSchema);



import mongoose from 'mongoose';

const colisSchema = new mongoose.Schema({
  description: { 
    type: String, 
    required: [true, "La description du colis est requise"],
    trim: true,
    minlength: [5, "La description doit contenir au moins 5 caractères"]
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
  poids: {
    type: Number,
    min: [0, "Le poids ne peut pas être négatif"]
  },
  dimensions: {
    type: String,
    match: [/^\d+x\d+x\d+$/, "Format de dimensions invalide (LxlxH)"]
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
      // MODIFICATION ICI : Accepte le format "HHhMM" (ex: 08h00, 20h00)
      validator: v => /^([01]\d|20)h([0-5]\d)$/.test(v),
      message: "Format d'heure invalide (HHhMM)"
    }
  },
  instructions: {
    type: String,
    maxlength: [500, "Les instructions ne peuvent dépasser 500 caractères"]
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