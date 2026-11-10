# Studio Pranavi Website — Content & Image Reference Guide

This document is your map for updating text, images, and contact details across the website without needing to understand the full codebase.

---

## Where Images Live

All images are stored in one folder:

```
apps/website-new-2/public/images/
```

**To swap an image:** Replace the file in that folder with the same filename. No code change needed.
**To use a new filename:** Change both the physical file AND the `src="/images/filename.jpg"` reference in the source file listed below.

### Image Reference by Section

| Section | Source File | Image Filename(s) |
|---|---|---|
| Header Logo | `src/components/layout/SiteHeader.tsx` | `logo.png` |
| Homepage Hero | `src/pages/HomePage.tsx` | `hero.jpg` |
| Homepage Category Scroll | `src/pages/HomePage.tsx` | `cat-grand.jpg`, `cat-chandeliers.jpg`, `cat-installations.jpg`, `cat-pendants.jpg`, `cat-floor-lamps.jpg`, `cat-decor.jpg` |
| Homepage New Collections | `src/pages/HomePage.tsx` | `prod-klevver.jpg`, `prod-splash.jpg`, `prod-mobula.jpg`, `prod-voda.jpg`, `prod-olalo.jpg`, `prod-rene.jpg` |
| Homepage Brand History | `src/pages/HomePage.tsx` | `about-studio.jpg` |
| Homepage Materials | `src/pages/HomePage.tsx` | `material-1.jpg`, `material-2.jpg` |
| Homepage News Cards | `src/pages/HomePage.tsx` | `news-1.jpg`, `news-2.jpg`, `news-3.jpg` |
| Homepage Showroom | `src/pages/HomePage.tsx` | `showroom.jpg` |
| Homepage Contact Blocks | `src/pages/HomePage.tsx` | `contact-offices.jpg`, `contact-message.jpg`, `contact-visit.jpg` |
| Homepage Downloads | `src/pages/HomePage.tsx` | `download-1.jpg`, `download-2.jpg`, `download-3.jpg`, `download-4.jpg` |
| Products — Large Installations | `src/pages/ProductsPage.tsx` | `grand-espira.jpg`, `grand-ellea.jpg`, `grand-rene.jpg` |
| Products — Chandeliers | `src/pages/ProductsPage.tsx` | `chandelier-espira.jpg`, `chandelier-ellea.jpg`, `chandelier-rene.jpg`, `chandelier-rene2.jpg`, `chandelier-ellea2.jpg` |
| Products — Installations | `src/pages/ProductsPage.tsx` | `prod-klevver.jpg`, `prod-voda.jpg`, `prod-mobula.jpg`, `inst-lita.jpg`, `prod-olalo.jpg`, `inst-espira.jpg`, `inst-mireya.jpg`, `prod-rene.jpg` |
| Products — Pendant Lights | `src/pages/ProductsPage.tsx` | `pendant-espira.jpg`, `pendant-ellea.jpg`, `pendant-rene.jpg` |
| Products — Floor Lamps | `src/pages/ProductsPage.tsx` | `floor-espira.jpg`, `floor-ellea.jpg` |
| Products Portfolio | `src/pages/ProductsPage.tsx` | `contact-offices.jpg`, `contact-message.jpg`, `contact-visit.jpg`, `showroom.jpg` |
| About Page | `src/pages/AboutPage.tsx` | `about-studio.jpg` |
| Partners Page | `src/pages/PartnersPage.tsx` | `material-1.jpg` |
| Career Page | `src/pages/CareerPage.tsx` | `material-2.jpg` |
| Showroom Page | `src/pages/ShowroomPage.tsx` | `showroom.jpg`, `contact-visit.jpg` |

---

## Text, Contact & Address Reference

### Homepage — Hero, Stats, News, Taglines
**File:** `src/pages/HomePage.tsx`

| What to change | Search for this text |
|---|---|
| Hero headline | `Light harmony masters` |
| Hero subtext | `We create glass and lighting` |
| Stats (sq.ft, years, states) | `5,000` |
| News titles & dates | `18.08.2026` |
| Category names | `Large Installations` |
| Collections names | `Klevver Installation` |
| Brand story text | `Studio Pranavi was born` |
| Social links | `Instagram`, `Pinterest`, `LinkedIn` |

