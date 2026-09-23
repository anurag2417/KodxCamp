import { renderLayout } from './layout.js';

export interface OtpData {
  code: string;
  expiresInMinutes: number;
  purpose?: string;
}

export function renderOtp(data: OtpData): {
  subject: string;
  html: string;
} {
  const purpose = data.purpose ? ` to ${data.purpose}` : '';

  const body = `
    <p style="margin:0 0 16px;">
      Use the code below${purpose}. It expires in ${data.expiresInMinutes} minutes.
    </p>
    <div style="margin:24px 0;padding:20px;background:#f0f6f2;border-radius:10px;text-align:center;">
      <span style="font-family:'JetBrains Mono',Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#092328;">
        ${data.code}
      </span>
    </div>
    <p style="margin:16px 0 0;font-size:13px;color:#60736d;">
      If you didn't request this code, you can safely ignore this email.
    </p>
  `;

  return {
    subject: 'Your KodxCamp verification code',
    html: renderLayout({
      preheader: `Your verification code expires in ${data.expiresInMinutes} minutes`,
      title: 'Verification code',
      body,
    }),
  };
}