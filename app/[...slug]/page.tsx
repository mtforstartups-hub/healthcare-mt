import {cmsBase,publicCopy} from '../../lib/cms';
import {EditorialPage,ReadingHub,TopicPage,WorksheetPage,worksheetAt} from '../../components/editorial';
import {editorialAt,isLaunchArticle,topicAt} from '../../lib/editorial';
import {articleMeta,baseGraph,basePageMeta,pageMeta,robotMeta} from '../../lib/seo';
import {JsonLd} from '../../components/seo';
import {PublishedGuide} from '../../components/published-guide';
import {guideCover,guidesDescription,publishedGuideAt} from '../../lib/pilot';
import {canManageEnquiries} from '../../lib/admin';
import {notFound,permanentRedirect} from 'next/navigation';
import {pageAt,redirects} from '../../lib/content';
import {ServicesPage,ServicePage,SectorsPage,SectorPage,ResourcesPage,ResourcePage,ArticlePage,ContactPage,LegalPage,UtilityPage} from '../../components/pages';

const reviewAccess=canManageEnquiries;
type Props={params:Promise<{slug:string[]}>,searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({params}:Props){
 const {slug}=await params;const path='/'+slug.join('/');
 const published=publishedGuideAt(path);
 if(published){const p=await publicCopy(cmsBase(path)!);return p?pageMeta({path,title:p.seoTitle+' | Marketing Tusk',description:p.seoDescription,eligible:true,article:true,image:guideCover(published)}):{robots:robotMeta(false)};}
 if(path==='/guides')return pageMeta({path,title:'Healthcare Guides | Marketing Tusk Healthcare',description:guidesDescription,eligible:true});
 const e=editorialAt(path);
 if(e&&(isLaunchArticle(e)||await reviewAccess())){const p=await publicCopy(e);return p?articleMeta(p):{robots:robotMeta(false)};}
 const w=worksheetAt(path);
 if(w)return pageMeta({path,title:w.title+' | Marketing Tusk Healthcare',description:w.description,eligible:true});
 const t=topicAt(path);
 if(t)return pageMeta({path,title:t.title+' | Marketing Tusk Healthcare',description:t.description,eligible:true});
 if(path==='/answers')return pageMeta({path,title:'Healthcare Answers | Marketing Tusk Healthcare',description:'Practical answers on healthcare websites, local search and enquiries.',eligible:true});
 const p=pageAt(path);
 return p?basePageMeta(p):{title:'Page not found | Marketing Tusk Healthcare',robots:robotMeta(false)};
}
export default async function Page({params,searchParams}:Props){
 const {slug}=await params;const path='/'+slug.join('/');
 const target=redirects.find(x=>x.from===path);if(target)permanentRedirect(target.to);
 const published=publishedGuideAt(path);if(published){const p=await publicCopy(cmsBase(path)!);if(!p)notFound();return <PublishedGuide guide={{...published,title:p.title,description:p.seoDescription,answer:p.answer,blocks:p.blocks as typeof published.blocks}}/>;}
 const e=editorialAt(path);
 if(e){const allowed=await reviewAccess();if(!isLaunchArticle(e)&&!allowed)notFound();const p=await publicCopy(e);if(!p)notFound();return <EditorialPage p={p} allowReview={allowed}/>;}
 const w=worksheetAt(path);if(w)return <WorksheetPage p={w} allowReview={await reviewAccess()}/>;
 const topic=topicAt(path);if(topic)return <TopicPage p={topic}/>;
 if(['/blog','/guides','/answers'].includes(path)){
  const allowed=await reviewAccess();
  return <ReadingHub allowReview={allowed} initial={path==='/guides'?'Guide':path==='/answers'?'Answer':'All'}/>;
 }
 const p=pageAt(path);if(!p)notFound();
 let body;
 switch(p.type){
 case 'service_hub':body=<ServicesPage p={p}/>;break;
 case 'service':body=<ServicePage p={p}/>;break;
 case 'icp_hub':body=<SectorsPage p={p}/>;break;
 case 'icp':body=<SectorPage p={p}/>;break;
 case 'resource_hub':body=<ResourcesPage p={p}/>;break;
 case 'resource':body=<ResourcePage p={p}/>;break;
 case 'blog_post':body=<ArticlePage p={p}/>;break;
 case 'contact':body=<ContactPage p={p} searchParams={await searchParams}/>;break;
 case 'legal':body=<LegalPage p={p}/>;break;
 default:body=<UtilityPage p={p}/>;
 }
 return <>{p.type!=='utility'&&<JsonLd value={baseGraph(p)}/>}{body}</>;
}
