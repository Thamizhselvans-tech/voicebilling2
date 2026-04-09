const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  phone:      { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  address:    { type: String, default: '', trim: true },
  role:       { type: String, enum: ['Worker', 'Staff', 'Manager', 'Cashier', 'Supervisor'], default: 'Staff' },
  joiningDate:{ type: Date, default: Date.now },
  image:      { type: String, default: '' },
  isActive:   { type: Boolean, default: true },
  salary:     { type: Number, default: 0 },
  department: { type: String, default: '' },
  notes:      { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Employee', EmployeeSchema);
