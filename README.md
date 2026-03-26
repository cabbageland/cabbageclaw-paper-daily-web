# cabbageclaw-paper-daily-web

GitHub Pages demo dashboard for `cabbageland/cabbageclaw_paper_daily`.

## What it does

- shows the latest daily digest
- browses recent digests
- browses paper notes
- filters note cards by verdict
- links back to the source markdown in the paper-daily repo
- works as a simple static site suitable for GitHub Pages

## Structure

- `index.html` — shell
- `styles.css` — UI styling
- `app.js` — client-side rendering
- `data/content.json` — generated content snapshot from `cabbageclaw_paper_daily`

## Publishing on GitHub Pages

This repo is designed to work as a plain static site.

Typical setup:

1. Push to `main`
2. In GitHub repo settings, enable **Pages**
3. Set source to **Deploy from branch**
4. Branch: `main`, folder: `/ (root)`

## Refreshing content

Right now `data/content.json` is a generated snapshot from the local workspace copy of `cabbageclaw_paper_daily`.

A later improvement is to automate this refresh after each daily paper push.
