import { renderLayout } from './layout.js';

export interface PasswordResetData {
  resetUrl: string;
  expiresInMinutes: number;
}

export function renderPasswordReset(data: PasswordResetData): {
  subject: string;
  html: string;
} {
  const body = `
    <p style="margin:0 0 16px;">
      Someone requested a password reset for your KodxCamp account.
      Click the button below to set a new password.
    </p>
    <div style="margin:28px 0;text-align:center;">
      <a href="${data.resetUrl}"
         style="display:inline-block;padding:12px 24px;background:#2a835f;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;border-radius:8px;">
        Reset password
      </a>
    </div>
    <p style="margin:16px 0 0;font-size:13px;color:#60736d;">
      This link expires in ${data.expiresInMinutes} minutes.
      If you didn't request this, you can ignore this email - your
      password won't change.
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#60736d;word-break:break-all;">
      Or paste this link into your browser:<br />
      <span style="color:#2a835f;">${escapeHtml(data.resetUrl)}</span>
    </p>
  `;

  return {
    subject: 'Reset your KodxCamp password',
    html: renderLayout({
      preheader: `Reset link expires in ${data.expiresInMinutes} minutes`,
      title: 'Reset your password',
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