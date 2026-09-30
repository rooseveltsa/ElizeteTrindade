import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec=promisify(execFile),root=process.cwd(),tmp=path.join(root,".tmp-tse"),out=path.join(root,"assets","candidatos-ap");
const dataUrl="https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip";
const photoUrl="https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/fotos/foto_cand2026_AP_div.zip";
await fs.rm(tmp,{recursive:true,force:true});await fs.mkdir(tmp,{recursive:true});await fs.mkdir(out,{recursive:true});
async function dl(url,file){await exec("curl",["-L","--fail","--retry","3","-A","Mozilla/5.0",url,"-o",file])}
await dl(dataUrl,path.join(tmp,"cand.zip"));await dl(photoUrl,path.join(tmp,"photos.zip"));
await exec("unzip",["-q",path.join(tmp,"cand.zip"),"-d",path.join(tmp,"cand")]);await exec("unzip",["-q",path.join(tmp,"photos.zip"),"-d",path.join(tmp,"photos")]);
const files=await fs.readdir(path.join(tmp,"cand"));const ap=files.find(x=>/consulta_cand_2026_AP\.csv$/i.test(x));if(!ap)throw new Error("CSV AP nao encontrado");
const raw=await fs.readFile(path.join(tmp,"cand",ap),"latin1");
const lines=raw.split(/\r?\n/).filter(Boolean),split=s=>{const a=[];let q=false,c="";for(let i=0;i<s.length;i++){const ch=s[i];if(ch==='"'&&s[i+1]==='"'){c+='"';i++;continue}if(ch==='"'){q=!q;continue}if(ch===';'&&!q){a.push(c);c="";continue}c+=ch}a.push(c);return a};
const head=split(lines[0]),ix=n=>head.indexOf(n),allowed=new Set(["DEPUTADO FEDERAL","DEPUTADO ESTADUAL","SENADOR","GOVERNADOR","VICE-GOVERNADOR"]);
const rows=[];
for(const line of lines.slice(1)){const v=split(line),cargo=v[ix("DS_CARGO")];if(!allowed.has(cargo))continue;rows.push({id:v[ix("SQ_CANDIDATO")],numero:v[ix("NR_CANDIDATO")],nome:v[ix("NM_URNA_CANDIDATO")]||v[ix("NM_CANDIDATO")],partido:v[ix("SG_PARTIDO")],cargo,situacao:v[ix("DS_SITUACAO_CANDIDATURA")]||"",foto:""})}
async function walk(d){let a=[];for(const e of await fs.readdir(d,{withFileTypes:true})){const p=path.join(d,e.name);a=e.isDirectory()?a.concat(await walk(p)):a.concat(p)}return a}
const photos=await walk(path.join(tmp,"photos"));for(const c of rows){const p=photos.find(x=>new RegExp("(^|[^0-9])"+c.id+"([^0-9]|$)").test(path.basename(x)));if(p){const ext=path.extname(p).toLowerCase()||".jpg",name=c.id+ext;await fs.copyFile(p,path.join(out,name));c.foto="/assets/candidatos-ap/"+name}}
await fs.writeFile(path.join(out,"candidatos.json"),JSON.stringify({uf:"AP",ano:2026,atualizadoEm:new Date().toISOString(),candidatos:rows},null,2));
console.log("Candidatos AP:",rows.length,"fotos:",rows.filter(x=>x.foto).length);