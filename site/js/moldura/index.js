/* ------------------------------------------------------------------
   index.js — ligação entre a interface e a lógica da moldura.
   ------------------------------------------------------------------ */

import { CONFIG } from './config.js';
import { validar, decodificar, descartar, MENSAGENS } from './arquivo.js';
import { criar, definirImagem, mover, ampliar, redefinir } from './enquadramento.js';
import { desenhar, carregarImagem } from './desenho.js';

const LADO = CONFIG.tamanho;

export function iniciarMoldura(raiz) {
  if (!raiz) return;

  const el = (id) => raiz.querySelector(`#${id}`);
  const palco      = el('moldura-palco');
  const tela       = el('moldura-tela');
  const vazio      = el('moldura-vazio');
  const entrada    = el('moldura-arquivo');
  const solta      = el('moldura-solta');
  const escolher   = el('moldura-escolher');
  const trocar     = el('moldura-trocar');
  const zoom       = el('moldura-zoom');
  const zoomSaida  = el('moldura-zoom-saida');
  const zoomMenos  = el('moldura-zoom-menos');
  const zoomMais   = el('moldura-zoom-mais');
  const centralizar= el('moldura-centralizar');
  const baixar     = el('moldura-baixar');
  const abrir      = el('moldura-abrir');
  const estado     = el('moldura-estado');
  const erro       = el('moldura-erro');
  const legenda    = el('moldura-legenda');
  const dialogo    = el('dialogo-salvar');
  const dialogoImg = el('dialogo-imagem');
  const dialogoFim = el('dialogo-fechar');
  const formaBotoes= raiz.querySelectorAll('[data-forma-alvo]');

  const ctx = tela.getContext('2d', { alpha: false });
  const enq = criar();

  let moldura = null;
  let demonstracao = true;
  let urlAtual = null;

  /* -------------------------------------------------- mensagens */

  function dizer(texto) { estado.textContent = texto || ''; }

  function falhar(texto) {
    erro.textContent = texto;
    erro.hidden = false;
  }

  function limparFalha() {
    erro.hidden = true;
    erro.textContent = '';
  }

  /* -------------------------------------------------- renderização */

  function render() {
    desenhar(ctx, LADO, enq, moldura);
    zoom.min = String(enq.zoomMinimo);
    zoom.value = String(enq.zoom);
    zoomSaida.textContent = `${Math.round(enq.zoom * 100)}%`;
    zoomMenos.disabled = enq.zoom <= enq.zoomMinimo + 0.001;
    zoomMais.disabled = enq.zoom >= CONFIG.zoomMaximo - 0.001;
  }

  function aplicarZoom(alvo, ancoraX = 0, ancoraY = 0) {
    ampliar(enq, alvo, CONFIG, ancoraX, ancoraY);
    render();
  }

  function atualizarDisponibilidade() {
    const pronto = !!enq.imagem && !demonstracao;
    baixar.disabled = !pronto;
    abrir.disabled = !pronto;
    trocar.hidden = demonstracao;
    escolher.textContent = demonstracao ? 'Escolher fotografia' : 'Escolher outra fotografia';
  }

  /* -------------------------------------------------- carregamento */

  async function usarArquivo(arquivo) {
    limparFalha();
    const teste = validar(arquivo, CONFIG);
    if (!teste.ok) { falhar(teste.mensagem); return; }

    dizer('Abrindo a fotografia…');
    let imagem;
    try {
      imagem = await decodificar(arquivo);
    } catch (e) {
      falhar(MENSAGENS.leitura);
      dizer('');
      return;
    }
    if (!imagem || !imagem.width || !imagem.height) {
      falhar(MENSAGENS.leitura);
      dizer('');
      return;
    }

    if (!demonstracao) descartar(enq.imagem);
    definirImagem(enq, imagem, CONFIG);
    demonstracao = false;
    vazio.hidden = true;
    palco.dataset.entrou = 'sim';
    setTimeout(() => { delete palco.dataset.entrou; }, 700);
    legenda.textContent = 'Arraste a fotografia para posicionar e use o controle de ampliação.';
    atualizarDisponibilidade();
    render();
    dizer('Fotografia carregada. Ajuste o enquadramento e baixe o PNG.');
  }

  async function usarDemonstracao() {
    try {
      const img = await carregarImagem('assets/img/retrato-candidatura-560.jpg');
      if (!demonstracao) return;
      definirImagem(enq, img, CONFIG);
      vazio.hidden = true;
      render();
    } catch (e) {
      vazio.hidden = false;
    }
  }

  /* -------------------------------------------------- entrada de arquivo */

  escolher.addEventListener('click', () => entrada.click());
  trocar.addEventListener('click', () => entrada.click());

  entrada.addEventListener('change', () => {
    const arquivo = entrada.files && entrada.files[0];
    if (arquivo) usarArquivo(arquivo);
    entrada.value = '';
  });

  ['dragenter', 'dragover'].forEach((nome) => {
    [solta, palco].forEach((alvo) => alvo.addEventListener(nome, (ev) => {
      ev.preventDefault();
      solta.dataset.sobre = 'sim';
    }));
  });
  ['dragleave', 'dragend'].forEach((nome) => {
    [solta, palco].forEach((alvo) => alvo.addEventListener(nome, () => {
      solta.dataset.sobre = 'nao';
    }));
  });
  [solta, palco].forEach((alvo) => alvo.addEventListener('drop', (ev) => {
    ev.preventDefault();
    solta.dataset.sobre = 'nao';
    const arquivo = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
    if (arquivo) usarArquivo(arquivo);
  }));

  /* -------------------------------------------------- arrastar e ampliar */

  const ponteiros = new Map();
  let ultimo = null;
  let pinca = null;

  function paraTela(ev) {
    const r = tela.getBoundingClientRect();
    const k = LADO / r.width;
    return { x: (ev.clientX - r.left) * k - LADO / 2, y: (ev.clientY - r.top) * k - LADO / 2 };
  }

  tela.addEventListener('pointerdown', (ev) => {
    if (!enq.imagem) return;
    tela.setPointerCapture(ev.pointerId);
    ponteiros.set(ev.pointerId, paraTela(ev));
    if (ponteiros.size === 1) {
      ultimo = ponteiros.get(ev.pointerId);
    } else if (ponteiros.size === 2) {
      const [a, b] = [...ponteiros.values()];
      pinca = {
        distancia: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        zoom: enq.zoom,
        ancoraX: (a.x + b.x) / 2,
        ancoraY: (a.y + b.y) / 2,
      };
      ultimo = null;
    }
  });

  tela.addEventListener('pointermove', (ev) => {
    if (!ponteiros.has(ev.pointerId) || !enq.imagem) return;
    const ponto = paraTela(ev);
    ponteiros.set(ev.pointerId, ponto);

    if (ponteiros.size === 2 && pinca) {
      const [a, b] = [...ponteiros.values()];
      const distancia = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      aplicarZoom(pinca.zoom * (distancia / pinca.distancia), pinca.ancoraX, pinca.ancoraY);
      return;
    }
    if (ultimo) {
      mover(enq, ponto.x - ultimo.x, ponto.y - ultimo.y, CONFIG);
      ultimo = ponto;
      render();
    }
  });

  function soltarPonteiro(ev) {
    ponteiros.delete(ev.pointerId);
    if (ponteiros.size < 2) pinca = null;
    if (ponteiros.size === 1) ultimo = [...ponteiros.values()][0];
    if (ponteiros.size === 0) ultimo = null;
  }
  tela.addEventListener('pointerup', soltarPonteiro);
  tela.addEventListener('pointercancel', soltarPonteiro);

  tela.addEventListener('wheel', (ev) => {
    if (!enq.imagem) return;
    ev.preventDefault();
    const ponto = paraTela(ev);
    aplicarZoom(enq.zoom * Math.exp(-ev.deltaY * 0.0016), ponto.x, ponto.y);
  }, { passive: false });

  tela.addEventListener('keydown', (ev) => {
    if (!enq.imagem) return;
    const passo = CONFIG.passoTeclado * (ev.shiftKey ? 4 : 1);
    const mapa = {
      ArrowLeft:  [-passo, 0],
      ArrowRight: [passo, 0],
      ArrowUp:    [0, -passo],
      ArrowDown:  [0, passo],
    };
    if (mapa[ev.key]) {
      ev.preventDefault();
      mover(enq, mapa[ev.key][0], mapa[ev.key][1], CONFIG);
      render();
      return;
    }
    if (ev.key === '+' || ev.key === '=') { ev.preventDefault(); aplicarZoom(enq.zoom + 0.1); }
    if (ev.key === '-' || ev.key === '_') { ev.preventDefault(); aplicarZoom(enq.zoom - 0.1); }
    if (ev.key === 'Home') {
      ev.preventDefault();
      redefinir(enq, CONFIG);
      render();
      dizer('Enquadramento restaurado.');
    }
  });

  /* -------------------------------------------------- controles visíveis */

  zoom.max = String(CONFIG.zoomMaximo);
  zoom.step = '0.01';
  zoom.addEventListener('input', () => aplicarZoom(parseFloat(zoom.value)));
  zoomMenos.addEventListener('click', () => aplicarZoom(enq.zoom - 0.15));
  zoomMais.addEventListener('click', () => aplicarZoom(enq.zoom + 0.15));

  centralizar.addEventListener('click', () => {
    redefinir(enq, CONFIG);
    render();
    dizer('Enquadramento restaurado.');
  });

  formaBotoes.forEach((botao) => {
    botao.addEventListener('click', () => {
      const alvo = botao.dataset.formaAlvo;
      palco.dataset.forma = alvo;
      formaBotoes.forEach((b) => b.setAttribute('aria-pressed', String(b === botao)));
      render();
    });
  });

  /* -------------------------------------------------- exportação */

  let capacidadeDownload = null;
  if (window.claude && typeof window.claude.use === 'function') {
    window.claude.use('downloads')
      .then((cap) => { capacidadeDownload = cap; })
      .catch(() => { capacidadeDownload = null; });
  }

  function gerarBlob() {
    return new Promise((resolve, reject) => {
      tela.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('png'))), 'image/png');
    });
  }

  function baixarPeloNavegador(blob) {
    if (urlAtual) URL.revokeObjectURL(urlAtual);
    urlAtual = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlAtual;
    a.download = CONFIG.nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  baixar.addEventListener('click', async () => {
    if (baixar.disabled) return;
    limparFalha();
    dizer('Preparando o arquivo…');
    let blob;
    try {
      blob = await gerarBlob();
    } catch (e) {
      falhar('Não foi possível gerar o PNG neste navegador. Use a opção "Abrir para salvar".');
      dizer('');
      return;
    }
    if (capacidadeDownload) {
      try {
        await capacidadeDownload.save({ filename: CONFIG.nomeArquivo, data: blob });
        dizer(`Arquivo ${CONFIG.nomeArquivo} salvo.`);
        return;
      } catch (falha) {
        if (falha && falha.code === 'declined') { dizer('Download cancelado.'); return; }
        /* qualquer outro caso segue pelo caminho do navegador */
      }
    }
    baixarPeloNavegador(blob);
    dizer(`Arquivo ${CONFIG.nomeArquivo} gerado. Verifique a pasta de downloads.`);
  });

  abrir.addEventListener('click', () => {
    if (abrir.disabled) return;
    dialogoImg.src = tela.toDataURL('image/png');
    if (typeof dialogo.showModal === 'function') dialogo.showModal();
    else dialogo.setAttribute('open', '');
  });

  function fecharDialogo() {
    if (typeof dialogo.close === 'function') dialogo.close();
    else dialogo.removeAttribute('open');
  }
  dialogoFim.addEventListener('click', fecharDialogo);

  /* -------------------------------------------------- partida */

  atualizarDisponibilidade();
  render();

  carregarImagem(CONFIG.molduraSrc)
    .then((img) => { moldura = img; render(); })
    .catch(() => {
      falhar('A moldura não pôde ser carregada. Recarregue a página.');
    })
    .finally(usarDemonstracao);
}
