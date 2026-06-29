# FleetPilot AI — Production Setup

This is the end-to-end runbook for taking FleetPilot from demo mode to a live,
multi-tenant deployment. The app runs fully in **demo mode** with no env vars; each
service below switches to "live" the moment its keys are present, so you can light
them up one at a time.

After each section, open **`/setup`** in the running app — it shows a live green/red
status for every service and tells you exactly what's missing.

**Order matters:** Supabase (DB + auth) → Storage → Stripe → Vercel → Domains.

---

## 0. Prerequisites

- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account
- A [Vercel](https://vercel.com) account + this repo on GitHub
- (Optional) [Resend](https://resend.com) for email, [OpenAI](https://platform.openai.com) for the AI workspace
- A registered domain if you want `fleetpilot.ai`-style subdomains or custom host domains

```bash
cp .env.example .env.local   # fill this in as you go
```

---

## 1. Supabase database

1. Create a project at supabase.com. Note the project ref.
2. **Settings → API** — copy into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `anon` public key
   - `SUPABASE_SERVICE_ROLE_KEY` = `service_role` key (server-only — never exposed to the browser)
3. **Settings → Database → Connection string** — copy two connection strings:
   - `DATABASE_URL` = the **Transaction pooler** string (port `6543`, append `?pgbouncer=true&connection_limit=1`). Used by the app at runtime.
   - `DIRECT_URL` = the **Direct connection** string (port `5432`). Used by Prisma for migrations.
4. Push the schema:
   ```bash
   npm run db:push        # prisma db push — fastest for first deploy
   # or, if you keep migrations under version control:
   npm run db:deploy      # prisma migrate deploy
   ```
5. Reload `/setup` — **Supabase auth** and **Database** should both be green.

> Auth emails: in **Authentication → URL Configuration**, set the Site URL to your
> production URL and add `${APP_URL}/auth/confirm` to the redirect allowlist. The
> sign-up confirmation link is handled by `app/auth/confirm/route.ts`.

---

## 2. Supabase Storage buckets

Vehicle photos upload to a public bucket (name = `SUPABASE_VEHICLE_IMAGES_BUCKET`,
default `vehicle-images`).

1. Open **SQL Editor → New query**, paste the contents of
   [`supabase/storage-setup.sql`](supabase/storage-setup.sql), and run it. This
   creates the public bucket and its read/write policies.
2. Confirm under **Storage** that the `vehicle-images` bucket exists and is public.

That's it — uploads in **Dashboard → Vehicles** now persist to Supabase Storage
instead of demo placeholders.

---

## 3. Stripe keys, webhooks & prices

### Keys
**Developers → API keys** → copy into `.env.local`:
- `STRIPE_SECRET_KEY` (`sk_test_…` for test mode, `sk_live_…` for production)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_…` / `pk_live_…`)

### Subscription prices
**Products** → create recurring monthly prices and copy each **Price ID** (`price_…`):
- `STRIPE_PRICE_STARTER` ($99) · `STRIPE_PRICE_GROWTH` ($299) · `STRIPE_PRICE_SCALE` ($599)
- `STRIPE_PRICE_ENTERPRISE` (optional)

### Webhook
The app reconciles payments, deposits, and subscriptions from webhook events
(`app/api/stripe/webhook/route.ts`).

- **Production:** **Developers → Webhooks → Add endpoint** →
  `https://<your-domain>/api/stripe/webhook` → select all events (or at least
  `checkout.session.completed`, `customer.subscription.*`, `payment_intent.*`).
  Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` (`whsec_…`).
- **Local dev:**
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```
  Use the `whsec_…` it prints as `STRIPE_WEBHOOK_SECRET`.

Reload `/setup` — the Stripe rows turn green and the exact webhook URL is shown there too.

> Start in **test mode** end-to-end (test keys + `4242 4242 4242 4242`). Flip every
> `…_test_…` value to its live counterpart only after a full test booking + subscription works.

---

## 4. Vercel deployment

1. **Add New → Project**, import this GitHub repo. Vercel auto-detects Next.js.
   The build runs `prisma generate && next build` (already wired in `package.json`)
   and `vercel.json` sets the function region and webhook timeouts.
2. **Settings → Environment Variables** — add every key from your `.env.local`
   (Production scope). At minimum:
   ```
   NEXT_PUBLIC_APP_URL=https://app.fleetpilot.ai
   NEXT_PUBLIC_ROOT_DOMAIN=fleetpilot.ai
   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
   DATABASE_URL / DIRECT_URL
   STRIPE_SECRET_KEY / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY / STRIPE_WEBHOOK_SECRET
   STRIPE_PRICE_STARTER / _GROWTH / _SCALE
   RESEND_API_KEY / EMAIL_FROM        # optional
   OPENAI_API_KEY                     # optional
   ```
3. **Deploy.** After it's live, run migrations against production once (from your
   machine with the production `DIRECT_URL` exported, or via a Vercel build step):
   ```bash
   DIRECT_URL="<prod direct url>" DATABASE_URL="<prod pooled url>" npm run db:push
   ```
