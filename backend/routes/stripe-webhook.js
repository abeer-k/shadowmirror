const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createCustomer, getCustomerByStripeId, updateCustomer, logFinancial } = require('../services/airtable');
const { generateOnboarding } = require('../services/claude');
const { sendWelcome } = require('../services/email');

const router = express.Router();

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        break;
    }
  } catch (err) {
    console.error(`Error handling event ${event.type}:`, err);
    return res.status(500).send('Internal error');
  }

  res.json({ received: true });
});

async function handleCheckoutCompleted(session) {
  const { customer: stripeCustomerId, customer_email, metadata } = session;
  const email = customer_email || metadata?.email;
  const firstName = metadata?.first_name || email.split('@')[0];
  const archetype = metadata?.archetype || 'Unknown';
  const q1 = metadata?.q1 || '';
  const q2 = metadata?.q2 || '';
  const q3 = metadata?.q3 || '';
  const q4 = metadata?.q4 || '';
  const q5 = metadata?.q5 || '';

  // Generate onboarding AI content
  const onboarding = await generateOnboarding({ firstName, archetype, q1, q2, q3, q4, q5 });

  // Create Airtable record
  const customer = await createCustomer({
    email,
    firstName,
    archetype,
    shadowName: onboarding.shadow_name,
    stripeCustomerId,
    plan: 'Monthly',
  });

  // Send welcome email
  await sendWelcome({
    to: email,
    firstName,
    shadowWelcome: onboarding.shadow_welcome,
    shadowName: onboarding.shadow_name,
    firstPrompt: onboarding.first_prompt,
  });

  // Log financial
  const amount = (session.amount_total || 0) / 100;
  await logFinancial({
    type: 'Revenue',
    description: `New subscription: ${email}`,
    amount,
    category: 'SaaS Subscriptions',
    debit: '1000 - Stripe Account',
    credit: '4000 - Monthly Subscriptions',
  });

  console.log(`✓ New customer onboarded: ${email} (${onboarding.shadow_name})`);
}

async function handleSubscriptionCancelled(subscription) {
  const customer = await getCustomerByStripeId(subscription.customer);
  if (customer) {
    await updateCustomer(customer.id, { Plan: 'Cancelled' });
    console.log(`Subscription cancelled: ${customer.fields.Email}`);
  }
}

async function handlePaymentSucceeded(invoice) {
  if (invoice.billing_reason === 'subscription_cycle') {
    const amount = (invoice.amount_paid || 0) / 100;
    await logFinancial({
      type: 'Revenue',
      description: `Renewal: ${invoice.customer_email}`,
      amount,
      category: 'SaaS Subscriptions',
      debit: '1000 - Stripe Account',
      credit: '4000 - Monthly Subscriptions',
    });
  }
}

async function handlePaymentFailed(invoice) {
  console.log(`Payment failed for: ${invoice.customer_email}`);
  // Stripe Smart Retries handles re-attempts automatically
}

module.exports = router;
