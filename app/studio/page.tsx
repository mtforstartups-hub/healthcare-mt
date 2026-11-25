import {AdminLogin} from '../../components/admin-login';
import {ownerSession} from '../../lib/admin';
import Studio from '../../components/studio';
export const dynamic='force-dynamic';
export const metadata={title:'Enquiry Inbox | Marketing Tusk Healthcare',robots:{index:false,follow:false}};
type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
export default async function StudioPage({searchParams}:Props){
 const session=await ownerSession();
 if(!session){const query=await searchParams;return <AdminLogin error={typeof query.error==='string'?query.error:undefined}/>}
 return <><div className="container studio-links"><a className="button primary" href="/studio/content">Manage content</a> <a href="/studio/editorial">Editorial register: 24 healthcare guides</a></div><div className="container"><p className="field-hint">Signed in as {session.email}</p></div><Studio/><div className="container"><form method="post" action="/api/admin-logout"><button className="button secondary" type="submit">Sign out</button></form></div></>;
}
