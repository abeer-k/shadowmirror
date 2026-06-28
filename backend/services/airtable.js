const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const TABLES = {
  CUSTOMERS: 'CUSTOMERS',
  JOURNAL_ENTRIES: 'JOURNAL_ENTRIES',
  CONTENT_PIPELINE: 'CONTENT_PIPELINE',
  FINANCIALS: 'FINANCIALS',
};

async function createCustomer({ email, firstName, archetype, shadowName, stripeCustomerId, plan = 'Monthly' }) {
  const record = await base(TABLES.CUSTOMERS).create({
    Email: email,
    'First Name': firstName,
    'Stripe Customer ID': stripeCustomerId,
    Plan: plan,
    'Join Date': new Date().toISOString().split('T')[0],
    'Streak Count': 0,
    'Shadow Archetype': archetype,
    'Shadow Name': shadowName,
    'Churn Risk Score': 0,
    'Week Number': 1,
  });
  return record;
}

async function getCustomerByEmail(email) {
  const records = await base(TABLES.CUSTOMERS)
    .select({ filterByFormula: `{Email} = '${email}'`, maxRecords: 1 })
    .firstPage();
  return records[0] || null;
}

async function getCustomerByStripeId(stripeCustomerId) {
  const records = await base(TABLES.CUSTOMERS)
    .select({ filterByFormula: `{Stripe Customer ID} = '${stripeCustomerId}'`, maxRecords: 1 })
    .firstPage();
  return records[0] || null;
}

async function updateCustomer(recordId, fields) {
  return base(TABLES.CUSTOMERS).update(recordId, fields);
}

async function incrementStreak(recordId, currentStreak) {
  return base(TABLES.CUSTOMERS).update(recordId, {
    'Streak Count': currentStreak + 1,
    'Last Journal Date': new Date().toISOString().split('T')[0],
    'Churn Risk Score': 0,
  });
}

async function createJournalEntry({ customerId, email, rawEntry, analysis }) {
  return base(TABLES.JOURNAL_ENTRIES).create({
    'Entry ID': `${email}-${Date.now()}`,
    Email: email,
    'Customer Record ID': customerId,
    Date: new Date().toISOString().split('T')[0],
    'Raw Entry': rawEntry,
    'AI Analysis': JSON.stringify(analysis),
    'Archetypes Detected': analysis.archetypes_active || [],
    'Emotional Valence': analysis.emotional_valence,
    'Key Themes': (analysis.key_themes || []).join(', '),
    'Entry Summary': analysis.entry_summary,
    'Tomorrow Prompt': analysis.tomorrow_prompt,
    'Flagged for Portrait': true,
  });
}

async function getWeekEntries(email) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const records = await base(TABLES.JOURNAL_ENTRIES)
    .select({
      filterByFormula: `AND({Email} = '${email}', {Date} >= '${sevenDaysAgo}')`,
      sort: [{ field: 'Date', direction: 'asc' }],
    })
    .firstPage();
  return records;
}

async function getLastEntrySummary(email) {
  const records = await base(TABLES.JOURNAL_ENTRIES)
    .select({
      filterByFormula: `{Email} = '${email}'`,
      sort: [{ field: 'Date', direction: 'desc' }],
      maxRecords: 1,
    })
    .firstPage();
  return records[0]?.fields['Entry Summary'] || null;
}

async function getAllActiveCustomers() {
  const records = await base(TABLES.CUSTOMERS)
    .select({ filterByFormula: `{Plan} != 'Cancelled'` })
    .all();
  return records;
}

async function getChurnRiskCustomers() {
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const records = await base(TABLES.CUSTOMERS)
    .select({
      filterByFormula: `AND({Plan} != 'Cancelled', OR({Last Journal Date} < '${fourDaysAgo}', {Last Journal Date} = ''))`,
    })
    .all();
  return records;
}

async function logFinancial({ type, description, amount, category, debit, credit }) {
  return base(TABLES.FINANCIALS).create({
    Date: new Date().toISOString().split('T')[0],
    'Transaction Type': type,
    Description: description,
    Amount: amount,
    Category: category,
    'Pacioli Debit Account': debit,
    'Pacioli Credit Account': credit,
  });
}

module.exports = {
  createCustomer,
  getCustomerByEmail,
  getCustomerByStripeId,
  updateCustomer,
  incrementStreak,
  createJournalEntry,
  getWeekEntries,
  getLastEntrySummary,
  getAllActiveCustomers,
  getChurnRiskCustomers,
  logFinancial,
};
