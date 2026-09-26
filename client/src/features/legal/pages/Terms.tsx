import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Seo } from '@/shared/components/seo/Seo';

/**
 * Terms of Service.
 *
 * Placeholder copy. Edit the prose to match your actual terms before
 * launch — the structure below is deliberately simple so it's easy to
 * replace. Last-updated date is set at build time via the constant
 * below so it's obvious when the page was last touched.
 */
const LAST_UPDATED = '2026-01-01';

export const Terms: React.FC = () => (
  <>
    <Seo
      title="Terms of Service"
      description="The rules for using KodxCamp."
    />
    <div className="mx-auto w-full max-w-3xl px-6 py-12 lg:px-10 lg:py-16">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-brand-500"
      >
        <ArrowLeft size={14} /> Back to home
      </Link>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="prose prose-sm mt-8 max-w-none space-y-6 text-sm leading-relaxed text-text-secondary">
        <section>
          <h2 className="text-lg font-semibold text-text-primary">
            1. Using KodxCamp
          </h2>
          <p className="mt-2">
            KodxCamp is a browser-based platform for learning programming.
            You may use the public surfaces (roadmaps, courses, practice
            problems, the compiler) without an account. Creating an account
            lets you save your work, submit problems and projects, and
            enroll in courses.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary">
            2. Your account
          </h2>
          <p className="mt-2">
            You are responsible for the activity on your account and for
            keeping your credentials secure. Do not share your account with
            others. If you believe your account has been compromised,
            contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary">
            3. Your code and submissions
          </h2>
          <p className="mt-2">
            You own the code you write on KodxCamp. By submitting
            solutions, projects, or challenge answers, you grant KodxCamp a
            limited license to store, display, and evaluate that content for
            the purpose of operating the platform — including for AI-assisted
            feedback and instructor review.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary">
            4. Acceptable use
          </h2>
          <p className="mt-2">Do not:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Attempt to access other users' accounts or data.</li>
            <li>Upload malware, illegal content, or content you don't have the right to share.</li>
            <li>Use the platform to harass other users.</li>
            <li>Attempt to bypass rate limits, security controls, or payment flows.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary">
            5. Paid courses
          </h2>
          <p className="mt-2">
            Some courses are paid. Payments are processed by Razorpay.
            Enrollment is granted once payment is verified. Refunds are
            handled case by case — contact support.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary">
            6. Changes to these terms
          </h2>
          <p className="mt-2">
            We may update these terms from time to time. The date above is
            when this page was last changed. Continued use of KodxCamp after
            an update means you accept the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-text-primary">
            7. Contact
          </h2>
          <p className="mt-2">
            For questions about these terms, contact us at{' '}
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