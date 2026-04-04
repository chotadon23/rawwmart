// ─────────────────────────────────────────
//  RAWWMART - Order Model
//  This defines what an order looks like
//  in the database.
// ─────────────────────────────────────────

const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({

  // Who placed the order? (a vendor)
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',   // links to the User model
    required: true
  },

  // Who will fulfill the order? (a supplier)
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // What items were ordered?
  items: [
    {
      name:     { type: String, required: true },  // e.g. "Onions"
      quantity: { type: Number, required: true },  // e.g. 10
      unit:     { type: String, default: 'kg' }    // e.g. "kg", "dozen", "litre"
    }
  ],

  // Total price
  totalAmount: { type: Number, default: 0 },

  // Order status — moves through these stages:
  // pending → accepted → preparing → out_for_delivery → delivered
  // or: pending → rejected
  status: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'rejected'],
    default: 'pending'
  },

  // Delivery address (copied from vendor's stall address)
  deliveryAddress: { type: String, required: true },

  // Notes from vendor (optional)
  notes: { type: String, default: '' },

  // Timestamps
  createdAt:   { type: Date, default: Date.now },
  acceptedAt:  { type: Date },
  deliveredAt: { type: Date }

});

module.exports = mongoose.model('Order', OrderSchema);

