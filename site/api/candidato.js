const BASE = "https://divulgacandcontas.tse.jus.br/divulga/rest/v1";

const cache = globalThis.__colinhaTseCache || (globalThis.__colinhaTseCache = {
  elections: null,
  lists: new Map()
});

const headers = {
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "pt-BR,pt;q=0.9",
  "User-Agent": "Mozilla/5.0",
  "Referer": "https://divulgacandcontas.tse.jus.br/divulga/",
  "Origin": "https://divulgacandcontas.tse.jus.br"
};

async function getJson(url) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error("TSE " + r.status);
  return r.json();
}

function collectElectionIds(value, out = new Set()) {
  if (!value) return out;
  if (Array.isArray(value)) {
    for (const item of value) collectElectionIds(item, out);
    return out;
  }
  if (typeof value !== "object") return out;

  const year = Number(value.ano || value.anoEleicao || value.nrAno || 0);
  const name = String(value.nomeEleicao || value.descricao || value.nome || "").toLowerCase();
  const looks2026 = year === 2026 || name.includes("2026");

  if (looks2026) {
    for (const key of ["id", "sqEleicao", "codigo", "idEleicao"]) {
      const n = Number(value[key]);
      if (Number.isFinite(n) && n > 100) out.add(String(value[key]));
    }
  }
  for (const v of Object.values(value)) collectElectionIds(v, out);
  return out;
}

async function electionIds() {
  if (cache.elections?.length) return cache.elections;
  const ids = new Set(["20322002026"]);

  try {
    const ord = await getJson(BASE + "/eleicao/ordinarias");
    collectElectionIds(ord, ids);
  } catch {}

  cache.elections = [...ids];
  return cache.elections;
}

function candidateArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.candidatos)) return data.candidatos;
  if (Array.isArray(data?.candidados)) return data.candidados;
  for (const v of Object.values(data || {})) {
    if (Array.isArray(v) && v.some(x => x && typeof x === "object" && ("numero" in x || "nr_CANDIDATO" in x))) return v;
  }
  return [];
}

async function listCandidates(ue, election, cargo) {
  const key = [ue, election, cargo].join(":");
  if (cache.lists.has(key)) return cache.lists.get(key);

  const url = BASE + "/candidatura/listar/2026/" + encodeURIComponent(ue) + "/" + encodeURIComponent(election) + "/" + encodeURIComponent(cargo) + "/candidatos";
  const data = await getJson(url);
  const list = candidateArray(data);
  cache.lists.set(key, list);
  return list;
}

function normalizeCandidate(c) {
  return {
    id: c.id || c.sq_CANDIDATO || c.sqCandidato || null,
    numero: String(c.numero ?? c.nr_CANDIDATO ?? c.nrCandidato ?? ""),
    nome: c.nomeUrna || c.nm_URNA || c.nomeCompleto || c.nm_CANDIDATO || "",
    partido: c.partido?.sigla || c.sg_PARTIDO || c.siglaPartido || "",
    foto: c.fotoUrl || c.urlFoto || c.foto || "",
    situacao: c.descricaoSituacao || c.situacaoCandidato || c.descricaoTotalizacao || ""
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  const cargo = Number(req.query.cargo);
  const numero = String(req.query.numero || "").replace(/\D/g, "");

  if (!cargo || !numero) {
    return res.status(400).json({ ok:false, error:"Parâmetros inválidos" });
  }

  // Cargos estaduais/federais desta colinha são sempre consultados no Amapá.
  // Presidente é uma candidatura nacional.
  const ue = cargo === 1 ? "BR" : "AP";

  // Reconhecimento local da identidade da própria candidata, sem depender de rede.
  if (cargo === 7 && numero === "44577") {
    return res.status(200).json({
      ok:true,
      source:"local",
      candidate:{
        id:null,
        numero:"44577",
        nome:"Elizete Trindade",
        partido:"UNIÃO",
        foto:"/assets/img/retrato-candidatura-560.jpg",
        situacao:""
      }
    });
  }

  try {
    const ids = await electionIds();
    for (const election of ids) {
      try {
        const list = await listCandidates(ue, election, cargo);
        const found = list.map(normalizeCandidate).find(c => c.numero === numero);
        if (found) {
          return res.status(200).json({ ok:true, candidate:found, source:"TSE", ue });
        }
      } catch {}
    }
    return res.status(404).json({ ok:false, error:"Candidatura não localizada no " + (ue === "AP" ? "Amapá" : "Brasil") });
  } catch {
    return res.status(502).json({ ok:false, error:"Fonte oficial temporariamente indisponível" });
  }
}