---

### Products Page — Names, Models, Categories
**File:** `src/pages/ProductsPage.tsx`

Edit the `PRODUCTS` array near the top of the file. Each item looks like:

```js
{ id: 'grand-espira', name: 'Espira Grand', category: 'grand', models: 4, isNew: true, image: '/images/grand-espira.jpg' },
```

- `name` — displayed product name
- `models` — number shown as "Available X models"
- `isNew` — `true` shows the "New" badge, `false` hides it
- `image` — filename in `/public/images/`
- `category` — must match one of: `grand`, `chandeliers`, `installations`, `pendants`, `floor-lamps`

To **add a product:** copy any line, paste it, update the fields.
To **remove a product:** delete its line.

---

### About Page — Brand Story, Values, Process
**File:** `src/pages/AboutPage.tsx`

| What to change | Search for this text |
|---|---|
| Brand story paragraph 1 | `Studio Pranavi was born from a design studio` |
| Brand story paragraph 2 | `Today, each Studio Pranavi piece` |
| Values (4 items) | `{ label: 'Light as Art'` |
| Process steps (6 steps) | `{ step: '01'` |

---

### Partners Page — Types & Benefits
**File:** `src/pages/PartnersPage.tsx`

Edit the two arrays at the top of the file:
- `PARTNER_TYPES` — who you work with (title, desc, icon)
- `BENEFITS` — what partners receive (label, desc)

---

### Career Page — Job Listings
**File:** `src/pages/CareerPage.tsx`

Edit the `OPENINGS` array. Each job:

```js
{
  title: 'Glass Artisan',
  type: 'Full-time · Studio',
  location: 'Noida, India',
  desc: 'Description text here...',
},
```

To add a job: copy a block, paste it inside the array, update the fields.
To remove a job: delete its block.

---

### Showroom Page — Address, Phone, Email, Hours
**File:** `src/pages/ShowroomPage.tsx`

Edit the `SHOWROOM_DETAILS` array at the top:

```js
{ label: 'Address',    value: 'A-12, Sector 63, Design District\nNoida 201 301, Uttar Pradesh, India' },
{ label: 'Open Hours', value: 'Monday – Saturday\n10:00 am – 7:00 pm' },
{ label: 'Sunday',     value: 'By appointment only' },
{ label: 'Phone',      value: '+91 80 4567 8900' },
{ label: 'Email',      value: 'showroom@studiopranavi.com' },
```

The `\n` creates a line break within a value.

---

### Footer — Links, Copyright, Social
**File:** `src/components/layout/SiteFooter.tsx`

| What to change | Search for this text |
|---|---|
| Copyright name/year | `Studio Pranavi` |
| Footer column links | Column arrays with `{ label, to }` objects |
| Social handles | `Instagram`, `Pinterest`, `LinkedIn` |

---

### Navigation — Menu Items & Dropdown Links
**File:** `src/components/layout/SiteHeader.tsx`

Edit the `NAV_ITEMS` array at the top. Each item has a `label` (what's shown) and a `to` (where it links). Dropdown children follow the same pattern inside a `children: []` array.

---

## Enquiry Form — CRM Source Tag

**File:** `src/pages/EnquiryPage.tsx`

The form sends leads to the CRM with `p_source: 'website3_enquiry_form'`. Do **not** change this value — it's how the CRM distinguishes leads from this website.

---

## Quick Rules

1. **Swap an image** → replace the file in `public/images/` with the same filename
2. **Edit any list** (products, jobs, partners, news) → find the array near the top of the file, edit the items
3. **Edit contact info** → go to `ShowroomPage.tsx`, edit `SHOWROOM_DETAILS`
4. **Edit nav links** → go to `SiteHeader.tsx`, edit `NAV_ITEMS`
5. **All images** in `src` are referenced as `/images/filename.jpg` (public folder path, not a relative import)
