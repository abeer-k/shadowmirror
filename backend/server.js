require('dotenv').config();
const express = require('express');
const cors = require('cors');

const stripeWebhook = require('./routes/stripe-webhook');
const journalRoutes = require('./routes/journal');
const quizRoutes = require('./routes/quiz');
const { startWeeklyPortraitJob } = require('./jobs/weeklyPortraits');
const { startChurnPreventionJob } = require('./jobs/churnPrevention');

const app = express();
const PORT = process.env.PORT || 3000;

// Stripe webhook must use raw body — mount BEFORE json middleware
app.use('/webhook/stripe', stripeWebhook);

// Standard middleware
app.use(cors({ origin: process.env.BASE_URL || '*' }));
app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/journal', journalRoutes);
app.use('/quiz', quizRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Start cron jobs
if (process.env.NODE_ENV === 'production') {
  startWeeklyPortraitJob();
  startChurnPreventionJob();
  console.log('✓ Cron jobs started');
}

app.listen(PORT, () => {
  console.log(`ShadowMirror backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
