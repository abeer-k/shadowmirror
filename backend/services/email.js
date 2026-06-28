const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`;

async function send({ to, subject, html }) {
  return resend.emails.send({ from: FROM, to, subject, html });
}

function wrapInTemplate(content, preheader = '') {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<style>
  body { margin: 0; padding: 0; background: #0a0a0a; font-family: 'Georgia', serif; color: #e8e4dc; }
  .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
  .logo { font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-bottom: 48px; }
  h1 { font-size: 28px; line-height: 1.3; color: #f0ece4; margin: 0 0 24px; font-weight: normal; }
  p { font-size: 17px; line-height: 1.7; color: #c8c4bc; margin: 0 0 20px; }
  .prompt-box { background: #141414; border-left: 3px solid #8b7355; padding: 24px 28px; margin: 32px 0; border-radius: 2px; }
  .prompt-box p { color: #e8e4dc; font-size: 19px; font-style: italic; margin: 0; }
  .shadow-speaks { background: #0f0f0f; border: 1px solid #2a2a2a; padding: 28px; margin: 32px 0; border-radius: 4px; }
  .shadow-speaks .label { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #666; margin-bottom: 16px; }
  .shadow-speaks p { color: #a8a49c; font-style: italic; }
  .cta { display: inline-block; background: #8b7355; color: #0a0a0a; text-decoration: none; padding: 14px 32px; font-size: 15px; letter-spacing: 0.05em; margin: 24px 0; border-radius: 2px; font-family: sans-serif; font-weight: 600; }
  .footer { margin-top: 56px; padding-top: 24px; border-top: 1px solid #1a1a1a; font-size: 13px; color: #555; font-family: sans-serif; }
  .footer a { color: #666; }
  .streak { font-size: 13px; font-family: sans-serif; color: #666; margin-bottom: 8px; }
  .portrait-title { font-size: 22px; color: #8b7355; font-style: italic; margin: 0 0 32px; }
  blockquote { border-left: 2px solid #333; padding-left: 20px; margin: 0 0 20px; }
  blockquote p { color: #888; font-size: 16px; }
</style>
</head>
<body>
${preheader ? `<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>` : ''}
<div class="wrapper">
  <div class="logo">ShadowMirror 🪞</div>
  ${content}
  <div class="footer">
    <p>ShadowMirror is a journaling tool, not therapy. If you're in crisis, please contact a licensed professional.</p>
    <p><a href="${process.env.BASE_URL}/portal">Manage subscription</a> · <a href="{{unsubscribe_url}}">Unsubscribe</a></p>
  </div>
</div>
</body>
</html>`;
}

async function sendWelcome({ to, firstName, shadowWelcome, shadowName, firstPrompt }) {
  const html = wrapInTemplate(`
    <h1>${firstName}, your shadow has a name.</h1>
    <p>${shadowWelcome}</p>
    <p style="font-size:13px;font-family:sans-serif;color:#666;text-transform:uppercase;letter-spacing:0.1em;">Your archetype</p>
    <p style="font-size:22px;color:#8b7355;margin-bottom:32px;">${shadowName}</p>
    <p>Your first prompt is waiting:</p>
    <div class="prompt-box"><p>${firstPrompt}</p></div>
    <p>Write as much or as little as you need. There is no wrong answer — only an honest one.</p>
    <a class="cta" href="${process.env.BASE_URL}/journal">Begin your first entry →</a>
    <p style="font-size:15px;color:#666;margin-top:32px;">You have 7 days free. No charge until then. Cancel anytime from your <a href="${process.env.BASE_URL}/portal" style="color:#8b7355;">customer portal</a>.</p>
  `, `${shadowName} is ready for you.`);

  return send({ to, subject: `${firstName}, your shadow has a name.`, html });
}

