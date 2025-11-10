# Changelog - Restmage MapEditor Integration

## [2.0.0] - 2025-11-07

### 🎉 Major Features Added

#### MapEditor Integration
- Integrated standalone MapEditor into React client application
- Created `MapEditor.tsx` React wrapper with full lifecycle management
- Migrated all MapEditor JavaScript modules (canvas, rooms, walls, doors, windows, etc.)
- Added canvas-based interactive editing with drag-and-drop functionality
- Implemented export functionality (PNG, PDF)
- Added real-time save to project API

#### AI-Powered Floor Plan Generation
- Integrated Google Gemini AI for intelligent floor plan generation
- Created `/api/gemini/generate-map` endpoint
- Smart prompt engineering for optimal layout generation
- Automatic fallback to basic generator when API unavailable
- JSON validation and error handling

#### Enhanced Workflow
- Created `WorkflowChoice` modal component for user path selection
- Two-path workflow: "Generate Floor Plan" or "Get Price Prediction"
- Seamless navigation between components
- State preservation across routes
- Automatic project creation with AI-generated maps

#### Export System
- Server-side PDF generation for pricing reports (`/api/export/pricing-pdf`)
- Server-side PDF generation for floor plans (`/api/export/map-pdf`)
- Client-side PNG image export via Canvas API
- Client-side PDF export via jsPDF and html2canvas
- Professional formatting with metadata

### 🧪 Testing & Quality

#### Automated Testing
- Created comprehensive integration tests for Gemini API
- Created component tests for WorkflowChoice
- Added test scripts to all package.json files:
  - `npm test` - Run all tests
  - `npm run test:coverage` - Coverage reports
  - `npm run test:ci` - CI/CD compatible tests

#### Logging & Debugging
- Integrated Winston logging framework
- Separate log files (combined, error, exceptions, rejections)
- Log rotation with size limits (5MB per file)
- Health check script for system validation
- Auto-debug capabilities

### 📝 Documentation

#### New Documentation Files
- `MAPEDITOR_INTEGRATION.md` - Comprehensive integration guide
- `INTEGRATION_SUMMARY.md` - Complete summary of changes
- `QUICK_START.md` - 5-minute getting started guide
- Updated `README.md` with new features and workflow

### 🔧 Technical Improvements

#### Frontend (Client)
- Added MapEditor route: `/project/:projectId/editor`
- Updated FloorPlanGenerator with workflow integration
- Created WorkflowChoice component with Material-UI
- Fixed MUI v7 Grid compatibility issues
- Added export handlers for PNG and PDF

#### Backend (Server)
- New route: `/api/gemini/generate-map`
- New route: `/api/export/pricing-pdf`
- New route: `/api/export/map-pdf`
- Winston logger utility
- Enhanced error handling

#### Configuration
- Updated `.gitignore` for Python and logs
- Added logging configuration
- Environment variable support for Gemini API
- NPM scripts for testing, linting, coverage

### 📦 Dependencies

#### Added
- `winston` (server) - Logging framework

#### Updated
- No version updates, all features use existing dependencies

### 🐛 Bug Fixes
- Fixed MUI Grid v7 compatibility in WorkflowChoice
- Resolved TypeScript errors in new components
- Fixed import paths for MapEditor modules

### 🔄 Changed

#### File Structure
```
client/src/components/
├── MapEditor/              [NEW]
│   ├── MapEditor.tsx
│   ├── js/                 [MIGRATED]
│   └── styles/             [MIGRATED]
└── FloorPlan/
    ├── WorkflowChoice.tsx  [NEW]
    └── WorkflowChoice.test.tsx [NEW]

server/
├── routes/
│   ├── gemini.js           [NEW]
│   └── export-pdf.js       [NEW]
├── utils/
│   └── logger.js           [NEW]
├── logs/                   [NEW]
└── tests/
    └── integration.test.js [NEW]

scripts/
└── health-check.js         [NEW]
```

#### Modified Files
1. `client/src/App.tsx` - Added MapEditor route
2. `client/src/components/FloorPlan/FloorPlanGenerator.tsx` - Workflow integration
3. `client/package.json` - Test scripts
4. `server/server.js` - New routes
5. `server/package.json` - Test/lint scripts
6. `package.json` - Comprehensive scripts
7. `.gitignore` - Python and logs
8. `README.md` - Updated features

### 📊 Statistics
- **Files Created**: 19
- **Files Modified**: 8
- **Lines of Code Added**: ~2,500+
- **Test Coverage**: Integration and unit tests
- **Documentation Pages**: 4

### 🚀 Performance
- Lazy loading of MapEditor component
- Optimized canvas rendering
- PDF generation with size limits
- Log file rotation
- Efficient state management

### 🔒 Security
- JWT authentication on all new routes
- Input validation on API endpoints
- Secure error logging (no sensitive data exposure)
- Rate limiting (existing, applies to new routes)

### ⚡ Breaking Changes
- None - All changes are additive and backward compatible

### 📋 Migration Guide
No migration needed. All existing functionality remains intact.

### 🎯 Known Limitations
1. Gemini API requires API key (optional, has fallback)
2. Canvas requires modern browser support
3. PDF export has size limits for performance

### 🔮 Future Roadmap
- [ ] 3D visualization mode
- [ ] Real-time collaborative editing enhancements
- [ ] Advanced AI room suggestions
- [ ] Custom furniture/fixture library
- [ ] Virtual reality walkthrough
- [ ] Enhanced pricing integration with map
- [ ] Mobile app version
- [ ] Offline mode support

### 👥 Contributors
- Implementation: AI Assistant
- Project Owner: Manmohan Singh Raghav

### 📞 Support
- Documentation: See `MAPEDITOR_INTEGRATION.md`
- Quick Start: See `QUICK_START.md`
- Health Check: Run `node scripts/health-check.js`

---

## [1.0.0] - Previous Version

### Features
- Basic floor plan generation
- Price prediction
- Chatbot functionality
- Project management
- Interactive maps (Leaflet)
- Export to PDF/CSV/JSON
- Real-time collaboration
- JWT authentication

---

**Note**: This changelog follows [Semantic Versioning](https://semver.org/) and [Keep a Changelog](https://keepachangelog.com/) format.
