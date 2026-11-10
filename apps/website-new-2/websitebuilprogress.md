# Studio Pranavi Website — Build Progress & How It Was Made

This document records every decision, fix, and build step taken to create `apps/website-new-2`.

---

## Goal

Build an exact visual replica of [sagarti.com](https://sagarti.com/en) — a luxury glass and lighting brand website — with the brand name changed to **Studio Pranavi** and a CRM enquiry form integrated via Supabase.

---

## Phase 1 — Project Scaffold

**What was done:**
- Created `apps/website-new-2/` as a new workspace package inside the pnpm monorepo
- Configured `package.json` with name `@platform/website-new-2` and dev server on port 5175
- Added `dev:website-new-2` and `build:website-new-2` scripts to root `package.json`
- Set up Vite 5, TypeScript, Tailwind CSS 3, React Router v6
- Configured `tsconfig.json` with `@/` path alias pointing to `src/`

**Key files created:**
- `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`

---

## Phase 2 — Design System

**What was done:**
- Analysed sagarti.com visually — confirmed white background, dark hero section, warm neutral palette
- Defined brand colour tokens in `tailwind.config.ts`:
  - `brand-bg: #ffffff`, `brand-bgalt: #f7f7f7`, `brand-text: #231F20`, `brand-muted: #888`
- Chose fonts: **Cormorant Garamond** (display — approximates sagarti's sharp-light serif) + **DM Sans** (body — approximates macan-regular)
- Built global CSS utility classes in `src/index.css`:
  - `.sp-container` — max-width 1440px, responsive padding
  - `.sp-section` — fluid vertical padding using `clamp()`
  - `.title-1` through `.title-4` — typographic scale
  - `.btn-black`, `.btn-outline`, `.btn-outline-white` — CTA button variants
  - `.reveal` + `.is-visible` — scroll animation classes
  - `.h-scroll` — horizontal scroll strip

**Fix applied:** Initial build accidentally used a dark theme (#050505) from an old context. WebFetch confirmed sagarti.com is white. All files were rewritten with correct white palette.

---

## Phase 3 — Scroll Animations

**What was done:**
- Created `src/hooks/useScrollReveal.ts` — IntersectionObserver hook that watches `.reveal` elements and adds `.is-visible` when they enter the viewport
- Added stagger delays: `.reveal-delay-1` through `.reveal-delay-4` (0.1s–0.4s)
- Applied `useScrollReveal()` at the top of every page component
- Elements enter with `opacity: 0, transform: translateY(40px)` and animate to `opacity: 1, transform: none` over 0.8s with cubic-bezier easing

**Fix applied:** When category filter tabs are clicked on the Products page, React re-renders new cards with `.reveal` class but the IntersectionObserver had already run. Fixed by adding a `useEffect` on `activeCategory` that promotes any `.reveal:not(.is-visible)` elements 40ms after render.

---

## Phase 4 — Navigation

**What was done:**
- Built `SiteHeader.tsx` with frosted glass pill navigation matching sagarti.com
- Logo LEFT: `logo.png` image (100px tall), no text wordmark
- Pill nav RIGHT (desktop only):
  - Container: `background: rgba(220,218,214,0.65); backdrop-filter: blur(12px); border-radius: 999px`
  - Active item: filled inner pill `background: rgba(190,188,184,0.85)`
  - Dropdowns: `background: rgba(200,198,194,0.82); backdrop-filter: blur(12px); border-radius: 16px`
- Dropdown navigation: Catalogue (Products, Collections, Uniqueness, Downloads), Collaboration (Partners, Career, Showroom)
- "Get a Quote" dark pill button at far right of nav
- Mobile: hamburger with 3-bar → animated X, flat vertical nav with sub-items indented

**Fix applied:** Header was `sticky top-0` (stayed fixed on scroll). Changed to `relative` — header now scrolls away with the page as the user wanted.

---

## Phase 5 — Pages Built

### HomePage.tsx
Sections matching sagarti.com home page:
1. Hero — dark `#111` background, `hero.jpg` at 40% opacity, white text, scroll CTA
2. Category horizontal scroll — 6 category cards using `.h-scroll`
3. New Collections — 6 product cards in a grid
4. Brand History — split layout with image and copy
5. Materials — two-image grid
6. Stats — 5,000+ sq.ft, 40+ projects, 12 states, 8 years
7. Social links — Instagram, Pinterest, LinkedIn
8. News — 3 news cards with dates
9. Showroom — full-width image
10. Contact blocks — 3 side-by-side blocks (Offices, Message, Visit)
11. Downloads — 4 download cards

### ProductsPage.tsx
- Sticky category filter tabs: All Products, Large Installations, Chandeliers, Installations, Pendant Lights, Floor Lamps
- Product grid: 2/3/4-col responsive, 3:4 aspect ratio images, "New" badge, name, model count
- All 21 products use real images downloaded from sagarti.com category pages
- Completed Projects portfolio: 4 images
- Custom project CTA section
- **Décor & Gifts removed** per user request
- No `onError` handlers — parent div background colour handles missing images gracefully

### AboutPage.tsx
- Brand story (2 paragraphs)
- 4 values (Light as Art, Unusual Materials, Unwavering Attention, Bespoke Only)
- 6-step process (Enquiry → Concept → Design → Prototype → Production → Installation)
- CTA section

### EnquiryPage.tsx
- 3-step form: Project Details → Contact Info → Review & Submit
- Supabase RPC: `submit_public_lead` with `p_source: 'website3_enquiry_form'`
- File upload to `lead-uploads` bucket, path `pending/{uploadSessionId}/`
- Zod validation, react-hook-form

### PartnersPage.tsx
- 4 partner types: Interior Designers, Architects, Developers & Hospitality, Distributors
- 6 trade programme benefits
- Trade account application CTA

### CareerPage.tsx
- 4 open roles: Glass Artisan, Lighting Designer, Project Manager, BDE
- All locations set to Noida, India
- "Why Studio Pranavi" section (4 values)
- Speculative applications CTA

### ShowroomPage.tsx
- Address: A-12, Sector 63, Noida 201 301
- Hours: Monday–Saturday 10am–7pm, Sunday by appointment
- Phone and email
- 4 "what to expect" cards
- Location image + map caption with metro directions (Blue Line, Sector 62)
- Book a visit CTA

### ContactPage, CollectionsPage, PrivacyPage, NotFoundPage
- Standard placeholder pages following the same section pattern

---

## Phase 6 — Images

All images downloaded directly from sagarti.com CDN (`https://sagarti.com/upload/iblock/...`) using `curl` and saved into `public/images/`.

**Total images: 48**

Categories of images:
- Hero, showroom, studio, materials (general)
- Category thumbnails: `cat-grand.jpg`, `cat-chandeliers.jpg` etc.
- Product images per category: `grand-*.jpg`, `chandelier-*.jpg`, `inst-*.jpg`, `pendant-*.jpg`, `floor-*.jpg`
- News and contact block images

---

## Phase 7 — CRM Integration

- Enquiry form sends leads via Supabase `submit_public_lead` RPC
- `p_source: 'website3_enquiry_form'` routes leads distinctly in the CRM dashboard
- File attachments upload to Supabase Storage `lead-uploads` bucket
- Form validates with zod before submission

---

## Key Fixes Made During Build

| Problem | Root Cause | Fix |
|---|---|---|
| Dark background (#050505) | Old context summary described wrong colours | Rewrote all files with white palette after WebFetch confirmed sagarti.com is white |
| No scroll animations | Initial build skipped animations | Added `useScrollReveal` hook + `.reveal` CSS classes to all pages |
| Blank product images on filter click | IntersectionObserver only ran on mount; filtered cards never got `.is-visible` | Added `useEffect([activeCategory])` that promotes remaining `.reveal` elements 40ms after state change |
| Header fixed/sticky | `className="sticky top-0"` | Changed to `relative` — header scrolls with page |
| TypeScript errors in template literals | `as 1 | 2 | 3 | 4` cast inside backtick string | Removed casts, used plain `Math.min()` |
| `onError` causing blank gaps | `onError` set `display: none` but left empty space | Removed all `onError` handlers; container `background: #f0eeeb` handles missing images |
| Collaboration nav links broken | All 3 sub-items pointed to `/contact` | Created `/partners`, `/career`, `/showroom` pages and wired into router |

---

## File Structure (final)

```
apps/website-new-2/
├── public/
│   └── images/              (48 images)
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── RootLayout.tsx
│   │   │   ├── SiteHeader.tsx
│   │   │   └── SiteFooter.tsx
│   │   └── ui/
│   │       └── page-meta.tsx
│   ├── hooks/
│   │   └── useScrollReveal.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── EnquiryPage.tsx
│   │   ├── ContactPage.tsx
│   │   ├── PartnersPage.tsx
│   │   ├── CareerPage.tsx
│   │   ├── ShowroomPage.tsx
│   │   ├── CollectionsPage.tsx
│   │   ├── PrivacyPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── index.css
│   ├── main.tsx
│   └── router.tsx
├── Readme-website-new-2.md   (content editing reference)
├── website2skill.md          (Claude skill for rebuilding this pattern)
├── websitebuilprogress.md    (this file)
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## How to Run

```bash
# From monorepo root
pnpm dev:website-new-2

# Or from this folder
pnpm dev
```

Runs on `http://localhost:5175`

---

## How to Deploy

The site builds as a standard Vite SPA. Deploy to Cloudflare Pages:
1. `pnpm build:website-new-2`
2. Publish `apps/website-new-2/dist/` to Cloudflare Pages
3. Set Supabase env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Add a `_redirects` file (or Cloudflare Pages routing rule) to serve `index.html` for all paths
