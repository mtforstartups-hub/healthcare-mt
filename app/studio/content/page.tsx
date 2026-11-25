import {AdminLogin} from '../../../components/admin-login';
import {canManageEnquiries} from '../../../lib/admin';
import ContentStudio from '../../../components/content-studio';
export const dynamic='force-dynamic';
export const metadata={title:'Content manager | Marketing Tusk Healthcare',robots:{index:false,follow:false}};
type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
export default async function Page({searchParams}:Props){
 if(!await canManageEnquiries()){const query=await searchParams;return <AdminLogin returnTo="/studio/content" error={typeof query.error==='string'?query.error:undefined}/>}
 return <ContentStudio/>;
}
