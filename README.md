# Ledger, personal expense/income tracker

Static site (GitHub Pages) that reads and writes to your existing Google
Sheet through a small Apps Script backend. Installable as an app on your
phone. No database, no build step.

> **Heads up:** this was built around my own Google Sheet, so the layout in
> `Code.gs` (which columns hold what, which tab, which rows) matches mine and
> might not match yours. Your mileage may vary. If your sheet is laid out
> differently, you'll need to adjust the column numbers and row settings in
> `Code.gs` to fit it, or set your sheet up the same way as described below.

## Features

**Entries**
- Add expenses and income with a date, amount and category.
- Edit any existing entry's date, amount, category and note. The kind
  (expense or income) is locked when editing.
- Delete an entry from edit mode. It takes two taps, so you can't do it by
  accident. Deleting an expense also closes the gap by shifting the rows
  below it up, as long as that's safe (see limitations). Deleting income
  just clears the entry.
- Optional note on expenses categorized as "Other", shown under the
  category in the table.
- Built-in calculator (+, −, ×, ÷, %) with a "Use this amount" button that
  drops the result into the amount field.

**Viewing**
- Running totals for Income, Expenses and Net, hidden by default. Each has
  its own eye button to reveal it, and they hide again on every fresh load.
- Table sorted newest first, 20 rows at a time with a "Show more" button.
- Expense categories are color-coded in the table and in the breakdown.
- Filter by kind, category and a From/To date range. "Show All" resets
  every filter at once.
- When a kind is selected, a total bar shows the sum for the current
  filter and how many entries it covers.
- Breakdown panel: per-category totals for whatever is currently filtered,
  as bars sorted largest first.

**Export**
- Export PDF produces a print-ready statement for the From/To date range:
  one row per entry, separate Income and Expense columns, totals and net.
  It uses the date range only. The kind and category filters don't apply
  to the export. The date range is the PDF's default filename.

**Security**
- Nothing loads until you type the password on the login screen. The
  password is checked by the Apps Script, not by the page, and is held only
  in memory for that tab, never saved on the device. Closing the app means
  logging in again.
- The password is sent in the body of a POST request, never in the URL.
- Clear error messages: "Wrong password" only appears when the server
  actually rejects the password. If the server can't be reached it says so,
  and if a save comes back garbled it tells you to check before re-adding
  (the row may have been written).

**Installable (PWA)**
- Install it from the browser menu ("Install app" or "Add to Home screen")
  to get a home screen icon and a full-screen window.
- A small service worker keeps the app's own files as a fallback. It always
  fetches fresh files when online, so a new deploy shows up right away. It
  never caches or touches anything going to Google, so your password and
  financial data are never stored by it.
- The app does not work offline. Your data lives in the Google Sheet, so
  without a connection you'll see the login screen but can't unlock it.

## What's in here

- `index.html` the whole site: login, form, table, filters, breakdown, PDF
  export and calculator.
- `manifest.json` tells the phone this is an installable app (name, colors,
  icons).
- `sw.js` the service worker described above.
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` app icons. The
  maskable one has extra padding so Android can crop it into a circle
  without clipping the ₱.
- `Code.gs` goes into your Google Sheet's Apps Script, not into the GitHub
  repo's build. It works on the `Sheet1` tab, with data starting at row 3:
  - Expenses: A (date), B (amount), C (category), E (when it was added,
    used for sort order), F (note, only for "Other" expenses).
  - Income: F (date), G (amount), H (category), J (when it was added).

All the web files must sit together in the repo root, next to each other.
No subfolders.

## Setup, in order

### 1. Open your sheet's Apps Script
In your Google Sheet: **Extensions → Apps Script**. Delete the default
empty `Code.gs` content and paste in this repo's `Code.gs` instead.

### 2. Set up the sheet ID and your password
- `SHEET_ID`: at the top of `Code.gs`, replace it with the long ID in your
  sheet's URL, between `/d/` and `/edit`.
- Password: this is **not** written in the file. In the Apps Script editor
  click the gear icon (**Project Settings**), scroll to **Script
  Properties**, click **Add script property**, set Property to `PASSWORD`
  and Value to whatever you want, then Save. This is what you type on the
  login screen, and what stops a stranger who finds your site URL from
  reading your data or writing junk rows into your sheet. Pick something
  long, because nothing limits how fast someone can guess.

### 3. Deploy it as a web app
**Deploy → New deployment → type: Web app.**
- Execute as: **Me**
- Who has access: **Anyone**

Click Deploy, authorize it (Google will warn you it's an unverified app,
that's expected since you wrote it, click through Advanced → Go to
[project name]). Copy the web app URL it gives you, it looks like
`https://script.google.com/macros/s/AKfycb.../exec`.

