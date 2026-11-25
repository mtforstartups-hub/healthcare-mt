import {canManageEnquiries} from '../../../../lib/admin';
import {json,validOrigin} from '../../../../lib/intake';
import {cmsBase,cmsEntries,cmsRow,saveCopy,validateCopy} from '../../../../lib/cms';
export async function GET(req:Request){
 if(!await canManageEnquiries())return json({error:'Owner access is required.'},403);
 const path=new URL(req.url).searchParams.get('path');
 if(!path)return json({items:cmsEntries.map(({path,title,kind})=>({path,title,kind}))});
 const item=cmsBase(path);if(!item)return json({error:'Content not found.'},404);
 try{const r=await cmsRow(path);return json({item:r?.draft?{...item,...JSON.parse(r.draft)}:item,revision:r?.revision??0,hidden:r?.visibility==='hidden',hasDraft:!!r?.draft&&r.draft!==r.live});}
 catch{return json({error:'Content could not be loaded.'},503)}
}
export async function PATCH(req:Request){
 if(!validOrigin(req)||!await canManageEnquiries())return json({error:'Owner access is required.'},403);
 try{
  const raw=await req.text();if(raw.length>180000)return json({error:'Content is too long.'},413);
  const {path,action,item,revision}=JSON.parse(raw);
  const base=cmsBase(path);
  if(!base||!item||!['draft','publish','hide'].includes(action)||!Number.isSafeInteger(revision)||revision<0)return json({error:'Invalid content change.'},400);
  const copy=validateCopy(item,base);if(!copy)return json({error:'Check required fields and content lengths.'},400);
  if(!await saveCopy(path,action,copy,revision))return json({error:'This entry changed. Reopen it before saving.'},409);
  return json({saved:true,revision:revision+1});
 }catch{return json({error:'Content could not be saved.'},503)}
}
