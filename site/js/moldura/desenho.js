/* ------------------------------------------------------------------
   desenho.js — composição da imagem.

   A tela de prévia tem exatamente 1080 × 1080 pixels e é reduzida por
   CSS. O arquivo baixado é essa mesma tela, sem nova renderização.
   ------------------------------------------------------------------ */

import { retangulo } from './enquadramento.js';

export function desenhar(ctx, lado, enq, moldura, opcoes = {}) {
  ctx.save();
  ctx.clearRect(0, 0, lado, lado);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, lado, lado);

  if (enq.imagem) {
    const r = retangulo(enq, lado);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(enq.imagem, r.x, r.y, r.largura, r.altura);

    /* fora do círculo a arte é transparente: deixamos branco para que o
       arquivo quadrado pareça um selo redondo. */
    ctx.beginPath();
    ctx.rect(0, 0, lado, lado);
    ctx.arc(lado / 2, lado / 2, lado / 2 - 1, 0, Math.PI * 2, true);
    ctx.fillStyle = '#ffffff';
    ctx.fill('evenodd');
  }

  if (moldura) ctx.drawImage(moldura, 0, 0, lado, lado);
  ctx.restore();
}

/** Carrega uma imagem (moldura ou fotografia de exemplo). */
export function carregarImagem(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('imagem'));
    img.src = src;
  });
}
