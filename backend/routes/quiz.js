const express = require('express');
const { sendSequenceEmail } = require('../services/email');

const router = express.Router();

const ARCHETYPE_MAP = {
  // Scoring logic: map answer combos to archetypes
  // Q1: A=Victim, B=Orphan, C=Controller, D=Saboteur, E=Saboteur, F=Trickster
  // Q2: A=Controller, B=Orphan, C=Tyrant, D=Tyrant, E=Victim, F=Saboteur
  // Q3: A=Orphan, B=Tyrant, C=Saboteur/Victim, D=Saboteur, E=Trickster, F=Trickster
};

const ARCHETYPES = {
  Saboteur: {
    name: 'The Saboteur',
    description: `The Saboteur doesn't destroy your life because it hates you. It destroys your life because it learned, early, that the pain of losing something you love is worse than never having it at all. So it acts first. You might recognize it as starting conflicts right when things get good. Leaving before you can be left. Underperforming just enough to have an excuse. Choosing someone unavailable and calling it chemistry. This is not a character flaw. It is a survival strategy that has outlived its usefulness.`,
  },
  Orphan: {
    name: 'The Orphan',
    description: `The Orphan doesn't struggle to connect — it's gifted at it. The problem is that connection comes at a cost: you. You shape-shift. You become whoever the room needs you to be. You're excellent at reading people and terrible at knowing what you actually want. The Orphan's deepest fear isn't abandonment — it's being known and then left. So it stays slightly invisible, slightly adjustable, always just slightly less than fully present.`,
  },
  Controller: {
    name: 'The Controller',
    description: `The Controller learned early that chaos is dangerous. Not a metaphor — literally dangerous. So it built systems. Routines. Standards. Expectations. It calls this high performance. The people who love it call it exhausting. The Controller doesn't need to control everything because it's a control freak. It needs to control everything because the alternative — trusting someone else with something that matters — feels like standing at the edge of something with no railing.`,
  },
  Victim: {
    name: 'The Victim',
    description: `The Victim is the most misunderstood archetype because it doesn't look like weakness from the inside — it looks like clarity. Clarity about who's responsible, what went wrong, why things keep not working. What it actually is: power through powerlessness. If nothing is your fault, nothing can be required of you. If you're always the injured party, you're always protected from the terrifying question of what would happen if you actually tried and it still failed.`,
  },
  Trickster: {
    name: 'The Trickster',
    description: `The Trickster is the funniest person in the room. Also the most unseen. Humor is armor — not the cheap kind, but the sophisticated kind that looks like openness while keeping everyone at exactly the right distance. The Trickster deflects with wit, reframes with irony, and exits before things get heavy. It's brilliant at making connection feel easy. It's terrified of what real connection actually requires.`,
  },
  Tyrant: {
    name: 'The Tyrant',
    description: `The Tyrant doesn't lead through fear because it's cruel. It leads through fear because fear is the only relationship it learned to trust. High achiever. Driven. Sets standards others can't meet — including itself. The Tyrant's deepest secret: it's not afraid of failure. It's afraid of the moment achievement stops and all that's left is the person underneath it, unadorned, unimpressive, ordinary. So it keeps moving. Keeps proving. Keeps performing competence as identity.`,
  },
};

function scoreQuiz(answers) {
  // answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'text' }
  const scores = { Saboteur: 0, Orphan: 0, Controller: 0, Victim: 0, Trickster: 0, Tyrant: 0 };

  const q1Map = { A: 'Victim', B: 'Orphan', C: 'Controller', D: 'Saboteur', E: 'Saboteur', F: 'Trickster' };
  const q2Map = { A: 'Controller', B: 'Orphan', C: 'Tyrant', D: 'Tyrant', E: 'Victim', F: 'Saboteur' };
  const q3Map = { A: 'Orphan', B: 'Tyrant', C: 'Victim', D: 'Saboteur', E: 'Trickster', F: 'Trickster' };
  const q4Map = { A: 'Victim', B: 'Orphan', C: 'Controller', D: 'Saboteur', E: 'Tyrant', F: 'Trickster' };

  if (q1Map[answers.q1]) scores[q1Map[answers.q1]] += 3;
  if (q2Map[answers.q2]) scores[q2Map[answers.q2]] += 3;
  if (q3Map[answers.q3]) scores[q3Map[answers.q3]] += 2;
  if (q4Map[answers.q4]) scores[q4Map[answers.q4]] += 2;

  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

// POST /quiz/submit — capture quiz results + email
router.post('/submit', async (req, res) => {
  const { email, firstName, q1, q2, q3, q4, q5 } = req.body;

  if (!email || !q1 || !q2 || !q3 || !q4) {
    return res.status(400).json({ error: 'All quiz answers required.' });
  }

  const archetype = scoreQuiz({ q1, q2, q3, q4 });
  const archetypeData = ARCHETYPES[archetype];

  // Send sequence email 1 (non-blocking)
  sendSequenceEmail({
    to: email,
    firstName: firstName || email.split('@')[0],
    emailNumber: 1,
    archetype: archetypeData.name,
    q5Answer: q5,
  }).catch(err => console.error('Email send error:', err));

  // Schedule subsequent emails via simple delay (in production, use a queue)
  scheduleSequenceEmails({ email, firstName, archetype: archetypeData.name, q5 });

  res.json({
    archetype,
    archetype_name: archetypeData.name,
    description: archetypeData.description,
    checkout_url: buildCheckoutUrl({ email, firstName, archetype, q1, q2, q3, q4, q5 }),
  });
});

function buildCheckoutUrl({ email, firstName, archetype, q1, q2, q3, q4, q5 }) {
  const params = new URLSearchParams({
    prefilled_email: email,
    'metadata[first_name]': firstName || '',
    'metadata[archetype]': archetype,
    'metadata[email]': email,
    'metadata[q1]': q1?.substring(0, 100) || '',
    'metadata[q2]': q2?.substring(0, 100) || '',
    'metadata[q3]': q3?.substring(0, 100) || '',
    'metadata[q4]': q4?.substring(0, 100) || '',
    'metadata[q5]': (q5 || '').substring(0, 200),
  });
  // Replace with your actual Stripe Payment Link
  return `https://buy.stripe.com/YOUR_PAYMENT_LINK?${params.toString()}`;
}

function scheduleSequenceEmails({ email, firstName, archetype, q5 }) {
  const delays = [4, 24, 48, 72].map(h => h * 60 * 60 * 1000);
  const emailNumbers = [2, 3, 4, 5];

  emailNumbers.forEach((num, i) => {
    setTimeout(() => {
      sendSequenceEmail({ to: email, firstName, emailNumber: num, archetype, q5Answer: q5 })
        .catch(err => console.error(`Sequence email ${num} error:`, err));
    }, delays[i]);
  });
}

module.exports = router;
