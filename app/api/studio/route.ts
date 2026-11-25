import {env} from '../../../lib/runtime';
import {canManageEnquiries} from '../../../lib/admin';
import {json,validOrigin} from '../../../lib/intake';
import {openPayload,sealPayload} from '../../../lib/security';
export async function GET(request:Request){
 if(!await canManageEnquiries())return json({error:'Owner access is required.'},403);
 if(!env.DB||!env.INTAKE_ENCRYPTION_KEY)return json({error:'The enquiry inbox is unavailable.'},503);
 try{const q=new URL(request.url).searchParams;const before=Number(q.get('before'))||Date.now()+1;
 const rows=await env.DB.prepare('SELECT * FROM requests WHERE created_at<? AND expires_at>? ORDER BY created_at DESC LIMIT 51').bind(before,Date.now()).all<any>();const subset=rows.results.slice(0,50);
 const items=await Promise.all(subset.map(async r=>({reference:r.reference,kind:r.kind,status:r.status,created_at:r.created_at,details:await openPayload(r.encrypted_payload,env.INTAKE_ENCRYPTION_KEY!)})));
 const totals=await env.DB.prepare('SELECT kind,count(*) AS total FROM requests WHERE expires_at>? GROUP BY kind').bind(Date.now()).all<{kind:string,total:number}>();
 return json({items,totals:totals.results,next_before:rows.results.length>50?subset[subset.length-1].created_at:null});
 }catch{return json({error:'The inbox could not be loaded. Please try again.'},503)}
}
export async function PATCH(request:Request){
 if(!validOrigin(request)||!await canManageEnquiries())return json({error:'Owner access is required.'},403);if(!env.DB)return json({error:'The inbox is unavailable.'},503);
 try{
  const raw=await request.text();if(raw.length>12000)return json({error:'The change is too large.'},413);
  const {reference,status,changes}=JSON.parse(raw);
  if(typeof reference!=='string'||!/^MTH-[A-F0-9]{12}$/.test(reference)||!['new','contacted','qualified','closed','archived'].includes(status))return json({error:'Please check the requested change.'},400);
  const row=await env.DB.prepare('SELECT encrypted_payload FROM requests WHERE reference=? AND expires_at>?').bind(reference,Date.now()).first<{encrypted_payload:string}>();
  if(!row)return json({error:'Enquiry not found.'},404);
  if(!changes){await env.DB.prepare('UPDATE requests SET status=? WHERE reference=?').bind(status,reference).run();return json({saved:true})}
  if(!env.INTAKE_ENCRYPTION_KEY)return json({error:'The inbox is unavailable.'},503);
  const details=await openPayload(row.encrypted_payload,env.INTAKE_ENCRYPTION_KEY) as Record<string,unknown>;
  const limits={name:120,organization:160,email:254,phone:40,city:100,internal_notes:3500,assignee:100,follow_up:10} as const;
  for(const key of Object.keys(limits) as (keyof typeof limits)[]){
   if(!Object.hasOwn(changes,key))continue;
   const v=changes[key];if(typeof v!=='string'||v.length>limits[key])return json({error:'Check the length of '+key+'.'},400);
   if(key==='email'&&v&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))return json({error:'Enter a valid email.'},400);
   if(key==='follow_up'&&v&&!/^\d{4}-\d{2}-\d{2}$/.test(v))return json({error:'Enter a valid follow-up date.'},400);
   details[key]=v.trim();
  }
  const sealed=await sealPayload(details,env.INTAKE_ENCRYPTION_KEY);
  const result=await env.DB.prepare('UPDATE requests SET status=?,encrypted_payload=? WHERE reference=? AND encrypted_payload=?').bind(status,sealed,reference,row.encrypted_payload).run();
  if(!result.meta.changes)return json({error:'This record changed. Refresh and try again.'},409);
  return json({saved:true,details});
 }catch{return json({error:'The enquiry could not be updated.'},503)}
}