Remember: if you ever edit `Code.gs` later, you have to make a **new
deployment version** (Deploy → Manage deployments → edit → new version) or
your changes won't actually go live. If login suddenly fails after a
backend edit, this is the first thing to check.

### 4. Fill in `index.html`
Near the top of the `<script>` tag:
```js
const SCRIPT_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
```
Replace it with the URL from step 3. There is no secret in `index.html`
anymore. The password is typed at the login screen each session.

### 5. Push to GitHub
```bash
git init
git add index.html manifest.json sw.js icon-192.png icon-512.png icon-maskable-512.png README.md
git commit -m "initial ledger site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```
Your password lives in the Apps Script project's Script Properties, not in
`Code.gs`, so the file is safe to commit. It does contain your `SHEET_ID`
though, so keep `Code.gs` local/private if you'd rather not publish that,
and only push the web files.

### 6. Turn on GitHub Pages
Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch:
`main`, folder `/ (root)`. Save. Give it a minute, then your site's live at
`https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`.

### 7. Install it on your phone (optional)
Open the site once while online, then use the browser menu: **Install app**
(or **Add to Home screen**). Open it from the new icon after that.

## Updating the site later

Push the changed files and reload. Because the service worker fetches
fresh files whenever you're online, you normally see the new version
straight away. If a phone ever sticks on an old version, change
`CACHE_VERSION` in `sw.js` (for example `ledger-v1` to `ledger-v2`),
push, and reopen the app.

## Known limitations, on purpose

- Apps Script execution is slow-ish (expect ~0.5–2s per add or load). Fine
  for personal use, not built for snappy real-time feel.
- No offline use. Entries can't be added or viewed without a connection,
  and nothing is queued to sync later.
- The password check has no attempt limit, so a long password matters.
- Editing a note only saves when column F of that row isn't holding an
  income date. Old rows can have an expense and an income entry sharing a
  row number, and the script deliberately won't overwrite the income date.
  In that case the rest of the edit saves but the note change is skipped.
- New entries are written starting from row 378 (expenses) and row 36
  (income) onward, reusing any blank rows after that. Rows above those
  points are never reused. Change `EXPENSE_WRITE_SCAN_START` and
  `INCOME_WRITE_SCAN_START` in `Code.gs` if your sheet's layout changes.
- Deleting an expense shifts columns A to F up to close the gap, but only
  when no income dates are in column F at or below that row. If there are
  (for example when deleting an older entry), it just clears the entry and
  leaves a blank row, and the site tells you so. The server also checks the
  row still holds the entry you clicked, and refuses if your page is out of
  date. Shifting moves everything in A to F below the deleted row, so
  anything else you keep there moves too, and Sheets may shrink formula
  ranges that cover it. Deleting can't be undone from the site. Use
  Google Sheets' version history.
- The site computes totals itself from raw rows. It does **not** touch your
  sheet's existing monthly breakdown formulas or Net cell. Those stay
  exactly as they were, and won't auto-include new entries added from the
  site. Update those ranges by hand in the sheet if you still use them.
- Categories are hardcoded lists (matching what's already in your sheet).
  Add a new category by editing the `EXPENSE_CATEGORIES` /
  `INCOME_CATEGORIES` arrays in `index.html` (and `CATEGORY_COLORS` if you
  want it color-coded).
- PDF export relies on the browser's print dialog. It works from the
  browser and should from an installed Android app, but printing from an
  installed app on iPhone is unreliable. Use Safari there.
