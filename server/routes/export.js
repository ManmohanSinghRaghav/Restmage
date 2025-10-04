const express = require('express');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validateObjectId');

const router = express.Router();

// Export project data as CSV
router.get('/:projectId/csv', auth, validateObjectId('projectId'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'username email')
      .populate('collaborators.user', 'username email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to the project
    const hasAccess = project.owner._id.toString() === req.user._id.toString() ||
      project.collaborators.some(collab => collab.user._id.toString() === req.user._id.toString()) ||
      project.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Prepare data for CSV export
    const csvData = [];

    // Project basic information
    csvData.push({
      category: 'Project Info',
      field: 'Name',
      value: project.name
    });
    csvData.push({
      category: 'Project Info',
      field: 'Description',
      value: project.description || 'N/A'
    });
    csvData.push({
      category: 'Project Info',
      field: 'Status',
      value: project.status
    });
    csvData.push({
      category: 'Project Info',
      field: 'Owner',
      value: project.owner.username
    });
    csvData.push({
      category: 'Project Info',
      field: 'Created Date',
      value: project.createdAt.toISOString().split('T')[0]
    });

    // Property details
    csvData.push({
      category: 'Property Details',
      field: 'Type',
      value: project.propertyDetails.type
    });
    csvData.push({
      category: 'Property Details',
      field: 'Length',
      value: `${project.propertyDetails.dimensions.length} ${project.propertyDetails.dimensions.unit}`
    });
    csvData.push({
      category: 'Property Details',
      field: 'Width',
      value: `${project.propertyDetails.dimensions.width} ${project.propertyDetails.dimensions.unit}`
    });
    csvData.push({
      category: 'Property Details',
      field: 'Height',
      value: `${project.propertyDetails.dimensions.height} ${project.propertyDetails.dimensions.unit}`
    });

    // Location
    if (project.propertyDetails.location) {
      const location = project.propertyDetails.location;
      csvData.push({
        category: 'Location',
        field: 'Address',
        value: location.address || 'N/A'
      });
      csvData.push({
        category: 'Location',
        field: 'City',
        value: location.city || 'N/A'
      });
      csvData.push({
        category: 'Location',
        field: 'State',
        value: location.state || 'N/A'
      });
    }

    // Cost estimation
    if (project.costEstimation) {
      const cost = project.costEstimation;
      csvData.push({
        category: 'Cost Estimation',
        field: 'Materials',
        value: `$${cost.materials}`
      });
      csvData.push({
        category: 'Cost Estimation',
        field: 'Labor',
        value: `$${cost.labor}`
      });
      csvData.push({
        category: 'Cost Estimation',
        field: 'Permits',
        value: `$${cost.permits}`
      });
      csvData.push({
        category: 'Cost Estimation',
        field: 'Equipment',
        value: `$${cost.equipment}`
      });
      csvData.push({
        category: 'Cost Estimation',
        field: 'Total',
        value: `$${cost.total}`
      });
    }

    // Materials breakdown
    if (project.propertyDetails.materials && project.propertyDetails.materials.length > 0) {
      project.propertyDetails.materials.forEach((material, index) => {
        csvData.push({
          category: 'Materials',
          field: `Material ${index + 1} - Type`,
          value: material.type
        });
        csvData.push({
          category: 'Materials',
          field: `Material ${index + 1} - Quantity`,
          value: `${material.quantity} ${material.unit || ''}`
        });
        if (material.pricePerUnit) {
          csvData.push({
            category: 'Materials',
            field: `Material ${index + 1} - Price Per Unit`,
            value: `$${material.pricePerUnit}`
          });
        }
      });
    }

    // Convert data to CSV format
    const csvHeaders = 'Category,Field,Value\n';
    const csvRows = csvData.map(row => 
      `"${row.category}","${row.field}","${row.value}"`
    ).join('\n');
    const csv = csvHeaders + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}-export.csv"`);
    res.send(csv);

  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Server error during CSV export' });
  }
});

// Export project as PDF report (simplified - returns HTML for now)
router.get('/:projectId/pdf', auth, validateObjectId('projectId'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'username email')
      .populate('collaborators.user', 'username email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to the project
    const hasAccess = project.owner._id.toString() === req.user._id.toString() ||
      project.collaborators.some(collab => collab.user._id.toString() === req.user._id.toString()) ||
      project.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // For now, return HTML content that can be converted to PDF client-side
    const htmlContent = generateProjectReportHTML(project);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);

  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ message: 'Server error during PDF export' });
  }
});

