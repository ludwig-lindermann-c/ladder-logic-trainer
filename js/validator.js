/* ============================================================
   LADDER LOGIC TRAINER — validator.js
   Motor de validación por comportamiento.
   Ejecuta estímulos contra el simulador y verifica salidas.
   Disponible como window.LLT.validator
   ============================================================ */

(function (global) {
  'use strict';

  const { state } = global.LLT;

  /* ----------------------------------------------------------
     CONSTANTES
  ---------------------------------------------------------- */

  const PULSE_HALF_PERIOD_MS = 100; // mitad del período de un pulso (sube 100ms, baja 100ms)

  /* ----------------------------------------------------------
     UTILIDADES
  ---------------------------------------------------------- */

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Genera N flancos de subida en una señal
  async function applyPulses(address, count) {
    for (let i = 0; i < count; i++) {
      state.setSignalValue(address, true);
      await sleep(PULSE_HALF_PERIOD_MS);
      state.setSignalValue(address, false);
      await sleep(PULSE_HALF_PERIOD_MS);
    }
  }

  /* ----------------------------------------------------------
     EJECUTOR DE UN ESTÍMULO
  ---------------------------------------------------------- */

  async function runStimulus(stimulus) {

    // 1. Aplicar señales directas
    if (stimulus.set) {
      for (const [address, value] of Object.entries(stimulus.set)) {
        state.setSignalValue(address, value);
      }
    }

    // 2. Aplicar pulsos (para contadores)
    if (stimulus.pulses) {
      for (const [address, count] of Object.entries(stimulus.pulses)) {
        await applyPulses(address, count);
      }
    }

    // 3. Esperar el tiempo indicado
    if (stimulus.wait_ms) {
      await sleep(stimulus.wait_ms);
    }

    // 4. Verificar expectativas
    const results = [];
    for (const [address, expected] of Object.entries(stimulus.expect)) {
      const actual = state.getSignalValue(address);
      results.push({
        address,
        expected,
        actual,
        pass: actual === expected
      });
    }

    return {
      label:   stimulus.label,
      results,
      pass:    results.every(r => r.pass)
    };
  }

  /* ----------------------------------------------------------
     PREPARACIÓN DEL ENTORNO
  ---------------------------------------------------------- */

  // Carga las señales del ejercicio sin borrar el programa del estudiante
  function loadExerciseSignals(exercise) {
    for (const sig of exercise.signals) {
      // Solo agrega si no existe ya (el estudiante puede haberla creado)
      state.addSignal(sig.address, sig.name, sig.type);
    }
  }

  // Resetea todas las señales del ejercicio a su valor inicial
  function resetExerciseSignals(exercise) {
    for (const sig of exercise.signals) {
      state.setSignalValue(sig.address, sig.initial ?? false);
    }
  }

  /* ----------------------------------------------------------
     VALIDACIÓN PRINCIPAL
  ---------------------------------------------------------- */

  async function validate(exercise) {

    // El simulador debe estar en RUN
    if (state.getMode() !== 'RUN') {
      return {
        error: 'El simulador debe estar en RUN antes de validar.'
      };
    }

    // Asegurar que las señales del ejercicio existen
    loadExerciseSignals(exercise);

    // Resetear señales al estado inicial
    resetExerciseSignals(exercise);
    await sleep(200); // dejar que el simulador procese el estado inicial

    const stimulusResults = [];

    for (const stimulus of exercise.validation.stimuli) {
      const result = await runStimulus(stimulus);
      stimulusResults.push(result);
    }

    // Calcular puntaje
    const passed  = stimulusResults.filter(r => r.pass).length;
    const total   = stimulusResults.length;
    const score   = passed / total;
    const success = score >= exercise.validation.pass_threshold;

    return {
      success,
      score,
      passed,
      total,
      stimulusResults
    };
  }

  /* ----------------------------------------------------------
     API PÚBLICA
  ---------------------------------------------------------- */

  const validator = {
    validate,
    loadExerciseSignals,
    resetExerciseSignals
  };

  global.LLT.validator = validator;

}(window));