# Phase 10A — Studio Pranavi Platform Assessment

Generated: 2026-11-09 · rev 3

---

## Brand Identity — Confirmed

| Item                | Confirmed value                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| Official brand name | **Studio Pranavi**                                                                                    |
| Logo wordmark       | "STUDIO PRANVI" — stylized abbreviation on the mark only; all copy and metadata uses "Studio Pranavi" |
| Primary logo file   | `brand-source/logos/brand image.png` (cleaner proportions, more whitespace around monogram)           |
| Secondary logo file | `brand-source/logos/brand logo.png` (same mark, tighter crop — use as fallback only)                  |
| Tagline             | **"We design the essence of light"** — approved for public use                                        |
| Monogram            | Interlocking P+V calligraphic mark — use as standalone motif in dividers / watermarks                 |

---

## 1. Current Frontend Scorecard

Scale: 5 = excellent · 4 = good · 3 = meets minimum · 2 = needs work · 1 = missing

| Dimension               | Score | Evidence                                                                                                                                |
| ----------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Routing completeness    | 3     | 10 public routes exist; missing /projects sub-routes, /expertise, /studio/* sub-pages, /catalogue, /start-a-project, /collections       |
| Logo                    | 1     | Asset now exists at `brand-source/logos/brand logo.png` but is **not in the codebase** — `SiteHeader` and `SiteFooter` render text only |
| Visual identity         | 2     | Color tokens and fonts correct per blueprint; hero is solid charcoal with no photography                                                |
| Typography              | 4     | Playfair Display + Inter in place; no clamp-based fluid scale yet                                                                       |
| Color palette           | 4     | charcoal / ivory / amber / brass / teal — aligned with blueprint                                                                        |
| Hero / hero media       | 1     | No photography, no video — solid dark block with literal placeholder text `[BRAND TAGLINE]`                                             |
| Project storytelling    | 2     | PortfolioDetailPage works but is a sidebar layout, not an editorial story page                                                          |
| Motion                  | 1     | Only `group-hover:scale-105` thumbnail effect; no scroll reveals, no transitions                                                        |
| Mobile experience       | 3     | Hamburger menu, responsive grid breakpoints — no mobile-first hero layout                                                               |
| Accessibility           | 3     | ARIA labels present; no skip-navigation link; focus ring is browser default                                                             |
| SEO                     | 3     | PageMeta component, robots.txt, sitemap.xml — no OG image, no structured data                                                           |
| Image handling          | 1     | Images served from Supabase at original size — no srcset, no WebP, no explicit dimensions                                               |
| Content completeness    | 1     | Hero, About, team, testimonials are all placeholder text — zero approved content                                                        |
| CMS / section control   | 1     | No CMS UI; services and portfolio tables exist but no page-section or navigation CMS                                                    |
| Collections / Catalogue | 1     | Not implemented                                                                                                                         |
| Studio / Craftsmanship  | 1     | Not implemented (collapsed into one placeholder About page)                                                                             |

**Overall: 2.0 / 5 — solid technical foundation, full design and content build required**

---

## 2. Existing Features That Must Be Preserved

Every item below must survive Phase 10B and 10C unchanged in behaviour.

| Feature                          | Key file                                            | Contract                                                                                                                                              |
| -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3-step quote request form        | `apps/website/src/pages/QuotePage.tsx`              | Calls `submit_public_lead` RPC · file upload to `lead-uploads` · budget in integer paise · honeypot field · `?service=id` pre-fill · consent checkbox |
| Contact inquiry form             | `apps/website/src/pages/ContactPage.tsx`            | Calls `submit_contact_inquiry` RPC                                                                                                                    |
| Portfolio category filter        | `apps/website/src/pages/PortfolioPage.tsx`          | `usePortfolioProjects(category?)` — category from URL or state                                                                                        |
| Portfolio detail + gallery       | `apps/website/src/pages/PortfolioDetailPage.tsx`    | Gallery sorted by `sort_order`; `Navigate` redirect on slug-not-found                                                                                 |
| Service detail → quote pre-fill  | `apps/website/src/pages/ServiceDetailPage.tsx`      | Link passes `?service=${service.id}` to quote form                                                                                                    |
| Sticky header + mobile menu      | `apps/website/src/components/layout/SiteHeader.tsx` | `aria-expanded`, `aria-controls`, `sr-only` toggle                                                                                                    |
| Page SEO meta                    | `apps/website/src/components/ui/page-meta.tsx`      | All pages — title, description, canonical path                                                                                                        |
| Scroll restoration               | `apps/website/src/components/layout/RootLayout.tsx` | React Router `ScrollRestoration`                                                                                                                      |
| Loading / error / empty states   | All data-driven pages                               | Skeleton, error banner, empty-state copy must survive redesign                                                                                        |
| `robots.txt` + `sitemap.xml`     | `apps/website/public/`                              | Must not regress                                                                                                                                      |
| **All CRM routes and behaviour** | `apps/crm/src/router.tsx`                           | /dashboard, /leads, /customers, /quotes, /orders, /projects, /invoices, /tasks, /admin/settings — no change                                           |
| **CRM visual identity**          | `apps/crm/src/index.css` + `tailwind.config.ts`     | Dark sidebar, neutral surface, amber primary — must remain visually stable                                                                            |
| Supabase RLS policies            | `supabase/migrations/20261108000010…`               | Anonymous cannot read leads, customers, CRM data, private buckets                                                                                     |

---

## 3. Source-Material Inventory

### Presentations and documents

| File                          | Location                   | Size  | Status                                                                                        |
| ----------------------------- | -------------------------- | ----- | --------------------------------------------------------------------------------------------- |
| `Prestigious Projects.pptx`   | `brand-source/projects/`   | 28 MB | 17 slides · 4 hospitality projects · 33 embedded images · **CONTAINS personal phone + email** |
| `Studio pranvi projects.pptx` | `brand-source/catalogues/` | 99 MB | ~49 slides · company overview + 9 projects · 83 embedded images/elements                      |

### Logo

| File             | Location              | Size  | Description                                                                                                                                                                                               |
| ---------------- | --------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `brand logo.png` | `brand-source/logos/` | 86 KB | Black-on-white · Square format · Serif monogram (P+V lettermark with flowing calligraphic element) · "STUDIO" in wide-spaced small caps · "PRANVI" in large serif caps · Premium, architectural character |

### Photographs

| Collection       | Location                           | Count | Quality                                                                                                                                                                                                                                   |
| ---------------- | ---------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UUID-named JPEGs | `brand-source/photos/`             | 90    | **Workshop / factory documentation.** Phone camera shots on green floor with rulers, boxes, packaging, clutter. None are publication-ready as editorial images. Useful only as process/behind-the-scenes if carefully cropped and framed. |
| Picoflights copy | `references_pics_ppt/Picoflights/` | 90    | Identical to above                                                                                                                                                                                                                        |

### Images extracted from presentations (assessed by sampling)

| Tier                                   | Source            | Count approx. | Description                                                                                                                                                                                      |
| -------------------------------------- | ----------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A — Hero / editorial                   | Both PPTs         | ~8–12         | Professional renders (CGI lobby · amber glass sculpture · dramatic product studio shots); editorial lifestyle product photography (dark-background mesh pendant · table lamp in luxury interior) |
| B — Project documentation              | Both PPTs         | ~20–25        | On-site installation photos from completed projects; some taken on phone (Samsung A22 watermark visible on several)                                                                              |
| C — In-progress / DO NOT PUBLISH       | Both PPTs         | ~10–15        | Unfinished installation sites, scaffolding, construction photos                                                                                                                                  |
| D — Template elements / DO NOT PUBLISH | Studio Pranvi PPT | ~35+          | Decorative SVG curves, layout frames, presentation chrome                                                                                                                                        |

### Public website assets

| Asset           | Status                                                       |
| --------------- | ------------------------------------------------------------ |
| `robots.txt`    | Present                                                      |
| `sitemap.xml`   | Present                                                      |
| Favicon         | **MISSING**                                                  |
| Social OG image | **MISSING**                                                  |
| Logo in build   | **MISSING** — not in `apps/website/public/` or `src/assets/` |

---

## 4. Public / Private / Requires-Approval Classification

### PRIVATE — must never appear in public website, build output, API response or metadata

| Item                                                               | Found in                           | Reason                                                                       |
| ------------------------------------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------- |
| Mr. Ashutosh · `ashutosh.kumar3@tajhotels.com` · `+91 79721 04372` | Prestigious Projects slide 3       | Personal work contact at Taj Hotels                                          |
| Mr. Anmol Pawar · `pawar.amol@hiranandani.net` · `98208 74473`     | Prestigious Projects slide 10      | Personal work contact at Hiranandani                                         |
| Mr. Ajay Kumar                                                     | Prestigious Projects slides 13, 16 | Personal contact at Lemon Tree / Paramjyoti                                  |
| Contact details placeholder (slide 50 of Studio Pranvi PPT)        | Studio Pranvi PPT                  | Even though blank in this version, field must remain empty in public content |
| Workshop / factory floor photographs                               | `brand-source/photos/`             | Reveals internal layout, partner packaging brands                            |
| "Samsung Yogendra's A22" watermarked photos                        | PPT media                          | Identifies employee by device; remove watermark before any use               |
| Exact project site addresses                                       | Any                                | Use city-level location label only (e.g. "Patna, Bihar")                     |
| Internal production notes, cost breakdowns                         | PPT                                | Internal commercial information                                              |

### REQUIRES OWNER APPROVAL before publishing

| Content                                                                       | Notes                                                                           |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Project names: Taj Patna, Meluha, Lemon Tree, DS Group                        | Use hotel/brand name — no contact names                                         |
| Residential client names: ATS Kingston, Mr. Nikhil, etc.                      | Residential clients require explicit consent                                    |
| All Tier-A photographs                                                        | Confirm: Studio Pranavi's own work vs. architect renders vs. OEM catalog images |
| Glassblowing craftsmanship photo (Studio Pranvi PPT image10)                  | Stunning image — confirm it is Studio Pranavi's own factory/process             |
| Company statistics: 100+ projects/year · 30+ employees · <0.5% quality return | Owner must approve for public use                                               |
| Brand tagline "We design the essence of light"                                | Confirm approval — confirmed in both PPT covers                                 |
| Product descriptions in Studio Pranvi PPT (slides 9, 10, 13, 19)              | Good draft copy — needs owner review                                            |

### SAFE to publish without per-item approval

- Service descriptions authored for the website
- Privacy policy
- Contact and quote forms
- Generic process steps
- Approved brand tagline (once confirmed)

---

## 5. Missing Source Material List

| Missing item                                                      | Impact                                                          | Priority                                      |
| ----------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| SVG version of logo                                               | Cannot scale sharply at all sizes; favicon derivation           | **Critical before 10B**                       |
| White / reversed logo variant                                     | Cannot use logo on dark charcoal header/footer backgrounds      | **Critical before 10B**                       |
| Professional finished-installation photography                    | Website cannot have a credible hero or project pages without it | **Critical before 10C**                       |
| Product catalogue PDF                                             | Catalogue page will be placeholder                              | High                                          |
| Approved business copy (About, craftsmanship, materials, process) | All Studio sub-pages will be placeholder                        | High                                          |
| Videos (any — hero loop, process film, installation timelapse)    | Video strategy cannot be executed                               | Medium                                        |
| Approved testimonials (with `consent_recorded_at`)                | Testimonials section omitted entirely until supplied            | Medium                                        |
| Favicon (32×32, 180×180 apple-touch)                              | Browser tab and mobile home-screen presence                     | High                                          |
| Social OG image (1200×630)                                        | All social shares use no image                                  | High                                          |
| ~~Brand name spelling~~                                           | ~~Confirm PRANVI vs PRANAVI~~                                   | **Resolved: official name is Studio Pranavi** |

---

## 6. Reference-Site Analysis

> Both sites fetched live. Analysis is from actual page content.
> Do **not** copy code, text, imagery, branding or distinctive layouts from either.

### sagarti.com

**What it is:** Russian luxury decorative lighting brand manufacturing high-end chandeliers and bespoke lighting, selling internationally.

Fetched live — content partially in Russian; analysis based on visible structure and HTML.

| Quality             | Detail                                                                         | Adapt for Studio Pranavi                                                          |
| ------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Visual hierarchy    | Pyramid: bold hero tagline → large category grid tiles → editorial content     | Adopt the same descending hierarchy                                               |
| Hero                | Full-viewport, text-dominant with large tagline; category navigation below     | Studio Pranavi: use approved photography as hero lead; text supports              |
| Category tiles      | Large image squares for each product category                                  | Adapt as expertise/service tiles with approved product photography                |
| Product photography | Museum-quality product shots on clean backgrounds; material texture emphasized | Adopt the dark-background product photography style visible in Studio Pranavi PPT |
| Navigation          | Header + mobile hamburger with hierarchical categories                         | Adapt: add Projects sub-navigation categories                                     |
| Brand storytelling  | Prose narrative over stats — craft origin story                                | Adopt: lead with craft narrative, not bullet statistics                           |
| Whitespace          | Generous vertical; tight horizontal                                            | Match                                                                             |
| Collections         | Clickable image-card grid linking to catalogue pages                           | Adopt for Expertise category pages                                                |
| Footer              | Three-column: brand + links by theme                                           | Adapt for Studio Pranavi four-column IA                                           |
| Overall feel        | Luxury · gallery-like · editorial · understated elegance                       | Target aesthetic                                                                  |

### www.staydesigned.in

**What it is:** Home goods and textile design studio — "Design Services Studio."

Fetched live. Site is text-driven and minimal.

| Quality              | Detail                                                                                             | Adapt for Studio Pranavi                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Visual hierarchy     | Studio name + tagline as primary anchor; CTA leads ("Explore · Our Designs")                       | Adopt hierarchy; Studio Pranavi needs photography where staydesigned.in uses text                                            |
| Hero                 | Minimal, text-driven; logo as visual anchor; no full-bleed photography                             | Contrast lesson: Studio Pranavi must be image-led here — this site's text-only hero would be too sparse for a lighting brand |
| Navigation           | Flat five-item horizontal: Home · About · Our Designs · Services · Contact                         | Adapt: Studio Pranavi adds Projects sub-nav and Start a Project CTA                                                          |
| Typography           | Clean contemporary sans-serif; high readability; no display serif                                  | Contrast lesson: Studio Pranavi's Playfair Display differentiates — this site's sans approach would dilute brand character   |
| Whitespace           | Generous — substantial margins; calm, uncluttered                                                  | Match the whitespace discipline; apply to Studio Pranavi's image sections                                                    |
| Project presentation | Curation-first: users navigate to "Our Designs" / "Design Books" rather than seeing inline gallery | Adapt: Studio Pranavi surfaces 3 project editorial cards on the homepage — more immediate                                    |
| Motion               | Minimal; standard page interactions only                                                           | Lesson: restraint works; Studio Pranavi motion adds scroll reveals but avoids more                                           |
| Color palette        | Neutral tones dominant; whitespace as primary "color"                                              | Match neutral ground; Studio Pranavi's charcoal + ivory + amber accents are richer                                           |
| Overall feel         | Understated · professional · design-studio-appropriate · content-clarity first                     | Good baseline discipline; Studio Pranavi adds editorial warmth via photography and typography                                |

### Key principles extracted (applicable to Studio Pranavi, not copied from either site)

1. Photography is the primary communication medium — text supports, never dominates (sagarti.com confirms this for luxury product brands)
2. Whitespace is generosity — both reference sites demonstrate generous spacing; each image breathes
3. Category tiles at scale anchor the browse experience (sagarti.com)
4. A flat, accessible IA with five to six primary nodes is the right navigation complexity for a studio site (staydesigned.in)
5. Project pages tell a story: brief → intent → craft → result
6. Motion is ambient and purposeful — reveal, not distract (staydesigned.in's restraint is instructive)
7. Mobile is a first-class experience — not a compressed desktop
8. The brand tagline lives in the hero — stated once, powerfully

---

## 7. Studio Pranavi Design Direction

### Character words

**Luminous. Considered. Crafted. Indian. Precise.**

Not cold Scandinavian minimalism. Not maximalist Baroque opulence. The specific register is: warm precision — the quality of a hand-formed brass fitting in an architectural lobby, lit to cast a specific shadow.

### Derived from the evidence

- **Logo:** Calligraphic P+V monogram + wide-spaced "STUDIO" + authoritative serif "PRANVI" wordmark → editorial restraint with craft character; official name Studio Pranavi used in all copy
- **PPT Tier-A imagery:** Warm amber glass in lobby renders; dark-background mesh pendant with geometric shadow patterns; lifestyle table lamp with antique mirror shade → warm-dark contrast is the Studio Pranavi signature
- **Brand tagline:** "We design the essence of light" → light itself is the product, not the fixture
- **Business positioning:** "Ultra luxury and premium segment" · "100% Made in India" · "Most sophisticated glass production in India" → Indian craft authority at international standards
- **Market mix:** 40% institutional buyers, 25% ID/LC, 20% hotels, 15% builders → B2B trust-building is as important as consumer appeal

### Visual language rules for 10C

**DO:**

- Lead every section with approved photography
- Use full-bleed hero images at viewport height on desktop
- Alternate text-left / image-right at desktop; stack on mobile
- Apply warm neutral surfaces: ivory (`#F9F5EF`) for primary, warm stone (`#EDE8DF`) for alternate sections
- Use charcoal (`#2C2C2C`) for hero, footer, and dark feature sections — mirrors logo weight
- Use amber/brass (`#C8973A` / `#9E7529`) only for accents, CTAs, and highlights — never as a background for body text
- Use the monogram mark as a standalone motif in section dividers or watermark overlays
- Enforce minimal border radius on image containers (4–6 px max) — architectural, not app-like
- Use Playfair Display for all display headings — never a different serif
- Show dramatic shadow play from lighting products in craftsmanship sections

**DO NOT:**

- Use solid charcoal as the hero background when approved photography is available
- Invent projects, clients, statistics or awards not in the source materials
- Use stock images of chandeliers or interiors that are not Studio Pranavi's work
- Round image corners beyond 6 px
- Use neon gradients, glassmorphism, excessive drop-shadows
- Autoplay audio
- Use scroll hijacking / snap-scrolling
- Publish any personal contact information from the PPTs

---

## 8. Final Website Information Architecture

```
/                               Home
/projects                       Projects  ← redirect from /portfolio
  /projects/hospitality
  /projects/residential
  /projects/commercial
  /projects/decorative-lighting
  /projects/custom-glass
  /projects/:slug               Project Story  ← redirect from /portfolio/:slug

/expertise                      Expertise  ← redirect from /services
  /expertise/bespoke-lighting
  /expertise/architectural-lighting
  /expertise/decorative-lighting
  /expertise/custom-glass
  /expertise/installation
  /expertise/:slug              Expertise Detail  ← redirect from /services/:slug

/collections                    Collections  (stub in 10C; full build in 10D)
  /collections/:slug

/studio                         Studio  ← redirect from /about
  /studio/about
  /studio/craftsmanship
  /studio/materials
  /studio/process

/catalogue                      Catalogue
/contact                        Contact
/start-a-project                Start a Project  ← redirect from /get-a-quote
/privacy                        Privacy Policy
*                               404

Required redirects (all use <Navigate replace>):
  /portfolio           → /projects
  /portfolio/:slug     → /projects/:slug
  /services            → /expertise
  /services/:slug      → /expertise/:slug
  /about               → /studio/about
  /get-a-quote         → /start-a-project
```

**Navigation:**

| Location        | Items                                                                                  |
| --------------- | -------------------------------------------------------------------------------------- |
| Desktop primary | Projects · Expertise · Studio · Catalogue · Contact                                    |
| Desktop CTA     | "Start a Project" (button, amber/brass)                                                |
| Mobile          | Hamburger → all primary items + CTA                                                    |
| Footer col 1    | Logo + tagline + contact details                                                       |
| Footer col 2    | Projects (Hospitality · Residential · Commercial · Decorative Lighting · Custom Glass) |
| Footer col 3    | Expertise (Bespoke · Architectural · Decorative · Custom Glass · Installation)         |
| Footer col 4    | Studio (About · Craftsmanship · Materials · Process) · Privacy · Contact               |

---

## 9. Homepage Content Structure

Sections in order:

| #   | Section                             | Content                                                                                                                                  | Notes                                                               |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | **Cinematic hero**                  | Best Tier-A approved photograph at 100 vh; short dark gradient at bottom                                                                 | No solid charcoal fallback — warm-stone placeholder only            |
| 2   | **Studio positioning**              | Tagline "We design the essence of light"; sub-line from product-and-source-material.md; two CTAs: "Explore Projects" / "Start a Project" | Owner confirms tagline                                              |
| 3   | **Selected projects**               | 3 editorial cards — large images, project name, category label, hover CTA                                                                | `is_featured = true` OR top 3 by `sort_order`                       |
| 4   | **Expertise categories**            | 4–5 category tiles with approved product/craft imagery                                                                                   | From `services` table                                               |
| 5   | **Concept-to-installation process** | 4 steps: Consultation → Design & Development → Craftsmanship → Installation & Handover                                                   | Expand existing process section copy                                |
| 6   | **Craftsmanship / material detail** | 1 approved craft image (e.g. glassblowing if provenance confirmed) + 2–3 sentences about the fabrication                                 | Placeholder until owner confirms image                              |
| 7   | **Flagship project feature**        | 1 project presented editorially: name, brief description, large image, link to project story                                             | Owner selects; use Taj Patna or ATS Kingston if approved            |
| 8   | **Testimonials**                    | Omit entirely in 10C — no approved testimonials exist                                                                                    | CMS section created but `status = 'draft'`, never rendered publicly |
| 9   | **Final CTA strip**                 | "Every space deserves the right light. Let's build yours." + "Start a Project"                                                           | Charcoal background, ivory text, amber CTA                          |

---

## 10. Project Listing Structure

**URL:** `/projects`

| Element         | Detail                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Header          | Minimal — page title "Projects", optional short intro line                                                                             |
| Category filter | Tab row: All · Hospitality · Residential · Commercial · Decorative Lighting · Custom Glass                                             |
| Grid layout     | Editorial masonry or offset grid — NOT uniform 3-column cards                                                                          |
| Project card    | Cover image (full-width within card) · project name (Playfair Display) · category label (uppercase small) · location label (city only) |
| Empty state     | "Our project portfolio is coming soon. Explore our expertise →"                                                                        |
| Broken image    | Warm-stone placeholder — never broken `<img>` tag                                                                                      |

**Editorial grid approach:**

- Desktop 1440 px: 1 large featured (60% width) + 2 smaller (40% width) per row or masonry
- Tablet 768 px: 2 columns
- Mobile: 1 column full-width

---

## 11. Project-Detail Storytelling Template

**URL:** `/projects/:slug`

Full editorial page — not a sidebar layout.

| Section               | Content field                                                     | Notes                                                                           |
| --------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Full-bleed hero       | `cover_image_path`                                                | 100 vh on desktop; no private address in image metadata                         |
| Project name          | `title`                                                           | Playfair Display, large                                                         |
| Meta row              | `category` · `location_label` (city only) · `completed_on` (year) | Inline, label-upper style                                                       |
| Project brief         | `summary`                                                         | Short paragraph — what the commission was                                       |
| Design intent         | `description` (first section)                                     | What Studio Pranavi was asked to achieve and why                                |
| Craft + technical     | Custom field or `description` continuation                        | Materials used (from `materials[]`), fabrication approach, technical challenges |
| Process media         | `portfolio_images` where caption contains "process"               | In-progress approved shots                                                      |
| Finished installation | `portfolio_images` sorted by `sort_order`                         | Full-width large gallery — not thumbnail grid                                   |
| Project facts         | `category`, `completed_on`, `materials[]`                         | Aside or inline fact block                                                      |
| Related project       | Next project in same category or by sort                          | "Next project →"                                                                |
| Start-a-Project CTA   | Link to `/start-a-project`                                        | Full-width band, charcoal or stone background                                   |

**No sidebar on this page.** Single-column linear narrative at all viewports.

---

## 12. Expertise / Services Structure

**URL:** `/expertise` and `/expertise/:slug`

| Page                      | Content                                                                                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/expertise` listing      | Section header · 4–5 expertise tiles (image, name, short description) · intro paragraph about Studio Pranavi's approach                                                                                     |
| `/expertise/:slug` detail | Hero image (from `services.hero_image_path`) · Title + short description · Features list (`services.features` JSONB) · Relevant project examples (linked) · Start-a-Project CTA with `?service=id` pre-fill |

Expertise categories map to the lighting and glass taxonomies in §13 and §14.

---

## 13. Lighting Taxonomy

Derived from source materials only. Owner to confirm and expand.

```
BESPOKE LIGHTING
  Custom chandelier design and manufacture
  Custom pendant and hanging light design
  Custom table lamp design
  Bespoke wall and sconce lighting

ARCHITECTURAL LIGHTING
  Integrated ceiling systems
  Lobby and atrium centrepiece installations
  Feature lighting for hospitality spaces
  Feature lighting for residential high-rises

DECORATIVE LIGHTING
  Chandeliers — statement ceiling pieces
  Hanging lights — linear and cluster arrangements
  Table lamps — decorative and functional
  Technical integration — dimming, tunability, scene-setting

MATERIALS AND FINISHES (known from PPTs)
  Metal: Brass · Gold finish · Black (matte/gloss) · Nickel silver · Antique mirror
  Glass: Cast glass elements · Crystal drops · Fabric shades with brass accent · Globe glass
  Technical: Dimming-compatible · Tuneable white
```

---

## 14. Glass Taxonomy

```
CUSTOM GLASS WORK
  Architectural glass panels
  Decorative glass installations
  Cast glass sculptural elements (see amber glass lobby render — signature piece)
  Glass and metal combination pieces
  Backlit glass surfaces

SPECIALTY GLASS (known from PPTs)
  Cast glass (mentioned as "world's largest portfolio of cast glass elements")
  Crystal components for chandeliers
  Bubble-inclusion glass (visible in table lamp lifestyle photo)
  Coloured / tinted glass (amber, smoke, clear)

Note: Glass taxonomy is less fully evidenced in current source materials than lighting.
Owner should provide a glass-specific catalogue or material board before 10C content seeding.
```

---

## 15. Studio / About Structure

**URL:** `/studio` (overview redirect or landing) + four sub-pages

| Page                    | Content                                                                                                                                                                                         | Source                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `/studio/about`         | Studio origin story · business positioning · why Studio Pranavi · team overview                                                                                                                 | Owner-authored copy required; no placeholder statistics |
| `/studio/craftsmanship` | What "bespoke" means in practice · the manufacturing process · quality standards ("European standard factories" · "<0.5% quality return" — confirm approval) · glassblowing + metal fabrication | PPT slides 3, 5 + owner copy                            |
| `/studio/materials`     | Glass types used · metals and finishes · sourcing standards · sustainability                                                                                                                    | Owner to specify; no content exists yet                 |
| `/studio/process`       | Expanded Consultation → Design → Fabrication → Installation → Handover; per-step image                                                                                                          | Expand from current 4-step placeholder                  |

---

## 16. Craftsmanship / Process Structure

Process visible in source materials:

```
1. Consultation        Client brief, space analysis, lighting design intent
2. Design Development  3D visualization, material selection, custom prototyping
3. Manufacturing       Metal fabrication + glass work in-house; quality inspection
4. Technical Integration  Dimming, tunability, electrical compliance
5. Installation        Site coordination, professional installation, commissioning
6. Handover + AMC      Training, maintenance, after-sales service
```

**Media needed per step:**

- Step 1: Meeting / consultation sketch
- Step 2: 3D render or drawing (several exist in PPTs as renders)
- Step 3: Workshop / fabrication (use the best UUID workshop photos or glassblowing image)
- Step 4: Technical detail shot
- Step 5: Installation process photo (Tier B images from PPTs)
- Step 6: Finished space

---

## 17. Catalogue Structure

**URL:** `/catalogue`

| State             | Content                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| No PDF exists     | "Download our project catalogue — coming soon. In the meantime, explore our expertise →" + expertise CTA                       |
| PDF available     | Brief intro + download form (name + email) → triggers email with PDF link; gated catalogue stored in Supabase `public-content` |
| Collections exist | Grid of collection tiles below download, each linking to `/collections/:slug`                                                  |

**Phase 10C:** Implement placeholder state (no PDF yet — this is factually accurate).
**Phase 10D:** Implement full CMS-managed catalogue with form-gated download.

---

## 18. Contact / Start-a-Project Structure

### `/contact`

Keep current form. Update route awareness for new IA. No content changes — the form calls `submit_contact_inquiry` which must remain intact.

Contact info displayed: phone, WhatsApp, email — all sourced from `VITE_CONTACT_PHONE`, `VITE_CONTACT_EMAIL`, `VITE_CONTACT_WHATSAPP` environment variables. **Never hard-coded in source.**

### `/start-a-project` (was `/get-a-quote`)

Keep all 3-step form logic from `QuotePage.tsx` exactly. Change is the URL only:

- Add `<Navigate replace from="/get-a-quote" to="/start-a-project" />`
- Update internal links from `/get-a-quote` to `/start-a-project`
- Update service detail CTA: `?service=id` param preserved

Page presentation: update headline from "Get a Free Quote" → "Start a Project" (or owner-approved equivalent). Keep form steps, file upload, validation, and RPC call unchanged.

---

## 19. Image Strategy

### Classification tiers

| Tier | Description                                            | Use                                                          |
| ---- | ------------------------------------------------------ | ------------------------------------------------------------ |
| A    | Professional renders, studio editorial shots from PPTs | Hero, project covers, expertise tiles, craftsmanship section |
| B    | On-site documentation, cleaned phone photos            | Project gallery images, process steps                        |
| C    | In-progress / construction                             | Craftsmanship / process steps only, with captions            |
| D    | Workshop QC documentation (90 UUID files)              | Internal only — do not publish                               |

### Technical pipeline (Phase 10D builds; 10B/10C must prepare for)

- Source originals stored privately in `brand-source/`
- Approved images uploaded by admin to Supabase `public-content` bucket
- Derive: WebP at 400 w, 800 w, 1200 w, 2000 w; AVIF at same widths
- All `<img>`: `srcset` + `sizes` + explicit `width`/`height` + `loading="lazy"` (hero: `loading="eager"` + `fetchpriority="high"`)
- Focal point stored in `portfolio_images` and `services` tables as `focal_x numeric`, `focal_y numeric`
- Alt text: required in database before any image publishes (`alt_text text not null` already enforced in `portfolio_images`)

### Phase 10C image approach (before Phase 10D pipeline exists)

- Tier-A images from PPTs uploaded manually to Supabase `public-content` and referenced by URL in seed migrations
- Each image: alt text written by developer, owner to review
- All images: placeholder warm-stone `<div>` when `cover_image_path` is null — never a broken `<img>`
- Samsung watermarks: flagged to owner — must be removed before Tier-B images are used

---

## 20. Video Strategy

**Current state:** No video files exist in any source directory.

### When video assets become available

| Format                     | Use case                                     | Requirements                                                                                                                          |
| -------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Compressed hero loop       | Background behind hero text                  | Muted · MP4 + WebM · < 5 MB · `poster` image required · `prefers-reduced-motion` fallback to static image · never autoplay with sound |
| Short product/process clip | Craftsmanship section                        | Same as above                                                                                                                         |
| Full project film          | `/projects/:slug` story or `/studio/process` | Embed YouTube or Vimeo — do not self-host long-form video                                                                             |

### Phase 10C

No video implemented — static images only. Video slots in homepage hero and craftsmanship section accept a video URL in `business_settings` or CMS but fall back gracefully to a static image.

---

## 21. Typography Recommendation

**Keep existing pairing:** Playfair Display (display) + Inter (body). The logo and the product both support this choice.

### Fluid scale tokens (Phase 10B to implement)

```css
--text-display-xl: clamp(2.75rem, 5vw, 4.5rem) / lh 1.1 /* Hero H1 */
  --text-display-lg: clamp(2rem, 3.5vw, 3rem) / lh 1.15 /* Page H1 */
  --text-display-md: clamp(1.5rem, 2.5vw, 2rem) / lh 1.2 /* Section H2 */
  --text-display-sm: clamp(1.25rem, 1.8vw, 1.5rem)/lh 1.3 /* Card H3 */ --text-body-lg: 1.125rem /
  lh 1.75 /* Intro para */ --text-body-md: 1rem / lh 1.625 /* Body */ --text-body-sm: 0.875rem / lh
  1.5 /* Caption / meta */ --text-label-upper: 0.6875rem / lh 1.4 / ls 0.15em / uppercase
  /* Category labels */;
