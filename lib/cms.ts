import {env} from './runtime';
import {editorial,type Editorial,type Block} from './editorial';
import {publishedGuides,guidePath,guideCover} from './pilot';

export const cmsEntries:Editorial[]=[...editorial,...publishedGuides.map(g=>({
 ...g,path:guidePath(g),kind:'guide',summary:g.description,seoDescription:g.description,
 author:'Marketing Tusk Healthcare',related:[],release:'Approved guides',
 blocks:g.blocks,service:g.service,sector:g.sector,
}))];
export type Copy=Pick<Editorial,'title'|'summary'|'seoTitle'|'seoDescription'|'answer'|'blocks'>;
type RecordRow={path:string;draft:string|null;live:string|null;visibility:string;revision:number};

async function read<T>(fn:()=>Promise<T>,fallback:T):Promise<T>{
 if(!env.DB)return fallback;
 try{return await fn()}catch(e){if(String(e).includes('no such table'))return fallback;throw e}
}
export const cmsBase=(path:string)=>cmsEntries.find(x=>x.path===path);
export async function cmsRow(path:string){return read(()=>env.DB!.prepare('SELECT * FROM cms_overrides WHERE path=?').bind(path).first<RecordRow>(),null)}
export async function publicCopy<T extends Editorial>(entry:T):Promise<T|null>{
 const row=await cmsRow(entry.path);
 return row?.visibility==='hidden'?null:row?.live?{...entry,...JSON.parse(row.live)}:entry;
}
export async function publicEntries(entries:Editorial[]){
 const rows=await read(async()=> (await env.DB!.prepare('SELECT path,live,visibility FROM cms_overrides').all<RecordRow>()).results,[]);
 const map=new Map(rows.map(r=>[r.path,r]));
 return entries.flatMap(e=>{const r=map.get(e.path);return r?.visibility==='hidden'?[]:[r?.live?{...e,...JSON.parse(r.live)}:e]});
}
export async function saveCopy(path:string,action:string,copy:Copy,revision:number){
 if(!env.DB)throw Error('Database unavailable.');
 const value=JSON.stringify(copy);
 if(revision===0){try{const r=await env.DB.prepare('INSERT INTO cms_overrides(path,draft,live,visibility,revision) VALUES(?,?,?,?,1)').bind(path,value,action==='publish'?value:null,action==='hide'?'hidden':'live').run();return r.meta.changes===1}catch(e:any){if(e?.code==='ER_DUP_ENTRY')return false;throw e}}
 const r=await env.DB.prepare("UPDATE cms_overrides SET draft=?,live=CASE WHEN ?='publish' THEN ? ELSE live END,visibility=CASE WHEN ?='draft' THEN visibility ELSE ? END,revision=revision+1 WHERE path=? AND revision=?").bind(value,action,value,action,action==='hide'?'hidden':'live',path,revision).run();return r.meta.changes===1;
}
export function validateCopy(data:Record<string,unknown>,base:Editorial):Copy|null{
 const limits={title:180,summary:500,seoTitle:160,seoDescription:500,answer:5000} as const;
 const copy={} as Copy;
 for(const key of Object.keys(limits) as (keyof typeof limits)[]){
  const v=data[key];if(typeof v!=='string'||!v.trim()||v.length>limits[key])return null;
  copy[key]=v.trim();
 }
 if(!Array.isArray(data.blocks)||data.blocks.length>120)return null;
 const originals=new Map([...base.blocks.filter(b=>b.type==='image'),...(base.legacyImages??[])].map(b=>[b.src,b]));
 const blocks:Block[]=[];
 for(const b of data.blocks){
  if(!b||typeof b!=='object')return null;
  if(b.type==='image'){const src=originals.get(b.src);if(!src)return null;blocks.push(src);continue}
  if(b.type==='bullets'){if(!Array.isArray(b.items)||b.items.length>60||b.items.some((x:unknown)=>typeof x!=='string'||x.length>4000))return null;blocks.push({type:b.type,items:b.items});continue}
  if(!['heading','subheading','paragraph'].includes(b.type)||typeof b.text!=='string'||!b.text.trim()||b.text.length>12000)return null;
  blocks.push({type:b.type,text:b.text});
 }
 copy.blocks=blocks;
 return copy;
}
export const pilotPublic=(path:string)=>cmsBase(path);
