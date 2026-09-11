/* ------------------------------------------------------------------
   apoio.js — cadastro de apoio oficial, emissão do cartão digital de
   apoiador, contador dinâmico e celebração com confetes em canvas.
   ------------------------------------------------------------------ */

// Confetes leves em canvas nativo sem bibliotecas
export function dispararConfetes(elementoOrigem) {
  let canvas = document.getElementById('confetes-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetes-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const cores = ['#0a5c2a', '#17803a', '#6ba610', '#fbb800', '#fcde5c', '#ffffff', '#0055aa'];
  const particulas = [];
  const quantidade = 80;

  let origemX = canvas.width / 2;
  let origemY = canvas.height / 3;

  if (elementoOrigem) {
    const rect = elementoOrigem.getBoundingClientRect();
    origemX = rect.left + rect.width / 2;
    origemY = rect.top + rect.height / 2;
  }

  for (let i = 0; i < quantidade; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const velocidade = 3 + Math.random() * 8;
    particulas.push({
      x: origemX,
      y: origemY,
      vx: Math.cos(angulo) * velocidade,
      vy: Math.sin(angulo) * velocidade - 4,
      tamanho: 6 + Math.random() * 8,
      cor: cores[Math.floor(Math.random() * cores.length)],
      rotacao: Math.random() * Math.PI * 2,
      vRotacao: (Math.random() - 0.5) * 0.2,
      vida: 1,
      decaimento: 0.012 + Math.random() * 0.015,
      gravidade: 0.18,
    });
  }

  let animId = null;
  function animar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let vivas = 0;

    particulas.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravidade;
      p.rotacao += p.vRotacao;
      p.vida -= p.decaimento;

      if (p.vida > 0) {
        vivas++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotacao);
        ctx.globalAlpha = Math.max(0, p.vida);
        ctx.fillStyle = p.cor;
        ctx.fillRect(-p.tamanho / 2, -p.tamanho / 2, p.tamanho, p.tamanho * 0.6);
        ctx.restore();
      }
    });

    if (vivas > 0) {
      animId = requestAnimationFrame(animar);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animId);
    }
  }

  animar();
}

window.dispararConfetes = dispararConfetes;

