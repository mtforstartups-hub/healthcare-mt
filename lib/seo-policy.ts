export const REVIEW_ORIGIN='https://healthcare.marketingtusk.chatgpt.site';
export const PUBLIC_ORIGIN='https://healthcare.marketingtusk.com';
export function indexingPolicy(vars:{SEO_INDEXING?:string;SEO_PUBLIC_ORIGIN?:string;SITE_ACCESS_MODE?:string}){
 // This review candidate prepares the already public, HTTPS-enabled custom-domain launch.
 // Explicit staging/private flags still override the public default.
 const configured=vars.SEO_PUBLIC_ORIGIN??PUBLIC_ORIGIN;
 try{
  const url=new URL(configured);
  const valid=url.protocol==='https:'&&url.hostname==='healthcare.marketingtusk.com'&&!url.port&&!url.username&&!url.password&&url.pathname==='/'&&!url.search&&!url.hash;
  const indexing=valid&&(!vars.SEO_INDEXING||vars.SEO_INDEXING==='public')&&(!vars.SITE_ACCESS_MODE||vars.SITE_ACCESS_MODE==='public');
  return {indexing,origin:valid?url.origin:REVIEW_ORIGIN};
 }catch{return {indexing:false,origin:REVIEW_ORIGIN}}
}
export function robotsRules(indexing:boolean,origin:string){
 if(!indexing)return 'User-agent: *\nDisallow: /\n';
 return 'User-agent: *\nDisallow: /api/\nDisallow: /admin\nDisallow: /studio\nDisallow: /signin-with-chatgpt\nDisallow: /signout-with-chatgpt\nDisallow: /callback\n\nUser-agent: GPTBot\nDisallow: /\n\nSitemap: '+origin+'/sitemap.xml\n';
}
