export async function POST(request:Request){
 if(request.headers.get('origin')!==process.env.APP_ORIGIN)return new Response('Invalid request',{status:403});
 return new Response(null,{status:303,headers:{Location:'/studio','Set-Cookie':'mth_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0','Cache-Control':'no-store'}});
}
