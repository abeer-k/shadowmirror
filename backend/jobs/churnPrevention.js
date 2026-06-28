const cron = require('node-cron');
const { getChurnRiskCustomers, updateCustomer } = require('../services/airtable');
const { sendChurnRiskEmail } = require('../services/email');

// Runs every Tuesday at 10:00 AM UTC
function startChurnPreventionJob() {
  cron.schedule('0 10 * * 2', async () => {
    console.log('[CRON] Running churn prevention...');
    const atRisk = await getChurnRiskCustomers();
    let contacted = 0;

    for (const customer of atRisk) {
      try {
        const { Email: email, 'First Name': firstName, 'Shadow Name': shadowName,
                'Streak Count': streak, 'Churn Risk Score': riskScore } = customer.fields;

        await sendChurnRiskEmail({ to: email, firstName, shadowName, streakCount: streak || 0 });

        // Increment churn risk score
        await updateCustomer(customer.id, { 'Churn Risk Score': (riskScore || 0) + 2 });
        contacted++;

        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error(`Churn email error for ${customer.fields.Email}:`, err.message);
      }
    }

    console.log(`[CRON] Churn prevention complete. Contacted: ${contacted}`);
  });
}

module.exports = { startChurnPreventionJob };
