type MailTheme = {
  headerGradientStart: string;
  headerGradientEnd: string;
  buttonColor: string;
  accentSoftBg: string;
  accentSoftBorder: string;
  accentStrongText: string;
  headlineTag: string;
};

type BrandConfig = {
  brandName?: string;
  logoUrl?: string;
};

type BaseTemplateInput = {
  title: string;
  intro: string;
  actionLabel: string;
  actionUrl: string;
  note?: string;
  previewText?: string;
  footer?: string;
  supportEmail?: string;
  brand?: BrandConfig;
  theme: MailTheme;
};

const DEFAULT_FOOTER = 'If you did not request this email, you can safely ignore it.';
const DEFAULT_BRAND = 'FindMe';

const VERIFY_THEME: MailTheme = {
  headerGradientStart: '#6D4AFF',
  headerGradientEnd: '#4B35CC',
  buttonColor: '#6D4AFF',
  accentSoftBg: '#F3EEFF',
  accentSoftBorder: '#D7CCFF',
  accentStrongText: '#4B35CC',
  headlineTag: 'Email Verification',
};

const RESET_THEME: MailTheme = {
  headerGradientStart: '#7A3DFF',
  headerGradientEnd: '#0F5AD8',
  buttonColor: '#5B34E6',
  accentSoftBg: '#EEF3FF',
  accentSoftBorder: '#C8D9FF',
  accentStrongText: '#1947B7',
  headlineTag: 'Password Reset',
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeBrand(brand?: BrandConfig) {
  return {
    brandName: (brand?.brandName || DEFAULT_BRAND).trim() || DEFAULT_BRAND,
    logoUrl: brand?.logoUrl?.trim() || '',
  };
}

function buildTextTemplate(input: BaseTemplateInput) {
  const brand = normalizeBrand(input.brand);
  const footer = input.footer || DEFAULT_FOOTER;

  return [
    brand.brandName,
    '',
    input.title,
    '',
    input.intro,
    '',
    `${input.actionLabel}: ${input.actionUrl}`,
    input.note ? `\n${input.note}` : '',
    input.supportEmail ? `\nSupport: ${input.supportEmail}` : '',
    '',
    footer,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildBrandLogoHtml(brandName: string, logoUrl: string) {
  if (logoUrl) {
    return `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brandName)} logo" style="display:block;width:44px;height:44px;border-radius:12px;object-fit:cover;border:1px solid rgba(255,255,255,0.3);" />`;
  }

  return `<div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.3);text-align:center;line-height:44px;font-size:16px;font-weight:700;color:#ffffff;">FM</div>`;
}

function buildHtmlTemplate(input: BaseTemplateInput) {
  const brand = normalizeBrand(input.brand);
  const title = escapeHtml(input.title);
  const intro = escapeHtml(input.intro);
  const actionLabel = escapeHtml(input.actionLabel);
  const actionUrl = escapeHtml(input.actionUrl);
  const note = input.note ? escapeHtml(input.note) : '';
  const footer = escapeHtml(input.footer || DEFAULT_FOOTER);
  const previewText = escapeHtml(input.previewText || input.intro);
  const supportEmail = input.supportEmail ? escapeHtml(input.supportEmail) : '';
  const brandName = escapeHtml(brand.brandName);
  const logoHtml = buildBrandLogoHtml(brand.brandName, brand.logoUrl);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#101828;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${previewText}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f6fb;padding:24px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:660px;border-radius:24px;overflow:hidden;background:#ffffff;box-shadow:0 20px 55px rgba(16,24,40,0.14);">
            <tr>
              <td style="padding:28px 32px;background:linear-gradient(135deg,${input.theme.headerGradientStart},${input.theme.headerGradientEnd});color:#ffffff;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td valign="top" style="padding-right:14px;width:48px;">${logoHtml}</td>
                    <td valign="top">
                      <div style="font-size:12px;letter-spacing:0.11em;text-transform:uppercase;opacity:0.82;">${escapeHtml(input.theme.headlineTag)}</div>
                      <div style="margin-top:6px;font-size:26px;line-height:1.22;font-weight:700;">${title}</div>
                      <div style="margin-top:8px;font-size:13px;opacity:0.9;">${brandName}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 32px 30px 32px;">
                <div style="font-size:16px;line-height:1.72;color:#344054;">${intro}</div>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 22px 0;">
                  <tr>
                    <td align="center" bgcolor="${input.theme.buttonColor}" style="border-radius:14px;box-shadow:0 10px 24px rgba(91,52,230,0.25);">
                      <a href="${actionUrl}" style="display:inline-block;padding:14px 24px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.01em;">
                        ${actionLabel}
                      </a>
                    </td>
                  </tr>
                </table>
                <div style="padding:18px 18px;background:${input.theme.accentSoftBg};border:1px solid ${input.theme.accentSoftBorder};border-radius:14px;">
                  <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${input.theme.accentStrongText};">Manual Link</div>
                  <div style="margin-top:10px;font-size:14px;line-height:1.68;color:#344054;word-break:break-word;">
                    If the button does not work, open this link:<br />
                    <a href="${actionUrl}" style="color:${input.theme.accentStrongText};text-decoration:underline;">${actionUrl}</a>
                  </div>
                </div>
                ${note ? `<div style="margin-top:20px;font-size:14px;line-height:1.68;color:#475467;">${note}</div>` : ''}
                ${supportEmail ? `<div style="margin-top:8px;font-size:13px;color:#667085;">Need help? Contact <a href="mailto:${supportEmail}" style="color:${input.theme.accentStrongText};text-decoration:underline;">${supportEmail}</a></div>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e4e7ec;">
                <div style="font-size:12px;line-height:1.7;color:#667085;">${footer}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildMail(input: BaseTemplateInput) {
  return {
    subjectTitle: input.title,
    text: buildTextTemplate(input),
    html: buildHtmlTemplate(input),
  };
}

type VerificationTemplateParams = {
  actionUrl: string;
  brand?: BrandConfig;
  supportEmail?: string;
};

type ResetTemplateParams = {
  actionUrl: string;
  brand?: BrandConfig;
  supportEmail?: string;
};

export function buildEmailVerificationMail(params: VerificationTemplateParams) {
  const input: BaseTemplateInput = {
    title: 'Confirm your email in FindMe',
    intro: 'Thanks for signing up. Confirm your email to activate your account and unlock all FindMe features.',
    actionLabel: 'Confirm Email',
    actionUrl: params.actionUrl,
    note: 'For security reasons, this confirmation link expires in 24 hours.',
    previewText: 'Confirm your email and finish creating your FindMe account.',
    theme: VERIFY_THEME,
    ...(params.supportEmail ? { supportEmail: params.supportEmail } : {}),
    ...(params.brand ? { brand: params.brand } : {}),
  };

  return buildMail(input);
}

export function buildPasswordResetMail(params: ResetTemplateParams) {
  const input: BaseTemplateInput = {
    title: 'Reset your FindMe password',
    intro: 'We received a request to reset your password. Tap the button below to create a new one.',
    actionLabel: 'Reset Password',
    actionUrl: params.actionUrl,
    note: 'For security reasons, this reset link expires in 30 minutes.',
    previewText: 'Password reset request for your FindMe account.',
    theme: RESET_THEME,
    ...(params.supportEmail ? { supportEmail: params.supportEmail } : {}),
    ...(params.brand ? { brand: params.brand } : {}),
  };

  return buildMail(input);
}
