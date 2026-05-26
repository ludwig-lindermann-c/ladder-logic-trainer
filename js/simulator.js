/* ============================================================
   LADDER LOGIC TRAINER — simulator.js
   Motor de simulación PLC. Scan cycle:
     1. Reset salidas Q (no marcas M)
     2. Evaluar cada rung
     3. Escribir salidas via _processOutputs
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

    // Fase 1: solo resetear estado visual (energized)
    // NO resetear señales Q — las bobinas las sobreescriben en la fase 2
    // Esto permite que los contactos Q lean el valor del scan anterior (enclavamiento)
    rungs.forEach(rung => {
      _walk(rung.elements, cell => {
        cell.energized = false;
        // Reset visual de timer/counter cells
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
     EVALUAR CELDA
  ---------------------------------------------------------- */
  function _evalCell(cell, powerIn, ts) {
    let passes = false;

    switch (cell.type) {

      // ── Contactos ──
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

      // ── Bobinas (no interrumpen el flujo) ──
      case 'coil':
      case 'coil-set':
      case 'coil-reset':
      case 'coil-not':
        passes = powerIn;
        break;

      // ── Hilo ──
      case 'wire-h':
        passes = powerIn;
        break;

      // ── TON: retardador de partida ──
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

      // ── TOF: retardador de parada ──
      case 'timer-off': {
        const m = getMem(cell.id);
        // TOF arranca "expirado" — salida OFF hasta primer ON
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

      // ── TP: pulso de duración fija ──
      case 'timer-pulse': {
        const m = getMem(cell.id);

        // Flanco de subida → arrancar solo si no está corriendo y el anterior terminó
        if (powerIn && !m.wasOn && !m.running) {
          m.running   = true;
          m.startTime = ts;
          m.elapsed   = 0;
          m.done      = false;
        }

        // El timer corre independiente de powerIn
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
        // Escribir salida directamente — sin pasar por _processCoils
        if (cell.address) state.setSignalValue(cell.address, tpOut);
        // Propagar continuidad siempre que el timer corre
        passes = tpOut;
        break;
      }

      // ── CTU: contador ascendente ──
      case 'counter-up': {
        const m = getMem(cell.id);
        if (m.count === undefined) m.count = 0;
        // Flanco de subida → incrementar
        if (powerIn && !m.wasOn) {
          m.count++;
        }
        m.wasOn    = powerIn;
        m.done     = m.count >= (cell.preset || 0);
        cell.count = m.count;
        cell.done  = m.done;
        // Escribir señal del contador — se usa como contacto en otro rung
        if (cell.address) state.setSignalValue(cell.address, m.done);
        // Estilo TIA Portal — pasa continuidad cuando done=true
        passes = m.done;
        break;
      }

      // ── CTD: contador descendente ──
      case 'counter-dn': {
        const m = getMem(cell.id);
        // Arrancar cargado con el preset
        if (m.count === undefined) m.count = cell.preset || 0;
        // Si el preset cambió, recargar
        if (m.count === 0 && !m.done && !m.wasOn) m.count = cell.preset || 0;
        // Flanco de subida → decrementar
        if (powerIn && !m.wasOn) {
          m.count = Math.max(0, m.count - 1);
        }
        m.wasOn    = powerIn;
        m.done     = m.count === 0;
        cell.count = m.count;
        cell.done  = m.done;
        if (cell.address) state.setSignalValue(cell.address, m.done);
        // Estilo TIA Portal — pasa continuidad cuando done=true
        passes = m.done;
        break;
      }

      // ── RST: reset de contador ──
      case 'counter-rst': {
        if (powerIn && !getMem(cell.id).wasOn) {
          // Buscar el contador asociado y resetearlo según su tipo
          state.getRungs().forEach(rung => {
            _walk(rung.elements, c => {
              if ((c.type === 'counter-up' || c.type === 'counter-dn') &&
                   c.address === cell.address) {
                const m = getMem(c.id);
                if (c.type === 'counter-dn') {
                  // CTD: cargar PV
                  m.count = c.preset || 0;
                  c.count = c.preset || 0;
                } else {
                  // CTU: resetear a 0
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
          // Bobina S/R: muestra el estado actual de la señal, no la continuidad del rung
          cell.energized = cell.address ? !!state.getSignalValue(cell.address) : continuity;
          break;
        case 'coil-reset':
          if (continuity && cell.address) state.setSignalValue(cell.address, false);
          // Bobina S/R: muestra el estado actual de la señal
          cell.energized = cell.address ? !!state.getSignalValue(cell.address) : !continuity;
          break;
      }
    });
  }

  /* ----------------------------------------------------------
     WALK — recorre elementos incluyendo ramas
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
        if (c.elapsed !== undefined) c.elapsed = 0;
        if (c.done    !== undefined) c.done    = false;
        if (c.count   !== undefined) c.count   = 0;
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