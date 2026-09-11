/* ------------------------------------------------------------------
   app.js — ponto de entrada da plataforma oficial de Elizete Trindade.
   ------------------------------------------------------------------ */

import { iniciarNavegacao } from './navegacao.js';
import { iniciarMovimento } from './movimento.js';
import { iniciarUrna } from './urna.js';
import { iniciarApoio } from './apoio.js';
import { iniciarMoldura } from './moldura/index.js';

function iniciar() {
  iniciarNavegacao();
  iniciarMovimento();
  iniciarUrna(document);
  iniciarApoio(document);
  iniciarMoldura(document.querySelector('#foto-oficial'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar);
} else {
  iniciar();
}