```

### Tracking

- Display headings: `-0.01em` to `-0.02em` (architectural tightness)
- "STUDIO" equivalent labels: `+0.15em` (editorial air)
- Body: `0` (Inter default)

### Font loading

- Preload both families in `index.html`
- `font-display: swap` on all declarations
- Subset to Latin + Latin Extended — no Cyrillic needed

---

## 22. Color-System Recommendation

### Core palette (all tokens confirmed from existing codebase + logo)

```
brand-charcoal:  #2C2C2C   — hero, footer, dark sections, logo on light
brand-ivory:     #F9F5EF   — primary light surface
brand-stone:     #EDE8DF   — alternate light surface (NEW token needed in 10B)
brand-amber:     #C8973A   — primary accent, CTA buttons, focus ring
brand-brass:     #9E7529   — hover state, deeper amber
brand-teal:      #2D6A6A   — optional architectural accent section (one use max per page)
```

### Semantic tokens (Phase 10B CSS custom properties)

```css
--color-surface: hsl(40 30% 97%) /* warm ivory */ --color-surface-alt: hsl(38 25% 93%)
  /* warm stone */ --color-surface-dark: #2c2c2c /* charcoal */ --color-text: hsl(20 10% 15%)
  --color-text-muted: hsl(20 10% 45%) --color-text-on-dark: #f9f5ef --color-accent: #c8973a
  --color-accent-hover: #9e7529 --color-border: hsl(40 15% 85%)
  --color-destructive: hsl(0 84.2% 60.2%);
