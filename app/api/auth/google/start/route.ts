import {authorizationUrl,createPkce,createState,googleClient} from '../../../../../lib/google';
import {STATE_COOKIE,VERIFIER_COOKIE} from '../../../../../lib/session';

export const dynamic='force-dynamic';

const RETURN_PATH=/^\/studio(?:\/[A-Za-z0-9_-]+)*\/?$/;

function finish(location:string){
 return new Response(null,{status:303,headers:{Location:location,'Cache-Control':'no-store'}});
}

export async function GET(request:Request){
 const origin=(process.env.APP_ORIGIN||'').replace(/\/+$/,'');
 if(!origin)return new Response('Sign-in is not configured.',{status:503,headers:{'Cache-Control':'no-store'}});
 if(!googleClient())return finish(origin+'/studio?error=config');
 const requested=new URL(request.url).searchParams.get('returnTo')||'/studio';
 const returnTo=RETURN_PATH.test(requested)?requested:'/studio';
 const state=createState()+'.'+Buffer.from(returnTo,'utf8').toString('base64url');
 const {verifier,challenge}=createPkce();
 const response=finish(authorizationUrl({origin,state,challenge}));
 response.headers.append('Set-Cookie',`${STATE_COOKIE}=${state}; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
 response.headers.append('Set-Cookie',`${VERIFIER_COOKIE}=${verifier}; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
 return response;
}
