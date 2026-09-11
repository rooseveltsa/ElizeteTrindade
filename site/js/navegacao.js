/* ------------------------------------------------------------------
   navegacao.js — links internos e destaque da seção atual.

   O cabeçalho tem duas entradas apenas, que cabem lado a lado em
   qualquer largura. Não há painel a abrir, então não há menu aqui.
   ------------------------------------------------------------------ */

/**
 * Leva a página até uma seção, descontando a altura do cabeçalho fixo.
 * Fazemos isso à mão porque a rolagem por âncora não é confiável quando
 * a página roda dentro de um quadro, como no ambiente de prévia.
 */
function irPara(destino) {
  const alvo = document.querySelector(destino);
  if (!alvo) return false;
  const cabecalho = document.querySelector('.cabecalho');
  const folga = (cabecalho ? cabecalho.getBoundingClientRect().height : 0) + 8;
  const topo = alvo.getBoundingClientRect().top + window.scrollY - folga;
  const parado = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: Math.max(0, topo), behavior: parado ? 'auto' : 'smooth' });
  if (history.replaceState) history.replaceState(null, '', destino);
  alvo.setAttribute('tabindex', '-1');
  alvo.focus({ preventScroll: true });
  return true;
}

function ligarLinksInternos() {
  document.addEventListener('click', (ev) => {
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey) return;
    const link = ev.target.closest('a[href^="#"]');
    if (!link) return;
    const destino = link.getAttribute('href');
    if (!destino || destino === '#') return;
    if (irPara(destino)) ev.preventDefault();
  });
}

function secaoAtual() {
  const links = [...document.querySelectorAll('.navegacao__lista a')];
  const alvos = links
    .map((a) => {
      const id = a.getAttribute('href') || '';
      return id.startsWith('#') ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if (!alvos.length || !('IntersectionObserver' in window)) return;

  const visiveis = new Set();
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (e.isIntersecting) visiveis.add(e.target.id);
      else visiveis.delete(e.target.id);
    });
    const atual = alvos.map((s) => s.id).find((id) => visiveis.has(id));
    links.forEach((a) => {
      if (atual && a.getAttribute('href') === `#${atual}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });

  alvos.forEach((s) => observador.observe(s));
}

export function iniciarNavegacao() {
  ligarLinksInternos();
  secaoAtual();
}
