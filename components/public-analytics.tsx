'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {isPrivatePath,safePageURL} from '../lib/integration-policy';
type Config={ga4?:string;clarity?:string;requiresConsent:boolean};
type AnalyticsWindow=Window&{
 dataLayer?:unknown[];gtag?:(...args:unknown[])=>void;
 clarity?:((...args:unknown[])=>void)&{q?:unknown[][]};
 __mthAnalytics?:{ga4?:string;clarity?:string;lastPage?:string;granted?:boolean;timer?:ReturnType<typeof setTimeout>};
 [key:`ga-disable-${string}`]:boolean|undefined;
};
export default function PublicAnalytics({config,paths}:{config:Config;paths:string[]}){
 const pathname=usePathname();
 useEffect(()=>{
  const w=window as unknown as AnalyticsWindow;
  const state=w.__mthAnalytics??={};
  const allowed=paths.includes(pathname)&&!isPrivatePath(pathname);
  const endpoint=()=>location.origin+location.pathname;
  function script(id:string,src:string){
   if(document.getElementById(id))return;
   const tag=document.createElement('script');tag.id=id;tag.async=true;tag.src=src;
   tag.referrerPolicy='strict-origin-when-cross-origin';document.head.appendChild(tag);
  }
  function start(){
   if(!allowed||!(state.granted||!config.requiresConsent))return;
   if(config.ga4){
    w[`ga-disable-${config.ga4}`]=false;
    if(!state.ga4){
     w.dataLayer??=[];w.gtag=function(){w.dataLayer!.push(arguments)};
     w.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
     w.gtag('js',new Date());
     w.gtag('set','send_page_view',false);
     w.gtag('config',config.ga4,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:endpoint(),page_referrer:safePageURL(document.referrer,location.origin)});
     script('mth-ga4','https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(config.ga4));
     state.ga4=config.ga4;
    }
    if(state.lastPage!==endpoint()){
     w.gtag?.('event','page_view',{send_to:config.ga4,page_location:endpoint(),page_referrer:state.lastPage??safePageURL(document.referrer,location.origin),page_title:document.title});
     state.lastPage=endpoint();
    }
   }
   // Recording never starts on a page whose URL may carry enquiry or campaign values.
   if(config.clarity&&!state.clarity&&!location.search&&!location.hash){
    document.documentElement.setAttribute('data-clarity-mask','true');
    const queue=function(...args:unknown[]){(queue.q??=[]).push(args)} as NonNullable<AnalyticsWindow['clarity']>;
    w.clarity=queue;
    script('mth-clarity','https://www.clarity.ms/tag/'+encodeURIComponent(config.clarity));
    state.clarity=config.clarity;
   }
  }
  function fullNavigationIfUnsafe(value:string|URL|null|undefined){
   if(!value||!state.ga4&&!state.clarity)return false;
   const next=new URL(String(value),location.href);
   if(!paths.includes(next.pathname)||isPrivatePath(next.pathname)||state.clarity&&(next.search||next.hash)){
    if(state.ga4)w[`ga-disable-${state.ga4}`]=true;
    location.assign(next.href);return true;
   }
   return false;
  }
  if(!allowed&&(state.ga4||state.clarity)){if(state.ga4)w[`ga-disable-${state.ga4}`]=true;location.reload();return}
  const originalPush=history.pushState,originalReplace=history.replaceState;
  history.pushState=function(data,title,url){if(!fullNavigationIfUnsafe(url))originalPush.call(this,data,title,url)};
  history.replaceState=function(data,title,url){if(!fullNavigationIfUnsafe(url))originalReplace.call(this,data,title,url)};
  function consent(event:Event){
   const granted=(event as CustomEvent).detail?.granted===true;
   state.granted=granted;
   if(granted)start();
   else{
    if(config.ga4){w[`ga-disable-${config.ga4}`]=true;w.gtag?.('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'})}
    if(state.ga4||state.clarity)location.reload();
   }
  }
  window.addEventListener('mth:analytics-consent',consent);
  state.timer=setTimeout(start,1500);
  return()=>{clearTimeout(state.timer);window.removeEventListener('mth:analytics-consent',consent);history.pushState=originalPush;history.replaceState=originalReplace};
 },[pathname,config.ga4,config.clarity,config.requiresConsent,paths]);
 return null;
}
