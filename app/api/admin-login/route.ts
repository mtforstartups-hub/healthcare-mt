import {scryptSync,timingSafeEqual} from 'node:crypto';
import {incrementRate} from '../../../lib/database';
import {sessionToken} from '../../../lib/admin';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const origin=request.headers.get('origin');const configured=process.env.APP_ORIGIN;
 if(!configured||origin!==configured)return new Response('Invalid request',{status:403});
 try{
  const hash=process.env.ADMIN_PASSWORD_HASH||'';const match=/^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(hash);
  if(!match||!process.env.ADMIN_SESSION_SECRET||process.env.ADMIN_SESSION_SECRET.length<32)return new Response('Admin login is not configured.',{status:503});
  const now=Date.now();const attempts=await incrementRate('admin-login:'+Math.floor(now/900000),now+900000);if(attempts>10)return new Response('Too many sign-in attempts. Try again later.',{status:429});
  if(Number(request.headers.get('content-length')||0)>4096)return new Response('Invalid request',{status:400});
  const password=(await request.formData()).get('password');if(typeof password!=='string'||password.length>256)return new Response('Invalid request',{status:400});
  const actual=scryptSync(password,Buffer.from(match[1],'hex'),64);const expected=Buffer.from(match[2],'hex');
  if(!timingSafeEqual(actual,expected))return new Response('Incorrect password. Go back and try again.',{status:403,headers:{'Cache-Control':'no-store'}});
  const expires=now+8*3600000;const response=new Response(null,{status:303,headers:{Location:configured+'/studio','Cache-Control':'no-store'}});
  response.headers.append('Set-Cookie',`mth_admin=${sessionToken(expires)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`);return response;
 }catch{return new Response('Sign-in is temporarily unavailable.',{status:503,headers:{'Cache-Control':'no-store'}})}
}
