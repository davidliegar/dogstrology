/**
 * La maqueta de las páginas legales del CDN — condiciones y privacidad.
 *
 * Son dos documentos con la misma forma: un título, apartados de rótulo y
 * cuerpo, y un pie con la versión. Vive aparte porque la segunda página no
 * puede ser una copia de la primera con el CSS pegado: el día que cambie un
 * token, cambiaría en una y no en la otra.
 *
 * Los colores y las tipografías son los de `design/theme.ts`. La app es oscura
 * por decisión (`userInterfaceStyle: dark`), así que estas páginas también: un
 * texto legal que se lee igual que la pantalla que lo enseña es un texto que se
 * reconoce como de la misma app.
 */

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Un párrafo con enlaces de correo. Es lo único que puede llevar marcado, y va
 * después de escapar: así el texto sigue siendo texto y el `mailto:` no depende
 * de que nadie escriba HTML a mano en el contenido.
 */
const linkEmails = (text) =>
  text.replace(/([\w.+-]+@[\w.-]+\.\w+)/g, '<a href="mailto:$1">$1</a>');

export function renderLegalPage({ title, heading, intro, sections, version }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} · Dogstrology</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Karla:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #0B1026;
    color: #F2EFE6;
    font: 400 16px/25px Karla, system-ui, sans-serif;
    padding: 48px 24px 64px;
  }
  main { max-width: 620px; margin: 0 auto; }
  h1 {
    font: 600 28px/34px Fraunces, Georgia, serif;
    letter-spacing: -0.3px;
    margin: 0 0 24px;
    text-wrap: balance;
  }
  .intro { color: #C6C2B8; margin: 0 0 32px; }
  section { margin: 0 0 24px; }
  h2 {
    font: 700 11px/14px Karla, sans-serif;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: #8E96B4;
    margin: 0 0 4px;
  }
  p { margin: 0 0 12px; color: #C6C2B8; }
  p:last-child { margin-bottom: 0; }
  a { color: #E8C87A; }
  footer {
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid rgba(242, 239, 230, 0.08);
    color: #8E96B4;
    font-size: 13px;
  }
</style>
</head>
<body>
<main>
  <h1>${escape(heading)}</h1>
${intro ? `  <p class="intro">${linkEmails(escape(intro))}</p>\n` : ''}${sections
    .map(
      (section) => `  <section>
    <h2>${escape(section.title)}</h2>
${(Array.isArray(section.body) ? section.body : [section.body])
  .map((paragraph) => `    <p>${linkEmails(escape(paragraph))}</p>`)
  .join('\n')}
  </section>`,
    )
    .join('\n')}
  <footer>${escape(version)}</footer>
</main>
</body>
</html>
`;
}
