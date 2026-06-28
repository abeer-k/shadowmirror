function buildOnboardingPrompt({ firstName, archetype, q1, q2, q3, q4, q5 }) {
  return {
    system: `You are ShadowMirror's psychological intelligence engine. You have deep knowledge of Jungian archetypes, Freudian unconscious mechanisms, Adlerian individual psychology, and evidence-based journaling therapy. You are not a therapist and never claim to be. You are an intelligent mirror.

Your tone: warm but precise. Never clinical. Never vague. Name things specifically. The user should feel seen, not processed.

Always respond with valid JSON only. No markdown, no explanation outside the JSON object.`,
    user: `New member profile:
- Name: ${firstName}
- Quiz result archetype: ${archetype}
- Quiz answers:
  Q1 (what they most want to change): ${q1}
  Q2 (the pattern they keep repeating): ${q2}
  Q3 (what they fear others see in them): ${q3}
  Q4 (their harshest self-criticism): ${q4}
  Q5 (what success looks like / what would change if no fear): ${q5}

Generate and return as JSON:
{
  "shadow_welcome": "A 150-word direct, specific paragraph addressing ${firstName} by name, naming their archetype, describing what it means for them specifically based on their answers, and framing their ShadowMirror journey as the beginning of integration, not the exposure of failure.",
  "first_prompt": "One question only, maximum 25 words, designed to surface the specific pattern identified in their quiz answers. Must feel uncomfortably accurate. Must make them pause before answering.",
  "shadow_name": "A specific name for their archetype based on their answers — not the generic label but a precise one, e.g., not 'The Tyrant' but 'The Controller Who Learned That Love Requires Performance'."
}`
  };
}

module.exports = { buildOnboardingPrompt };