// Export project data as JSON
router.get('/:projectId/json', auth, validateObjectId('projectId'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'username email')
      .populate('collaborators.user', 'username email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to the project
    const hasAccess = project.owner._id.toString() === req.user._id.toString() ||
      project.collaborators.some(collab => collab.user._id.toString() === req.user._id.toString()) ||
      project.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}-export.json"`);
    res.json(project);

  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({ message: 'Server error during JSON export' });
  }
});

// Generate HTML content for PDF report
function generateProjectReportHTML(project) {
  const formatCurrency = (amount) => `$${amount.toLocaleString()}`;
  const formatDate = (date) => new Date(date).toLocaleDateString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Project Report - ${project.name}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          line-height: 1.6;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 2.5em;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .section {
          margin-bottom: 30px;
          border-bottom: 2px solid #eee;
          padding-bottom: 20px;
        }
        .section:last-child {
          border-bottom: none;
        }
        .section h2 {
          color: #667eea;
          margin-bottom: 15px;
          font-size: 1.5em;
          border-left: 4px solid #667eea;
          padding-left: 15px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .info-item {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
        }
        .info-item strong {
          color: #667eea;
          display: block;
          margin-bottom: 5px;
        }
        .cost-breakdown {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 5px;
          margin-top: 15px;
        }
        .cost-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #dee2e6;
        }
        .cost-item:last-child {
          border-bottom: 2px solid #667eea;
          font-weight: bold;
          margin-top: 10px;
          padding-top: 15px;
        }
        .materials-list {
          list-style: none;
          padding: 0;
        }
        .materials-list li {
          background: #f8f9fa;
          margin: 10px 0;
          padding: 15px;
          border-radius: 5px;
          border-left: 4px solid #667eea;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${project.name}</h1>
        <p>Real Estate Project Report</p>
      </div>
      
      <div class="content">
        <div class="section">
          <h2>Project Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <strong>Description</strong>
              ${project.description || 'No description provided'}
            </div>
            <div class="info-item">
              <strong>Status</strong>
              ${project.status.toUpperCase()}
            </div>
            <div class="info-item">
              <strong>Owner</strong>
              ${project.owner.username} (${project.owner.email})
            </div>
            <div class="info-item">
              <strong>Created Date</strong>
              ${formatDate(project.createdAt)}
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Property Details</h2>
          <div class="info-grid">
            <div class="info-item">
              <strong>Property Type</strong>
              ${project.propertyDetails.type.charAt(0).toUpperCase() + project.propertyDetails.type.slice(1)}
            </div>
            <div class="info-item">
              <strong>Dimensions</strong>
              ${project.propertyDetails.dimensions.length} × ${project.propertyDetails.dimensions.width} × ${project.propertyDetails.dimensions.height} ${project.propertyDetails.dimensions.unit}
            </div>
            ${project.propertyDetails.location && project.propertyDetails.location.address ? `
            <div class="info-item">
              <strong>Address</strong>
              ${project.propertyDetails.location.address}<br>
              ${project.propertyDetails.location.city || ''}, ${project.propertyDetails.location.state || ''} ${project.propertyDetails.location.zipCode || ''}
            </div>
            ` : ''}
          </div>
        </div>

        ${project.propertyDetails.materials && project.propertyDetails.materials.length > 0 ? `
        <div class="section">
          <h2>Materials</h2>
          <ul class="materials-list">
            ${project.propertyDetails.materials.map(material => `
              <li>
                <strong>${material.type}</strong><br>
                Quantity: ${material.quantity} ${material.unit || ''}<br>
                ${material.pricePerUnit ? `Price per unit: ${formatCurrency(material.pricePerUnit)}` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
        ` : ''}

        ${project.costEstimation ? `
        <div class="section">
          <h2>Cost Estimation</h2>
          <div class="cost-breakdown">
            <div class="cost-item">
              <span>Materials</span>
              <span>${formatCurrency(project.costEstimation.materials)}</span>
            </div>
            <div class="cost-item">
              <span>Labor</span>
              <span>${formatCurrency(project.costEstimation.labor)}</span>
            </div>
            <div class="cost-item">
              <span>Permits & Fees</span>
              <span>${formatCurrency(project.costEstimation.permits)}</span>
            </div>
            <div class="cost-item">
              <span>Equipment</span>
              <span>${formatCurrency(project.costEstimation.equipment)}</span>
            </div>
            <div class="cost-item">
              <span><strong>Total Estimated Cost</strong></span>
              <span><strong>${formatCurrency(project.costEstimation.total)}</strong></span>
            </div>
          </div>
          ${project.costEstimation.lastCalculated ? `
            <p style="margin-top: 15px; color: #666; font-size: 0.9em;">
              Last calculated: ${formatDate(project.costEstimation.lastCalculated)}
            </p>
          ` : ''}
        </div>
        ` : ''}

        <div class="footer">
          <p>Report generated on ${formatDate(new Date())} by Restmage</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;