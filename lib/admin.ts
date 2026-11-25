import 'server-only';
import {cookies} from 'next/headers';
import {readSession,SESSION_COOKIE,type Session} from './session';

export async function ownerSession():Promise<Session|null>{
 try{return readSession((await cookies()).get(SESSION_COOKIE)?.value)}catch{return null}
}

export async function ownerEmail(){return (await ownerSession())?.email??null}

export async function canManageEnquiries(){return !!(await ownerSession())}
