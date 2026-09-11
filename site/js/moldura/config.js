/* ------------------------------------------------------------------
   config.js — parâmetros da ferramenta de moldura.

   A moldura oficial é um círculo com uma janela transparente à esquerda,
   onde entra a fotografia do apoiador. Os valores de `janela` e `foco`
   foram medidos no próprio arquivo e são frações do lado da imagem.
   Ao trocar a arte, meça de novo (ver LEIA-ME.md).
   ------------------------------------------------------------------ */

export const CONFIG = {
  /* lado do PNG exportado, em pixels */
  tamanho: 1080,

  /* nome do arquivo entregue ao visitante */
  nomeArquivo: 'foto-elizete-trindade.png',

  /* moldura oficial da campanha */
  molduraSrc: 'assets/img/moldura-oficial.webp',

  /* área transparente da moldura */
  janela: { x: 0.0593, y: 0.0472, largura: 0.6306, altura: 0.6324 },

  /* centro do maior círculo livre dentro da janela: é onde o rosto fica */
  foco: { x: 0.3296, y: 0.3269 },

  /* altura relativa do rosto numa fotografia comum de retrato */
  ancoraRosto: 0.40,

  /* folga sobre a janela no enquadramento inicial */
  folgaInicial: 1.25,

  /* formatos aceitos no envio */
  tiposAceitos: ['image/jpeg', 'image/png', 'image/webp'],
  extensoesAceitas: ['jpg', 'jpeg', 'png', 'webp'],

  /* limite de tamanho do arquivo enviado */
  tamanhoMaximoBytes: 20 * 1024 * 1024,

  /* ampliação máxima sobre o enquadramento inicial */
  zoomMaximo: 4,

  /* deslocamento por toque de seta, em pixels da imagem exportada */
  passoTeclado: 24,
};