async function sendDailyPrompt({ to, firstName, tomorrowPrompt, streakCount, patternAlert }) {
  const streakMessage = streakCount === 7
    ? `<p class="streak">✦ 7-day streak. Something shifts at seven days. Watch for it.</p>`
    : streakCount === 30
    ? `<p class="streak">✦ 30 days of shadow work. You've done something most people never do.</p>`
    : `<p class="streak">Day ${streakCount} streak</p>`;

  const alertHtml = patternAlert
    ? `<div style="background:#1a1512;border-left:3px solid #8b7355;padding:16px 20px;margin:24px 0;"><p style="color:#a8a49c;font-size:15px;margin:0;">Pattern observed: ${patternAlert}</p></div>`
    : '';

  const html = wrapInTemplate(`
    <p style="color:#666;font-size:13px;font-family:sans-serif;">Entry received. ✓</p>
    ${streakMessage}
    ${alertHtml}
    <p>Tomorrow's question:</p>
    <div class="prompt-box"><p>${tomorrowPrompt}</p></div>
    <a class="cta" href="${process.env.BASE_URL}/journal">Write tomorrow's entry →</a>
  `, tomorrowPrompt.substring(0, 80));

  return send({ to, subject: `Entry received, ${firstName}. Tomorrow's question is waiting.`, html });
}

async function sendWeeklyPortrait({ to, firstName, portrait, weekNumber }) {
  const { title, mirror, shadow_speaks, integration_question, next_week_forecast } = portrait;

  const html = wrapInTemplate(`
    <p class="streak">Week ${weekNumber} Portrait</p>
    <p class="portrait-title">"${title}"</p>
    <p>${mirror.replace(/\n/g, '</p><p>')}</p>
    <div class="shadow-speaks">
      <div class="label">Your shadow speaks</div>
      <p>${shadow_speaks}</p>
    </div>
    <p style="font-size:13px;font-family:sans-serif;color:#666;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Your question for the week ahead</p>
    <div class="prompt-box"><p>${integration_question}</p></div>
    <p style="font-size:15px;color:#888;">${next_week_forecast}</p>
    <a class="cta" href="${process.env.BASE_URL}/journal">Begin Week ${weekNumber + 1} →</a>
  `, `"${title}"`);

  return send({ to, subject: `"${title}" — Your Week ${weekNumber} Portrait`, html });
}

