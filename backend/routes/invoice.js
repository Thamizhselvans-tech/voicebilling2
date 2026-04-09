const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice');
const { protect, adminOnly } = require('../middleware/auth');

// Ensure invoices directory exists
const invoicesDir = path.join(__dirname, '../invoices');
if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });

function generatePDF(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `invoice-${invoice.invoiceNumber}.pdf`;
    const filepath = path.join(invoicesDir, filename);
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Header
    doc.fontSize(22).text('TAX INVOICE', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Invoice No: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.moveDown();

    // Items
    invoice.items.forEach((item, i) => {
      doc.text(`${i + 1}. ${item.name} x ${item.qty} = ₹${item.lineTotal.toFixed(2)}`);
    });

    // 🔥 FIXED TOTAL SECTION
    doc.moveDown(1);

    // Subtotal
    doc.fontSize(10).fillColor('#000');
    doc.text(`Subtotal: ₹${invoice.subtotal.toFixed(2)}`, {
      align: 'right'
    });

    // GST
    doc.moveDown(0.3);
    doc.text(`GST: ₹${invoice.totalGst.toFixed(2)}`, {
      align: 'right'
    });

    // Divider
    doc.moveDown(0.5);
    doc.moveTo(300, doc.y).lineTo(550, doc.y).stroke();

    // Grand Total
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#1F4E79').font('Helvetica-Bold');
    doc.text(`GRAND TOTAL: ₹${invoice.grandTotal.toFixed(2)}`, {
      align: 'right'
    });

    doc.end();

    stream.on('finish', () => resolve(filename));
    stream.on('error', reject);
  });
}

// 🚀 GENERATE INVOICE
router.post('/generate', protect, async (req, res) => {
  try {
    const { items, customer, subtotal, cgst, sgst, igst, totalGst, grandTotal,
            isInterState, paymentMethod, confirmed, voiceTranscript, notes } = req.body;

    if (!confirmed) {
      return res.status(400).json({
        success: false,
        message: 'Invoice cannot be generated without confirmation.'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in bill'
      });
    }

    // 🔥 UNIQUE INVOICE NUMBER
    const invoiceNumber = "INV-" + Date.now();

    const invoice = await Invoice.create({
      invoiceNumber,
      customer: customer || {},
      items,
      subtotal,
      cgst,
      sgst,
      igst,
      totalGst,
      grandTotal,
      isInterState,
      paymentMethod,
      status: 'confirmed',
      confirmedAt: new Date(),
      confirmedBy: req.user._id,
      voiceTranscript,
      notes
    });

    // Generate PDF
    const pdfFile = await generatePDF(invoice);
    invoice.pdfPath = pdfFile;
    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        grandTotal: invoice.grandTotal,
       pdfUrl: `http://localhost:5000/invoices/${pdfFile}`,
        confirmedAt: invoice.confirmedAt
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all invoices
router.get('/', protect, async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json({ success: true, invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single invoice
router.get('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false });

    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;