const Anthropic = require('@anthropic-ai/sdk');
const { buildOnboardingPrompt } = require('../prompts/onboarding');
const { buildDailyAnalysisPrompt } = require('../prompts/dailyAnalysis');
const { buildWeeklyPortraitPrompt } = require('../prompts/weeklyPortrait');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function callClaude(system, user, model = 'claude-haiku-4-5-20251001') {
  const message = await client.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: 'user', content: user }],
    system,
  });
  const text = message.content[0].text.trim();
  return JSON.parse(text);
}

async function generateOnboarding(data) {
  const { system, user } = buildOnboardingPrompt(data);
  return callClaude(system, user, 'claude-sonnet-4-6');
}

async function analyzeDailyEntry(data) {
  const { system, user } = buildDailyAnalysisPrompt(data);
  return callClaude(system, user, 'claude-haiku-4-5-20251001');
}

async function generateWeeklyPortrait(data) {
  const { system, user } = buildWeeklyPortraitPrompt(data);
  return callClaude(system, user, 'claude-sonnet-4-6');
}

async function generateContentPackage(trendingTopics) {
  const system = `You are a content strategist for ShadowMirror, a Jungian shadow work journaling platform. Brand voice: intellectually rigorous, emotionally precise, never preachy. The reader should feel understood, then curious. Always respond with valid JSON only.`;

  const user = `Trending discussions in psychology/self-improvement communities today:
${trendingTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Generate content that adds genuine value to these conversations and drives traffic to shadowmirror.com/quiz.

Return as JSON:
{
  "twitter_thread": ["tweet1", "tweet2", ... up to 16 tweets. Last tweet includes CTA to shadowmirror.com/quiz?utm_source=twitter&utm_campaign=organic"],
  "tiktok_script": "60-second script with hook in first 3 seconds",
  "linkedin_hook": "First 3 lines of an article — something that cannot be scrolled past"
}`;

  return callClaude(system, user, 'claude-haiku-4-5-20251001');
}

module.exports = { generateOnboarding, analyzeDailyEntry, generateWeeklyPortrait, generateContentPackage };
