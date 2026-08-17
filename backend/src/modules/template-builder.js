const cheerio = require('cheerio');

/**
 * Build template dari HTML yang di-scrape
 */
function buildTemplate(html, config) {
  const $ = cheerio.load(html);
  
  // Ekstrak komponen
  const components = {
    header: extractComponent($, 'header', config?.headerSelector),
    hero: extractComponent($, '.hero, .banner, .jumbotron', config?.heroSelector),
    content: extractComponent($, 'main, .content, article', config?.contentSelector),
    sidebar: extractComponent($, 'aside, .sidebar', config?.sidebarSelector),
    footer: extractComponent($, 'footer', config?.footerSelector),
    styles: extractStyles($),
  };
  
  // Generate template structure
  const template = {
    name: config?.name || 'untitled-template',
    sourceUrl: config?.sourceUrl || '',
    components: components,
    layout: {
      type: config?.layoutType || 'default',
      columns: config?.columns || 1,
    },
    styles: components.styles,
    // Placeholder untuk konten yang bisa diganti
    placeholders: {
      title: '{{title}}',
      description: '{{description}}',
      siteName: '{{siteName}}',
      heroImage: '{{heroImage}}',
      logo: '{{logo}}',
      favicon: '{{favicon}}',
      content: '{{content}}',
      cta: '{{cta}}',
    },
    createdAt: new Date().toISOString(),
  };
  
  return template;
}

/**
 * Ekstrak komponen dari selector
 */
function extractComponent($, selector, customSelector) {
  const target = customSelector || selector;
  const element = $(target).first();
  if (element.length > 0) {
    return {
      html: element.html() || '',
      text: element.text() || '',
      attributes: element.attr() || {},
      selector: target,
    };
  }
  return null;
}

/**
 * Ekstrak semua styles
 */
function extractStyles($) {
  const styles = {
    inline: [],
    external: [],
    internal: [],
  };
  
  // Internal styles (<style>)
  $('style').each((i, el) => {
    styles.internal.push($(el).html());
  });
  
  // External styles (<link rel="stylesheet">)
  $('link[rel="stylesheet"]').each((i, el) => {
    const href = $(el).attr('href');
    if (href) {
      styles.external.push(href);
    }
  });
  
  // Inline styles (style attribute)
  $('[style]').each((i, el) => {
    const style = $(el).attr('style');
    if (style) {
      styles.inline.push(style);
    }
  });
  
  return styles;
}

/**
 * Render template dengan data
 */
function renderTemplate(template, data) {
  let html = template.components.header?.html || '';
  html += template.components.hero?.html || '';
  html += template.components.content?.html || '';
  html += template.components.sidebar?.html || '';
  html += template.components.footer?.html || '';
  
  // Replace placeholders
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    html = html.replaceAll(placeholder, value);
  }
  
  // Wrap with style
  const styleTags = template.styles.internal.join('\n');
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title || 'Untitled'}</title>
      <meta name="description" content="${data.description || ''}">
      ${template.styles.external.map(h => `<link rel="stylesheet" href="${h}">`).join('\n')}
      <style>${styleTags}</style>
      ${data.customCss ? `<style>${data.customCss}</style>` : ''}
    </head>
    <body>
      ${html}
      ${data.customJs ? `<script>${data.customJs}</script>` : ''}
    </body>
    </html>
  `;
  
  return fullHtml;
}

module.exports = { buildTemplate, renderTemplate, extractComponent, extractStyles };