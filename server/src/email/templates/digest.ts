import { renderLayout } from './layout.js';

export interface DigestData {
  name: string;
  streakDays: number;
  xpThisWeek: number;
  lessonsThisWeek: number;
  problemsThisWeek: number;
  dashboardUrl: string;
}

export function renderDigest(data: DigestData): {
  subject: string;
  html: string;
} {
  const firstName = data.name.split(' ')[0];

  const statRow = (label: string, value: string | number) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f6f2;font-size:14px;color:#60736d;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0f6f2;font-size:16px;font-weight:600;color:#092328;text-align:right;">
        ${value}
      </td>
    </tr>
  `;

  const body = `
    <p style="margin:0 0 16px;">
      Hi ${escapeHtml(firstName)}, here's what you did on KodxCamp this week.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0;">
      ${statRow('XP earned', data.xpThisWeek)}
      ${statRow('Lessons completed', data.lessonsThisWeek)}
      ${statRow('Problems solved', data.problemsThisWeek)}
      ${statRow('Current streak', `${data.streakDays} day${data.streakDays === 1 ? '' : 's'}`)}
    </table>
    <div style="margin:28px 0;text-align:center;">
      <a href="${data.dashboardUrl}"
         style="display:inline-block;padding:12px 24px;background:#2a835f;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;border-radius:8px;">
        Open dashboard
      </a>
    </div>
  `;

  return {
    subject: `Your week on KodxCamp`,
    html: renderLayout({
      preheader: `${data.xpThisWeek} XP · ${data.problemsThisWeek} problems · ${data.streakDays}-day streak`,
      title: 'Your weekly summary',
      body,
      footer: 'Weekly summary from KodxCamp.',
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