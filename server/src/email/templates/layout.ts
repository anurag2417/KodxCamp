/**
 * Shared HTML wrapper for every outgoing email.
 *
 * Email clients are hostile. Rules:
 *   - Inline styles only. No <style> blocks. Gmail strips them.
 *   - Table-based layout for Outlook compatibility.
 *   - No external images unless you're willing to host them.
 *   - Fixed width, 600px is the safe maximum.
 *   - No CSS custom properties (email clients don't support them).
 *     The palette below is hardcoded on purpose and mirrors the
 *     KodxCamp Color Scheme Specification.
 *
 * Palette (light — emails are always light for maximum compatibility):
 *   Page bg        #F8FAFC
 *   Surface        #FFFFFF
 *   Border         #E2E8F0
 *   Muted surface  #F1F5F9
 *   Body text      #0F172A
 *   Secondary text #334155
 *   Muted text     #64748B
 *   Brand navy     #1E3A8A
 *   Brand blue     #2563EB
 *   Footer bg      #0F172A   (navy anchor, per spec's light-theme footer)
 *   Footer text    #CBD5E1
 *   Footer heading #F8FAFC
 */
export interface LayoutOptions {
  preheader?: string;
  title: string;
  body: string;
  footer?: string;
}

export function renderLayout({
  preheader,
  title,
  body,
  footer,
}: LayoutOptions): string {
  const year = new Date().getFullYear();

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
    ${
      preheader
        ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>`
        : ''
    }
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #f1f5f9;">
                <span style="font-size:18px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">
                  KODX<span style="color:#1e3a8a;">CAMP</span>
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">
                  ${escapeHtml(title)}
                </h1>
                <div style="font-size:15px;line-height:1.6;color:#334155;">
                  ${body}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#0f172a;border-top:1px solid #1e293b;font-size:12px;color:#cbd5e1;line-height:1.5;">
                ${
                  footer ??
                  `You're receiving this because you have a KodxCamp account.`
                }
                <br />
                <span style="color:#94a3b8;">© ${year} KodxCamp</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}