# Elizete Trindade — Deputada Estadual (Amapá) · 44.577

Plataforma oficial da campanha de **Elizete Trindade** a Deputada Estadual pelo Estado do Amapá — **União Brasil · Número 44.577**.

🌐 **Site no ar**: [vote44577.vercel.app](https://vote44577.vercel.app)

---

## 📌 Funcionalidades Principais

- **Urna Eletrônica Interativa**:
  - Simulador realista com teclado numérico tátil oficial (teclas grandes de 58–70px, relevo na tecla 5, teclas Branco, Corrige e Confirma).
  - Som autêntico do TSE gerado em tempo real via Web Audio API (1320 Hz com sequência oficial de confirmação).
  - Atalho rápido "Votar 44577 com 1 clique".

- **Declaração de Apoio Popular & Cartão Digital**:
  - Formulário otimizado para celulares com os 16 municípios do Amapá e máscara de WhatsApp.
  - Emissão imediata do **Cartão Oficial de Apoiador Digital** personalizado com número de registro eleitoral.
  - Botão de compartilhamento direto no WhatsApp em 1 clique e chuva de confetes comemorativa.

- **Estúdio de Foto de Perfil (Moldura Oficial)**:
  - Ferramenta nativa em Canvas HTML5 (sem envio de fotos para servidores, 100% no navegador).
  - Exportação em alta resolução (1080 × 1080) e prévia em círculo para foto de perfil do WhatsApp.
  - Controles de zoom, centralização e ajuste intuitivo por toque/arraste.

- **Storytelling e Compromissos**:
  - Apresentação da candidata com foco em transparência e atuação nas comunidades.
  - 4 eixos de compromissos com resumo objetivo: Saúde nos Municípios, Educação e Juventude, Empreendedorismo e Renda, Família e Proteção Social.

- **Mobile First & Performance**:
  - 100% responsivo para todos os dispositivos (360px a 1440px+).
  - Alto contraste nível AAA (zero texto verde-sobre-verde).
  - Sem dependências pesadas de bibliotecas ou frameworks, carregamento instantâneo.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 Semântico**
- **CSS3 Moderno**: Custom Properties (Tokens), Flexbox, CSS Grid, animações suaves com suporte a `prefers-reduced-motion`.
- **Vanilla JavaScript (ES Modules)**:
  - Web Audio API (síntese sonora da urna)
  - Canvas 2D API (composição de moldura de fotos e confetes)
  - LocalStorage (persistência do cartão de apoiador)
- **Deploy**: Vercel (Produção em `https://vote44577.vercel.app`)

---

## 📁 Estrutura do Projeto

```
├── site/
│   ├── assets/img/          # Imagens, marcas e retratos oficiais
│   ├── css/                 # Folhas de estilo modulares (tokens, layout, components, moldura, movimento)
│   ├── js/                  # Módulos JS (app, urna, apoio, moldura, navegacao, movimento)
│   ├── dist/                # Pacotes compilados de distribuição única
│   ├── build.py             # Script de empacotamento em arquivo único
│   └── index.html           # Página principal da aplicação
├── vercel.json              # Configurações de deploy no Vercel
├── .gitignore               # Arquivos ignorados pelo Git
└── README.md                # Documentação do repositório
```

---

## ⚖️ Informações Legais

- **Candidata**: Elizete Trindade — Deputada Estadual (Amapá)
- **Partido**: União Brasil (UNIÃO) · Número: 44.577
- **CNPJ de Campanha**: 68.430.706/0001-27
- **WhatsApp Oficial**: (96) 99117-5205
