import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Seo } from '@/shared/components/seo/Seo';

/**
 * Privacy Policy.
 *
 * Placeholder copy. Edit the prose to match your actual practices
 * before launch. The outline below covers the categories a typical
 * learning platform needs to disclose: what we collect, why, who we
 * share it with, and how to request deletion.
 */
const LAST_UPDATED = '2026-01-01';

export const Privacy: React.FC = () => (
  <>
    <Seo
      title="Privacy Policy"
      description="How KodxCamp handles your data."
    />
    <div className="mx-auto w-full max-w-3xl px-6 py-12 lg:px-10 lg:py-16">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={14} /> Back to home
      </Link>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="prose prose-sm mt-8 max-w-none space-y-6 text-sm leading-relaxed text-text-secondary">
        <section>
          <h2 className="text-lg font-semibold text-text-primary">
            1. What we collect
          </h2>
          <p className="mt-2">
            When you create an account, we store your name, email address,
            and (if you sign in with Google) your Google account identifier.
            While you use the platform, we store your progress, submissions,
            drafts, and any media you upload.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary">
            2. Why we collect it
          </h2>
          <p className="mt-2">
            We use your data to operate the platform: to show your progress,
            record your submissions, evaluate your projects, and let
            instructors review your work. We do not sell your data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary">
            3. Who we share it with
          </h2>
          <p className="mt-2">
            We share data only with the services that make KodxCamp work:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>MongoDB Atlas</strong> — stores account and progress
              data.
            </li>
            <li>
              <strong>Cloudinary</strong> — stores uploaded media.
            </li>
            <li>
              <strong>Razorpay</strong> — processes payments.
            </li>
            <li>
              <strong>Groq</strong> — runs AI evaluation of project
              submissions. Submitted code and screenshots may be sent to
              Groq for evaluation.
            </li>
            <li>
              <strong>Firebase</strong> — verifies Google sign-in tokens.
            </li>
            <li>
              <strong>Umami</strong> — collects anonymised usage analytics.
              No personal data is sent.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary">
            4. Cookies
          </h2>
          <p className="mt-2">
            We use one cookie to keep you signed in. It is HTTP-only and
            cannot be read by client-side JavaScript. We do not use
            tracking or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary">
            5. Your rights
          </h2>
          <p className="mt-2">
            You can request a copy of your data, correct it, or ask us to
            delete your account at any time. Deleting your account removes
            your personal information; some anonymised records (such as
            aggregate submission counts) may be retained.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary">
            6. Contact
          </h2>
          <p className="mt-2">
            For privacy questions or data requests, contact us at{' '}
            <a
              href="mailto:hello@kodxcamp.dev"
              className="text-brand-500 hover:underline"
            >
              hello@kodxcamp.dev
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  </>
);