/**
 * Shared HTML wrapper for every outgoing email.
 *
 * Email clients are hostile. Rules:
 *   - Inline styles only. No <style> blocks. Gmail strips them.
 *   - Table-based layout for Outlook compatibility.
 *   - No external images unless you're willing to host them.
 *   - Fixed width, 600px is the safe maximum.
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
  <body style="margin:0;padding:0;background:#f7faf8;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
    ${
      preheader
        ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>`
        : ''
    }
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7faf8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #d4e2d8;overflow:hidden;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #f0f6f2;">
                <span style="font-size:18px;font-weight:700;color:#092328;letter-spacing:-0.01em;">
                  KODX<span style="color:#2a835f;">CAMP</span>
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#092328;line-height:1.3;">
                  ${escapeHtml(title)}
                </h1>
                <div style="font-size:15px;line-height:1.6;color:#29403b;">
                  ${body}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f0f6f2;border-top:1px solid #f0f6f2;font-size:12px;color:#60736d;line-height:1.5;">
                ${
                  footer ??
                  `You're receiving this because you have a KodxCamp account.`
                }
                <br />
                © ${year} KodxCamp
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