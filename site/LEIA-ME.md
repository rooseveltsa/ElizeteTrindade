# Site de Elizete Trindade — prévia

Site estático, sem dependências de build. Abra `index.html` por um servidor
HTTP local (o `file://` bloqueia a leitura do canvas na exportação do PNG):

    python3 -m http.server 8765

## Direção visual

Verde oficial sobre superfícies claras, sem tema escuro: a identidade da
campanha é fixa. Título e rótulos em Archivo, que repete o esqueleto quadrado
do logotipo oficial; texto corrido em Source Serif 4, para dar ao conteúdo
peso de documento.

A página tem três blocos e um rodapé, e cada um faz uma coisa só:

    herói         cartaz oficial em sangria + instrução da urna e ação
    compromissos  sequência editorial numerada, em filetes, sem cartões
    foto          ferramenta de moldura
    rodapé        marca, canais oficiais e CNPJ

O herói abre com o cartaz oficial em sangria, com a folga inferior aparada no
desktop para que a faixa de identificação já apareça na primeira tela; no
celular a arte aparece inteira.

A faixa verde-mata logo abaixo não repete a arte. Cargo, nome e número já estão
no cartaz, e o texto alternativo da imagem os repete para quem não enxerga. A
faixa é uma tira de ação e nada mais: a instrução da urna e o botão, lado a lado.
O `<h1>` da página vive ali em `.apenas-leitor`, fora da tela mas dentro do
fluxo, porque busca e leitor de tela precisam dele e a arte já ocupa o lugar
visual do nome.

O lema "O Amapá merece mais forte, mais justo e humano" foi retirado da página a
pedido do responsável. Ele não está na arte do cartaz, então hoje não aparece em
lugar nenhum do site. Fica guardado em `conteudo/dados.json`, em `candidatura`,
caso a campanha queira trazê-lo de volta.

Nada se repete de um bloco para o outro. O menu aparece uma vez, e abaixo de
620px fica só "Minha foto", porque os compromissos vêm logo depois do herói e
não precisam de atalho. Não há faixa de contato, não há barra fixa e não há
menu sanfonado. O WhatsApp tem um botão flutuante que se recolhe ao chegar no
rodapé, onde o mesmo número já está em texto.

## Organização

    index.html            conteúdo (HTML semântico, funciona sem JavaScript)
    conteudo/dados.json   dados verificados e suas origens; pendências declaradas
    css/tokens.css        cores, tipografia, espaçamento e medidas
    css/base.css          reset, tipografia base, acessibilidade
    css/layout.css        envoltório, cabeçalho, herói, faixas e rodapé
    css/components.css    botões, compromissos, botão flutuante
    css/moldura.css       interface da ferramenta de foto
    js/navegacao.js       links internos e destaque da seção atual
    js/movimento.js       revelações, cabeçalho compacto, botão flutuante
    js/moldura/config.js  parâmetros da ferramenta
    js/moldura/arquivo.js validação e leitura do arquivo enviado
    js/moldura/enquadramento.js  posição e ampliação
    js/moldura/desenho.js composição no canvas
    js/moldura/index.js   ligação com a interface
    js/app.js             ponto de entrada
    build.py              empacota tudo em um arquivo único (pasta dist/)
    brand-source/         recortes em alta das peças oficiais (não vão ao ar)
    _medir.html           varre larguras e acusa vazamento horizontal
    _resp.html            põe a página lado a lado em várias larguras

Os dois arquivos com sublinhado na frente são ferramentas de conferência. Não
entram no empacotamento e não devem ir ao ar. Ambos reapontam as folhas de
estilo ao carregar, porque o servidor de prévia não manda cabeçalho de cache e
o Chrome reaproveita CSS antigo sem isso.

## A moldura oficial

A arte em uso é a oficial, em `assets/img/moldura-oficial.webp`, com o recorte
em alta guardado em `brand-source/moldura-oficial-1254.png`. Ela é um círculo
com uma janela transparente à esquerda, onde entra a fotografia do apoiador.

Se a campanha mandar uma arte nova, troque o arquivo e meça de novo os dois
valores de `js/moldura/config.js`, ambos em frações do lado da imagem:

- `janela` é a caixa que envolve a área transparente, em x, y, largura e
  altura;
- `foco` é o centro do maior círculo que cabe dentro dessa janela, e é onde o
  rosto é ancorado.

## Como a prévia corresponde ao arquivo baixado

A tela de prévia tem 1080 × 1080 pixels de verdade e é apenas reduzida por CSS.
O download é essa mesma tela, sem nova renderização, então não há como a prévia
divergir do arquivo. O botão "Círculo / Arquivo" alterna entre o recorte que os
aplicativos aplicam e o quadrado completo, com o círculo seguro tracejado.

## Textos

A página não traz notas de processo. Tudo o que falta de conteúdo está
registrado em `conteudo/dados.json`, na chave `pendencias`, e em comentários
HTML no ponto exato onde o material entrará.

Os quatro compromissos reproduzem o material de campanha já publicado, palavra
por palavra. Nenhuma promessa foi criada para preencher seção, e nenhuma
mudança de composição alterou uma vírgula desse texto.

Os textos de apoio da ferramenta de foto foram encurtados: as instruções que os
três passos numerados já davam saíram da introdução, que ficou só com a garantia
de que nada sai do aparelho.

As figuras recortadas saem das fotografias originais por remoção de fundo de
estúdio. Rosto, expressão, corpo e roupas não foram alterados.

## Publicação

`dist/elizete-trindade.html` é o site inteiro em um arquivo, com imagens
embutidas — útil para hospedar a prévia em qualquer lugar. A substituição do
site publicado depende de aprovação.

Antes de publicar em domínio próprio: trocar `og:image` por uma URL absoluta.
O CNPJ 68.430.706/0001-27 está no rodapé e na arte oficial do herói.
