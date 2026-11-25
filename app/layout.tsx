export const dynamic='force-dynamic';
import {headers} from 'next/headers';
import PublicAnalytics from '../components/public-analytics';
import {analyticsPublicPaths,integrations} from '../lib/integrations';
import type {Metadata} from 'next';
import Shell from '../components/shell';
import {canManageEnquiries} from '../lib/admin';
import './globals.css';
import {SEO,robotMeta} from '../lib/seo';
export const metadata:Metadata={metadataBase:new URL(SEO.origin),title:{default:'Marketing Tusk Healthcare',template:'%s'},description:'Websites, brand systems and digital visibility for healthcare organizations.',robots:robotMeta(false),icons:{icon:'/favicon.svg'},verification:{google:integrations.googleVerification,other:integrations.bingVerification?{'msvalidate.01':integrations.bingVerification}:{}},openGraph:{siteName:'Marketing Tusk Healthcare',type:'website',images:['/og-cover.png']}};
export default async function RootLayout({children}:{children:React.ReactNode}){const isOwner=await canManageEnquiries();const requestHeaders=await headers();const path=requestHeaders.get('x-mth-render-path')??'';const paths=integrations.enabled&&!isOwner?await analyticsPublicPaths():[];const analytics=paths.includes(path);return <html lang="en-IN"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;550;600;650;700&family=Manrope:wght@400;500;600;650;700;750;800&display=swap" rel="stylesheet"/></head><body><Shell isOwner={isOwner}>{children}</Shell>{analytics&&<PublicAnalytics config={{ga4:integrations.ga4,clarity:integrations.clarity,requiresConsent:integrations.requiresConsent}} paths={paths}/>}</body></html>}
