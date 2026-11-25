import {createHash,createPublicKey,randomBytes,verify} from 'node:crypto';

const AUTH_ENDPOINT='https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT='https://oauth2.googleapis.com/token';
const CERTS_ENDPOINT='https://www.googleapis.com/oauth2/v3/certs';

export function googleClient(){const id=process.env.GOOGLE_CLIENT_ID?.trim();const secret=process.env.GOOGLE_CLIENT_SECRET?.trim();return id&&secret?{id,secret}:null}

export function callbackUrl(origin:string){return origin.replace(/\/+$/,'')+'/api/auth/google/callback'}

export function createState(){return randomBytes(32).toString('base64url')}

export function createPkce(){const verifier=randomBytes(48).toString('base64url');return {verifier,challenge:createHash('sha256').update(verifier).digest('base64url')}}

export function authorizationUrl({origin,state,challenge}:{origin:string;state:string;challenge:string}){
 const client=googleClient();if(!client)throw Error('Google sign-in is not configured');
 const url=new URL(AUTH_ENDPOINT);
 url.searchParams.set('client_id',client.id);
 url.searchParams.set('redirect_uri',callbackUrl(origin));
 url.searchParams.set('response_type','code');
 url.searchParams.set('scope','openid email profile');
 url.searchParams.set('state',state);
 url.searchParams.set('code_challenge',challenge);
 url.searchParams.set('code_challenge_method','S256');
 url.searchParams.set('prompt','select_account');
 const domain=process.env.GOOGLE_ALLOWED_DOMAIN?.trim().replace(/^@/,'');
 if(domain)url.searchParams.set('hd',domain);
 return url.toString();
}

export async function exchangeCode({code,verifier,origin}:{code:string;verifier:string;origin:string}){
 const client=googleClient();if(!client)throw Error('Google sign-in is not configured');
 const response=await fetch(TOKEN_ENDPOINT,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:client.id,client_secret:client.secret,redirect_uri:callbackUrl(origin),grant_type:'authorization_code',code_verifier:verifier})});
 if(!response.ok)throw Error('Google token exchange failed');
 const data=await response.json() as {id_token?:string};
 if(!data.id_token)throw Error('Google did not return an identity token');
 return data.id_token;
}

type Jwk={kid?:string;kty?:string;n?:string;e?:string};
let cachedKeys:{keys:Jwk[];expires:number}|null=null;

async function googleKeys(){
 if(cachedKeys&&cachedKeys.expires>Date.now())return cachedKeys.keys;
 const response=await fetch(CERTS_ENDPOINT,{cache:'no-store'});
 if(!response.ok)throw Error('Google signing keys unavailable');
 const data=await response.json() as {keys?:Jwk[]};
 if(!Array.isArray(data.keys)||data.keys.length===0)throw Error('Google signing keys unavailable');
 const maxAge=Number(/max-age=(\d+)/.exec(response.headers.get('cache-control')||'')?.[1]??3600);
 cachedKeys={keys:data.keys,expires:Date.now()+Math.max(300,Math.min(maxAge,3600))*1000};
 return cachedKeys.keys;
}

const decode=(part:string)=>JSON.parse(Buffer.from(part,'base64url').toString('utf8'));

export type GoogleIdentity={email:string;domain?:string};

export async function verifyIdToken(idToken:string,clientId:string):Promise<GoogleIdentity>{
 const parts=idToken.split('.');
 if(parts.length!==3)throw Error('Malformed identity token');
 const [headerPart,payloadPart,signaturePart]=parts;
 const header=decode(headerPart) as {alg?:string;kid?:string};
 if(header.alg!=='RS256'||!header.kid)throw Error('Unexpected identity token algorithm');
 let jwk=(await googleKeys()).find(key=>key.kid===header.kid);
 if(!jwk){cachedKeys=null;jwk=(await googleKeys()).find(key=>key.kid===header.kid)}
 if(!jwk||!jwk.n||!jwk.e)throw Error('Unknown identity token key');
 const key=createPublicKey({format:'jwk',key:{kty:'RSA',n:jwk.n,e:jwk.e}});
 if(!verify('RSA-SHA256',Buffer.from(headerPart+'.'+payloadPart),key,Buffer.from(signaturePart,'base64url')))throw Error('Identity token signature is invalid');
 const claims=decode(payloadPart) as {iss?:string;aud?:string|string[];exp?:number;iat?:number;email?:string;email_verified?:boolean|string;hd?:string};
 const now=Math.floor(Date.now()/1000);
 if(!['accounts.google.com','https://accounts.google.com'].includes(String(claims.iss)))throw Error('Unexpected identity token issuer');
 const audience=Array.isArray(claims.aud)?claims.aud:[claims.aud];
 if(!audience.includes(clientId))throw Error('Identity token was issued for another application');
 if(!claims.exp||claims.exp<now-30)throw Error('Identity token has expired');
 if(!claims.iat||claims.iat>now+300)throw Error('Identity token is not yet valid');
 if(claims.email_verified!==true&&claims.email_verified!=='true')throw Error('Google account email is not verified');
 if(typeof claims.email!=='string'||!claims.email)throw Error('Google account has no email address');
 const domain=process.env.GOOGLE_ALLOWED_DOMAIN?.trim().toLowerCase().replace(/^@/,'');
 if(domain&&claims.hd&&String(claims.hd).toLowerCase()!==domain)throw Error('Google Workspace domain mismatch');
 return {email:claims.email,domain:claims.hd};
}
