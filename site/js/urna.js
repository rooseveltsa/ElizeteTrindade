/* ------------------------------------------------------------------
   urna.js — simulador interativo da urna eletrônica para 44.577.
   Gera áudio por Web Audio API (sem dependência externa) e permite ao
   eleitor experimentar o voto de forma intuitiva, lúdica e memorável.
   ------------------------------------------------------------------ */

let audioCtx = null;

function obterAudioCtx() {
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    const Audio = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Audio();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function tocarBeep(frequencia = 1000, duracao = 0.05, tipo = 'sine') {
  try {
    const ctx = obterAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(frequencia, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duracao);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duracao);
  } catch (e) {
    /* Áudio opcional */
  }
}

// Som oficial e autêntico da Urna Eletrônica do TSE (intermitente seguido de beep longo característico)
function tocarFim() {
  try {
    const ctx = obterAudioCtx();
    if (!ctx) return;
    const freqTSE = 1320; // Tom oficial de confirmação
    const t0 = ctx.currentTime;

    // 3 beeps curtos de alerta preliminar
    [0, 0.11, 0.22].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqTSE, t0 + offset);
      gain.gain.setValueAtTime(0.18, t0 + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + offset + 0.065);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0 + offset);
      osc.stop(t0 + offset + 0.07);
    });

    // Beep longo e inconfundível do "FIM"
    const oscLongo = ctx.createOscillator();
    const gainLongo = ctx.createGain();
    oscLongo.type = 'sine';
    oscLongo.frequency.setValueAtTime(freqTSE, t0 + 0.35);
    gainLongo.gain.setValueAtTime(0.22, t0 + 0.35);
    gainLongo.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.15);
    oscLongo.connect(gainLongo);
    gainLongo.connect(ctx.destination);
    oscLongo.start(t0 + 0.35);
    oscLongo.stop(t0 + 1.16);
  } catch (e) {
    /* Silencioso se indisponível */
  }
}

export function iniciarUrna(raiz = document) {
  const container = raiz.querySelector('.simulador-urna');
  if (!container) return;

  const visorDigitos = container.querySelectorAll('.urna-digito');
  const visorCandidato = container.querySelector('.urna-candidato-info');
  const visorFoto = container.querySelector('.urna-foto-box');
  const visorFim = container.querySelector('.urna-fim-tela');
  const visorInstrucao = container.querySelector('.urna-rodape-instrucao');
  const botoesTeclado = container.querySelectorAll('[data-tecla]');
  const botaoRapido = container.querySelector('.urna-atalho-rapido');

  let digitos = [];
  const NUMERO_ELIZETE = '44577';

  function atualizarVisor() {
    visorDigitos.forEach((slot, i) => {
      slot.textContent = digitos[i] || '';
      slot.classList.toggle('ativo', i === digitos.length);
      slot.classList.toggle('preenchido', !!digitos[i]);
    });

    const digitado = digitos.join('');

    if (digitado.length === 5) {
      if (digitado === NUMERO_ELIZETE) {
        if (visorCandidato) visorCandidato.hidden = false;
        if (visorFoto) visorFoto.hidden = false;
        if (visorInstrucao) {
          visorInstrucao.innerHTML = 'Aperte a tecla: <strong class="texto-confirma">CONFIRMA</strong> para validar seu voto!';
        }
      } else {
        if (visorCandidato) visorCandidato.hidden = true;
        if (visorFoto) visorFoto.hidden = true;
        if (visorInstrucao) {
          visorInstrucao.innerHTML = '<span class="texto-aviso">NÚMERO NÃO REGISTRADO</span>. Aperte <strong>CORRIGE</strong> e digite <strong>44577</strong>.';
        }
      }
    } else {
      if (visorCandidato) visorCandidato.hidden = true;
      if (visorFoto) visorFoto.hidden = true;
      if (visorInstrucao) {
        visorInstrucao.innerHTML = 'Digite os 5 dígitos: <strong>44577</strong>';
      }
    }
  }

  function digitar(num) {
    if (digitos.length < 5) {
      tocarBeep(700 + digitos.length * 60, 0.09);
      digitos.push(num);
      atualizarVisor();
    }
  }

  function corrigir() {
    tocarBeep(420, 0.12, 'sawtooth');
    digitos = [];
    if (visorFim) visorFim.hidden = true;
    atualizarVisor();
  }

  function confirmar() {
    const digitado = digitos.join('');
    if (digitado === NUMERO_ELIZETE) {
      tocarFim();
      if (visorFim) {
        visorFim.hidden = false;
        visorFim.classList.add('animar-fim');
      }
      // Feedback visual e celebração
      if (window.dispararConfetes) window.dispararConfetes(container);
    } else if (digitado.length === 5) {
      tocarBeep(300, 0.25, 'sawtooth');
    } else {
      tocarBeep(350, 0.15, 'sawtooth');
    }
  }

  botoesTeclado.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tecla = btn.dataset.tecla;
      if (tecla >= '0' && tecla <= '9') {
        digitar(tecla);
      } else if (tecla === 'corrige') {
        corrigir();
      } else if (tecla === 'confirma') {
        confirmar();
      } else if (tecla === 'branco') {
        tocarBeep(400, 0.1);
        digitos = [];
        atualizarVisor();
        if (visorInstrucao) {
          visorInstrucao.innerHTML = 'Voto em branco. Digite <strong>44577</strong> e aperte CONFIRMA.';
        }
      }
    });
  });

  if (botaoRapido) {
    botaoRapido.addEventListener('click', () => {
      corrigir();
      let i = 0;
      const timer = setInterval(() => {
        if (i < NUMERO_ELIZETE.length) {
          digitar(NUMERO_ELIZETE[i]);
          i++;
        } else {
          clearInterval(timer);
          setTimeout(confirmar, 320);
        }
      }, 120);
    });
  }

  // Teclado físico
  container.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      digitar(e.key);
    } else if (e.key === 'Backspace' || e.key === 'Escape') {
      e.preventDefault();
      corrigir();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      confirmar();
    }
  });

  // Estado inicial
  atualizarVisor();
}
