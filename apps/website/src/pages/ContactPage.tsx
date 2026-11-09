import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label } from '@platform/ui';
import { Phone, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';
import { PageMeta } from '@/components/ui/page-meta';
import { supabase } from '@/lib/supabase';

const contactSchema = z
  .object({
    name: z.string().min(2, 'Please enter your name').max(200),
    email: z.string().email('Please enter a valid email').max(320).optional().or(z.literal('')),
    phone: z.string().max(30).optional().or(z.literal('')),
    message: z.string().max(5000).optional().or(z.literal('')),
  })
  .refine((d) => d.email || d.phone, {
    message: 'Please provide at least an email or phone number',
    path: ['email'],
  });

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const phone = import.meta.env.VITE_CONTACT_PHONE;
  const email = import.meta.env.VITE_CONTACT_EMAIL;
  const whatsapp = import.meta.env.VITE_CONTACT_WHATSAPP;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(data: ContactFormData) {
    setServerError(null);
    try {
      const { error } = await supabase.rpc('submit_contact_inquiry', {
        p_name: data.name,
        p_email: data.email || undefined,
        p_phone: data.phone || undefined,
        p_message: data.message || undefined,
      });
      if (error) {
        setServerError(error.message || 'Something went wrong. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError('Something went wrong. Please try again.');
    }
  }

  return (
    <>
      <PageMeta
        title="Contact Us"
        description="Get in touch with us for enquiries, consultations, or to discuss your project."
        path="/contact"
      />

      {/* Header */}
      <section className="bg-brand-charcoal py-16 text-brand-ivory">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-semibold">Contact Us</h1>
          <p className="mt-4 max-w-2xl text-brand-ivory/70">
            Have a question or want to discuss a project? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="bg-brand-ivory py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Contact info */}
            <div>
              <h2 className="font-display text-xl font-semibold">Get in Touch</h2>
              <p className="mt-3 text-muted-foreground">
                Reach out through any of the channels below, or fill in the form and we&apos;ll
                respond within one business day.
              </p>

              <ul className="mt-6 space-y-4">
                {phone && (
                  <li className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-amber/10 text-brand-amber flex-shrink-0">
                      <Phone className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <a href={`tel:${phone}`} className="text-sm font-medium hover:text-primary">
                        {phone}
                      </a>
                    </div>
                  </li>
                )}
                {whatsapp && (
                  <li className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-amber/10 text-brand-amber flex-shrink-0">
                      <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">WhatsApp</p>
                      <a
                        href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:text-primary"
                      >
                        {whatsapp}
                      </a>
                    </div>
                  </li>
                )}
                {email && (
                  <li className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-amber/10 text-brand-amber flex-shrink-0">
                      <Mail className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${email}`}
                        className="text-sm font-medium hover:text-primary"
                      >
                        {email}
                      </a>
                    </div>
                  </li>
                )}
              </ul>

              <div className="mt-8 rounded-xl border border-border bg-card p-5">
                <p className="text-sm font-medium">Looking for a quote?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use our quote request form for a more detailed conversation about your project.
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/get-a-quote">Request a Quote</Link>
                </Button>
              </div>
            </div>

            {/* Contact form */}
            <div>
              {submitted ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-10 text-center h-full">
                  <CheckCircle2 className="h-12 w-12 text-brand-amber" aria-hidden="true" />
                  <h2 className="font-display text-xl font-semibold">Message Received!</h2>
                  <p className="text-muted-foreground">
                    Thank you for reaching out. We&apos;ll get back to you within one business day.
                  </p>
                  <Button asChild variant="outline" className="mt-2">
                    <Link to="/">Back to Home</Link>
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                  className="rounded-xl border border-border bg-card p-6 space-y-5"
                >
                  <h2 className="font-display text-lg font-semibold">Send us a message</h2>

                  <div className="space-y-1.5">
                    <Label htmlFor="name">
                      Your Name{' '}
                      <span className="text-destructive" aria-hidden="true">
                        *
                      </span>
                    </Label>
                    <Input
                      id="name"
                      autoComplete="name"
                      placeholder="Your full name"
                      aria-describedby={errors.name ? 'name-error' : undefined}
                      {...register('name')}
                    />
                    {errors.name && (
                      <p id="name-error" role="alert" className="text-xs text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        {...register('email')}
                      />
                      {errors.email && (
                        <p id="email-error" role="alert" className="text-xs text-destructive">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+91 98765 43210"
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                        {...register('phone')}
                      />
                      {errors.phone && (
                        <p id="phone-error" role="alert" className="text-xs text-destructive">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground -mt-2">
                    Please provide at least an email or phone number.
                  </p>

                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message</Label>
                    <textarea
                      id="message"
                      rows={4}
                      placeholder="Tell us how we can help…"
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...register('message')}
                    />
                    {errors.message && (
                      <p role="alert" className="text-xs text-destructive">
                        {errors.message.message}
                      </p>
                    )}
                  </div>

                  {serverError && (
                    <div
                      role="alert"
                      className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                    >
                      {serverError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-amber text-white hover:bg-brand-brass"
                  >
                    {isSubmitting ? 'Sending…' : 'Send Message'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
