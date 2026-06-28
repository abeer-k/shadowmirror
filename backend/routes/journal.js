const express = require('express');
const { getCustomerByEmail, incrementStreak, createJournalEntry, getLastEntrySummary } = require('../services/airtable');
const { analyzeDailyEntry } = require('../services/claude');
const { sendDailyPrompt } = require('../services/email');

const router = express.Router();

// POST /journal — submit a journal entry
router.post('/', async (req, res) => {
  const { email, entry } = req.body;

  if (!email || !entry) {
    return res.status(400).json({ error: 'email and entry are required' });
  }

  if (entry.trim().length < 20) {
    return res.status(400).json({ error: 'Entry is too short. Write at least a few sentences.' });
  }

  try {
    const customer = await getCustomerByEmail(email);
    if (!customer) {
      return res.status(404).json({ error: 'No account found for this email.' });
    }

    const { 'First Name': firstName, 'Shadow Name': shadowName, 'Streak Count': streak } = customer.fields;
    const previousSummary = await getLastEntrySummary(email);

    // Analyze with Claude
    const analysis = await analyzeDailyEntry({
      firstName,
      shadowName,
      streakCount: streak + 1,
      previousSummary,
      journalEntry: entry,
    });

    // Persist entry
    await createJournalEntry({ customerId: customer.id, email, rawEntry: entry, analysis });

    // Update streak
    await incrementStreak(customer.id, streak);

    // Send confirmation + tomorrow's prompt
    await sendDailyPrompt({
      to: email,
      firstName,
      tomorrowPrompt: analysis.tomorrow_prompt,
      streakCount: streak + 1,
      patternAlert: analysis.pattern_alert,
    });

    res.json({
      success: true,
      streak: streak + 1,
      tomorrow_prompt: analysis.tomorrow_prompt,
      pattern_alert: analysis.pattern_alert,
    });
  } catch (err) {
    console.error('Journal submission error:', err);
    res.status(500).json({ error: 'Something went wrong processing your entry. Please try again.' });
  }
});

// GET /journal/prompt — get today's prompt (for members who need a reminder)
router.get('/prompt', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email required' });

  try {
    const customer = await getCustomerByEmail(email);
    if (!customer) return res.status(404).json({ error: 'Account not found.' });

    const lastEntry = await getLastEntrySummary(email);
    // Return the last prompt or a default
    res.json({
      prompt: customer.fields['Last Prompt'] || 'What is the oldest story you tell yourself about why things don\'t work out?',
      streak: customer.fields['Streak Count'],
      shadow_name: customer.fields['Shadow Name'],
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching prompt.' });
  }
});

module.exports = router;
