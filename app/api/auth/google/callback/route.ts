import {exchangeCode,googleClient,verifyIdToken} from '../../../../../lib/google';
import {cookieValue,isAllowedEmail,issueSession,SESSION_COOKIE,SESSION_MAX_AGE,STATE_COOKIE,VERIFIER_COOKIE} from '../../../../../lib/session';

export const dynamic='force-dynamic';

const RETURN_PATH=/^\/studio(?:\/[A-Za-z0-9_-]+)*\/?$/;

function redirect(location:string){return new Response(null,{status:303,headers:{Location:location,'Cache-Control':'no-store'}})}
function clear(name:string){return `${name}=; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0`}
function fail(origin:string,code:string){
 const response=redirect(origin+'/studio?error='+code);
 response.headers.append('Set-Cookie',clear(STATE_COOKIE));
 response.headers.append('Set-Cookie',clear(VERIFIER_COOKIE));
 return response;
}
function requestedPath(state:string){
 const part=state.split('.')[1];
 if(!part)return null;
 try{const value=Buffer.from(part,'base64url').toString('utf8');return RETURN_PATH.test(value)?value:null}catch{return null}
}

export async function GET(request:Request){
 const origin=(process.env.APP_ORIGIN||'').replace(/\/+$/,'');
 if(!origin)return new Response('Sign-in is not configured.',{status:503,headers:{'Cache-Control':'no-store'}});
 const client=googleClient();
 if(!client)return fail(origin,'config');
 const url=new URL(request.url);
 if(url.searchParams.get('error'))return fail(origin,'denied');
 const code=url.searchParams.get('code');
 const state=url.searchParams.get('state');
 const storedState=cookieValue(request.headers.get('cookie'),STATE_COOKIE);
 const verifier=cookieValue(request.headers.get('cookie'),VERIFIER_COOKIE);
 if(!code||!state||!storedState||state!==storedState||!verifier)return fail(origin,'state');
 try{
  const idToken=await exchangeCode({code,verifier,origin});
  const identity=await verifyIdToken(idToken,client.id);
  if(!isAllowedEmail(identity.email))return fail(origin,'domain');
  const response=redirect(origin+(requestedPath(state)??'/studio'));
  // SameSite must stay Lax: the redirect back from Google is a cross-site
  // navigation, and Strict would withhold the new cookie on the first request
  // to /studio, showing the sign-in page until a manual refresh.
  response.headers.append('Set-Cookie',`${SESSION_COOKIE}=${issueSession(identity.email)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE/1000}`);
  response.headers.append('Set-Cookie',clear(STATE_COOKIE));
  response.headers.append('Set-Cookie',clear(VERIFIER_COOKIE));
  return response;
 }catch{return fail(origin,'failed')}
}
