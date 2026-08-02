const LEAF_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3a6d4c"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A7.3 7.3 0 0 0 12 19c4 0 7-3 7-7-2-1-4-2-2-4zM12 2C9 2 7 4.5 7 7c0 2.5 1.5 4 3 5.5C8.5 11 7 9 7 6.5 7 3.5 9.5 1 13 1c.3 0 .7 0 1 .1C12.5 1.5 12 1.8 12 2z"/></svg>`,
)

export function emailLayout(input: {
  title: string
  preheader: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
  footerNote?: string
}): string {
  const cta =
    input.ctaLabel && input.ctaUrl
      ? `<p style="margin:28px 0 8px;">
          <a href="${input.ctaUrl}" style="display:inline-block;background:#3a6d4c;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;">
            ${input.ctaLabel}
          </a>
        </p>
        <p style="margin:0;font-size:12px;color:#6b7c70;word-break:break-all;">
          Ou copie ce lien :<br/>${input.ctaUrl}
        </p>`
      : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${input.title}</title>
</head>
<body style="margin:0;padding:0;background:#eef5f0;font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${input.preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;border:1px solid #d7e5db;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#3a6d4c,#2f573e);padding:22px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="data:image/svg+xml,${LEAF_SVG}" width="28" height="28" alt=""/>
                  </td>
                  <td style="vertical-align:middle;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">
                    Leafitome
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#1f2d24;font-size:16px;line-height:1.55;">
              ${input.bodyHtml}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font-size:12px;color:#6b7c70;line-height:1.45;">
              ${input.footerNote ?? 'Si tu n’es pas à l’origine de cette demande, ignore simplement cet email — la clairière reste calme.'}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function verifyEmailTemplate(name: string | null, url: string) {
  const who = name?.trim() || 'explorateur'
  return {
    subject: 'Confirme ton email — une feuille de plus',
    html: emailLayout({
      title: 'Confirme ton email',
      preheader: 'Un petit clic pour planter ta confiance dans Leafitome.',
      bodyHtml: `
        <p style="margin:0 0 12px;">Salut ${who},</p>
        <p style="margin:0 0 12px;">
          Pour que ta clairière s’enracine bien, confirme ton adresse email.
          <em>Pas de panique : ce n’est pas une corvée, juste une petite feuille à planter.</em>
        </p>
      `,
      ctaLabel: 'Valider mon email',
      ctaUrl: url,
    }),
  }
}

export function resetPasswordTemplate(name: string | null, url: string) {
  const who = name?.trim() || 'voyageur'
  return {
    subject: 'Mot de passe oublié — on rouvre le sentier',
    html: emailLayout({
      title: 'Réinitialiser le mot de passe',
      preheader: 'Voici un lien pour choisir un nouveau mot de passe.',
      bodyHtml: `
        <p style="margin:0 0 12px;">Salut ${who},</p>
        <p style="margin:0 0 12px;">
          Tu as demandé à réinitialiser ton mot de passe.
          <em>On efface les traces sur le sentier et on t’en trace un nouveau.</em>
        </p>
        <p style="margin:0;">Ce lien expire dans 1 heure.</p>
      `,
      ctaLabel: 'Choisir un nouveau mot de passe',
      ctaUrl: url,
    }),
  }
}

export function changePasswordTemplate(name: string | null, url: string) {
  const who = name?.trim() || 'gardien'
  return {
    subject: 'Modifier ton mot de passe — nouvelle clé de la clairière',
    html: emailLayout({
      title: 'Modifier le mot de passe',
      preheader: 'Confirme le changement de mot de passe depuis ce lien sécurisé.',
      bodyHtml: `
        <p style="margin:0 0 12px;">Salut ${who},</p>
        <p style="margin:0 0 12px;">
          Tu as demandé à changer ton mot de passe depuis ton profil.
          <em>On te tend une nouvelle clé — l’ancienne ne passera plus à la serrure.</em>
        </p>
        <p style="margin:0;">Pour ta sécurité, tes sessions actuelles seront fermées après le changement.</p>
      `,
      ctaLabel: 'Définir mon nouveau mot de passe',
      ctaUrl: url,
      footerNote:
        'Si tu n’as pas demandé ce changement, ignore cet email et ton mot de passe actuel reste valide.',
    }),
  }
}
