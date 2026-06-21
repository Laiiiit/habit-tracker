require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { migrate } = require('./db');
const { startCronJobs } = require('./services/cron');

const authRoutes = require('./routes/auth');
const habitsRoutes = require('./routes/habits');
const sharedRoutes = require('./routes/shared');
const eventsRoutes = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/shared', sharedRoutes);
app.use('/api/events', eventsRoutes);

// 404
app.use((_, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start
async function main() {
  try {
    await migrate();
    startCronJobs();
    app.listen(PORT, () => {
      console.log(`🚀 Backend listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main();
