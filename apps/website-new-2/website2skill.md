# Claude Skill — Build a Brand Website (Studio Pranavi Pattern)

Use this skill when building a new marketing/brand website inside this monorepo that follows the Studio Pranavi (`website-new-2`) pattern.

---

## Stack

- **React 18 + Vite 5 + TypeScript** — `apps/<name>/`
- **Tailwind CSS 3** — utility classes + custom `@layer components`
- **React Router v6** — `createBrowserRouter`, lazy pages with Suspense
- **TanStack Query** — for any async data
- **react-hook-form + zod** — for forms
- **Supabase** — `submit_public_lead` RPC for enquiry forms

---

## Monorepo Setup

### 1. Create the package

```
apps/<name>/
  package.json          name: @platform/<name>, dev port: 517X
  vite.config.ts        base: '/', port matching package.json
  tsconfig.json         copy from website-new-2, update paths
  tailwind.config.ts    brand tokens below
  postcss.config.js     tailwindcss + autoprefixer
  index.html
  public/images/        all images go here
  src/
    main.tsx
    router.tsx
    index.css
    hooks/
      useScrollReveal.ts
    components/layout/
      RootLayout.tsx
      SiteHeader.tsx
      SiteFooter.tsx
    components/ui/
      page-meta.tsx
    pages/
      HomePage.tsx
      ProductsPage.tsx
      AboutPage.tsx
      EnquiryPage.tsx
      ContactPage.tsx
      PartnersPage.tsx
      CareerPage.tsx
      ShowroomPage.tsx
      PrivacyPage.tsx
      NotFoundPage.tsx
```

Add scripts to root `package.json`:
```json
"dev:<name>": "pnpm --filter @platform/<name> dev",
"build:<name>": "pnpm --filter @platform/<name> build"
```

---

## Brand Tokens (tailwind.config.ts)

```ts
colors: {
  brand: {
    bg:     '#ffffff',
    bgalt:  '#f7f7f7',
    text:   '#231F20',
    muted:  '#888888',
    dim:    '#aaaaaa',
    border: '#e3e3e3',
  }
},
fontFamily: {
  sans:    ['DM Sans', 'sans-serif'],
  display: ['Cormorant Garamond', 'Georgia', 'serif'],
},
```

---

## index.css — Global Styles

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body { background-color: #ffffff; color: #231F20; }
}

