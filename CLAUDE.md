# CLAUDE.md — Strength Over Speed (SOS) Online

This file provides AI assistants with context about this repository's structure, conventions, and development workflows.

## Project Overview

**Strength Over Speed (SOS)** is a peer-led recovery support community based in Seattle (Capitol Hill). This repository is a static HTML/CSS website providing information about meetings, resources, and community support for people in recovery.

- **Organization founded:** 2005
- **Location:** Peer Seattle, 1520 Bellevue Ave Suite 100, Seattle WA
- **Contact:** sosonlinemeetings@gmail.com
- **Target audience:** People in recovery, their friends/family, and community allies

## Technology Stack

- **HTML5** — semantic markup, no templating engine
- **CSS3** — single stylesheet (`style.css`), no preprocessors
- **Vanilla JavaScript** — only used in `meetings.html` for Google Calendar API integration
- **Google Fonts** — Inter, Playfair Display
- **No build tools, no package manager, no frameworks**

## Repository Structure

```
sos-online/
├── index.html           # Landing page (mission, meeting preview, about overview)
├── about.html           # Organization history, mission, core values
├── what-we-do.html      # Services: peer groups, social activities, projects
├── meetings.html        # Meeting schedule + Google Calendar API integration
├── resources.html       # Curated community resources (counseling, crisis lines, etc.)
├── friends-family.html  # Guidance for loved ones/supporters
├── our-stories.html     # Member testimonials and story submission info
├── style.css            # Global stylesheet (~611 lines)
└── CLAUDE.md            # This file
```

All files live at the repository root — there are no subdirectories.

## HTML Conventions

- **Semantic elements:** `<nav>`, `<section>`, `<footer>`, `<header>` with proper ARIA roles
- **BEM-like class naming:**
  - Sub-components use double underscore: `.nav__inner`, `.card__icon`, `.section__header`
  - Modifiers use double dash: `.btn--primary`, `.badge--online`, `.section--alt`
- **Accessibility:** `aria-label` on navigation, `role` attributes, `lang="en"`, `rel="noopener"` on external links
- **HTML entities** for special characters: `&mdash;`, `&rsquo;`, etc.
- **Meta tags** on every page: `<title>`, `<meta name="description">`, viewport

## CSS Conventions

- **CSS custom properties** (variables) defined in `:root` for theming — always use these, never hardcode colors:
  - `--purple-deep` (#4A2080), `--purple-mid` (#7B4BBF), `--purple-light` (#E8DEFF), `--purple-pale` (#F5F0FF)
  - `--teal` (#1A9E9E), `--teal-dark` (#147070)
  - `--pink` (#D4358E)
  - `--text-dark`, `--text-mid`, `--text-light`
  - `--shadow-md`, etc.
- **Responsive design** — mobile-first with breakpoints at `768px` and `480px`
- **Utility classes:** `.mt-1`, `.mt-2`, `.mb-2`, `.text-center`
- **Global:** `box-sizing: border-box`, `scroll-behavior: smooth`
- **Typography scale:** Uses `clamp()` for responsive font sizes

### Reusable Component Patterns

| Pattern | Class | Usage |
|---------|-------|-------|
| Hero section | `.hero` | Top of each page, gradient background |
| Content card | `.card`, `.card__icon`, `.card__body` | Feature/info cards |
| Grid layout | `.grid-2`, `.grid-3` | 2 or 3 column responsive grid |
| Callout box | `.callout`, `.callout--teal`, `.callout--purple` | Highlighted info blocks |
| Quote block | `.quote-block` | Pull quotes with gradient background |
| Badge | `.badge`, `.badge--online`, `.badge--inperson` | Meeting type labels |
| Buttons | `.btn--primary`, `.btn--outline`, `.btn--purple` | CTA buttons |
| Alternate section | `.section--alt` | Gray background alternating sections |

## JavaScript Conventions

JavaScript is only used in `meetings.html`. Key patterns:

- Wrapped in an IIFE (Immediately Invoked Function Expression)
- Uses `fetch` API for Google Calendar API calls
- **Google Calendar config** (hardcoded — no .env):
  - API Key: embedded in `meetings.html`
  - Calendar ID: embedded in `meetings.html`
- Deduplication logic: recurring events are identified by `day-of-week + time` key
- Location detection: classifies as "online" if location string contains `zoom`, `online`, `http`, or `virtual`
- Graceful fallback to static HTML if the API call fails

## Page Structure Template

Every page follows this consistent structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- meta, title, description, Google Fonts, style.css link -->
</head>
<body>
  <nav class="nav" role="navigation">
    <!-- logo + nav links + mobile hamburger toggle -->
  </nav>

  <section class="hero">
    <!-- page title + subtitle -->
  </section>

  <!-- content sections alternating .section and .section.section--alt -->

  <footer role="contentinfo">
    <!-- links, contact info, copyright -->
  </footer>

  <!-- optional inline <script> for page-specific JS -->
</body>
</html>
```

## Navigation

The nav bar is duplicated across all pages (no server-side includes or components). When updating navigation:
- Update **all 8 HTML files**
- Keep `aria-label` and `role="navigation"` intact
- Maintain the mobile hamburger toggle (`<button class="nav__toggle">`)

## Content & Tone Guidelines

- **Warm, inclusive, non-clinical** tone — avoid medical jargon
- **Person-first language** — "person in recovery" not "addict"
- **No endorsement of specific substances, methods, or 12-step programs** — SOS is explicitly non-religious, peer-led
- Crisis resources should always include local Seattle numbers first, then national lines
- Meeting info (times, location, links) is the most frequently updated content

## Meeting Schedule (Current)

| Day | Time | Format |
|-----|------|--------|
| Sunday | 10:00 AM | In-person |
| Monday | 2:00 PM | In-person |
| Tuesday | 6:00 PM | In-person |
| Wednesday | TBA | Online |
| Friday | 6:00 PM | In-person |
| Saturday | TBA | Online |

**In-person location:** Peer Seattle, 1520 Bellevue Ave Suite 100, Capitol Hill

## Development Workflow

Since this is a static site with no build step:

1. Edit HTML/CSS files directly
2. Open in a browser to preview (no server needed for most pages)
3. For `meetings.html`, a local server is needed for the Google Calendar fetch to work (CORS): `python3 -m http.server 8000`
4. Commit and push — no build or deploy step required

## Common Tasks

**Update meeting times/locations:**
- Edit the static table in `meetings.html`
- The Google Calendar API will override it dynamically when loaded

**Add a new page:**
- Copy an existing page as a template
- Update `<title>`, `<meta name="description">`, and the `aria-current="page"` nav attribute
- Add the new page link to the nav in **all existing pages**

**Update styles:**
- All styles live in `style.css` — no per-page stylesheets
- Prefer CSS variables over hardcoded values

**Update resources:**
- Edit `resources.html` for community resources
- Verify all phone numbers and URLs are current

## Git Workflow

- **Branch naming:** `claude/<descriptor>` for AI-assisted branches
- **Commit style:** Plain descriptive messages (e.g., `Update meeting schedule`, `Fix mobile nav`)
- **No CI/CD pipeline** — changes go live when pushed to the hosting provider
- **No tests to run** before committing

## Key Contacts & External Services

- **Email:** sosonlinemeetings@gmail.com
- **Google Calendar:** Used for dynamic meeting schedule in `meetings.html`
- **Crisis lines referenced on site:**
  - Crisis Connections: 206-461-3222
  - Compass Health: 206-722-3700
  - WA Recovery Help Line: 1-800-562-1240
