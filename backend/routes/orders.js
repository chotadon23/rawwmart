// ─────────────────────────────────────────
//  RAWWMART - Orders Routes
//  API endpoints for:
//   GET  /api/orders/nearby-suppliers  → find suppliers near vendor
//   POST /api/orders/place             → vendor places an order
//   GET  /api/orders/my-orders         → vendor sees their orders
//   GET  /api/orders/incoming          → supplier sees incoming orders
//   PUT  /api/orders/:id/accept        → supplier accepts an order
//   PUT  /api/orders/:id/reject        → supplier rejects an order
//   PUT  /api/orders/:id/status        → supplier updates order status
// ─────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Order   = require('../models/Order');

// ── Middleware: check if user is logged in ──
function protect(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: 'Not logged in.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rawwmart_secret_key');
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token. Please log in again.' });
  }
}

// ────────────────────────────────
//  GET /api/orders/nearby-suppliers
//  Find suppliers within 10km of the vendor
// ────────────────────────────────
router.get('/nearby-suppliers', protect, async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000 } = req.query;
    // maxDistance is in metres. 10000m = 10km

    const suppliers = await User.find({
      role: 'supplier',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).select('name mobile email deliveryAddress location gstVerified');

    res.json({ suppliers });
  } catch (err) {
    console.error('Nearby suppliers error:', err.message);
    res.status(500).json({ message: 'Could not find nearby suppliers.' });
  }
});

// ────────────────────────────────
//  POST /api/orders/place
//  Vendor places a new order
// ────────────────────────────────
router.post('/place', protect, async (req, res) => {
  try {
    const { supplierId, items, deliveryAddress, notes } = req.body;

    // Check supplier exists
    const supplier = await User.findById(supplierId);
    if (!supplier || supplier.role !== 'supplier') {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    const order = await Order.create({
      vendor:          req.userId,
      supplier:        supplierId,
      items,
      deliveryAddress,
      notes: notes || ''
    });

    res.status(201).json({ message: 'Order placed successfully!', order });

  } catch (err) {
    console.error('Place order error:', err.message);
    res.status(500).json({ message: 'Could not place order.' });
  }
});

// ────────────────────────────────
//  GET /api/orders/my-orders
//  Vendor sees their own orders
// ────────────────────────────────
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ vendor: req.userId })
      .populate('supplier', 'name mobile email') // fill in supplier details
      .sort({ createdAt: -1 }); // newest first

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch orders.' });
  }
});

// ────────────────────────────────
//  GET /api/orders/incoming
//  Supplier sees orders coming in to them
// ────────────────────────────────
router.get('/incoming', protect, async (req, res) => {
  try {
    const orders = await Order.find({ supplier: req.userId })
      .populate('vendor', 'name mobile email deliveryAddress')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch incoming orders.' });
  }
});

// ────────────────────────────────
//  PUT /api/orders/:id/accept
//  Supplier accepts an order
// ────────────────────────────────
router.put('/:id/accept', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.supplier.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not your order to accept.' });
    }

    order.status     = 'accepted';
    order.acceptedAt = new Date();
    await order.save();

    res.json({ message: 'Order accepted!', order });
  } catch (err) {
    res.status(500).json({ message: 'Could not accept order.' });
  }
});

// ────────────────────────────────
//  PUT /api/orders/:id/reject
//  Supplier rejects an order
// ────────────────────────────────
router.put('/:id/reject', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.supplier.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not your order to reject.' });
    }

    order.status = 'rejected';
    await order.save();

    res.json({ message: 'Order rejected.', order });
  } catch (err) {
    res.status(500).json({ message: 'Could not reject order.' });
  }
});

// ────────────────────────────────
//  PUT /api/orders/:id/status
//  Supplier updates order progress
//  Body: { status: "preparing" | "out_for_delivery" | "delivered" }
// ────────────────────────────────
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['preparing', 'out_for_delivery', 'delivered'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    order.status = status;
    if (status === 'delivered') order.deliveredAt = new Date();
    await order.save();

    res.json({ message: `Order marked as ${status}`, order });
  } catch (err) {
    res.status(500).json({ message: 'Could not update status.' });
  }
});

module.exports = router;