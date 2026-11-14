import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/page-meta';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export function ContactPage() {
  useScrollReveal();
  return (
    <>
      <PageMeta
        title="Contact"
        description="Get in touch with Studio Pranvi to discuss your bespoke glass and lighting project."
        path="/contact"
      />

      <section className="border-b border-brand-border py-20 lg:py-32 bg-white">
        <div className="sp-container">
          <p className="title-4">Get in Touch</p>
          <h1 className="title-1 mt-6 reveal">Contact</h1>
        </div>
      </section>

      <section className="sp-section bg-white">
        <div className="sp-container">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
            <div className="reveal">
              <h2 className="title-2">Showroom &amp; Studio</h2>
              <div className="mt-10 space-y-8">
                {[
                  { label: 'Address', value: 'Muradabad, Please contact us to schedule a studio visit By appointment only.' },
                  { label: 'Email', value: 'sales@studiopranvi.com' },
                  { label: 'Phone / WhatsApp', value: '+919821325865' },
                  { label: 'Hours', value: 'Monday – Saturday, 10 AM – 7 PM IST' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="title-4">{item.label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-brand-muted">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal reveal-delay-2">
              <h2 className="title-2">Start a project</h2>
              <p className="title-3 mt-6 leading-relaxed text-brand-muted">
                For project enquiries, commissions, or any questions about our work, please use our
                enquiry form. We respond within one business day.
              </p>
              <Link to="/enquiry" className="btn-black mt-10">Submit an Enquiry</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
