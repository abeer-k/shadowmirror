const cron = require('node-cron');
const { getAllActiveCustomers, getWeekEntries, updateCustomer, logFinancial } = require('../services/airtable');
const { generateWeeklyPortrait } = require('../services/claude');
const { sendWeeklyPortrait } = require('../services/email');

// Runs every Sunday at 8:00 AM UTC
function startWeeklyPortraitJob() {
  cron.schedule('0 8 * * 0', async () => {
    console.log('[CRON] Starting weekly portrait generation...');
    const customers = await getAllActiveCustomers();
    let generated = 0;

    for (const customer of customers) {
      try {
        const { Email: email, 'First Name': firstName, 'Shadow Name': shadowName,
                'Week Number': weekNumber, 'Streak Count': streak } = customer.fields;

        const entries = await getWeekEntries(email);

        if (entries.length < 3) {
          // Not enough entries — send re-engagement instead
          await sendWeeklyPortrait({
            to: email,
            firstName,
            portrait: {
              title: 'Your portrait is waiting',
              mirror: `We couldn't build your Week ${weekNumber} portrait — you wrote ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} this week, and a portrait needs at least 3. The work doesn't disappear. Come back this week.`,
              shadow_speaks: 'I\'m still here. Still running. You can look at me anytime you\'re ready.',
              integration_question: 'What would it take to show up for yourself three times this week?',
              next_week_forecast: 'The patterns don\'t pause when the journal does. They find other channels. Writing is how you make them visible.',
            },
            weekNumber,
          });
          continue;
        }

        const summaries = entries.map(e => e.fields['Entry Summary'] || e.fields['Raw Entry']?.substring(0, 100));
        const themes = [...new Set(entries.flatMap(e => (e.fields['Key Themes'] || '').split(', ')))].filter(Boolean);
        const valences = entries.map(e => e.fields['Emotional Valence'] || 0);
        const valenceArc = `${valences[0]} → ${valences[valences.length - 1]}`;
        const archetypes = [...new Set(entries.flatMap(e => e.fields['Archetypes Detected'] || []))];

        const portrait = await generateWeeklyPortrait({
          firstName, shadowName, weekNumber, streakCount: streak, entries: summaries,
          themes, valenceArc, archetypes,
        });

        await sendWeeklyPortrait({ to: email, firstName, portrait, weekNumber });
        await updateCustomer(customer.id, { 'Week Number': (weekNumber || 1) + 1 });

        generated++;
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`Portrait error for ${customer.fields.Email}:`, err.message);
      }
    }

    console.log(`[CRON] Weekly portraits complete. Generated: ${generated}/${customers.length}`);
  });
}

module.exports = { startWeeklyPortraitJob };