4. Update Stripe's webhook endpoint and Supabase's auth redirect URL to the
   production domain (Sections 1 & 3).

---

## 5. Custom domain & subdomain routing

Routing is handled in [`proxy.ts`](proxy.ts) and keys off `NEXT_PUBLIC_ROOT_DOMAIN`:

- **App / marketing:** `fleetpilot.ai` and `app.fleetpilot.ai` → the dashboard + landing page.
- **Tenant subdomains:** `luxedrive.fleetpilot.ai` → rewritten to the public `/[org]`
  booking site for that slug. `www`, `app`, `admin`, `api`, `dashboard` are reserved.
- **Custom host domains:** a host's own `rentwithluxe.com` → resolved against
  `Organization.domain` (set in **Dashboard → Settings → Custom domain**).

### DNS / Vercel setup

1. **Root + app:** In Vercel **Settings → Domains**, add `fleetpilot.ai` and
   `app.fleetpilot.ai`. Point DNS at Vercel (`A 76.76.21.21` for the apex, or the
   `CNAME` Vercel shows).
2. **Wildcard subdomains** (so every tenant slug works without manual setup): add
   `*.fleetpilot.ai` as a domain in Vercel and create a wildcard DNS record:
   ```
   CNAME   *.fleetpilot.ai   cname.vercel-dns.com
   ```
   > Wildcard domains on Vercel require the domain's nameservers to be on Vercel
   > (or a verified wildcard). Follow Vercel's prompt to verify.
3. **A host's custom domain:** add their domain (e.g. `rentwithluxe.com`) in Vercel
   Domains, have them point a `CNAME`/`A` record at Vercel, then set that exact
   hostname in the host's **Dashboard → Settings → Custom domain** field (it's saved
   to `Organization.domain`, which the proxy matches on).

### Local testing of subdomains
`*.localhost` resolves to `127.0.0.1` in most browsers, but the proxy treats
`localhost` as a non-tenant host. To test tenant routing locally, use the path form
`http://localhost:3000/<slug>` (e.g. `/luxedrive`), which renders the same `/[org]` pages.

---

## 6. Optional services

| Service | Env | Effect when absent |
| --- | --- | --- |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` | Booking/payment emails log to the server console instead of sending |
| AI workspace | `OPENAI_API_KEY`, `OPENAI_MODEL` | Insights fall back to built-in heuristics |

---

## 7. Go-live checklist

- [ ] `/setup` shows all **required** services green
- [ ] A test booking on a tenant site creates a Stripe Checkout session and a reservation
- [ ] The Stripe webhook shows `200`s in the Stripe dashboard after a test payment
- [ ] A subscription checkout creates a `Subscription` row and sends the confirm email
- [ ] A vehicle photo upload appears on the public booking page
- [ ] `luxedrive.<your-domain>` loads the booking site; internal links navigate without 404s
- [ ] A custom domain set in Settings resolves to the right tenant
- [ ] All Stripe/Supabase values flipped from test to live
