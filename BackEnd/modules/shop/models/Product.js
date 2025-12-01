const mongoose = require("mongoose");

const ProductsSchema = mongoose.Schema({
  name: String,
  img: String,
  description: String,
  size: String, // "A4", "A3", "30x40", "tube", etc.
  price: Number, // € TTC
  category: String,
  quantity: Number,
  dateOnline: { type: Date, default: Date.now },
  promotion: Boolean,

  // SIMTAO
  shipping: {
    weight_g:  { type: Number, required: true, default: 50 }, // poids "g"
    length_cm: { type: Number, default: 20 },
    width_cm:  { type: Number, default: 15 },
    height_cm: { type: Number, default: 2 },
    shipping_class: { type: String, default: 'print' }, // 'print', 'tube', 'fragile', etc.
    // simtao_productCode: { type: String, default: null }, // N CONTRAT
  },
});

const Product = mongoose.model("product", ProductsSchema);

module.exports = Product;
