/* ------------------------------------------------------------------
   movimento.js — animações motin, revelações por rolagem, cabeçalho
   compacto, contador numérico dinâmico e recolher do botão flutuante.
   ------------------------------------------------------------------ */

const PARADO = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function revelarTudo() {
  document.querySelectorAll('[data-mov]').forEach((el) => el.classList.add('revelado'));
}

function animarContadores() {
  const contadores = [...document.querySelectorAll('[data-contador]')];
  if (!contadores.length) return;

  const animar = (el) => {
    if (el.dataset.contado === 'sim') return;
    el.dataset.contado = 'sim';

    const alvo = parseInt(el.dataset.contador, 10);
    const prefixo = el.dataset.prefixo || '';
    const sufixo = el.dataset.sufixo || '';
    if (isNaN(alvo)) return;

    if (PARADO()) {
      el.textContent = `${prefixo}${alvo.toLocaleString('pt-BR')}${sufixo}`;
      return;
    }

    const duracao = 1400;
    const inicioTempo = performance.now();

    function frame(agora) {
      const prog = Math.min((agora - inicioTempo) / duracao, 1);
      // Easing out cubic
      const easeOut = 1 - Math.pow(1 - prog, 3);
      const atual = Math.floor(easeOut * alvo);
      el.textContent = `${prefixo}${atual.toLocaleString('pt-BR')}${sufixo}`;
      if (prog < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = `${prefixo}${alvo.toLocaleString('pt-BR')}${sufixo}`;
      }
    }
    requestAnimationFrame(frame);
  };

  if (PARADO() || !('IntersectionObserver' in window)) {
    contadores.forEach(animar);
    return;
  }

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (e.isIntersecting) {
        animar(e.target);
        observador.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  contadores.forEach((el) => observador.observe(el));
}

function revelacoes() {
  const alvos = [...document.querySelectorAll('[data-mov]')];
  if (!alvos.length) return;

  if (PARADO() || !('IntersectionObserver' in window)) { revelarTudo(); return; }

  /* prazo de segurança: se algo impedir o observador, nada fica escondido */
  const salvaguarda = setTimeout(revelarTudo, 2500);

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('revelado');
      observador.unobserve(e.target);
    });
    if (!document.querySelector('[data-mov]:not(.revelado)')) clearTimeout(salvaguarda);
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

  alvos.forEach((el, i) => {
    /* o que já está na tela entra em cascata curta; o resto espera a rolagem */
    const visivel = el.getBoundingClientRect().top < window.innerHeight;
    if (visivel) {
      el.style.setProperty('--atraso', `${Math.min(i, 8) * 70}ms`);
      requestAnimationFrame(() => el.classList.add('revelado'));
    } else {
      observador.observe(el);
    }
  });
}

function cabecalhoCompacto() {
  const cabecalho = document.querySelector('.cabecalho');
  if (!cabecalho) return;
  let ultimo = null;
  const avaliar = () => {
    const compacto = window.scrollY > 80 ? 'sim' : 'nao';
    if (compacto !== ultimo) {
      cabecalho.dataset.compacto = compacto;
      ultimo = compacto;
    }
  };
  avaliar();
  window.addEventListener('scroll', avaliar, { passive: true });
}

/* O botão flutuante do WhatsApp some ao chegar no rodapé */
function botaoFlutuante() {
  const botao = document.querySelector('.zap');
  const rodape = document.querySelector('.rodape');
  if (!botao || !rodape) return;

  let ultimo = null;
  const avaliar = () => {
    const noRodape = rodape.getBoundingClientRect().top < window.innerHeight - 24;
    const estado = noRodape ? 'sim' : 'nao';
    if (estado !== ultimo) {
      botao.dataset.recolhido = estado;
      ultimo = estado;
    }
  };
  avaliar();
  window.addEventListener('scroll', avaliar, { passive: true });
  window.addEventListener('resize', avaliar);
}

export function iniciarMovimento() {
  document.documentElement.classList.add('js-mov');
  revelacoes();
  animarContadores();
  cabecalhoCompacto();
  botaoFlutuante();
}
