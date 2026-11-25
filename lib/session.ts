import {createHmac,timingSafeEqual} from 'node:crypto';

export const SESSION_COOKIE='mth_admin';
export const SESSION_MAX_AGE=8*3600*1000;
export const STATE_COOKIE='mth_oauth_state';
export const VERIFIER_COOKIE='mth_oauth_verifier';

const b64url=(value:string)=>Buffer.from(value,'utf8').toString('base64url');
const fromB64url=(value:string)=>Buffer.from(value,'base64url').toString('utf8');
const signature=(payload:string,secret:string)=>createHmac('sha256',secret).update(payload).digest('hex');

function secret(){const value=process.env.ADMIN_SESSION_SECRET;return value&&value.length>=32?value:null}

export function allowedDomain(){return (process.env.GOOGLE_ALLOWED_DOMAIN||'marketingtusk.com').trim().toLowerCase().replace(/^@/,'')}

export function allowedEmails(){return (process.env.GOOGLE_ALLOWED_EMAILS||'').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean)}

export function isAllowedEmail(email:string){
 const address=String(email||'').trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+$/.test(address))return false;
 const domain=allowedDomain();
 if(!domain)return false;
 if(address.slice(address.lastIndexOf('@')+1)!==domain)return false;
 const emails=allowedEmails();
 return emails.length===0||emails.includes(address);
}

export function issueSession(email:string,now=Date.now()){
 const key=secret();if(!key)throw Error('Admin session secret missing');
 const expires=now+SESSION_MAX_AGE;
 const payload=expires+'.'+b64url(email.trim().toLowerCase());
 return payload+'.'+signature(payload,key);
}

export type Session={email:string;expires:number};

export function readSession(token:string|undefined,now=Date.now()):Session|null{
 const key=secret();if(!key)return null;
 const parts=String(token||'').split('.');
 if(parts.length!==3)return null;
 const [expires,emailPart,provided]=parts;
 if(!/^\d{13}$/.test(expires)||!/^[A-Za-z0-9_-]+$/.test(emailPart)||!/^[a-f0-9]{64}$/.test(provided))return null;
 const expiresAt=Number(expires);
 if(expiresAt<now||expiresAt>now+SESSION_MAX_AGE+60000)return null;
 const expected=signature(expires+'.'+emailPart,key);
 if(!timingSafeEqual(Buffer.from(expected),Buffer.from(provided)))return null;
 let email:string;try{email=fromB64url(emailPart)}catch{return null}
 return isAllowedEmail(email)?{email,expires:expiresAt}:null;
}

export function cookieValue(header:string|null,name:string){
 if(!header)return null;
 for(const part of header.split(';')){const index=part.indexOf('=');if(index<0)continue;if(part.slice(0,index).trim()===name)return part.slice(index+1).trim()}
 return null;
}
