import { inflateRawSync } from "node:zlib";

const CAND_URL="https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip";
const PHOTO_URL_AP="https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/fotos/foto_cand2026_AP_div.zip";
const PHOTO_URL_BR="https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/fotos/foto_cand2026_BR_div.zip";
const cache=globalThis.__apCandCache||(globalThis.__apCandCache={cands:null,photosAP:null,photosBR:null,loading:null});

function unzipEntries(buf){
  const b=Buffer.from(buf); let eocd=-1;
  for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--){if(b.readUInt32LE(i)===0x06054b50){eocd=i;break}}
  if(eocd<0)throw new Error("ZIP inválido");
  const count=b.readUInt16LE(eocd+10), cdOff=b.readUInt32LE(eocd+16), out=[]; let p=cdOff;
  for(let n=0;n<count;n++){
    if(b.readUInt32LE(p)!==0x02014b50)break;
    const method=b.readUInt16LE(p+10), csize=b.readUInt32LE(p+20), usize=b.readUInt32LE(p+24);
    const nlen=b.readUInt16LE(p+28), xlen=b.readUInt16LE(p+30), clen=b.readUInt16LE(p+32), loff=b.readUInt32LE(p+42);
    const name=b.subarray(p+46,p+46+nlen).toString("utf8");
    const ln=b.readUInt16LE(loff+26), lx=b.readUInt16LE(loff+28), start=loff+30+ln+lx;
    const comp=b.subarray(start,start+csize);
    let data; if(method===0)data=comp; else if(method===8)data=inflateRawSync(comp); else data=null;
    if(data)out.push({name,data,usize});
    p+=46+nlen+xlen+clen;
  }
  return out;
}
function splitCsv(line){const a=[];let q=false,s="";for(let i=0;i<line.length;i++){const ch=line[i];if(ch=='"'&&line[i+1]=='"'){s+='"';i++;continue}if(ch=='"'){q=!q;continue}if(ch===';'&&!q){a.push(s);s="";continue}s+=ch}a.push(s);return a}
async function load(){
  if(cache.cands&&cache.photosAP&&cache.photosBR)return;
  if(cache.loading)return cache.loading;
  cache.loading=(async()=>{
    const [cr,pr,pbr]=await Promise.all([fetch(CAND_URL),fetch(PHOTO_URL_AP),fetch(PHOTO_URL_BR)]);
    if(!cr.ok||!pr.ok||!pbr.ok)throw new Error("Falha ao carregar base oficial");
    const [cz,pz,pbz]=await Promise.all([cr.arrayBuffer(),pr.arrayBuffer(),pbr.arrayBuffer()]);
    const entries=unzipEntries(cz), csvs=entries.filter(e=>/consulta_cand_2026_(AP|BR)\.csv$/i.test(e.name));
    if(!csvs.length)throw new Error("CSV de candidaturas não encontrado");
    const map=new Map();
    for(const cent of csvs){
      const uf=/_(AP|BR)\.csv$/i.exec(cent.name)?.[1]?.toUpperCase()||"AP";
      const txt=cent.data.toString("latin1"), lines=txt.split(/\r?\n/).filter(Boolean), head=splitCsv(lines[0]), ix=n=>head.indexOf(n);
      for(const line of lines.slice(1)){
        const v=splitCsv(line), cargo=v[ix("DS_CARGO")], numero=v[ix("NR_CANDIDATO")];
        if(!numero||!["DEPUTADO FEDERAL","DEPUTADO ESTADUAL","SENADOR","GOVERNADOR","PRESIDENTE"].includes(cargo))continue;
        map.set(uf+"|"+cargo+"|"+numero,{id:v[ix("SQ_CANDIDATO")],numero,nome:v[ix("NM_URNA_CANDIDATO")]||v[ix("NM_CANDIDATO")],partido:v[ix("SG_PARTIDO")],cargo,uf});
      }
    }
    const makePhotos=z=>{const photos=new Map();
    for(const e of unzipEntries(z)){
      const m=e.name.match(/(\d{8,})[^/]*\.(jpe?g|png)$/i); if(!m)continue;
      const mime=/png$/i.test(m[2])?"image/png":"image/jpeg";
      photos.set(m[1],"data:"+mime+";base64,"+e.data.toString("base64"));
    } return photos};
    cache.cands=map;cache.photosAP=makePhotos(pz);cache.photosBR=makePhotos(pbz);
  })().finally(()=>cache.loading=null);
  return cache.loading;
}
const cargoMap={6:"DEPUTADO FEDERAL",7:"DEPUTADO ESTADUAL",5:"SENADOR",3:"GOVERNADOR",1:"PRESIDENTE"};
export default async function handler(req,res){
  res.setHeader("Cache-Control","s-maxage=21600, stale-while-revalidate=86400");
  const cargo=Number(req.query.cargo),numero=String(req.query.numero||"").replace(/\D/g,"");
  if(!cargo||!numero)return res.status(400).json({ok:false,error:"Parâmetros inválidos"});
  
  try{
    await load();
    const uf=cargo===1?"BR":"AP", key=uf+"|"+cargoMap[cargo]+"|"+numero, c=cache.cands.get(key);
    if(!c)return res.status(404).json({ok:false,error:"Número não localizado entre os candidatos do Amapá"});
    const photos=uf==="BR"?cache.photosBR:cache.photosAP;
    return res.status(200).json({ok:true,source:"TSE",candidate:{...c,foto:photos.get(c.id)||""}});
  }catch(e){return res.status(502).json({ok:false,error:"Base oficial temporariamente indisponível",detail:String(e?.message||e)})}
}