@layer components {
  .sp-container { max-width: 1440px; margin: 0 auto; padding: 0 4rem; }
  @media (max-width: 768px) { .sp-container { padding: 0 1.5rem; } }
  .sp-section   { padding: clamp(5rem,10vw,10rem) 0; }

  .title-1 { font-family: Cormorant Garamond; font-weight:300; font-size: clamp(3rem,6vw,6rem); line-height:1.05; letter-spacing:-0.02em; }
  .title-2 { font-family: Cormorant Garamond; font-weight:300; font-size: clamp(2rem,4vw,3.5rem); line-height:1.1; }
  .title-3 { font-family: Cormorant Garamond; font-weight:300; font-size: clamp(1.1rem,2vw,1.5rem); line-height:1.4; }
  .title-4 { font-family: DM Sans; font-weight:400; font-size:0.6875rem; letter-spacing:0.12em; text-transform:uppercase; color:#888; }

  .btn-black        { display:inline-block; background:#231F20; color:#fff; padding:12px 32px; border-radius:2px; font-family:'DM Sans'; font-size:0.8125rem; letter-spacing:0.08em; text-transform:uppercase; text-decoration:none; transition:all 0.2s; }
  .btn-black:hover  { background:#fff; color:#231F20; box-shadow:inset 0 0 0 1px #231F20; }
  .btn-outline      { display:inline-block; background:transparent; color:#231F20; padding:12px 32px; border-radius:2px; font-family:'DM Sans'; font-size:0.8125rem; letter-spacing:0.08em; text-transform:uppercase; text-decoration:none; box-shadow:inset 0 0 0 1px #231F20; transition:all 0.2s; }
  .btn-outline:hover { background:#231F20; color:#fff; }
  .btn-outline-white { display:inline-block; background:transparent; color:#fff; padding:12px 32px; border-radius:2px; font-family:'DM Sans'; font-size:0.8125rem; letter-spacing:0.08em; text-transform:uppercase; text-decoration:none; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.6); transition:all 0.2s; }

  .link-dotted { border-bottom: 1px solid currentColor; }

  /* Scroll reveal */
  .reveal { opacity:0; transform:translateY(40px); transition:opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1); }
  .reveal.is-visible { opacity:1; transform:none; }
  .reveal-delay-1 { transition-delay:0.1s; }
  .reveal-delay-2 { transition-delay:0.2s; }
  .reveal-delay-3 { transition-delay:0.3s; }
  .reveal-delay-4 { transition-delay:0.4s; }

  /* Horizontal scroll strip */
  .h-scroll { display:flex; overflow-x:auto; scrollbar-width:none; gap:1rem; }
  .h-scroll::-webkit-scrollbar { display:none; }
}
```

---

## useScrollReveal Hook

```ts
// src/hooks/useScrollReveal.ts
import { useEffect } from 'react';

export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
```

**Important:** When elements re-render due to filter/state changes (e.g. product category tabs), add this to the page component to re-reveal them:

```ts
useEffect(() => {
  const timer = setTimeout(() => {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
      el.classList.add('is-visible');
    });
  }, 40);
  return () => clearTimeout(timer);
}, [activeCategoryOrStateVar]);
```

---

## Navigation — Frosted Glass Pill

```tsx
// SiteHeader.tsx — pill nav styles
background: 'rgba(220,218,214,0.65)'
backdropFilter: 'blur(12px)'
borderRadius: '999px'
padding: '6px'

// Active item pill
background: 'rgba(190,188,184,0.85)'
borderRadius: '999px'
padding: '8px 20px'

// Dropdown card
background: 'rgba(200,198,194,0.82)'
backdropFilter: 'blur(12px)'
borderRadius: '16px'
```

- Logo goes LEFT, pill nav goes RIGHT
- "Get a Quote" dark pill button inside the nav on the far right
- Mobile: hamburger with 3 bars → animated X on open → flat vertical nav

---

## Enquiry Form — CRM Integration

```ts
// EnquiryPage.tsx — Supabase RPC call
await supabase.rpc('submit_public_lead', {
  p_source: 'website3_enquiry_form',   // MUST match this value for website-new-2
  p_name: data.name,
  p_email: data.email,
  // ...other fields
});
```

File uploads go to the `lead-uploads` Supabase bucket under `pending/{uploadSessionId}/`.

Each new website should use a unique `p_source` so leads are routed correctly in the CRM.

---

## Page Template Pattern

```tsx
export function SomePage() {
  useScrollReveal();
  return (
    <>
      <PageMeta title="Page Title" description="..." path="/path" />

      {/* Page header */}
      <section className="border-b border-brand-border py-20 lg:py-32 bg-white">
        <div className="sp-container">
          <p className="title-4">Section Label</p>
          <h1 className="title-1 mt-6 reveal">Main Heading</h1>
        </div>
      </section>

      {/* Content section */}
      <section className="sp-section bg-white">
        <div className="sp-container">
          {/* content */}
        </div>
      </section>

      {/* Alt-bg section */}
      <section className="sp-section border-t border-brand-border" style={{ background: '#f7f7f7' }}>
        <div className="sp-container">
          {/* content */}
        </div>
      </section>
    </>
  );
}
```

---

## Editable Data Pattern

Keep all editable content (products, jobs, partners, news) in a plain array near the top of the page file:

```ts
const ITEMS = [
  { id: 'slug', name: 'Display Name', image: '/images/file.jpg', ... },
];
```

This makes content updates self-contained — no need to touch JSX.

---

## Images

- All images in `public/images/`
- Referenced as `src="/images/filename.jpg"` (absolute public path)
- No `onError` handlers needed when images are local — parent div background color acts as fallback
- Use `style={{ background: '#f0eeeb' }}` on image containers for graceful fallback
- Use `aspectRatio: '3/4'` for product portraits, `4/3` for landscape, `21/9` for hero banners

---

## Routing

```tsx
// router.tsx pattern
const SomePage = lazy(() => import('./pages/SomePage').then(m => ({ default: m.SomePage })));

// Wrap every lazy page:
function withSuspense(el) {
  return <Suspense fallback={<Spinner />}>{el}</Suspense>;
}

{ path: 'some-path', element: withSuspense(<SomePage />) }
```
