const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.ObjectId, ref: 'Product', required: true },
  quantityChanged: { type: Number, required: true },
  action: { type: String, enum: ['added', 'sold', 'removed'], required: true },
  date: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.ObjectId, ref: 'User' } // optional
});

module.exports = mongoose.model('StockLog', stockLogSchema);
