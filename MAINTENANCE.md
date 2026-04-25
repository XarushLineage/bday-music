# Maintenance Notes

## GitHub Pages

This site is deployed from the `main` branch at the repository root.

Live URL:

```text
https://xarushlineage.github.io/bday-music/
```

After editing files, publish updates with:

```powershell
git add .
git commit -m "Update birthday music site"
git push
```

GitHub Pages usually refreshes within a few minutes.

## YouTube ID Refresh

Dry-run the video validator:

```powershell
node scripts/refresh-youtube-ids.js
```

Write replacement IDs for videos that are unavailable or not embeddable:

```powershell
node scripts/refresh-youtube-ids.js --write
```

Review the changes before committing:

```powershell
git diff data.js
```

## Data Boundary

Year-end data begins in 1946. Entries from 1946 through 1957 use Billboard's pre-Hot-100 retail-sales lists.

Monthly Hot 100 data begins in August 1958, because the Billboard Hot 100 launched that month.
