/* ============================================================
   LADDER LOGIC TRAINER — main.js
   Punto de entrada. Inicializa módulos y carga ejercicios.
   ============================================================ */

(function (global) {
  'use strict';

  const REQUIRED = ['LLT', 'LLT.utils', 'LLT.state', 'LLT.components', 'LLT.simulator', 'LLT.editor'];

  function checkDeps() {
    for (const dep of REQUIRED) {
      const parts = dep.split('.');
      let obj = global;
      for (const part of parts) {
        if (!obj[part]) {
          console.error(`[LLT] Dependencia faltante: ${dep}`);
          return false;
        }
        obj = obj[part];
      }
    }
    return true;
  }

  async function loadExercises() {
    try {
      const res = await fetch('./exercises/exercises.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.exercises || [];
    } catch (err) {
      console.warn('[LLT] Sin ejercicios:', err.message);
      return [];
    }
  }

  function renderExerciseList(exercises) {
    // La renderización completa la maneja editor.js — aquí solo pasamos los datos
    if (typeof global.LLT.editor.loadExercises === 'function') {
      global.LLT.editor.loadExercises(exercises);
    }
  }

  async function boot() {
    if (!checkDeps()) {
      document.body.innerHTML = '<p style="color:red;padding:2rem">Error: faltan módulos JS.</p>';
      return;
    }

    const { utils, editor } = global.LLT;

    // Inicializar editor con canvas vacío
    editor.init();

    // ← LÍNEA NUEVA
    global.LLT.sceneEngine.init();

    // Cargar ejercicios
    const exercises = await loadExercises();
    renderExerciseList(exercises);

    console.info('%c⬛ Ladder Logic Trainer%c listo', 'color:#39c960;font-weight:bold', 'color:#8a9488');
    utils.toast('Ladder Logic Trainer listo', 'success', 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

}(window));