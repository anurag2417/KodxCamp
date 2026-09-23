import { renderLayout } from './layout.js';

export interface AnnouncementData {
  instructorName: string;
  courseName: string;
  courseUrl: string;
  content: string;
}

export function renderAnnouncement(data: AnnouncementData): {
  subject: string;
  html: string;
} {
  // Preserve line breaks in the instructor's message.
  const contentHtml = escapeHtml(data.content).replace(/\n/g, '<br />');

  const body = `
    <p style="margin:0 0 16px;">
      <strong>${escapeHtml(data.instructorName)}</strong> posted an announcement
      in <strong>${escapeHtml(data.courseName)}</strong>.
    </p>
    <div style="margin:24px 0;padding:16px;background:#f0f6f2;border-left:4px solid #2a835f;border-radius:6px;font-size:15px;line-height:1.6;color:#29403b;">
      ${contentHtml}
    </div>
    <div style="margin:24px 0;text-align:center;">
      <a href="${data.courseUrl}"
         style="display:inline-block;padding:12px 24px;background:#2a835f;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;border-radius:8px;">
        Open course
      </a>
    </div>
  `;

  return {
    subject: `[${data.courseName}] New announcement`,
    html: renderLayout({
      preheader: `New message from ${data.instructorName}`,
      title: `Announcement in ${data.courseName}`,
      body,
      footer:
        "You're receiving this because you're enrolled in this course.",
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