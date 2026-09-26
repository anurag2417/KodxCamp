import { renderLayout } from './layout.js';

export interface InvitationData {
  inviterName: string;
  courseName: string;
  role: string;
  acceptUrl: string;
  expiresInDays: number;
}

export function renderInvitation(data: InvitationData): {
  subject: string;
  html: string;
} {
  const roleLabel = ROLE_LABELS[data.role] ?? data.role;

  const body = `
    <p style="margin:0 0 16px;">
      <strong>${escapeHtml(data.inviterName)}</strong> invited you to join
      <strong>${escapeHtml(data.courseName)}</strong> as
      <strong>${escapeHtml(roleLabel)}</strong>.
    </p>
    <div style="margin:28px 0;text-align:center;">
      <a href="${data.acceptUrl}"
         style="display:inline-block;padding:12px 24px;background:#1e3a8a;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;border-radius:8px;">
        Accept invitation
      </a>
    </div>
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">
      This invitation expires in ${data.expiresInDays} day${data.expiresInDays === 1 ? '' : 's'}.
      If you don't have a KodxCamp account, you'll be asked to create one.
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#64748b;word-break:break-all;">
      Or paste this link into your browser:<br />
      <span style="color:#2563eb;">${escapeHtml(data.acceptUrl)}</span>
    </p>
  `;

  return {
    subject: `${data.inviterName} invited you to ${data.courseName}`,
    html: renderLayout({
      preheader: `Join ${data.courseName} as ${roleLabel}`,
      title: `You're invited to ${data.courseName}`,
      body,
    }),
  };
}

/**
 * Role labels keyed by the raw role string. Kept in sync with
 * `COURSE_TEAM_ROLES` in shared/src/types/permissions.ts. The
 * `reviewer` entry is retained for legacy invitations that predate
 * the 2D taxonomy migration.
 */
const ROLE_LABELS: Record<string, string> = {
  lead: 'Lead',
  course_author: 'Course Author',
  problem_author: 'Problem Author',
  class_coordinator: 'Class Coordinator',
  ta: 'Teaching Assistant',
  viewer: 'Viewer',
  // legacy
  author: 'Author',
  reviewer: 'Reviewer',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}