export type IntegrationVars={
 GA4_MEASUREMENT_ID?:string;CLARITY_PROJECT_ID?:string;ANALYTICS_ENABLED?:string;
 ANALYTICS_CONSENT_MODE?:string;GOOGLE_SITE_VERIFICATION?:string;BING_SITE_VERIFICATION?:string;
};
const placeholder=(s:string)=>/placeholder|your|replace|example/i.test(s);
const valid=(v:string|undefined,pattern:RegExp)=>v&&pattern.test(v.trim())&&!placeholder(v.trim())?v.trim():undefined;
export function integrationConfig(v:IntegrationVars){
 return {
  ga4:valid(v.GA4_MEASUREMENT_ID,/^G-[A-Z0-9]{6,20}$/),
  clarity:valid(v.CLARITY_PROJECT_ID,/^[a-z0-9]{5,30}$/),
  googleVerification:valid(v.GOOGLE_SITE_VERIFICATION,/^[A-Za-z0-9_-]{10,200}$/),
  bingVerification:valid(v.BING_SITE_VERIFICATION,/^[A-Fa-f0-9]{16,64}$/),
  enabled:v.ANALYTICS_ENABLED==='true',
  requiresConsent:v.ANALYTICS_CONSENT_MODE!=='preapproved',
 };
}
export const isPrivatePath=(p:string)=>/^\/(admin|studio|api|signin-with-chatgpt|signout-with-chatgpt|callback)(?:\/|$)/.test(p)||['/thank-you','/resource-download'].includes(p);
export function safePageURL(value:string,origin:string){
 try{const u=new URL(value,origin);return u.protocol==='https:'?u.origin+u.pathname:''}catch{return ''}
}
