import 'server-only';
import mysql from 'mysql2/promise';
let pool:mysql.Pool|undefined;
export function database(){
 if(!process.env.DB_HOST||!process.env.DB_USER||!process.env.DB_NAME||!process.env.DB_PASSWORD)throw Error('Database configuration missing');
 return pool??=mysql.createPool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,connectionLimit:5,supportBigNumbers:true});
}
type Runner={execute:(sql:string,params:any[])=>Promise<any>};
export class Statement{
 params:any[]=[];constructor(public sql:string){} bind(...params:any[]){this.params=params;return this}
 async first<T=any>():Promise<T|null>{const [rows]=await database().execute(this.sql,this.params);return ((rows as any[])[0]??null) as T|null}
 async all<T=any>():Promise<{results:T[]}>{const [rows]=await database().execute(this.sql,this.params);return {results:rows as T[]}}
 async run(){const [result]=await database().execute(this.sql,this.params);return {meta:{changes:(result as mysql.ResultSetHeader).affectedRows}}}
}
export const DB={prepare:(sql:string)=>new Statement(sql),async batch(stmts:Statement[]){const c=await database().getConnection();try{await c.beginTransaction();for(const s of stmts)await c.execute(s.sql,s.params);await c.commit()}catch(e){await c.rollback();throw e}finally{c.release()}}};
export async function incrementRate(key:string,expires:number){const c=await database().getConnection();try{await c.beginTransaction();await c.execute('INSERT INTO rate_limits (`key`,`count`,expires_at) VALUES (?,1,?) ON DUPLICATE KEY UPDATE `count`=`count`+1',[key,expires]);const [rows]=await c.execute('SELECT `count` FROM rate_limits WHERE `key`=? FOR UPDATE',[key]);await c.commit();return Number((rows as any[])[0].count)}catch(e){await c.rollback();throw e}finally{c.release()}}
