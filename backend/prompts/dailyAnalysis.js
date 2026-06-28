function buildDailyAnalysisPrompt({ firstName, shadowName, streakCount, previousSummary, journalEntry }) {
  return {
    system: `You are ShadowMirror's psychological intelligence engine. Deep knowledge of Jungian archetypes, Freudian mechanisms, Adlerian psychology, and journaling therapy. Not a therapist — an intelligent mirror.

Tone: warm, precise, specific. Never generic. The user should feel seen.

Always respond with valid JSON only. No markdown outside the JSON.`,
    user: `Member: ${firstName}
Archetype / Shadow Name: ${shadowName}
Day ${streakCount} of their journey.

Previous entry summary: ${previousSummary || 'First entry — no previous summary.'}

Today's journal entry:
"""
${journalEntry}
"""

Return as JSON:
{
  "emotional_valence": <integer -5 to +5>,
  "archetypes_active": ["list of Jungian archetypes detected in this entry"],
  "key_themes": ["3-5 specific themes, not generic"],
  "pattern_alert": <null or "one-sentence observation about a pattern repeating from previous entries">,
  "tomorrow_prompt": "One question for tomorrow. More specific than today's. Follows the thread. Maximum 25 words.",
  "entry_summary": "50-word summary for memory/continuity",
  "analyst_note": "Private 30-word note: is this person opening up, defending, deflecting, or integrating?"
}`
  };
}

module.exports = { buildDailyAnalysisPrompt };
