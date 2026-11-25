import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export const metadata={title:'Website admin | Marketing Tusk Healthcare',robots:{index:false,follow:false}};
export default function Access(){redirect('/studio')}
