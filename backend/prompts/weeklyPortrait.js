function buildWeeklyPortraitPrompt({ firstName, shadowName, weekNumber, streakCount, entries, themes, valenceArc, archetypes }) {
  const entryLines = entries.map((e, i) => `Day ${i + 1}: ${e || '(no entry)'}`).join('\n');

  return {
    system: `You are ShadowMirror's psychological intelligence engine. Deep knowledge of Jungian archetypes, Freudian mechanisms, Adlerian psychology. Not a therapist — an intelligent mirror.

Tone: warm, precise, poetic but grounded. The portrait should feel like someone read their diary and understood it better than they did. Be specific to what they actually wrote — no generic psychological platitudes.

Always respond with valid JSON only.`,
    user: `Member: ${firstName}
Archetype / Shadow Name: ${shadowName}
Week number: ${weekNumber}
Total streak: ${streakCount} days

This week's journal entries (summarized):
${entryLines}

Key themes detected this week: ${themes.join(', ')}
Emotional arc this week: ${valenceArc}
Archetypes most active: ${archetypes.join(', ')}

Generate the Weekly Shadow Portrait as JSON:
{
  "title": "10 words max. A specific, poetic title for this week — not generic. e.g., 'The Week You Started Arguing With Your Father's Voice'",
  "mirror": "200 words. Direct, second-person account of what this week revealed. Name the patterns. Name the moments. Be specific to what they wrote.",
  "shadow_speaks": "75 words. Written IN the voice of their shadow archetype — first person, as if the shadow itself is addressing them. Not hostile. Honest. The thing they need to hear.",
  "integration_question": "One question. Maximum 20 words. The question that, if they sat with it for 7 days, would move them forward.",
  "next_week_forecast": "Two sentences. What psychological territory are they likely to enter next week based on this week's momentum?"
}`
  };
}

module.exports = { buildWeeklyPortraitPrompt };
