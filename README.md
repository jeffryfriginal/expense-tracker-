# Ledger — personal expense/income tracker

Static site (GitHub Pages) that reads/writes to your existing Google Sheet
through a small Apps Script backend. No database, no build step.

## What's in here

- `index.html` — the whole site. Form to add entries, table to view/filter, running totals.
- `Code.gs` — goes into your Google Sheet's Apps Script, not into the GitHub repo's build. It reads/writes columns A–C (expenses) and F–H (income) on `Sheet1`.

## Setup, in order

### 1. Open your sheet's Apps Script
In your Google Sheet: **Extensions → Apps Script**. Delete the default empty
`Code.gs` content and paste in this repo's `Code.gs` instead.

### 2. Fill in two values at the top of `Code.gs`
- `SHEET_ID`: the long ID in your sheet's URL, between `/d/` and `/edit`.
- `SECRET`: make up any random string. Treat it like a password — this is
  what stops a stranger who finds your site URL from writing junk rows into
  your sheet.

### 3. Deploy it as a web app
**Deploy → New deployment → type: Web app.**
- Execute as: **Me**
- Who has access: **Anyone**

Click Deploy, authorize it (Google will warn you it's an unverified app —
that's expected since you wrote it, click through Advanced → Go to
[project name]). Copy the web app URL it gives you, it looks like
`https://script.google.com/macros/s/AKfycb.../exec`.

Remember: if you ever edit `Code.gs` later, you have to make a **new
deployment version** (Deploy → Manage deployments → edit → new version) or
your changes won't actually go live.

### 4. Fill in `index.html`
Near the top of the `<script>` tag:
```js
const SCRIPT_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
const SECRET = 'PASTE_THE_SAME_SECRET_FROM_CODE_GS_HERE';
```
Replace both with the values from steps 2 and 3. `SECRET` must match
exactly, or every add-entry attempt will silently fail with "unauthorized."

### 5. Push to GitHub
```bash
git init
git add index.html README.md
git commit -m "initial ledger site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```
(Don't commit `Code.gs` if you'd rather keep the script text out of the
public repo — it doesn't contain your secret in a way that matters since
you'll fill the secret directly into your live Apps Script project, but if
you're cautious, just keep `Code.gs` local/private and only push
`index.html`.)

### 6. Turn on GitHub Pages
Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch:
`main`, folder `/ (root)`. Save. Give it a minute, then your site's live at
`https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`.

## Known limitations, on purpose

- Apps Script execution is slow-ish (expect ~0.5–2s per add or load). Fine
  for personal use, not built for snappy real-time feel.
- The site computes totals itself from raw rows. It does **not** touch your
  sheet's existing monthly breakdown formulas or Net cell — those stay
  exactly as they were, and won't auto-include new entries added from the
  site. Update those ranges by hand in the sheet if you still use them.
- Categories are hardcoded lists (matching what's already in your sheet).
  Add a new category by editing the `EXPENSE_CATEGORIES` /
  `INCOME_CATEGORIES` arrays in `index.html`.
