# Hangzhou Schools Staff Football League — 2026–27

The league website: live table, fixtures and results, club pages with squad stats, and season awards (Golden Boot and Playmaker Award).

It is a plain static website. There is no server and no database, so GitHub Pages hosts it for free.

## Put it live on GitHub Pages (about 5 minutes)

1. Sign in to GitHub and click **New repository**.
   - Name it something like `hz-league`.
   - Set it to **Public**. GitHub Pages is free for public repositories.
   - Click **Create repository**.
2. On the new repository page, click **uploading an existing file**.
3. Unzip the download on your computer. Open the unzipped folder and select **everything inside it**: `index.html`, `app.js`, `style.css`, `manifest.webmanifest`, `.nojekyll`, `README.md`, and the `data`, `fonts` and `img` folders. Drag them all into the upload box.
   - Upload the contents of the folder, not the folder itself, so that `index.html` sits at the top of the repository.
   - `.nojekyll` is a hidden file. On a Mac, press Cmd+Shift+. in Finder to see it. The site still works without it.
4. Click **Commit changes**.
5. Go to **Settings → Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose **main** and **/ (root)**, then click **Save**.
6. Wait a minute or two, then refresh the page. The link appears at the top, for example `https://YOUR-USERNAME.github.io/hz-league/`.

Share that link with the league. On an iPhone, people open it in Safari and tap **Share → Add to Home Screen**. They then get an "HZ League" app icon that opens full screen.

## Updating the site

Everything that changes during the season is in **one file: `data/league.json`**. The table, form, awards, squad pages and "last updated" date are all worked out from it automatically.

To update the site:

1. Open the repository on GitHub, then open `data/league.json`.
2. Click the pencil icon, make the change, and click **Commit changes**.
3. The site updates within a minute or two. People might need to refresh.

Or send the new results and stats to Claude, and it will hand back an updated `league.json` to upload in place of the old one.

### Add a result

Find the gameweek and change `null` to the score, home team first:

```json
{ "home": "WYC", "away": "WAH", "score": [3, 1] }
```

For a forfeit, add `"forfeit": true`.

Also change `"lastUpdated"` at the top to today's date, for example `"2026-11-21"`.

### Move a game to a different date

Change the `"date"` of that gameweek. Use the format `YYYY-MM-DD`.

### Add or update players

Players are listed under `"players"`, grouped by team code. To add another club, copy the Wycombe Abbey block and change the team code:

```json
"players": {
  "WYC": [
    { "name": "Paul", "apps": 2, "goals": 4, "assists": 1, "cleanSheets": 0 }
  ],
  "DIN": [
    { "name": "Li", "apps": 3, "goals": 2, "assists": 0, "cleanSheets": 0 }
  ]
}
```

Team codes: `WYC` Wycombe Abbey, `DIN` Dingwen FC, `BAS` BASIS, `WAH` WAHAHA, `WBO` Wellington Boots, `WLI` Wellington Lions, `HIS` HIS.

A club with players listed gets a squad section on its club page, and its players appear in the awards automatically.

### Check your edit

JSON is fussy about commas and quotation marks. If the site shows "Could not load the league data" after an edit, paste the file into https://jsonlint.com to find the mistake.

## What is in the folder

| File | What it does |
|---|---|
| `index.html` | The page itself |
| `style.css` | The look |
| `app.js` | Builds the table, fixtures, club pages and awards from the data |
| `data/league.json` | All the league data. This is the only file you need to edit |
| `img/` | School logos, the Hangzhou logo and the home-screen icons |
| `fonts/` | The fonts, stored with the site so it doesn't rely on Google Fonts. Both are open-licence (SIL OFL) |
| `manifest.webmanifest` | Lets phones add the site to the home screen like an app |

## Testing on your own computer

Opening `index.html` by double-clicking it won't load the data, because browsers block that for local files. In this folder, run `python3 -m http.server`, then open http://localhost:8000.