async function sendSequenceEmail({ to, firstName, emailNumber, archetype, q5Answer, shadowName, entryCount }) {
  const emails = {
    1: {
      subject: `${firstName}, your shadow has a name.`,
      preheader: `And it's been running things longer than you know.`,
      body: `
        <h1>${firstName}, your shadow has a name.</h1>
        <p>You're <strong style="color:#8b7355;">${archetype}</strong>.</p>
        <p>Most people with your archetype pattern describe the same thing: a feeling of being <em>almost</em> there — almost happy, almost stable, almost done with the old patterns — and then something shifts.</p>
        <p>That shift isn't failure. It's the shadow reminding you it hasn't been integrated yet.</p>
        <p>ShadowMirror gives you the exact framework to do that. One question a day. A full portrait every week. AI-analyzed. No judgment.</p>
        <a class="cta" href="${process.env.BASE_URL}?utm_source=email&utm_campaign=sequence_1">Start your 7-day free trial →</a>
        <p style="font-size:14px;color:#666;">No credit card required for the first 7 days.</p>
      `
    },
    2: {
      subject: `The answer you gave us, ${firstName}`,
      preheader: `"${(q5Answer || '').substring(0, 60)}..."`,
      body: `
        <h1>You wrote something that stayed with me.</h1>
        <blockquote><p>"${q5Answer}"</p></blockquote>
        <p>The people who write answers like that are not people who need more information about themselves.</p>
        <p>They already know.</p>
        <p>What they need is a container. A place where the knowing becomes movement.</p>
        <p>That's what ShadowMirror is.</p>
        <a class="cta" href="${process.env.BASE_URL}?utm_source=email&utm_campaign=sequence_2">Your first week is still free →</a>
      `
    },
    3: {
      subject: `What happened at Day 7`,
      preheader: `Something changes. Here's what it looks like.`,
      body: `
        <h1>Most people stop before Day 7.</h1>
        <p>Here's what they miss:</p>
        <p>The first three days of shadow journaling feel exposing. You're naming things you've spent years not naming.</p>
        <p>By Day 5, something changes. The writing gets faster. The patterns start to feel less like threats and more like information.</p>
        <p>By Day 7, you have your first Weekly Shadow Portrait — a 400-word mirror built entirely from what you wrote. Not a template. Not a quiz result. Your actual patterns, named precisely.</p>
        <p>People screenshot them. Some cry. Most say: "I didn't know something could be this accurate."</p>
        <p>Your Week 1 portrait is waiting to be built. It needs your entries to exist.</p>
        <a class="cta" href="${process.env.BASE_URL}?utm_source=email&utm_campaign=sequence_3">Begin today →</a>
      `
    },
    4: {
      subject: `Still thinking about your answer, ${firstName}`,
      preheader: `The gap between insight and change is action.`,
      body: `
        <h1>The gap between insight and change is action.</h1>
        <p>Not big action. One prompt. Five minutes of honest writing.</p>
        <p>That's all Day 1 asks for.</p>
        <div class="prompt-box"><p>What is the oldest story you tell yourself about why things don't work out?</p></div>
        <p>That's the kind of question you'd get on Day 1.</p>
        <a class="cta" href="${process.env.BASE_URL}?utm_source=email&utm_campaign=sequence_4">The first prompt is waiting →</a>
      `
    },
    5: {
      subject: `Last email about the free trial, ${firstName}`,
      preheader: `After this, it's just you and your shadow.`,
      body: `
        <h1>This is the last one.</h1>
        <p>I'm not going to send another "have you started yet?" email after this.</p>
        <p>The free trial is still open. The quiz result I sent you was real. The archetype hasn't changed.</p>
        <p>If it's not the right time, it's not the right time.</p>
        <p>If something in the last few days has made you think about that answer you gave us —</p>
        <blockquote><p>"${q5Answer}"</p></blockquote>
        <p>— then maybe it is.</p>
        <a class="cta" href="${process.env.BASE_URL}?utm_source=email&utm_campaign=sequence_5">Start your 7-day free trial →</a>
      `
    },
    6: {
      subject: `Your first portrait was supposed to arrive today`,
      preheader: `We couldn't build it. Here's why.`,
      body: `
        <h1>Your first portrait was supposed to arrive today.</h1>
        <p>We couldn't build it.</p>
        <p>Weekly portraits are built from your entries. We don't have enough of yours yet — you completed ${entryCount || 0} ${entryCount === 1 ? 'entry' : 'entries'} this week. A portrait needs at least 3.</p>
        <p>We want to build yours.</p>
        <p>If you continue into your paid membership ($27/month — cancel anytime), we'll carry forward everything you've written and your portrait will be waiting next Sunday.</p>
        <a class="cta" href="${process.env.BASE_URL}/upgrade?utm_source=email&utm_campaign=sequence_6">Continue to full membership →</a>
        <p style="font-size:14px;color:#666;">Or, if life got in the way and you want another free week — reply to this email.</p>
      `
    }
  };

  const email = emails[emailNumber];
  if (!email) return;

  const html = wrapInTemplate(email.body, email.preheader);
  return send({ to, subject: email.subject, html });
}

async function sendChurnRiskEmail({ to, firstName, shadowName, streakCount }) {
  let subject, body;

  if (streakCount <= 7) {
    subject = `${firstName}, your shadow doesn't disappear when you ignore it`;
    body = `<h1>It doesn't disappear when you ignore it.</h1><p>It just runs things from somewhere you can't see.</p><p>Your journal is waiting. Today's prompt will take 5 minutes.</p><a class="cta" href="${process.env.BASE_URL}/journal">Return to your work →</a>`;
  } else if (streakCount <= 29) {
    subject = `Something brought you here`;
    body = `<h1>Something brought you here.</h1><p>It's still here.</p><p>Your <em>${shadowName}</em> doesn't go quiet just because the journal does. It finds other channels.</p><p>Your portrait this week will be waiting if you come back today.</p><a class="cta" href="${process.env.BASE_URL}/journal">Come back today →</a>`;
  } else {
    subject = `${streakCount} days of work, ${firstName}`;
    body = `<h1>${streakCount} days.</h1><p>That's not a streak you lose — it's a foundation you step away from.</p><p><em>${shadowName}</em> is still yours. Streaks can restart. The work doesn't leave.</p><a class="cta" href="${process.env.BASE_URL}/journal">Step back in →</a>`;
  }

  const html = wrapInTemplate(body, `Your shadow is still waiting.`);
  return send({ to, subject, html });
}

module.exports = { sendWelcome, sendDailyPrompt, sendWeeklyPortrait, sendSequenceEmail, sendChurnRiskEmail };
