const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const records=require('../content/editorial.json'),report=require('../content/master-import-report.json');
const all=[...records,...require('../content/field-notes.json'),...require('../content/pilot-guides.json').map(x=>({...x,path:'/guides/'+x.slug}))];
test('master merges 80 existing and 160 new records with no duplicate URL, ID or title',()=>{
 assert.equal(records.length,240);assert.equal(records.filter(x=>x.kind==='guide').length,60);assert.equal(records.filter(x=>x.kind==='answer').length,180);
 assert.equal(report.updatedExistingPaths.length,80);assert.equal(report.addedPaths.length,160);
 for(const key of ['path','title'])assert.equal(new Set(all.map(x=>x[key].trim().toLowerCase())).size,all.length);
 assert.equal(new Set(records.map(x=>x.id)).size,240);
});
test('every imported image exists and captions and direct answers are retained',()=>{
 for(const x of records){assert.ok(x.answer);assert.ok(x.seoTitle);assert.ok(x.seoDescription);assert.equal(x.sourceStatus,'review');
 for(const b of x.blocks){assert.notEqual(b.type,'directAnswer');if(b.type==='image'){assert.ok(b.alt);assert.ok(fs.existsSync('public'+b.src));}}}
 for(const path of report.importedAssets)assert.ok(fs.existsSync('public'+path));
});
test('internal editorial and CTA links resolve to current routes and form values',()=>{
 const site=require('../content/site.json'),forms=require('../content/form-options.json');
 const paths=new Set([...all.map(x=>x.path),...site.pages.map(x=>x.path),'/guides','/answers']);
 for(const x of records)for(const match of JSON.stringify(x.blocks).matchAll(/\]\((\/[^)]+)\)/g)){
 const url=new URL(match[1],'https://healthcare.marketingtusk.com');assert.ok(paths.has(url.pathname),url.pathname);
 if(url.pathname==='/contact'){assert.equal(url.searchParams.get('intent'),'audit');if(url.searchParams.has('service'))assert.ok(forms.services.some(x=>x.key===url.searchParams.get('service')));if(url.searchParams.has('icp'))assert.ok(forms.sectors.some(x=>x.id===url.searchParams.get('icp')));}}
});
test('CMS accepts every imported entry and previously saved image references',()=>{
 const compiled=ts.transpileModule(fs.readFileSync('lib/cms.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(compiled,{exports,require:n=>n==='cloudflare:workers'?{env:{}}:n==='./editorial'?{editorial:records}:n==='./pilot'?{publishedGuides:[]}:null,Map,JSON});
 for(const record of records){assert.ok(exports.validateCopy(record,record),record.path);for(const image of record.legacyImages??[])assert.ok(exports.validateCopy({...record,blocks:[image]},record));assert.equal(exports.validateCopy({...record,blocks:[{type:'image',src:'https://example.com/unknown.svg'}]},record),null);}
});