export function iniciarApoio(raiz = document) {
  const form = raiz.querySelector('#form-apoio');
  const cartaoBox = raiz.querySelector('#cartao-apoiador-container');
  const contadorEl = raiz.querySelector('#contador-apoiadores');
  const campoTelefone = raiz.querySelector('#apoio-whatsapp');

  // Máscara de telefone/WhatsApp
  if (campoTelefone) {
    campoTelefone.addEventListener('input', (e) => {
      let valor = e.target.value.replace(/\D/g, '');
      if (valor.length > 11) valor = valor.slice(0, 11);

      if (valor.length > 10) {
        valor = valor.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      } else if (valor.length > 6) {
        valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
      } else if (valor.length > 2) {
        valor = valor.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
      } else if (valor.length > 0) {
        valor = valor.replace(/^(\d*)$/, '($1');
      }
      e.target.value = valor;
    });
  }

  // Contador de Apoiadores
  let totalApoiadores = 1438;
  const apoioSalvo = localStorage.getItem('apoio_elizete_44577');

  if (apoioSalvo) {
    totalApoiadores++;
  }

  function atualizarContador(animar = false) {
    if (!contadorEl) return;
    if (!animar) {
      contadorEl.textContent = totalApoiadores.toLocaleString('pt-BR');
      return;
    }

    let inicio = totalApoiadores - 25;
    const fim = totalApoiadores;
    const duracao = 1200;
    const inicioTempo = performance.now();

    function passo(agora) {
      const progresso = Math.min((agora - inicioTempo) / duracao, 1);
      const valor = Math.floor(inicio + (fim - inicio) * progresso);
      contadorEl.textContent = valor.toLocaleString('pt-BR');
      if (progresso < 1) {
        requestAnimationFrame(passo);
      }
    }
    requestAnimationFrame(passo);
  }

  atualizarContador(false);

  // Exibir Cartão Digital
  function renderizarCartao(dados) {
    if (!cartaoBox) return;

    const dataFormatada = dados.data || new Date().toLocaleDateString('pt-BR');
    const idApoiador = dados.id || `44577-${Math.floor(1000 + Math.random() * 9000)}`;

    cartaoBox.innerHTML = `
      <div class="cartao-apoiador animar-surgir">
        <div class="cartao-apoiador__topo">
          <div class="cartao-apoiador__marca">
            <img src="assets/img/marca-elizete-trindade-420.png" alt="Elizete Trindade 44.577">
          </div>
          <span class="cartao-apoiador__selo">APOIADOR(A) OFICIAL</span>
        </div>

        <div class="cartao-apoiador__corpo">
          <div class="cartao-apoiador__foto">
            <img src="assets/img/selo-amapa-44577.jpg" alt="Amapá com Elizete Trindade">
          </div>
          <div class="cartao-apoiador__info">
            <p class="cartao-apoiador__rotulo">Certificado de Apoio Popular</p>
            <h4 class="cartao-apoiador__nome">${dados.nome}</h4>
            <p class="cartao-apoiador__municipio">${dados.cidade || 'Amapá'} · AP</p>
            <p class="cartao-apoiador__lema">"O Amapá merece mais forte, mais justo e humano."</p>
          </div>
        </div>

        <div class="cartao-apoiador__rodape">
          <div class="cartao-apoiador__codigo">
            <span>REGISTRO ELEITORAL</span>
            <strong>#${idApoiador}</strong>
          </div>
          <div class="cartao-apoiador__data">
            <span>DATA</span>
            <strong>${dataFormatada}</strong>
          </div>
          <div class="cartao-apoiador__urna">
            <span>VOTE</span>
            <strong>44.577</strong>
          </div>
        </div>

        <div class="cartao-apoiador__acoes">
          <a class="botao botao--primario botao--zap" 
             href="https://api.whatsapp.com/send?text=${encodeURIComponent(
               `Declarei meu apoio oficial a Elizete Trindade 44.577 para Deputada Estadual! Junte-se a nós por um Amapá mais forte, justo e humano. Acesse e gere seu cartão de apoio também: `
             )}${encodeURIComponent(window.location.href)}" 
             target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Z"/></svg>
            Compartilhar no WhatsApp
          </a>

          <a class="botao botao--discreto" 
             href="https://wa.me/5596991175205?text=${encodeURIComponent(
               `Olá Elizete! Sou ${dados.nome} de ${dados.cidade || 'Amapá'}. Acabei de me cadastrar no site oficial e estou com você no 44.577!`
             )}" 
             target="_blank" rel="noopener">
            Falar com a Campanha Oficial
          </a>

          <button class="botao botao--link" type="button" id="btn-novo-apoio">
            Cadastrar outra pessoa
          </button>
        </div>
      </div>
    `;

    cartaoBox.hidden = false;
    if (form) form.hidden = true;

    const btnNovo = cartaoBox.querySelector('#btn-novo-apoio');
    if (btnNovo) {
      btnNovo.addEventListener('click', () => {
        cartaoBox.hidden = true;
        if (form) {
          form.hidden = false;
          form.reset();
        }
      });
    }
  }

  // Se já tinha apoio salvo, exibe o cartão
  if (apoioSalvo) {
    try {
      const dados = JSON.parse(apoioSalvo);
      renderizarCartao(dados);
    } catch (e) {
      localStorage.removeItem('apoio_elizete_44577');
    }
  }

  // Tratamento do Envio do Formulário
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nome = form.querySelector('#apoio-nome').value.trim();
      const zap = form.querySelector('#apoio-whatsapp').value.trim();
      const cidade = form.querySelector('#apoio-cidade').value;
      const interesse = [...form.querySelectorAll('input[name="interesse"]:checked')].map(el => el.value);

      if (!nome || nome.length < 3) {
        alert('Por favor, informe seu nome completo.');
        return;
      }

      if (!cidade) {
        alert('Por favor, selecione seu município no Amapá.');
        return;
      }

      const idApoiador = `44577-${Math.floor(1000 + Math.random() * 9000)}`;
      const dataHoje = new Date().toLocaleDateString('pt-BR');

      const dados = {
        nome,
        whatsapp: zap,
        cidade,
        interesse,
        id: idApoiador,
        data: dataHoje,
      };

      try {
        localStorage.setItem('apoio_elizete_44577', JSON.stringify(dados));
      } catch (err) {
        // Ignora falhas de cota
      }

      totalApoiadores++;
      atualizarContador(true);
      renderizarCartao(dados);
      dispararConfetes(cartaoBox);

      // Rola suave até o cartão
      cartaoBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}
