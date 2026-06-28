# ShadowMirror 🪞

AI-powered Jungian shadow work journaling system. One prompt a day. A weekly portrait of your unconscious patterns, built from what you actually write.

## Stack

| Layer | Tool |
|---|---|
| Frontend | Static HTML/CSS/JS (deploy to Framer, Vercel, Netlify, or any host) |
| Backend | Node.js + Express (deploy to Railway, Render, or Fly.io) |
| AI Engine | Claude API (Anthropic) |
| Database | Airtable |
| Payments | Stripe |
| Email | Resend |
| Automation | node-cron (weekly portraits, churn prevention) |

## Project Structure

```
shadowmirror/
├── frontend/
│   ├── index.html        # Landing page
│   ├── quiz.html         # Shadow archetype quiz (acquisition engine)
│   └── journal.html      # Daily journal submission
├── backend/
│   ├── server.js         # Express app entry point
│   ├── routes/
│   │   ├── stripe-webhook.js   # Stripe payment events → onboarding
│   │   ├── journal.js          # Journal entry submission + AI analysis
│   │   └── quiz.js             # Quiz scoring + email sequence trigger
│   ├── services/
│   │   ├── claude.js     # All Claude API calls
│   │   ├── airtable.js   # Database operations
│   │   └── email.js      # All email templates + sending (Resend)
│   ├── prompts/
│   │   ├── onboarding.js       # New customer archetype analysis
│   │   ├── dailyAnalysis.js    # Per-entry journal analysis
│   │   └── weeklyPortrait.js   # Sunday portrait generation
│   └── jobs/
│       ├── weeklyPortraits.js  # Cron: every Sunday 8AM UTC
│       └── churnPrevention.js  # Cron: every Tuesday 10AM UTC
└── automations/
    └── make-scenarios.md       # Make.com flow documentation
```

## Setup

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/shadowmirror.git
cd shadowmirror/backend
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
# Fill in all values (see .env.example for descriptions)
```

Required keys:
- `ANTHROPIC_API_KEY` — [console.anthropic.com](https://console.anthropic.com)
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` — [stripe.com/dashboard](https://stripe.com/dashboard)
- `AIRTABLE_API_KEY` + `AIRTABLE_BASE_ID` — [airtable.com](https://airtable.com)
- `RESEND_API_KEY` — [resend.com](https://resend.com)

### 3. Airtable setup

Create a base called **ShadowMirror OS** with these tables:

**CUSTOMERS** — Email, First Name, Stripe Customer ID, Plan, Join Date, Streak Count, Shadow Archetype, Shadow Name, Last Journal Date, Last Prompt, Week Number, Churn Risk Score

**JOURNAL_ENTRIES** — Entry ID, Email, Customer Record ID, Date, Raw Entry, AI Analysis, Archetypes Detected (multi-select), Emotional Valence, Key Themes, Entry Summary, Tomorrow Prompt, Flagged for Portrait

**CONTENT_PIPELINE** — Content ID, Platform, Format, Topic, Raw Draft, Status, Scheduled Date/Time

**FINANCIALS** — Date, Transaction Type, Description, Amount, Category, Pacioli Debit Account, Pacioli Credit Account

### 4. Stripe setup

Create two products:
- **ShadowMirror Monthly** — $27/month recurring
- **ShadowMirror Annual** — $197/year recurring
- **Coach Plan** — $97/month recurring

Configure Stripe webhook endpoint: `https://your-backend.com/webhook/stripe`

Events to listen for:
- `checkout.session.completed`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Update `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_ANNUAL_PRICE_ID`, `STRIPE_COACH_PRICE_ID` in `.env`.

### 5. Update frontend config

In `quiz.html` and `journal.html`, set the API URL:

```html
<script>window.SHADOWMIRROR_API = 'https://your-backend.com';</script>
```

Update the Stripe Payment Link in `quiz.js`:
```js
return `https://buy.stripe.com/YOUR_PAYMENT_LINK?${params.toString()}`;
```

### 6. Deploy

**Backend (Railway — recommended):**
```bash
# Connect GitHub repo → Railway auto-deploys on push
# Set environment variables in Railway dashboard
```

**Frontend (Vercel):**
```bash
cd frontend
vercel deploy
```

Or drag the `frontend/` folder into [Framer](https://framer.com).

### 7. Run locally

```bash
cd backend
cp .env.example .env   # fill in keys
npm run dev            # starts on port 3000
```

Frontend: open `frontend/index.html` directly in browser, or:
```bash
npx serve frontend -l 4200
```

## The Business Model

| Tier | Price | Description |
|---|---|---|
| Free | $0 | Quiz + archetype result |
| Monthly | $27/mo | Daily prompts + weekly portrait |
| Annual | $197/yr | Same, locked rate |
| Coach Plan | $97/mo | Up to 20 clients, branded portraits |

**Unit economics:**
- Claude API cost per customer: ~$0.09/month
- Gross margin: ~96%
- Target CAC via organic content: < $27

## Content Automation

The system auto-generates daily content packages (Twitter threads, TikTok scripts, LinkedIn hooks) via Claude for ~$0.05/day. See `automations/make-scenarios.md` for Make.com setup.

## Cron Jobs (auto-run in production)

| Job | Schedule | What it does |
|---|---|---|
| Weekly Portraits | Sunday 8AM UTC | Generates + emails personalized portraits |
| Churn Prevention | Tuesday 10AM UTC | Emails lapsed members |

## License

MIT
