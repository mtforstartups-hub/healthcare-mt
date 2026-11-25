import {NextResponse,type NextRequest} from 'next/server';
export function middleware(request:NextRequest){const headers=new Headers(request.headers);headers.set('x-mth-render-path',request.nextUrl.pathname);for(const key of ['oai-authenticated-user-id','oai-authenticated-user-email','oai-authenticated-user-full-name'])headers.delete(key);return NextResponse.next({request:{headers}})}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
