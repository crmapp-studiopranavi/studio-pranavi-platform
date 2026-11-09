# Studio Pranavi Frontend Design Blueprint

## Design intent

The public website should feel like an architectural design studio and premium project portfolio, not a generic startup template or ecommerce marketplace.

### Visual language

- Editorial, restrained and image-led
- Strong full-bleed project photography
- Warm neutral base with charcoal, ivory, muted stone, antique brass and an optional deep architectural blue/teal accent derived from approved brand material
- Elegant display typography paired with a readable modern sans serif
- Generous whitespace and deliberate asymmetry
- Subtle motion that never competes with project imagery
- Detailed mobile layouts, not compressed desktop screens

### Avoid

- Generic neon gradients
- Excessive glassmorphism
- Autoplay audio
- Heavy parallax that harms performance
- Stock images presented as Studio Pranavi work
- Unverified statistics and testimonials
- Long uncompressed videos
- Arbitrary CSS/JavaScript from CMS users

## Information architecture

```text
Home
Projects
  Residential
  Hospitality
  Commercial
  Decorative Lighting
  Custom Glass
Expertise
  Bespoke Lighting
  Architectural Lighting
  Decorative Lighting
  Custom Glass
  Installation
Collections (only if supported by catalogue)
Studio
  About
  Craftsmanship
  Materials
  Process
Catalogue
Contact
Start a Project
```

Refine labels from approved catalogue vocabulary.

## Homepage composition

1. Cinematic hero with approved project photo or compressed muted video
2. Studio Pranavi positioning and two actions: Explore Projects, Start a Project
3. Selected projects using large editorial imagery
4. Expertise categories
5. Featured collections/products when source material supports them
6. Concept-to-installation process
7. Craftsmanship/material detail
8. Project story or short film
9. Approved testimonial or trust section
10. Final project enquiry call to action

## Project detail template

- Full-bleed hero
- Project name, category and location label without private address
- Project brief
- Design intent
- Craft / material / technical development
- Drawing or process media when approved
- Installation story
- Large finished imagery
- Project facts
- Related or next project
- Start-a-project CTA

Project pages should tell a story, not show an unlabelled image dump.

## Media handling

Images:

- Preserve approved originals privately
- Generate responsive WebP/AVIF derivatives when supported
- Store explicit width/height
- Use focal point and art direction
- Require meaningful alt text
- Lazy-load below the fold
- Do not publish contact-bearing screenshots

Videos:

- Prefer YouTube/Vimeo for long films
- Permit compressed MP4/WebM for short muted loops
- Require poster and mobile fallback
- Respect reduced motion
- Do not autoplay with sound
- Provide title/caption/transcript fields

## CMS section types

- Hero
- Selected projects
- Services / expertise grid
- Product or collection grid
- Image gallery
- Video
- Text + image
- Process timeline
- Before / after
- Materials / craftsmanship
- Testimonials
- FAQ
- CTA
- Contact / map

Each supports relevant title, copy, media, alignment, theme, CTA, visibility, ordering, draft/published state and optional schedule. Use a controlled schema, not free HTML.

## Branding administration

Website branding:

- Business name and tagline
- Main / light / dark / mobile logos
- Favicon and social image
- Primary, secondary and accent colors
- Page/surface/text colors
- Approved heading/body font choices
- Button and radius tokens
- Default hero and placeholder media

CRM appearance remains separate and limited to logo, accent, light/dark mode, sidebar and table density.

## Motion

Use CSS/Framer Motion only when already appropriate to the stack:

- 180–450 ms UI and section transitions
- reveal-on-scroll with reduced-motion fallback
- subtle image mask/scale effects
- no scroll hijacking
- no animation that blocks reading or input
- target smooth interaction on mid-range mobile devices

## Accessibility and performance

- WCAG 2.2 AA intent
- Keyboard navigation and visible focus
- Semantic headings and landmarks
- Status never communicated by color alone
- Responsive images and route splitting
- Avoid cumulative layout shift
- Test 360, 390, 768 and 1440 px viewports
- Set realistic Lighthouse budgets and report actual results rather than guaranteeing scores
