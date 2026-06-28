# Make.com Automation Scenarios

## FLOW 1: New Customer Onboarding
*This is handled by the backend Stripe webhook — no Make.com needed.*

## FLOW 2: Daily Content Generation

**Trigger:** Schedule — 6:00 AM daily

**Modules:**
1. `HTTP > Make a Request` — fetch Reddit RSS feeds
   - URL: `https://www.reddit.com/r/Jung+selfimprovement+psychology/.rss?limit=5`
   - Method: GET, Parse response: Yes

2. `Tools > Set Variable` — extract top post titles from RSS XML

3. `HTTP > Make a Request` — call Claude API
   - URL: `https://api.anthropic.com/v1/messages`
   - Method: POST
   - Headers: `x-api-key: {{ANTHROPIC_API_KEY}}`, `anthropic-version: 2023-06-01`
   - Body:
   ```json
   {
     "model": "claude-haiku-4-5-20251001",
     "max_tokens": 2048,
     "system": "Content strategist for ShadowMirror (Jungian shadow work journaling). Voice: intellectually rigorous, emotionally precise, never preachy. Respond with JSON only.",
     "messages": [{"role": "user", "content": "Trending topics: {{topics}}. Generate Twitter thread (15 tweets, ends with CTA to shadowmirror.com/quiz?utm_source=twitter&utm_campaign=organic), TikTok script (60 sec), LinkedIn hook (3 lines). Return as JSON: {twitter_thread:[], tiktok_script:'', linkedin_hook:''}"}]
   }
   ```

4. `JSON > Parse JSON` — extract content

5. `Airtable > Create Record` — add to CONTENT_PIPELINE
   - Table: CONTENT_PIPELINE
   - Platform: Twitter/TikTok/LinkedIn
   - Raw Draft: {{parsed content}}
   - Status: Scheduled
   - Scheduled Date: {{today}}

6. `HTTP > Make a Request` — post to Typefully API (Twitter)
   - URL: `https://api.typefully.com/v1/drafts/`
   - Body: `{"content": "{{twitter_thread joined by newlines}}", "scheduleDate": "{{tomorrow 9am}}"}`

7. `Telegram > Send Message` — push TikTok script + LinkedIn hook to your phone

**Cost per run:** ~$0.05 Claude API + $0 everything else

---

## FLOW 3: Sequence Email Scheduler

*Handled in backend `routes/quiz.js` via setTimeout. For production scale, replace with:*

**Option A:** Make.com with scheduled delayed runs
**Option B:** Resend's broadcast scheduling feature
**Option C:** A proper queue (BullMQ + Redis on Railway)

For launch (Days 1-14), the setTimeout approach in the backend handles it fine up to ~500 new signups/day.

---

## FLOW 4: Churn Risk Escalation

**Trigger:** Schedule — every Friday at noon

1. `Airtable > Search Records` — CUSTOMERS where Churn Risk Score >= 7
2. For each: `HTTP > Make a Request` to your backend `/admin/high-risk-alert`
3. Backend sends you a summary email of high-risk accounts with their last entry date and streak

---

## FLOW 5: Financial Dashboard Update

**Trigger:** Schedule — daily at 11:59 PM

1. `Stripe > List Balance Transactions` — get today's transactions
2. `Airtable > Create Records` — log each to FINANCIALS table
3. `HTTP > Make a Request` — call Claude to summarize daily P&L
4. `Telegram > Send Message` — daily financial summary to your phone:
   - Revenue today
   - New customers
   - Churned customers
   - Running MRR
   - API costs
   - Net today

---

## Environment Variables for Make.com

Store these in Make.com's Data Store or as scenario variables:
- `ANTHROPIC_API_KEY`
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `TYPEFULLY_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `STRIPE_SECRET_KEY`
