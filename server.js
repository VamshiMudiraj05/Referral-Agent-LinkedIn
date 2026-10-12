const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const cors = require('cors');
const path = require('path');
const WorkflowCoordinator = require('./agents/WorkflowCoordinator');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Serve static frontend build if present
const distPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(distPath));

// Broadcast helper for WebSocket
function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Instantiate WorkflowCoordinator
const coordinator = new WorkflowCoordinator(broadcast, {
  safety: {
    maxRequestsPerCompany: 10,
    maxRequestsPerSession: 20
  },
  headless: false // Visible by default for transparency & manual login
});

// WebSocket Connection handling
wss.on('connection', (ws) => {
  console.log('Client connected to real-time agent WebSocket');

  // Send current state
  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    isRunning: coordinator.isRunning,
    history: coordinator.history.getAll(),
    lastCampaign: coordinator.history.lastCampaign,
    stats: coordinator.history.getStats()
  }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'APPROVAL_DECISION') {
        coordinator.handleApprovalDecision(parsed.data);
      } else if (parsed.type === 'COMPANY_VERIFICATION_DECISION') {
        coordinator.confirmCompanyVerification(parsed.data);
      } else if (parsed.type === 'RESUME_SAFETY') {
        coordinator.resumeSecurityPause();
      }
    } catch (err) {
      console.error('Error parsing WS message:', err);
    }
  });
});

// REST API Endpoints
app.get('/api/status', (req, res) => {
  res.json({
    isRunning: coordinator.isRunning,
    isPaused: coordinator.safety.isPaused,
    pauseReason: coordinator.safety.pauseReason,
    stats: coordinator.history.getStats()
  });
});

app.get('/api/history', (req, res) => {
  const company = req.query.company || null;
  const history = coordinator.history.getAll();
  const filtered = company 
    ? history.filter(h => h.company.toLowerCase() === company.toLowerCase())
    : history;
  res.json({
    records: filtered,
    stats: coordinator.history.getStats(company),
    lastCampaign: coordinator.history.lastCampaign
  });
});

app.get('/api/history/csv', (req, res) => {
  const company = req.query.company || null;
  const csv = coordinator.history.exportCSV(company);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="linkedin_outreach_${company || 'all'}_${Date.now()}.csv"`);
  res.send(csv);
});

app.post('/api/campaign/start', async (req, res) => {
  try {
    const { companyName, companies, referralMessage, strategy, maxPerCompany, maxSession, approvalMode, headless } = req.body;
    
    if (!companyName && (!companies || companies.length === 0)) {
      return res.status(400).json({ error: 'Company Name is required' });
    }
    if (!referralMessage) {
      return res.status(400).json({ error: 'Referral Message is required' });
    }

    // Run campaign asynchronously
    coordinator.startCampaign({
      companyName,
      companies: companies && companies.length > 0 ? companies : [companyName],
      referralMessage,
      strategy: strategy || 'sales_then_it',
      maxPerCompany: maxPerCompany || 10,
      maxSession: maxSession || 20,
      approvalMode: approvalMode !== false,
      headless: headless || false
    }).catch(err => {
      console.error('Campaign background error:', err);
    });

    res.json({ success: true, message: 'Campaign started successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/campaign/stop', (req, res) => {
  coordinator.stopCampaign();
  res.json({ success: true, message: 'Stop signal sent' });
});

app.post('/api/campaign/verify-decision', (req, res) => {
  coordinator.confirmCompanyVerification(req.body);
  res.json({ success: true });
});

app.post('/api/campaign/approval-decision', (req, res) => {
  coordinator.handleApprovalDecision(req.body);
  res.json({ success: true });
});

app.post('/api/campaign/resume-safety', (req, res) => {
  coordinator.resumeSecurityPause();
  res.json({ success: true });
});

// Fallback to React app index.html for client-side routing
app.use((req, res) => {
  const indexHtml = path.join(distPath, 'index.html');
  if (require('fs').existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.send('LinkedIn Referral Outreach AI Agent Backend is running. Please start the frontend with `npm run dev` in frontend/ or build the frontend.');
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🤖 LinkedIn Referral Outreach AI Agent Server`);
  console.log(`🌐 API & WebSocket Server running at: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
