const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      name:     { type: String, required: true },
      quantity: { type: Number, required: true },
      unit:     { type: String, default: 'kg' }
    }
  ],
  totalAmount:     { type: Number, default: 0 },
  status:          { type: String, enum: ['pending','accepted','preparing','out_for_delivery','delivered','rejected'], default: 'pending' },
  deliveryAddress: { type: String, required: true },
  notes:           { type: String, default: '' },
  createdAt:       { type: Date, default: Date.now },
  acceptedAt:      { type: Date },
  deliveredAt:     { type: Date }
});

module.exports = mongoose.model('Order', OrderSchema);