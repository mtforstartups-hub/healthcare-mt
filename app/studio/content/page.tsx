import {AdminLogin} from '../../../components/admin-login';
import {notFound} from 'next/navigation';
import {canManageEnquiries} from '../../../lib/admin';
import ContentStudio from '../../../components/content-studio';
export const dynamic='force-dynamic';
export const metadata={title:'Content manager | Marketing Tusk Healthcare',robots:{index:false,follow:false}};
export default async function Page(){if(!await canManageEnquiries())return <AdminLogin returnTo="/studio/content"/>;return <ContentStudio/>}
