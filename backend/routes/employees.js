const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const PDFDocument= require('pdfkit');
const Employee   = require('../models/Employee');
const { protect, adminOnly } = require('../middleware/auth');

// ── Multer config ────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `emp_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Images only'));
    cb(null, true);
  }
});

// ── GET /api/employees ───────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };
    if (role && role !== 'all') query.role = role;
    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    const [employees, total] = await Promise.all([
      Employee.find(query).sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit),
      Employee.countDocuments(query)
    ]);
    res.json({ success: true, employees, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/employees/stats ─────────────────────────────────────────
router.get('/stats', protect, async (req, res) => {
  try {
    const [total, byRole] = await Promise.all([
      Employee.countDocuments({ isActive: true }),
      Employee.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ])
    ]);
    res.json({ success: true, total, byRole });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST /api/employees ──────────────────────────────────────────────
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.file) body.image = req.file.filename;
    const emp = await Employee.create(body);
    res.status(201).json({ success: true, employee: emp });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Email already exists' });
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT /api/employees/:id ───────────────────────────────────────────
router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      // Remove old image
      const old = await Employee.findById(req.params.id);
      if (old?.image) {
        const oldPath = path.join(uploadsDir, old.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      body.image = req.file.filename;
    }
    const emp = await Employee.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, employee: emp });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ── DELETE /api/employees/:id ────────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const emp = await Employee.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee removed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/employees/pdf ───────────────────────────────────────────
router.get('/pdf', protect, async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true }).sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="employees.pdf"');
    doc.pipe(res);

    // Header
    doc.rect(0, 0, 595, 90).fill('#0f172a');
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#60a5fa').text('VoiceBill', 50, 20);
    doc.fontSize(11).font('Helvetica').fillColor('#94a3b8').text('Smart Billing System', 50, 46);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff').text('EMPLOYEE DIRECTORY', 350, 30, { align: 'right', width: 195 });
    doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text(`Generated: ${new Date().toLocaleString('en-IN')}`, 350, 52, { align: 'right', width: 195 });

    doc.moveDown(4);

    // Summary bar
    const roles = {};
    employees.forEach(e => { roles[e.role] = (roles[e.role] || 0) + 1; });
    doc.rect(50, 105, 495, 36).fill('#1e293b');
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#f1f5f9').text(`Total Employees: ${employees.length}`, 66, 117);
    let rx = 220;
    Object.entries(roles).forEach(([r, c]) => {
      doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text(`${r}: ${c}`, rx, 120);
      rx += 80;
    });

    // Table header
    const th = 158;
    doc.rect(50, th, 495, 22).fill('#1d4ed8');
    const cols = ['#', 'Name', 'Phone', 'Email', 'Role', 'Joined'];
    const cx   = [55, 75, 190, 280, 400, 460];
    cols.forEach((c, i) => {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#fff').text(c, cx[i], th + 7);
    });

    // Rows
    employees.forEach((emp, idx) => {
      const ry = 186 + idx * 26;
      if (ry > 760) { doc.addPage(); }
      if (idx % 2 === 0) doc.rect(50, ry, 495, 25).fill('#0f172a');
      else doc.rect(50, ry, 495, 25).fill('#111827');

      doc.fontSize(9).font('Helvetica').fillColor('#f1f5f9');
      doc.text(String(idx + 1),                                    cx[0], ry + 8);
      doc.text(emp.name.substring(0, 18),                          cx[1], ry + 8);
      doc.text(emp.phone,                                           cx[2], ry + 8);
      doc.text(emp.email.substring(0, 22),                         cx[3], ry + 8);

      // Role badge color
      const roleColor = { Worker:'#f59e0b', Staff:'#06b6d4', Manager:'#a855f7', Cashier:'#10b981', Supervisor:'#3b82f6' };
      doc.fillColor(roleColor[emp.role] || '#94a3b8').text(emp.role, cx[4], ry + 8);
      doc.fillColor('#94a3b8').text(new Date(emp.joiningDate).toLocaleDateString('en-IN'), cx[5], ry + 8);
    });

    // Footer
    doc.rect(0, 800, 595, 42).fill('#0f172a');
    doc.fontSize(9).font('Helvetica').fillColor('#475569').text('VoiceBill Smart Billing System — Confidential', 50, 816, { align: 'center', width: 495 });

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
