import { PageMeta } from '@/components/ui/page-meta';

export function PrivacyPage() {
  return (
    <>
      <PageMeta title="Privacy Policy" description="Privacy Policy for Studio Pranavi." path="/privacy" />

      <section className="border-b border-brand-border py-20 lg:py-32 bg-white">
        <div className="sp-container">
          <p className="title-4">Legal</p>
          <h1 className="title-1 mt-6">Privacy Policy</h1>
        </div>
      </section>

      <section className="sp-section bg-white">
        <div className="sp-container max-w-3xl space-y-10 text-sm leading-relaxed text-brand-muted">
          {[
            { heading: 'Information We Collect', body: 'When you submit an enquiry through this website, we collect the personal information you provide: name, email address, phone number, WhatsApp number, project description, and any files you upload.' },
            { heading: 'How We Use Your Information', body: 'We use your information solely to respond to your enquiry, prepare a project quote, and follow up on the progress of your project. We do not sell, share, or disclose your personal information to third parties, except as required to deliver our services.' },
            { heading: 'Data Storage', body: 'Your information is stored securely using Supabase, a cloud database platform. We retain enquiry data for up to three years from the date of submission.' },
            { heading: 'Your Rights', body: 'You may request access to, correction of, or deletion of your personal data at any time by contacting us at studio@pranavi.in. We will respond within 30 days.' },
            { heading: 'Cookies', body: 'This website does not use tracking cookies. We may use session cookies to maintain your form state during an active session; these are not used for analytics or advertising.' },
            { heading: 'Contact', body: 'For privacy-related enquiries, write to us at studio@pranavi.in.' },
          ].map((section) => (
            <div key={section.heading}>
              <h2 className="title-3 text-brand-text">{section.heading}</h2>
              <p className="mt-4">{section.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
