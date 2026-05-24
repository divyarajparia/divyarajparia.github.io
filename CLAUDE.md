# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio website for Divya Rajparia (AI/ML researcher). Static HTML/CSS site deployed via GitHub Pages, with a separate Firebase Cloud Functions backend for the ML Bootcamp payment flow.

## Resume

The resume is a LaTeX document compiled with `pdflatex`:

```powershell
cd resume
pdflatex -interaction=nonstopmode main.tex
pdflatex -interaction=nonstopmode main.tex  # run twice for cross-references
```

Always compile after every edit. The compiled PDF (`resume/main.pdf`) is what gets linked from the site.

## Architecture

**Portfolio site** — plain HTML + CSS, no build step, no framework.
- `style.css` — single shared stylesheet using CSS variables (`--primary-emerald`, etc.) for the dark emerald tech theme
- Each page is a self-contained `.html` file sharing the same nav + mobile-menu JS snippet (duplicated inline per page)
- `bootcamp/` — subdirectory with its own HTML pages for an ML Bootcamp; links back to root with `../style.css`

**Firebase backend** (`functions/`) — Cloud Functions (Node 20) for the bootcamp registration flow:
- Payment processing via Razorpay
- Email via Resend
- Deploy: `firebase deploy --only functions` from `functions/`
- Local emulator: `npm run serve` inside `functions/`

**Active pages:** `index.html`, `resume.html`, `research.html`, `timeline.html`, `extracurriculars.html`, `contact.html`, `bootcamp/bootcamp.html`

**Inactive/shelved pages:** `development.html`, `projects.html` (nav links to these are commented out)

## Nav pattern

Every page duplicates the same nav HTML and the same 3-part mobile-menu JS block (toggle button, link click handler, outside-click handler). When adding a new page or changing nav items, update all pages.