```

### Contrast audit (required before 10C goes live)

| Pair                                                | Ratio target                                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Amber (#C8973A) on ivory (#F9F5EF) — body text      | Must be ≥ 4.5:1 — currently borderline; use brass (#9E7529) for small text on light |
| Charcoal (#2C2C2C) on ivory — passes easily         | ≥ 4.5:1 ✓                                                                           |
| Ivory (#F9F5EF) on charcoal — passes                | ≥ 4.5:1 ✓                                                                           |
| Amber (#C8973A) on charcoal — passes for large text | Verify at 14 px                                                                     |

---

## 23. Animation / Motion Recommendation

### Principles

Motion in Studio Pranavi's website must feel like the work itself: considered, precise, unhurried.

### Allowed patterns

| Pattern                                     | Duration | Easing      | Rule                                 |
| ------------------------------------------- | -------- | ----------- | ------------------------------------ |
| Scroll reveal (fade + translateY 24 px → 0) | 450 ms   | ease-out    | `once: true`; stagger children 80 ms |
| Hero image ambient scale (1.0 → 1.04)       | 8 s      | linear      | Breathing effect — not parallax      |
| Route transition (fade)                     | 250 ms   | ease-in-out | Page-level only                      |
| Image hover scale (1.0 → 1.03)              | 280 ms   | ease-out    | Reduce current 1.05 to 1.03          |
| CTA hover (color shift + translateY -1 px)  | 200 ms   | ease-out    |                                      |
| Mobile menu slide-in                        | 220 ms   | ease-out    |                                      |

### Forbidden

- Scroll hijacking / full-page snap-scrolling
- Heavy parallax (image moves at rate different from scroll)
- Animation that blocks text reading or form interaction
- Infinite looping decorative animations
- Anything not wrapped in `@media (prefers-reduced-motion: no-preference)` or Framer Motion `useReducedMotion()`

### Implementation

- CSS transitions for hover/state
- Framer Motion `variants` + `whileInView` for scroll reveals
- `once: true` on all `whileInView` — do not replay on scroll-back
- Performance target: 60 fps on Samsung Galaxy A-series (mid-range Android)

---

## 24. Desktop Requirements

| Requirement             | Specification                                                                   |
| ----------------------- | ------------------------------------------------------------------------------- |
| Minimum supported width | 1024 px                                                                         |
| Optimal design width    | 1440 px                                                                         |
| Max content width       | 1280 px (container)                                                             |
| Hero image              | 100 vw × 100 vh; `object-fit: cover`; focal point from database                 |
| Section padding         | 80–120 px vertical (top + bottom); 24–48 px horizontal padding within container |
| Project grid            | Editorial masonry or offset — never uniform card grid at desktop                |
| Navigation              | Sticky header; transparent on hero, opaque on scroll                            |
| Typography              | Full fluid scale active at 1440 px                                              |
| Hover states            | All interactive elements have visible hover styles                              |
| Focus states            | Custom amber focus ring — visible, not browser default                          |

---

## 25. Mobile Requirements

Test viewports: **360 px · 390 px · 768 px · 1440 px**

| Requirement    | Specification                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Hero           | 100 vw × 100 svh (small-viewport height); image fills frame; title at `--text-display-lg`; CTA buttons stack vertically |
| Navigation     | Hamburger at < 768 px; min 44×44 px tap area for all interactive elements; menu items large enough for thumb tap        |
| Project grid   | 1 column at 360–640 px; 2 columns at 640–1024 px                                                                        |
| Project detail | Single column — no sidebar; "Project Details" sidebar reflows below main content                                        |
| Quote form     | Full-width inputs; step indicator visible at 360 px without truncation                                                  |
| Typography     | All `clamp()`-based — no layout break or text overflow at any viewport                                                  |
| Footer         | Single column at mobile; no horizontal scroll                                                                           |
| Images         | Serve `400w` srcset slice on mobile                                                                                     |
| Touch gestures | No hover-only interactions; tap = hover equivalent                                                                      |
| Reduced motion | System preference respected on all mobile devices                                                                       |
| Skip link      | Functional on mobile keyboards                                                                                          |

---

## 26. CMS Requirements

### Phase 10B scope (branding only — in CRM)

CRM page `/admin/website-branding`:

- Business name, tagline
- Logo URLs: main, light, dark, mobile
- Favicon URL, social OG image URL
- Primary, secondary, accent color tokens (hex — validated against approved palette, not free-text CSS)
- Heading / body font choices (select list from approved options only)
- Button border-radius token
- Default hero media URL
- Stored in `business_settings` row
- RLS: admin write only; anonymous read of published subset only

### Phase 10D scope (full CMS — document here for 10B/10C architectural awareness)

**Page sections (homepage, key landing pages):**

- Section types: hero · selected-projects · services-grid · text-image · process-timeline · image-gallery · video · testimonials · faq · cta · catalogue-download
- Each section: title · copy · media reference · alignment (left/right/center) · theme (light/dark) · CTA link + label · visibility toggle · sort order · draft/published status · optional publish date

**Navigation management:**

- Primary nav items with label + path
- Footer column groups with links

**Services / Expertise management:**

- Full CRUD on `services` table via CRM UI
- Image upload to `public-content` bucket from CRM

**Portfolio / Projects management:**

- Full CRUD on `portfolio_projects` + `portfolio_images` tables
- Image upload, sort, alt text, focal point

**No arbitrary CSS or HTML in CMS fields.** Color fields: hex validation. Copy fields: plain text or controlled markdown only.

---

## 27. Media-Library Requirements

### Phase 10D to implement — 10B/10C must not block it architecturally

| Requirement             | Detail                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Upload                  | Admin uploads to Supabase `public-content` bucket via CRM media library UI                                                                 |
| Metadata                | Filename · alt text · caption · project linkage · category tag · approval status (`draft`/`approved`) · focal point (`focal_x`, `focal_y`) |
| Derivative generation   | WebP + AVIF at 400/800/1200/2000 w — via Edge Function or external pipeline                                                                |
| Usage tracking          | Which pages and sections reference each asset (prevent orphan deletion)                                                                    |
| Private media isolation | `lead-uploads` and `crm-documents` must never appear in the public media library UI                                                        |
| Replacement             | Upload a new version; retire old version gracefully (no hard-delete while in use)                                                          |

### Database additions needed (Phase 10D)

```sql
alter table portfolio_images add column focal_x numeric check (focal_x between 0 and 1);
alter table portfolio_images add column focal_y numeric check (focal_y between 0 and 1);
alter table services         add column focal_x numeric check (focal_x between 0 and 1);
alter table services         add column focal_y numeric check (focal_y between 0 and 1);
```

---

## 28. SEO Requirements

| Requirement                              | Phase   | Detail                                                                  |
| ---------------------------------------- | ------- | ----------------------------------------------------------------------- |
| Per-page title + description             | 10C     | `PageMeta` component already in place — populate with approved copy     |
| Canonical URL                            | 10C     | Add `<link rel="canonical">` to `PageMeta`                              |
| OG image                                 | 10B     | Create 1200×630 placeholder; swap with real image in 10C                |
| `og:title`, `og:description`, `og:image` | 10B/10C | Add to `PageMeta`                                                       |
| Twitter card meta                        | 10C     | `twitter:card=summary_large_image`                                      |
| Structured data                          | 10D     | `LocalBusiness` JSON-LD with `business_settings` data                   |
| Sitemap                                  | 10D     | Dynamic sitemap generated from published portfolio + services routes    |
| robots.txt                               | Present | Ensure `/api/*` and CRM paths are not indexed                           |
| Heading hierarchy                        | 10C     | One `<h1>` per page; logical `h2`/`h3` nesting — audit in AC            |
| Image alt text                           | 10C     | All `<img>` have non-empty alt text (or `alt=""` for purely decorative) |
| No noindex on live pages                 | 10J     | Confirm `VITE_PUBLIC_SITE_URL` is set before DNS cutover                |

---

## 29. Accessibility Requirements

Target: **WCAG 2.2 AA intent**

| Requirement          | Specification                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Color contrast       | All text/background ≥ 4.5:1 (large text ≥ 3:1); amber on ivory must be audited before 10C ships                                                              |
| Focus ring           | Custom amber ring (`outline: 2px solid #C8973A; outline-offset: 2px`) on all interactive elements — not browser default                                      |
| Skip navigation      | `<a href="#main-content" className="sr-only focus:not-sr-only …">Skip to content</a>` as first focusable element in `RootLayout`; `<main id="main-content">` |
| Heading hierarchy    | One `<h1>` per page; no skipped levels; never use heading for styling                                                                                        |
| Landmarks            | `<header>`, `<main>`, `<nav>` (with `aria-label`), `<footer>` on every page                                                                                  |
| Images               | Meaningful `alt` text on all images; decorative: `alt=""`                                                                                                    |
| Form labels          | Every `<input>`, `<textarea>`, `<select>` has associated `<label>` — no placeholder-only labelling                                                           |
| Error states         | Communicated by icon + text + color — never color alone                                                                                                      |
| Status announcements | Errors via `role="alert"`; success states via `aria-live="polite"`                                                                                           |
| Keyboard navigation  | All elements reachable via Tab; all interactive elements operable with Enter/Space                                                                           |
| Reduced motion       | All animations wrapped in `@media (prefers-reduced-motion: no-preference)`                                                                                   |
| Touch targets        | Minimum 44×44 px on all interactive elements                                                                                                                 |
| Language             | `<html lang="en">` present                                                                                                                                   |

---

## 30. Performance Requirements

Target — report actual Lighthouse results, never claim before measuring.

| Metric                      | Target                                                 |
| --------------------------- | ------------------------------------------------------ |
| LCP                         | < 2.5 s on 4G mobile (Lighthouse simulated throttling) |
| CLS                         | < 0.1                                                  |
| INP                         | < 200 ms                                               |
| FCP                         | < 1.8 s                                                |
| Home page total weight      | < 1.5 MB transferred                                   |
| Hero image (mobile srcset)  | < 200 KB WebP                                          |
| Hero image (desktop srcset) | < 600 KB WebP                                          |

| Requirement                    | Detail                                                       |
| ------------------------------ | ------------------------------------------------------------ |
| Explicit image dimensions      | `width` + `height` on every `<img>` — prevents CLS           |
| Hero image loading             | `loading="eager"` + `fetchpriority="high"`                   |
| Below-fold images              | `loading="lazy"`                                             |
| Code splitting                 | Route-level dynamic imports (already in CRM, add to website) |
| Font loading                   | Preload Playfair Display + Inter; `font-display: swap`       |
| No uncompressed autoplay video | If video hero added: < 5 MB, compressed MP4 + WebM           |
| Tree shaking                   | Vite already does this — do not import entire icon libraries |

---

## 31. Database Changes Needed

### Phase 10B

No schema changes required. Phase 10B reads `business_settings` (already exists) and adds a CRM admin UI for it.

### Phase 10C

No schema changes — phase reads existing `services`, `portfolio_projects`, `portfolio_images`, `testimonials`. Seed data added via SQL migration.

### Phase 10D (document here for awareness)

```sql
-- focal point columns for art-direction cropping
alter table portfolio_images add column focal_x numeric check (focal_x between 0 and 1);
alter table portfolio_images add column focal_y numeric check (focal_y between 0 and 1);
alter table services         add column focal_x numeric check (focal_x between 0 and 1);
alter table services         add column focal_y numeric check (focal_y between 0 and 1);

-- page sections CMS table (new)
create table page_sections ( … );

-- navigation management table (new)
create table nav_items ( … );

-- media library metadata (new or extend portfolio_images)
alter table portfolio_images add column approval_status text not null default 'draft';

-- collections table (new — for catalogue phase)
create table collections ( … );
```

---

## 32. Storage Changes Needed

### Phase 10B

- No new buckets required.
- Admin uploads logo, favicon, OG image to `public-content` bucket via CRM branding UI — this bucket and its RLS policies already exist.

### Phase 10C

- Admin uploads Tier-A project and expertise images to `public-content` bucket before seeding.
- No new bucket policies required.

### Phase 10D

- Optional: add an image variants bucket or use a Cloudflare Image Resizing / transformation service.
- Optional: `import-staging` bucket with short retention for CSV/XLSX import (architecture-data-security.md already mentions this).

---

## 33. Security / RLS Implications

| Concern                             | Current state                                                                                                      | 10B/10C action required                                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anonymous read of published content | `services_public_read` and `portfolio_public_read` policies enforce `status = 'published' and archived_at is null` | Preserve exactly — no change                                                                                                                          |
| Draft content leak                  | RLS ensures draft rows are invisible to anonymous users                                                            | 10C seed migration must set `status = 'published'` only for approved content                                                                          |
| `business_settings` exposure        | `business_settings_staff_read` requires active staff                                                               | 10B must add a narrow anon-readable view for the public website (only `business_name`, `tagline`, `logo_path` — no GSTIN, legal name, phone, address) |
| Logo + OG image URLs                | Stored in `public-content` bucket (public read)                                                                    | Fine — these are intentionally public                                                                                                                 |
| Private PPT contact data            | In local file system only — not in database or build                                                               | Keep it that way; audit 10C build output for any leakage                                                                                              |
| Service-role key                    | Not in any frontend code — confirmed in `.env.example`                                                             | Maintain; never add to Vite builds                                                                                                                    |
| Lead upload paths                   | `pending/{uploadSessionId}/{filename}` in `lead-uploads` (private)                                                 | RPC `submit_public_lead` manages paths server-side — do not change                                                                                    |
| CRM routes                          | Protected by `ProtectedRoute` component + Supabase Auth                                                            | No change in 10B/10C                                                                                                                                  |

**Recommended addition for 10B:**

```sql
-- Narrow public view of business_settings (Phase 10B migration)
create view public_brand_settings as
  select business_name, logo_path
  from   business_settings
  limit  1;

grant select on public_brand_settings to anon;
```

Then add a `business_tagline text` column to `business_settings` and include it in the view.

---

## 34. Phase 10B Acceptance Criteria

### AC-10B-01 Design tokens — CSS custom properties

All design tokens defined in `apps/website/src/index.css` as CSS custom properties. Tokens cover: all color roles (--color-surface, --color-surface-alt, --color-surface-dark, --color-text, --color-text-muted, --color-text-on-dark, --color-accent, --color-accent-hover, --color-border, --color-destructive); typography scale (--text-display-xl through --text-label-upper with clamp values); spacing scale (--space-xs through --space-5xl, 4-px base); motion (--duration-fast=150ms, --duration-ui=200ms, --duration-reveal=450ms, --ease-out); border radius (--radius-img=4px, --radius-ui=6px).

### AC-10B-02 Tailwind config consumes new tokens

`apps/website/tailwind.config.ts` updated to reference all new CSS custom properties. `brand-stone` token added. No existing utility class removed or renamed. `pnpm --filter website build` passes.

### AC-10B-03 Logo in header and footer

`SiteHeader` renders `<img src={logoUrl} alt="Studio Pranavi" …>` when `VITE_LOGO_URL` is set. On charcoal backgrounds it uses `VITE_LOGO_LIGHT_URL` (white/reversed variant). Falls back gracefully to "Studio Pranavi" text when either env var is unset. No broken `<img>` element at any viewport or env configuration. Logo is visually proportioned — no stretching.

### AC-10B-04 Skip navigation link

`<a href="#main-content">Skip to content</a>` is the first focusable element in `RootLayout`. Visually hidden until focused. On focus: visible amber-outlined box appears. `<main id="main-content">` present on every page. Verified by keyboard navigation (Tab → Enter).

### AC-10B-05 Reduced-motion tokens

All CSS transitions and Framer Motion animations conditionally inactive when `prefers-reduced-motion: reduce` is active. Verified in Chrome DevTools → Rendering → "prefers-reduced-motion: reduce": all hover and scroll animations are instant.

### AC-10B-06 Website branding admin in CRM

CRM route `/admin/website-branding` (admin-only, protected by `requiredRoles={['admin']}`). Form fields: business name, tagline (new `business_tagline text` column in `business_settings`), main logo URL, light logo URL, favicon URL, OG image URL, primary/secondary/accent color (hex, validated). On submit: `update business_settings set … where id = <id>`. RLS: admin write confirmed; active staff read confirmed; anonymous cannot read raw `business_settings` row (use `public_brand_settings` view for website). `pnpm --filter crm build` passes.

### AC-10B-07 Public brand settings view + migration

Migration `20261108000019_brand_settings_public.sql` adds: `business_tagline text` column to `business_settings`; `public_brand_settings` view exposing only `business_name`, `business_tagline`, `logo_path`; `grant select on public_brand_settings to anon`. Website reads from this view. Anonymous user cannot query `business_settings` table directly.

### AC-10B-08 OG image and favicon slots

`apps/website/index.html` contains `<link rel="icon" href="/favicon.ico">`, `<meta property="og:image" content="…">`, `<meta property="og:title">`, `<meta property="og:description">`. Actual OG image is a placeholder warm-stone 1200×630 PNG committed to `apps/website/public/`. Favicon is a placeholder 32×32 ICO derived from the logo monogram.

### AC-10B-09 CRM unchanged

No CRM page, route, component, style or behavior changed in Phase 10B other than the new `/admin/website-branding` page and the new navigation entry for it. CRM admin logs in → dashboard, leads, customers, quotes all function without console errors.

### AC-10B-10 Builds pass, no type errors

`pnpm --filter website build` exits 0. `pnpm --filter website typecheck` exits 0. `pnpm --filter crm build` exits 0. `pnpm --filter crm typecheck` exits 0.

---

## 35. Phase 10C Acceptance Criteria

### AC-10C-01 Route structure and redirects

All routes in §8 exist in `apps/website/src/router.tsx`. Redirects from `/portfolio`, `/portfolio/:slug`, `/services`, `/services/:slug`, `/about`, `/get-a-quote` are active using `<Navigate replace>`. `grep -r '/portfolio\|/services\|/about\b\|/get-a-quote' apps/website/src` returns zero results outside `router.tsx`.

### AC-10C-02 Logo rendered, no broken image

Logo renders in `SiteHeader` and `SiteFooter` at all viewports. Light variant on dark backgrounds. Warm-stone text fallback when env var unset. Zero broken `<img>` elements on any page.

### AC-10C-03 Homepage — all 9 required sections (§9)

All 9 sections exist in order. Cinematic hero uses a Tier-A approved photograph or warm-stone placeholder — never solid charcoal with `[BRAND TAGLINE]` text. Testimonials section absent (no approved testimonials). Section 9 (final CTA) uses charcoal background.

### AC-10C-04 No placeholder text in build output

`grep -r '\[BRAND TAGLINE\]\|\[Update this\]\|\[Replace\]\|\[Add a\]\|\[Paragraph one\]\|\[Client' apps/website/dist/` returns zero results.

### AC-10C-05 No private contact data in build output

`grep -rE '(98208|79721|tajhotels|hiranandani|pawar\.amol|ashutosh\.kumar|Ajay Kumar|Anmol)' apps/website/dist/` returns zero results.

### AC-10C-06 Projects page — editorial grid and filters

`/projects` uses editorial grid layout (not uniform card grid). Category filter tabs: All · Hospitality · Residential · Commercial · Decorative Lighting · Custom Glass. Each project card: cover image, name (Playfair Display), category label (uppercase small). Warm-stone placeholder for null `cover_image_path`.

### AC-10C-07 Project story page — editorial template (§11)

`/projects/:slug`: full-bleed hero, meta row (category + city label + year), project brief, at least one narrative section (description), image gallery (sort_order honoured), related/next project, Start-a-Project CTA. Single-column at mobile.

### AC-10C-08 Expertise pages

`/expertise` listing and `/expertise/:slug` detail implemented and data-driven from `services` table. Start-a-Project CTA preserves `?service=id` pre-fill. Redirects from `/services` paths in place.

### AC-10C-09 Studio sub-pages — all 4 exist

`/studio/about`, `/studio/craftsmanship`, `/studio/materials`, `/studio/process` all return 200 and render content (may be approved draft copy, clearly marked as such in CMS, never published as invented facts).

### AC-10C-10 Start a Project — quote form preserved

`/start-a-project` renders identical 3-step form logic. `submit_public_lead` RPC call unchanged. File upload to `lead-uploads` unchanged. Budget paise values unchanged. Honeypot field present. Consent checkbox present. Redirect from `/get-a-quote` in place. `?service=id` pre-fill works.

### AC-10C-11 Navigation correct at all viewports

Desktop: logo + Projects · Expertise · Studio · Catalogue · Contact + "Start a Project" CTA button. Mobile: hamburger with all items + CTA. Footer: 4-column structure (§8). All footer links resolve to valid non-404 routes.

### AC-10C-12 Accessibility baseline passes

All pages: one `<h1>`, landmark elements, non-empty `alt` on images, labels on all inputs, amber focus ring visible, skip-navigation functional. `pnpm dlx axe-cli` against Home, /projects, /projects/:slug (one seeded project), /expertise, /start-a-project: **zero WCAG AA critical violations**.

### AC-10C-13 Responsive — 4 viewports

All pages at 360 px, 390 px, 768 px, 1440 px: no horizontal scroll, no overlapping elements, no text overflow, hero fills viewport width.

### AC-10C-14 Reduced motion

Chrome DevTools → prefers-reduced-motion: reduce → scroll reveals instant, hero ambient scale inactive, route transitions instant.

### AC-10C-15 CRM unchanged

`pnpm --filter crm build` exits 0. CRM admin navigates to dashboard, leads list, lead detail, quote list — no visual regression, no console errors.

### AC-10C-16 Builds and typechecks pass

`pnpm --filter website build` exits 0. `pnpm --filter website typecheck` exits 0. `pnpm --filter crm build` exits 0.

### AC-10C-17 Collections and Catalogue stubs

`/collections` and `/catalogue` exist and return 200. Collections redirects to home or shows "coming soon." Catalogue shows placeholder with quote CTA. Neither route throws an error.

### AC-10C-18 No invented content

`grep -rE '(Placeholder Client|Lorem ipsum|Coming soon.*testimonial|Fake.*project|Award|Certification|Client said)' apps/website/src` returns zero results. All project names, descriptions and statistics come from approved source-material content only.

---

## Phase 10A Completion Notes

**Files changed:** `studio-pranavi-platform/references/phase-10A-assessment.md` only.
No product code modified.

**Tests run:** None (assessment and planning phase — no code to test).

**Security notes:**

- `Prestigious Projects.pptx` personal contact data confirmed via text extraction — file sits only in `brand-source/projects/` and must never be added to git history with public access or referenced in any web build.
- 90 UUID photos confirmed as workshop documentation — not publication-ready; do not upload to `public-content` bucket.
- Phone-watermarked images in PPTs identified — must be cleaned before Tier-B use.
- `business_settings` table currently has no anon-readable path for logo/tagline — Phase 10B must add the `public_brand_settings` view before the website can read branding dynamically.

**Manual configuration still required before 10B:**

- ~~Brand spelling~~ — **Resolved: Studio Pranavi** (logo wordmark uses "PRANVI" as stylized abbreviation)
- ~~Tagline~~ — **Resolved: "We design the essence of light" approved**
- Primary logo: `brand-source/logos/brand image.png` — confirmed
- Owner to supply or commission white/reversed logo variant (for dark header/footer backgrounds)
- Owner to supply or commission SVG version of logo for scalability and favicon derivation
- Owner to confirm which Tier-A PPT images are Studio Pranavi's own work

**Manual configuration still required before 10C:**

- Owner to author About / craftsmanship / materials copy
- Owner to approve which project names may be published
- Owner to approve any statistics before they appear publicly
- Professional photography of finished installations recommended before launch
