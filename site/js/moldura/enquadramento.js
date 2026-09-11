/* ------------------------------------------------------------------
   enquadramento.js — posição e ampliação da fotografia.

   Tudo é calculado nas coordenadas da imagem exportada (1080 × 1080),
   por isso a prévia e o arquivo final compartilham a mesma conta.
   A fotografia só precisa cobrir a janela transparente da moldura;
   o resto do quadrado é arte opaca.
   ------------------------------------------------------------------ */

function janelaEmPixels(cfg) {
  const lado = cfg.tamanho;
  return {
    x: cfg.janela.x * lado,
    y: cfg.janela.y * lado,
    largura: cfg.janela.largura * lado,
    altura: cfg.janela.altura * lado,
  };
}

export function criar() {
  return { imagem: null, base: 1, zoom: 1, zoomMinimo: 1, x: 0, y: 0 };
}

/** Retângulo de destino da fotografia dentro do quadrado. */
export function retangulo(enq, lado) {
  const escala = enq.base * enq.zoom;
  const largura = enq.imagem.width * escala;
  const altura = enq.imagem.height * escala;
  return {
    x: (lado - largura) / 2 + enq.x,
    y: (lado - altura) / 2 + enq.y,
    largura,
    altura,
  };
}

/** A fotografia nunca pode deixar um canto da janela descoberto. */
export function limitar(enq, cfg) {
  if (!enq.imagem) return enq;
  const lado = cfg.tamanho;
  const j = janelaEmPixels(cfg);
  const escala = enq.base * enq.zoom;
  const largura = enq.imagem.width * escala;
  const altura = enq.imagem.height * escala;

  const maiorX = j.x - (lado - largura) / 2;
  const menorX = j.x + j.largura - largura - (lado - largura) / 2;
  const maiorY = j.y - (lado - altura) / 2;
  const menorY = j.y + j.altura - altura - (lado - altura) / 2;

  enq.x = Math.min(Math.max(enq.x, Math.min(menorX, maiorX)), Math.max(menorX, maiorX));
  enq.y = Math.min(Math.max(enq.y, Math.min(menorY, maiorY)), Math.max(menorY, maiorY));
  return enq;
}

/**
 * Enquadramento inicial: a fotografia entra com folga sobre a janela e
 * o rosto cai no centro da área livre da moldura.
 */
export function redefinir(enq, cfg) {
  if (!enq.imagem) return enq;
  const lado = cfg.tamanho;
  enq.zoom = 1;
  const altura = enq.imagem.height * enq.base;
  enq.x = cfg.foco.x * lado - lado / 2;
  enq.y = cfg.foco.y * lado - lado / 2 + altura * (0.5 - cfg.ancoraRosto);
  return limitar(enq, cfg);
}

export function definirImagem(enq, imagem, cfg) {
  const lado = cfg.tamanho;
  const j = janelaEmPixels(cfg);
  const cobreJanela = Math.max(j.largura / imagem.width, j.altura / imagem.height);
  enq.imagem = imagem;
  enq.base = cobreJanela * cfg.folgaInicial;
  enq.zoomMinimo = 1 / cfg.folgaInicial;
  return redefinir(enq, cfg);
}

export function mover(enq, dx, dy, cfg) {
  if (!enq.imagem) return enq;
  enq.x += dx;
  enq.y += dy;
  return limitar(enq, cfg);
}

/**
 * Amplia mantendo fixo o ponto (ancoraX, ancoraY), medido a partir do
 * centro do quadrado. Sem âncora, amplia pelo centro.
 */
export function ampliar(enq, zoomAlvo, cfg, ancoraX = 0, ancoraY = 0) {
  if (!enq.imagem) return enq;
  const anterior = enq.zoom;
  const novo = Math.min(cfg.zoomMaximo, Math.max(enq.zoomMinimo, zoomAlvo));
  if (novo === anterior) return enq;
  const razao = novo / anterior;
  enq.zoom = novo;
  enq.x = ancoraX - (ancoraX - enq.x) * razao;
  enq.y = ancoraY - (ancoraY - enq.y) * razao;
  return limitar(enq, cfg);
}
