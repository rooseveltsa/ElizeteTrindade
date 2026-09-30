#!/usr/bin/env python3
import csv, io, json, os, re, shutil, urllib.request, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DATA = ROOT / "site" / "data"
OUT_IMG = ROOT / "site" / "assets" / "candidatos-ap"
OUT_DATA.mkdir(parents=True, exist_ok=True)
OUT_IMG.mkdir(parents=True, exist_ok=True)

CAND_URL = "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip"
PHOTO_URL = "https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/fotos/foto_cand2026_AP_div.zip"
CARGOS = {"GOVERNADOR", "SENADOR", "DEPUTADO FEDERAL", "DEPUTADO ESTADUAL"}

def download(url):
    req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()

def decode_csv(raw):
    for enc in ("utf-8-sig","latin-1","cp1252"):
        try: return raw.decode(enc)
        except UnicodeDecodeError: pass
    return raw.decode("utf-8", errors="replace")

cand_zip = zipfile.ZipFile(io.BytesIO(download(CAND_URL)))
csv_names = [n for n in cand_zip.namelist() if n.lower().endswith(".csv")]
ap_names = [n for n in csv_names if re.search(r"(_AP|AP_)\.csv$", n, re.I)]
rows = []
for name in (ap_names or csv_names):
    text = decode_csv(cand_zip.read(name))
    reader = csv.DictReader(io.StringIO(text), delimiter=";")
    for row in reader:
        if (row.get("SG_UF") or "").strip().upper() != "AP": continue
        cargo = (row.get("DS_CARGO") or "").strip().upper()
        if cargo not in CARGOS: continue
        rows.append(row)

photo_zip = zipfile.ZipFile(io.BytesIO(download(PHOTO_URL)))
photo_members = [n for n in photo_zip.namelist() if n.lower().endswith((".jpg",".jpeg",".png"))]
photo_by_digits = {}
for member in photo_members:
    digits = re.findall(r"\d{8,}", Path(member).stem)
    for d in digits:
        photo_by_digits[d] = member

# clear only managed candidate photos
for p in OUT_IMG.glob("*"):
    if p.is_file(): p.unlink()

db = {"updated_from":"TSE Dados Abertos 2026","uf":"AP","candidates":{}}
seen = set()
for row in rows:
    sq = (row.get("SQ_CANDIDATO") or "").strip()
    numero = (row.get("NR_CANDIDATO") or "").strip()
    cargo = (row.get("DS_CARGO") or "").strip().upper()
    if not sq or not numero: continue
    key = cargo + ":" + numero
    if key in seen: continue
    seen.add(key)

    photo_rel = ""
    member = photo_by_digits.get(sq)
    if member:
        ext = Path(member).suffix.lower()
        if ext == ".jpeg": ext = ".jpg"
        dest = OUT_IMG / f"{sq}{ext}"
        with photo_zip.open(member) as src, open(dest, "wb") as dst:
            shutil.copyfileobj(src, dst)
        photo_rel = f"assets/candidatos-ap/{dest.name}"

    item = {
        "numero": numero,
        "nome": (row.get("NM_URNA_CANDIDATO") or row.get("NM_CANDIDATO") or "").strip(),
        "partido": (row.get("SG_PARTIDO") or "").strip(),
        "cargo": cargo,
        "sq": sq,
        "foto": photo_rel,
        "situacao": (row.get("DS_SITUACAO_CANDIDATURA") or row.get("DS_SITUACAO_CANDIDATO_URNA") or "").strip()
    }
    db["candidates"][key] = item

with open(OUT_DATA / "candidatos-ap.json","w",encoding="utf-8") as f:
    json.dump(db,f,ensure_ascii=False,separators=(",",":"))

print(f"AP candidates: {len(db['candidates'])}; photos saved: {len(list(OUT_IMG.glob('*')))}")
