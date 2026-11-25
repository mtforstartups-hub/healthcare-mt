import {AdminLogin} from '../../components/admin-login';
import {canManageEnquiries} from '../../lib/admin';
import Studio from '../../components/studio';
export const dynamic='force-dynamic';
export const metadata={title:'Enquiry Inbox | Marketing Tusk Healthcare',robots:{index:false,follow:false}};
export default async function StudioPage(){if(await canManageEnquiries())return <><div className="container studio-links"><a className="button primary" href="/studio/content">Manage content</a> <a href="/studio/editorial">Editorial register: 24 healthcare guides</a></div><Studio/><div className="container"><form method="post" action="/api/admin-logout"><button className="button secondary" type="submit">Sign out</button></form></div></>;return <AdminLogin/>;}
