/* ============================================================
   LADDER LOGIC TRAINER — simulator.js
   Motor de simulación PLC. Scan cycle:
     1. Reset salidas Q (no marcas M)
     2. Evaluar cada rung
     3. Escribir salidas via _processOutputs

   Bloques analógicos añadidos:
     Comparadores : cmp-gt, cmp-lt, cmp-ge, cmp-le, cmp-eq, cmp-ne
     Matemáticas  : math-add, math-sub, math-mul, math-div, math-mod
     Escalado     : scale
     Movimiento   : move-a
   ============================================================ */

(function (global) {
  'use strict';

  const { utils, state } = global.LLT;

  /* ----------------------------------------------------------
     ESTADO INTERNO
  ---------------------------------------------------------- */
  let _running      = false;
  let _rafId        = null;
  let _lastTime     = 0;
  let _scanInterval = 50;

  // Memoria de timers/contadores: { cellId: { ... } }
  const _mem = {};

  function getMem(id) {
    if (!_mem[id]) {
      _mem[id] = {
        running:   false,
        startTime: 0,
        elapsed:   0,
        done:      false,
        wasOn:     false,
        lastState: false,
        count:     0,
      };
    }
    return _mem[id];
  }

  /* ----------------------------------------------------------
     LOOP
  ---------------------------------------------------------- */
  function _loop(ts) {
    if (!_running) return;
    if (ts - _lastTime >= _scanInterval) {
      _lastTime = ts;
      const t0 = performance.now();
      _scan(ts);
      state.updateScanStats(Math.round(performance.now() - t0));
    }
    _rafId = requestAnimationFrame(_loop);
  }

  /* ----------------------------------------------------------
     SCAN CYCLE
  ---------------------------------------------------------- */
  function _scan(ts) {
    const rungs = state.getRungs();

    // Fase 1: reset visual
    rungs.forEach(rung => {
      _walk(rung.elements, cell => {
        cell.energized = false;
        if (cell.type === 'timer-on' || cell.type === 'timer-off' || cell.type === 'timer-pulse') {
          cell.done = false;
        }
        if (cell.type === 'counter-up' || cell.type === 'counter-dn') {
          cell.done = false;
        }
      });
      rung.energized = false;
    });

    // Fase 2: evaluar rungs
    rungs.forEach(rung => {
      rung.energized = _evalSeries(rung.elements, true, ts);
      _processCoils(rung.elements, rung.energized);
    });

    // Fase 3: notificar al canvas
    document.dispatchEvent(new CustomEvent('llt:scan-update', { detail: { rungs } }));
  }

  /* ----------------------------------------------------------
     EVALUAR SERIE
  ---------------------------------------------------------- */
  function _evalSeries(elements, powerIn, ts) {
    let power = powerIn;
    for (const el of elements) {
      if (el.rows) {
        power = _evalParallel(el, power, ts);
      } else {
        power = _evalCell(el, power, ts);
      }
    }
    return power;
  }

  /* ----------------------------------------------------------
     EVALUAR PARALELO
  ---------------------------------------------------------- */
  function _evalParallel(branch, powerIn, ts) {
    if (!powerIn) {
      _walk(branch.rows.flat(), c => { c.energized = false; });
      return false;
    }
    let any = false;
    branch.rows.forEach(row => {
      if (_evalSeries(row, true, ts)) any = true;
    });
    return any;
  }

  /* ----------------------------------------------------------
     HELPER: leer valor numérico de una señal (analógica o digital)
  ---------------------------------------------------------- */
  function _readNum(address) {
    if (!address) return 0;
    const sig = state.getSignal(address);
    if (!sig) return 0;
    if (sig.type === 'analog') return state.getAnalogValue(address);
    // Digital leída como número: false=0, true=1
    return state.getSignalValue(address) ? 1 : 0;
  }

  /* ----------------------------------------------------------
     EVALUAR CELDA
  ---------------------------------------------------------- */
  function _evalCell(cell, powerIn, ts) {
    let passes = false;

    switch (cell.type) {

      // ── Contactos ──────────────────────────────────────────
      case 'contact-no':
        passes = powerIn && !!state.getSignalValue(cell.address);
        break;

      case 'contact-nc':
        passes = powerIn && !state.getSignalValue(cell.address);
        break;

      case 'contact-pos': {
        const m = getMem(cell.id);
        const cur = powerIn && !!state.getSignalValue(cell.address);
        passes = cur && !m.wasOn;
        m.wasOn = cur;
        break;
      }

      case 'contact-neg': {
        const m = getMem(cell.id);
        const cur = !!state.getSignalValue(cell.address);
        passes = powerIn && !cur && m.wasOn;
        m.wasOn = cur;
        break;
      }

      // ── Bobinas ────────────────────────────────────────────
      case 'coil':
      case 'coil-set':
      case 'coil-reset':
      case 'coil-not':
        passes = powerIn;
        break;

      // ── Hilo ───────────────────────────────────────────────
      case 'wire-h':
        passes = powerIn;
        break;

      // ── TON ────────────────────────────────────────────────
      case 'timer-on': {
        const m = getMem(cell.id);
        if (powerIn) {
          if (!m.running) {
            m.running   = true;
            m.startTime = ts;
            m.elapsed   = 0;
            m.done      = false;
          }
          if (!m.done) {
            m.elapsed    = ts - m.startTime;
            cell.elapsed = Math.min(m.elapsed, cell.preset || 0);
            if (m.elapsed >= (cell.preset || 0)) m.done = true;
          } else {
            cell.elapsed = cell.preset || 0;
          }
        } else {
          m.running    = false;
          m.startTime  = 0;
          m.elapsed    = 0;
          m.done       = false;
          cell.elapsed = 0;
        }
        const out = m.running && m.done;
        cell.done = out;
        if (cell.address) state.setSignalValue(cell.address, out);
        passes = out;
        break;
      }

      // ── TOF ────────────────────────────────────────────────
      case 'timer-off': {
        const m = getMem(cell.id);
        if (m.done === false && !m.running && !m.wasOn) m.done = true;
        if (powerIn) {
          m.running    = false;
          m.startTime  = 0;
          m.elapsed    = 0;
          m.done       = false;
          cell.elapsed = 0;
        } else {
          if (!m.running && m.wasOn) {
            m.running   = true;
            m.startTime = ts;
            m.elapsed   = 0;
          }
          if (m.running) {
            m.elapsed    = ts - m.startTime;
            cell.elapsed = Math.min(m.elapsed, cell.preset || 0);
            if (m.elapsed >= (cell.preset || 0)) {
              m.done    = true;
              m.running = false;
            }
          }
        }
        m.wasOn = powerIn;
        const tofOut = !m.done;
        cell.done = m.done;
        if (cell.address) state.setSignalValue(cell.address, tofOut);
        passes = tofOut;
        break;
      }

      // ── TP ─────────────────────────────────────────────────
      case 'timer-pulse': {
        const m = getMem(cell.id);
        if (powerIn && !m.wasOn && !m.running) {
          m.running   = true;
          m.startTime = ts;
          m.elapsed   = 0;
          m.done      = false;
        }
        if (m.running) {
          m.elapsed    = ts - m.startTime;
          cell.elapsed = Math.min(m.elapsed, cell.preset || 0);
          if (m.elapsed >= (cell.preset || 0)) {
            m.running    = false;
            m.done       = true;
            m.elapsed    = 0;
            cell.elapsed = 0;
          }
        }
        m.wasOn = powerIn;
        const tpOut = m.running;
        cell.done = m.done;
        if (cell.address) state.setSignalValue(cell.address, tpOut);
        passes = tpOut;
        break;
      }

      // ── CTU ────────────────────────────────────────────────
      case 'counter-up': {
        const m = getMem(cell.id);
        if (m.count === undefined) m.count = 0;
        if (powerIn && !m.wasOn) m.count++;
        m.wasOn    = powerIn;
        m.done     = m.count >= (cell.preset || 0);
        cell.count = m.count;
        cell.done  = m.done;
        if (cell.address) state.setSignalValue(cell.address, m.done);
        passes = m.done;
        break;
      }

      // ── CTD ────────────────────────────────────────────────
      case 'counter-dn': {
        const m = getMem(cell.id);
        if (m.count === undefined) m.count = cell.preset || 0;
        if (m.count === 0 && !m.done && !m.wasOn) m.count = cell.preset || 0;
        if (powerIn && !m.wasOn) m.count = Math.max(0, m.count - 1);
        m.wasOn    = powerIn;
        m.done     = m.count === 0;
        cell.count = m.count;
        cell.done  = m.done;
        if (cell.address) state.setSignalValue(cell.address, m.done);
        passes = m.done;
        break;
      }

      // ── RST ────────────────────────────────────────────────
      case 'counter-rst': {
        if (powerIn && !getMem(cell.id).wasOn) {
          state.getRungs().forEach(rung => {
            _walk(rung.elements, c => {
              if ((c.type === 'counter-up' || c.type === 'counter-dn') &&
                   c.address === cell.address) {
                const m = getMem(c.id);
                if (c.type === 'counter-dn') {
                  m.count = c.preset || 0;
                  c.count = c.preset || 0;
                } else {
                  m.count = 0;
                  c.count = 0;
                }
                m.done  = false;
                c.done  = false;
              }
            });
          });
          if (cell.address) state.setSignalValue(cell.address, false);
        }
        getMem(cell.id).wasOn = powerIn;
        passes = powerIn;
        break;
      }

      // ══════════════════════════════════════════════════════
      //  BLOQUES ANALÓGICOS
      // ══════════════════════════════════════════════════════

      // ── Comparadores ───────────────────────────────────────
      // Leen IN1 (cell.address) y lo comparan con IN2 (cell.address2 o cell.setpoint)
      // Si powerIn = true Y la comparación es verdadera → passes = true
      case 'cmp-gt':
      case 'cmp-lt':
      case 'cmp-ge':
      case 'cmp-le':
      case 'cmp-eq':
      case 'cmp-ne': {
        if (!powerIn) { cell.result = false; passes = false; break; }

        const in1 = _readNum(cell.address);
        const in2 = cell.address2 ? _readNum(cell.address2) : (cell.setpoint || 0);

        let cmpResult = false;
        switch (cell.type) {
          case 'cmp-gt': cmpResult = in1 >  in2; break;
          case 'cmp-lt': cmpResult = in1 <  in2; break;
          case 'cmp-ge': cmpResult = in1 >= in2; break;
          case 'cmp-le': cmpResult = in1 <= in2; break;
          case 'cmp-eq': cmpResult = in1 === in2; break;
          case 'cmp-ne': cmpResult = in1 !== in2; break;
        }

        // Guardar IN1 para mostrar en el bloque
        cell.currentVal = in1;
        cell.result     = cmpResult;
        passes = cmpResult;
        break;
      }

      // ── Operaciones matemáticas ────────────────────────────
      // IN1 OP IN2 → OUT (sólo ejecuta si powerIn)
      case 'math-add':
      case 'math-sub':
      case 'math-mul':
      case 'math-div':
      case 'math-mod': {
        if (!powerIn) { passes = false; break; }

        const in1 = _readNum(cell.address);
        const in2 = cell.address2 ? _readNum(cell.address2) : (cell.operand2 || 0);

        let mathResult = 0;
        switch (cell.type) {
          case 'math-add': mathResult = in1 + in2; break;
          case 'math-sub': mathResult = in1 - in2; break;
          case 'math-mul': mathResult = in1 * in2; break;
          case 'math-div': mathResult = in2 !== 0 ? in1 / in2 : 0; break;
          case 'math-mod': mathResult = in2 !== 0 ? in1 % in2 : 0; break;
        }

        // Redondear a 4 decimales para evitar ruido flotante
        mathResult = Math.round(mathResult * 10000) / 10000;

        cell.result = mathResult;

        // Escribir en señal de salida si está definida
        if (cell.addrOut) state.setAnalogValue(cell.addrOut, mathResult);

        passes = true;  // MATH siempre propaga la energía si powerIn
        break;
      }

      // ── Escalado lineal ────────────────────────────────────
      // Convierte el valor crudo de cell.address (rawMin..rawMax)
      // al rango de ingeniería (engMin..engMax) y lo escribe en cell.addrOut
      case 'scale': {
        if (!powerIn) { passes = false; break; }

        const raw    = _readNum(cell.address);
        const rawMin = cell.rawMin !== undefined ? cell.rawMin : 0;
        const rawMax = cell.rawMax !== undefined ? cell.rawMax : 27648;
        const engMin = cell.engMin !== undefined ? cell.engMin : 0;
        const engMax = cell.engMax !== undefined ? cell.engMax : 100;

        let scaled = 0;
        const rawRange = rawMax - rawMin;
        if (rawRange !== 0) {
          scaled = ((raw - rawMin) / rawRange) * (engMax - engMin) + engMin;
        }
        scaled = Math.round(scaled * 100) / 100;   // 2 decimales

        cell.result    = scaled;
        cell.currentVal = raw;

        if (cell.addrOut) state.setAnalogValue(cell.addrOut, scaled);

        passes = true;
        break;
      }

      // ── MOVE analógico ─────────────────────────────────────
      // Copia cell.address → cell.addrOut (si powerIn)
      case 'move-a': {
        if (!powerIn) { passes = false; break; }
        const val = _readNum(cell.address);
        cell.result = val;
        if (cell.addrOut) state.setAnalogValue(cell.addrOut, val);
        passes = true;
        break;
      }

      default:
        passes = powerIn;
    }

    cell.energized = passes;
    return passes;
  }

  /* ----------------------------------------------------------
     PROCESAR BOBINAS
  ---------------------------------------------------------- */
  function _processCoils(elements, continuity) {
    _walk(elements, cell => {
      switch (cell.type) {
        case 'coil':
          if (cell.address) state.setSignalValue(cell.address, continuity);
          cell.energized = continuity;
          break;
        case 'coil-not':
          if (cell.address) state.setSignalValue(cell.address, !continuity);
          cell.energized = !continuity;
          break;
        case 'coil-set':
          if (continuity && cell.address) state.setSignalValue(cell.address, true);
          cell.energized = cell.address ? !!state.getSignalValue(cell.address) : continuity;
          break;
        case 'coil-reset':
          if (continuity && cell.address) state.setSignalValue(cell.address, false);
          cell.energized = cell.address ? !!state.getSignalValue(cell.address) : !continuity;
          break;
      }
    });
  }

  /* ----------------------------------------------------------
     WALK
  ---------------------------------------------------------- */
  function _walk(elements, fn) {
    elements.forEach(el => {
      if (el.rows) el.rows.forEach(row => row.forEach(fn));
      else fn(el);
    });
  }

  /* ----------------------------------------------------------
     API PÚBLICA
  ---------------------------------------------------------- */
  const simulator = {};

  simulator.start = function () {
    if (_running) return;
    _running  = true;
    _lastTime = performance.now();
    state.setMode('RUN');
    _rafId = requestAnimationFrame(_loop);
    utils.toast('Simulación iniciada', 'success', 2000);
  };

  simulator.stop = function () {
    _running = false;
    if (_rafId) cancelAnimationFrame(_rafId);
    _rafId = null;
    state.setMode('STOP');
    state.resetScanStats();
    state.getRungs().forEach(rung => {
      rung.energized = false;
      _walk(rung.elements, c => {
        c.energized = false;
        if (c.elapsed     !== undefined) c.elapsed     = 0;
        if (c.done        !== undefined) c.done        = false;
        if (c.count       !== undefined) c.count       = 0;
        if (c.result      !== undefined) c.result      = (typeof c.result === 'number') ? 0 : false;
        if (c.currentVal  !== undefined) c.currentVal  = 0;
      });
    });
    state.resetAllOutputs();
    Object.keys(_mem).forEach(k => delete _mem[k]);
    document.dispatchEvent(new CustomEvent('llt:scan-update', { detail: { rungs: state.getRungs() } }));
    utils.toast('Simulación detenida', 'warning', 2000);
  };

  simulator.getScanInterval = () => _scanInterval;
  simulator.setScanInterval = ms => { _scanInterval = Math.max(10, Math.min(ms, 5000)); };
  simulator.isRunning       = () => _running;

  state.on('mode:changed', ({ mode }) => {
    if (mode === 'STOP' && _running) simulator.stop();
  });

  global.LLT.simulator = simulator;

}(window));