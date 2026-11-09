import { Link } from 'react-router-dom';
import { Button } from '@platform/ui';
import { PageMeta } from '@/components/ui/page-meta';

const VALUES = [
  {
    title: 'Craftsmanship',
    description:
      '[Describe your commitment to quality and the skilled artisanship that goes into every piece.]',
  },
  {
    title: 'Collaboration',
    description: '[Describe how you work closely with clients to bring their vision to life.]',
  },
  {
    title: 'Integrity',
    description:
      '[Describe your transparent pricing, honest timelines, and commitment to client satisfaction.]',
  },
];

export function AboutPage() {
  return (
    <>
      <PageMeta
        title="About Us"
        description="[Add a short description of your business story and values for SEO.]"
        path="/about"
      />

      {/* Hero */}
      <section className="bg-brand-charcoal py-20 text-brand-ivory">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl font-semibold sm:text-5xl">Our Story</h1>
            <p className="mt-6 text-lg text-brand-ivory/70">
              [Replace this with your business origin story — how you started, what drives you, and
              the passion behind your craft.]
            </p>
          </div>
        </div>
      </section>

      {/* Story section */}
      <section className="bg-brand-ivory py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="font-display text-2xl font-semibold">Who We Are</h2>
              <div className="mt-4 space-y-4 text-muted-foreground">
                <p>
                  [Paragraph one about your business background, experience, and what sets you
                  apart. Replace this placeholder with your actual story.]
                </p>
                <p>
                  [Paragraph two about your team, your workshops, or your approach to custom work.
                  Be specific and authentic — clients connect with genuine stories.]
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-muted h-72 flex items-center justify-center text-muted-foreground text-sm">
              [Add a photo of your workshop or team here]
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-2xl font-semibold">Our Values</h2>
            <p className="mt-3 text-muted-foreground">
              The principles that guide everything we do.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="rounded-xl border border-border bg-card p-6 text-center"
              >
                <h3 className="font-display text-lg font-semibold text-brand-amber">
                  {value.title}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team placeholder */}
      <section className="bg-brand-ivory py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-2xl font-semibold">Meet the Team</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              [Introduce your key team members — names, roles, and a brief description of their
              expertise. Team profiles build trust with prospective clients.]
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="mx-auto h-20 w-20 rounded-full bg-muted mb-4" />
                <p className="font-semibold">[Team Member Name]</p>
                <p className="mt-1 text-sm text-muted-foreground">[Role / Speciality]</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-amber py-14 text-white">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold">Ready to work together?</h2>
          <p className="mt-2 text-white/80">
            Let&apos;s start with a conversation about your project.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-white text-brand-amber hover:bg-white/90">
              <Link to="/get-a-quote">Get a Free Quote</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
