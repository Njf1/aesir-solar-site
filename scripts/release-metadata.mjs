export function releaseMetadata(html,slug,production){
 if(!production)return html;
 const indexable=!['apply','success'].includes(slug);
 html=html.replace('<meta name="robots" content="noindex, nofollow">',`<meta name="robots" content="${indexable?'index, follow':'noindex, follow'}">`);
 const canonical='https://aesirsolar.co.uk/'+(['index','experience'].includes(slug)?'':slug);
 html=html.replace(/\s*<link rel="canonical"[^>]*>/,'');
 return html.replace('</head>',`  <link rel="canonical" href="${canonical}">\n</head>`);
}
export const publicPages=['','solar','suitability','faq','contact','terms','privacy','refunds','simulator'];
export const publicRobots='User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /apply\nDisallow: /success\nSitemap: https://aesirsolar.co.uk/sitemap.xml\n';
export const publicSitemap='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+publicPages.map(p=>'<url><loc>https://aesirsolar.co.uk/'+p+'</loc></url>').join('')+'</urlset>\n';
