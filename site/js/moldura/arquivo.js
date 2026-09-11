/* ------------------------------------------------------------------
   arquivo.js — validação e leitura da fotografia enviada.
   Tudo acontece no navegador: nenhum byte é enviado a um servidor.
   ------------------------------------------------------------------ */

export const MENSAGENS = {
  tipo: 'Formato não aceito. Envie uma fotografia em JPEG, PNG ou WebP.',
  tamanho: 'A imagem passa do limite de 20 MB. Envie um arquivo menor.',
  vazio: 'Nenhuma imagem foi selecionada.',
  leitura: 'Não foi possível abrir esta imagem. O arquivo pode estar danificado. Tente outra fotografia.',
};

function extensao(nome) {
  const partes = String(nome || '').toLowerCase().split('.');
  return partes.length > 1 ? partes.pop() : '';
}

/**
 * Verifica formato e tamanho antes de qualquer processamento.
 * @returns {{ok: boolean, mensagem?: string}}
 */
export function validar(arquivo, config) {
  if (!arquivo) return { ok: false, mensagem: MENSAGENS.vazio };

  const tipoConhecido = arquivo.type && config.tiposAceitos.includes(arquivo.type);
  const extensaoConhecida = config.extensoesAceitas.includes(extensao(arquivo.name));

  /* alguns sistemas entregam o arquivo sem tipo declarado; nesse caso
     a extensão decide. Tipo declarado e não aceito é recusa direta. */
  if (arquivo.type && !tipoConhecido) return { ok: false, mensagem: MENSAGENS.tipo };
  if (!arquivo.type && !extensaoConhecida) return { ok: false, mensagem: MENSAGENS.tipo };

  if (arquivo.size > config.tamanhoMaximoBytes) {
    return { ok: false, mensagem: MENSAGENS.tamanho };
  }
  return { ok: true };
}

/**
 * Decodifica a fotografia respeitando a orientação gravada pela câmera.
 * @returns {Promise<ImageBitmap|HTMLImageElement>}
 */
export async function decodificar(arquivo) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
    } catch (erro) {
      /* segue para o caminho alternativo */
    }
  }
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decodificacao')); };
    img.src = url;
  });
}

/** Libera a memória de um ImageBitmap anterior. */
export function descartar(imagem) {
  if (imagem && typeof imagem.close === 'function') imagem.close();
}
