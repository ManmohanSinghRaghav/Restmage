const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const auth = require('../middleware/auth');

/**
 * @route   POST /api/export/pricing-pdf
 * @desc    Export pricing prediction as PDF
 * @access  Private
 */
router.post('/pricing-pdf', auth, async (req, res) => {
  try {
    const { prediction, propertyDetails, breakdown } = req.body;

    if (!prediction) {
      return res.status(400).json({ error: 'Prediction data is required' });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="price-estimate-${Date.now()}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.fontSize(24)
       .fillColor('#667eea')
       .text('Restmage Price Estimation Report', { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(10)
       .fillColor('#666')
       .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    
    doc.moveDown(2);

    // Add property details section
    doc.fontSize(16)
       .fillColor('#000')
       .text('Property Details', { underline: true });
    
    doc.moveDown();

    if (propertyDetails) {
      doc.fontSize(11)
         .fillColor('#333');
      
      Object.entries(propertyDetails).forEach(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        doc.text(`${formattedKey}: ${value}`);
      });
    }

    doc.moveDown(2);

    // Add price estimate section
    doc.fontSize(16)
       .fillColor('#000')
       .text('Price Estimate', { underline: true });
    
    doc.moveDown();

    // Display predicted price
    doc.fontSize(28)
       .fillColor('#667eea')
       .text(`₹${prediction.toLocaleString()}`, { align: 'center' });
    
    doc.moveDown(2);

    // Add breakdown section if available
    if (breakdown && breakdown.length > 0) {
      doc.fontSize(16)
         .fillColor('#000')
         .text('Cost Breakdown', { underline: true });
      
      doc.moveDown();

      // Create table
      const tableTop = doc.y;
      const colWidth = 200;
      
      doc.fontSize(11)
         .fillColor('#333');

      breakdown.forEach((item, index) => {
        const y = tableTop + (index * 25);
        
        doc.text(item.category || item.name, 50, y, { width: colWidth });
        doc.text(`₹${(item.cost || item.value).toLocaleString()}`, 300, y, { width: 150, align: 'right' });
      });

      doc.moveDown(breakdown.length + 1);
    }

    // Add footer
    doc.fontSize(9)
       .fillColor('#999')
       .text('This is an estimated price based on machine learning prediction and market trends.', 
             50, 
             doc.page.height - 100, 
             { align: 'center', width: doc.page.width - 100 });
    
    doc.text('For accurate pricing, please consult with a professional real estate appraiser.', 
             { align: 'center', width: doc.page.width - 100 });

    // Add logo/branding
    doc.fontSize(8)
       .fillColor('#667eea')
       .text('Powered by Restmage', 
             50, 
             doc.page.height - 50, 
             { align: 'center', width: doc.page.width - 100 });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating pricing PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message 
    });
  }
});

/**
 * @route   POST /api/export/map-pdf
 * @desc    Export map as PDF (enhanced version)
 * @access  Private
 */
router.post('/map-pdf', auth, async (req, res) => {
  try {
    const { mapData, projectDetails, imageData } = req.body;

    if (!mapData && !imageData) {
      return res.status(400).json({ error: 'Map data or image data is required' });
    }

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="floor-plan-${Date.now()}.pdf"`);

    doc.pipe(res);

    // Add header
    doc.fontSize(24)
       .fillColor('#667eea')
       .text('Floor Plan Design', { align: 'center' });
    
    doc.moveDown();

    if (projectDetails) {
      doc.fontSize(12)
         .fillColor('#333')
         .text(`Project: ${projectDetails.name || 'Untitled'}`, { align: 'center' });
    }

    doc.moveDown(2);

    // Add image if provided (base64)
    if (imageData) {
      const imageBuffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      doc.image(imageBuffer, {
        fit: [700, 400],
        align: 'center',
        valign: 'center'
      });
    }

    doc.moveDown(2);

    // Add map metadata
    if (mapData && mapData.metadata) {
      doc.fontSize(11)
         .fillColor('#333')
         .text(`Generated: ${new Date(mapData.metadata.generatedAt).toLocaleDateString()}`, { align: 'center' });
    }

    // Footer
    doc.fontSize(8)
       .fillColor('#667eea')
       .text('Powered by Restmage Map Editor', 
             50, 
             doc.page.height - 30, 
             { align: 'center', width: doc.page.width - 100 });

    doc.end();

  } catch (error) {
    console.error('Error generating map PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message 
    });
  }
});

module.exports = router;
