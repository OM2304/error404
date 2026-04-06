const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const { parseIFC } = require('./parser');
const { detectClashes } = require('./clash');
const { generateReport } = require('./report');
const { computeReroute } = require('./reroute');

const app = express();
const port = 3001;

// Use much larger body limit for large IFC models
app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

// Root route for health check
app.get('/', (req, res) => {
  res.send('BIM Smart Route Backend is running. Please use the frontend UI to interact.');
});

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 1. Convert IFC to JSON
app.post('/api/convert', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const filePath = req.file.path;
    const model = await parseIFC(filePath);
    
    // Cleanup: delete uploaded file after parsing
    fs.unlinkSync(filePath);
    
    res.json(model);
  } catch (error) {
    console.error('Error parsing IFC:', error);
    res.status(500).json({ error: 'Failed to parse IFC file' });
  }
});

// 2. Detect Clashes and Generate Report
app.post('/api/clash-analysis', (req, res) => {
  const { elements, metadata } = req.body;

  if (!elements || !Array.isArray(elements)) {
    return res.status(400).json({ error: 'Invalid elements data' });
  }

  try {
    const clashes = detectClashes(elements);
    const report = generateReport(clashes, metadata);
    
    res.json({
      clashes,
      reportText: report.text,
      reportJson: report.json
    });
  } catch (error) {
    console.error('Error during clash analysis:', error);
    res.status(500).json({ error: 'Clash analysis failed' });
  }
});

app.post('/api/reroute', (req, res) => {
  // API Flow
  // Step 1: Frontend sends:
  // POST /api/reroute
  // {
  //   elements: [...],
  //   clashes: [...] or clash: {...}
  // }
  let requestClashes = req.body.clashes;
  if (!Array.isArray(requestClashes) && req.body.clash) {
    requestClashes = [req.body.clash];
  }

  const { elements } = req.body;

  if (!Array.isArray(requestClashes) || !Array.isArray(elements)) {
    return res.status(400).json({ error: 'Invalid clashes or elements data' });
  }

  try {
    const result = computeReroute(requestClashes, elements);
    res.json({
      message: "rerouting complete",
      rerouted: result.reroutedElements,
      updatedElements: result.updatedElements
    });
  } catch (error) {
    console.error('Error during reroute:', error);
    res.status(500).json({ error: error.message || 'Reroute failed' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});
