import { renderLayout } from './layout.js';

/**
 * Announcement email.
 *
 * Master Spec, section 43:
 *   "Announcements are messages from instructors to a target
 *    audience. Audiences are: all | roadmap | course | cohort |
 *    class."
 *
 * The template is audience-agnostic. It takes an `audienceLabel`
 * ("all students", "the JavaScript course", "the Full Stack 2026-A
 * cohort") rather than a `courseName`, because an announcement can
 * target any of the five audience kinds — not just a course.
 *
 * The CTA link is optional. A course or roadmap announcement has a
 * natural destination URL; a cohort or `all` announcement does not.
 * When `ctaUrl` is absent, the button is omitted rather than
 * pointing somewhere arbitrary.
 */
export interface AnnouncementData {
  /** The instructor who posted the announcement. */
  authorName: string;
  /**
   * Human-readable description of who the announcement is for.
   * Rendered inline: "posted an announcement for {audienceLabel}".
   */
  audienceLabel: string;
  /** The announcement headline. */
  title: string;
  /** The announcement body. Line breaks are preserved. */
  content: string;
  /** Optional destination URL for the CTA button. */
  ctaUrl?: string;
  /** Optional label for the CTA button. Defaults to "Open". */
  ctaLabel?: string;
}

export function renderAnnouncement(data: AnnouncementData): {
  subject: string;
  html: string;
} {
  const contentHtml = escapeHtml(data.content).replace(/\n/g, '<br />');

  const ctaBlock =
    data.ctaUrl
      ? `
    <div style="margin:24px 0;text-align:center;">
      <a href="${data.ctaUrl}"
         style="display:inline-block;padding:12px 24px;background:#1e3a8a;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;border-radius:8px;">
        ${escapeHtml(data.ctaLabel ?? 'Open')}
      </a>
    </div>
  `
      : '';

  const body = `
    <p style="margin:0 0 16px;">
      <strong>${escapeHtml(data.authorName)}</strong> posted an announcement
      for <strong>${escapeHtml(data.audienceLabel)}</strong>.
    </p>
    <h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0f172a;line-height:1.35;">
      ${escapeHtml(data.title)}
    </h2>
    <div style="margin:24px 0;padding:16px;background:#f1f5f9;border-left:4px solid #2563eb;border-radius:6px;font-size:15px;line-height:1.6;color:#334155;">
      ${contentHtml}
    </div>
    ${ctaBlock}
  `;

  return {
    subject: `[KodxCamp] ${data.title}`,
    html: renderLayout({
      preheader: `New announcement from ${data.authorName}`,
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