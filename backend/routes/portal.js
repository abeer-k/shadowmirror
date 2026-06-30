const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// GET /portal?email=user@example.com
router.get('/', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email required' });

  try {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) {
      return res.status(404).json({ error: 'No customer found for this email.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: process.env.BASE_URL,
    });

    res.redirect(session.url);
  } catch (err) {
    console.error('Portal error:', err.message);
    res.status(500).json({ error: 'Could not create portal session.' });
  }
});

module.exports = router;