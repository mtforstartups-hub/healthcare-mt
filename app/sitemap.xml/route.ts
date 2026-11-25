export const dynamic='force-dynamic';
import {pages} from '../../lib/content';
import {canonical,SEO,pageEligible} from '../../lib/seo';
import {newArticles,topicIndex} from '../../lib/editorial';
import {cmsEntries,publicEntries} from '../../lib/cms';
import worksheets from '../../content/tools.json';

export async function GET(){
 const paths=SEO.indexing?[...pages.filter(pageEligible).map(p=>p.path),...worksheets.map(w=>'/resources/'+w.slug),...(await publicEntries(cmsEntries)).map(p=>p.path),...topicIndex.map(t=>'/blog/topics/'+t.slug),'/guides','/answers']:[];
 return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...new Set(paths)].map(path=>'<url><loc>'+canonical(path).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\"','&quot;').replaceAll("'",'&apos;')+'</loc></url>').join('')+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store'}});
}
