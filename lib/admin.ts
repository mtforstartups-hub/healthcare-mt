import 'server-only';
import {cookies} from 'next/headers';
import {createHmac,timingSafeEqual} from 'node:crypto';
const cookieName='mth_admin';
export function sessionToken(expiry:number){const secret=process.env.ADMIN_SESSION_SECRET;if(!secret||secret.length<32)throw Error('Admin session secret missing');const value=String(expiry);return value+'.'+createHmac('sha256',secret).update(value).digest('hex')}
export async function canManageEnquiries(){try{const token=(await cookies()).get(cookieName)?.value??'';const [exp,signature,...extra]=token.split('.');if(extra.length||!/^\d{13}$/.test(exp)||!/^\w{64}$/.test(signature)||Number(exp)<Date.now()||Number(exp)>Date.now()+12*3600000)return false;const expected=sessionToken(Number(exp)).split('.')[1];return timingSafeEqual(Buffer.from(expected),Buffer.from(signature))}catch{return false}}
