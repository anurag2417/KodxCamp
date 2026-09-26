import { renderLayout } from './layout.js';

/**
 * Generic notification email.
 *
 * One template serves every in-app notification type. Notifications
 * differ in their *content*, not their *shape* — a title, a body,
 * an optional call to action. Building a per-type template would
 * mean maintaining N nearly-identical HTML blocks; that's the wrong
 * trade.
 *
 * The alternative — the client rendering the email — isn't viable,
 * because email needs its own HTML with inline styles and email-safe
 * structure. So the template lives here, and the caller passes the
 * already-final title and body (the same strings the in-app
 * notification uses).
 */
export interface NotificationEmailData {
  title: string;
  body: string;
  /**
   * Optional deep link. When present, a CTA button appears at the
   * bottom of the email. When absent, no button — a notification
   * without a destination (e.g. a pure FYI) doesn't need a
   * decorative CTA.
   */
  link?: string;
  /**
   * Optional label for the CTA button. Defaults to "Open KodxCamp".
   */
  ctaLabel?: string;
}

export function renderNotification(data: NotificationEmailData): {
  subject: string;
  html: string;
} {
  const bodyHtml = escapeHtml(data.body).replace(/\n/g, '<br />');

  const ctaBlock = data.link
    ? `
    <div style="margin:28px 0 0;text-align:center;">
      <a href="${data.link}"
         style="display:inline-block;padding:12px 24px;background:#1e3a8a;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;border-radius:8px;">
        ${escapeHtml(data.ctaLabel ?? 'Open KodxCamp')}
      </a>
    </div>
  `
    : '';

  const body = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155;">
      ${bodyHtml}
    </p>
    ${ctaBlock}
  `;

  return {
    subject: `[KodxCamp] ${data.title}`,
    html: renderLayout({
      preheader: data.title,
      title: data.title,
      body,
    }),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}