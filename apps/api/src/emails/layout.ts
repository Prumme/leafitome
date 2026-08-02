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

  // Pas d’image data:URI (souvent bloquée → carré gris). Emoji feuille + pastille.
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
            <td style="background:#3a6d4c;background-color:#3a6d4c;padding:22px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td
                    width="36"
                    height="36"
                    align="center"
                    valign="middle"
                    bgcolor="#ffffff"
                    style="width:36px;height:36px;background:#ffffff;border-radius:10px;font-size:18px;line-height:36px;text-align:center;"
                  >
                    &#127811;
                  </td>
                  <td style="vertical-align:middle;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.02em;font-family:Georgia,'Times New Roman',serif;">
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
