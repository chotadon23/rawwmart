const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  mobile:           { type: String, required: true, unique: true },
  email:            { type: String, required: true, unique: true },
  password:         { type: String, required: true },
  role:             { type: String, enum: ['vendor','supplier'], required: true },
  permanentAddress: { type: String, required: true },
  deliveryAddress:  { type: String, required: true },
  location: {
    type:        { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0,0] }
  },
  gstNumber:   { type: String, default: '' },
  gstVerified: { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now }
});

UserSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', UserSchema);