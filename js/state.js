/* ============================================================
   LADDER LOGIC TRAINER — state.js
   Store central de la aplicación. Gestiona:
   - Programa (rungs y elementos)
   - Señales I/O (entradas, salidas, marcas)
   - Señales analógicas (AIW, AQW, MW analógicas)
   - Modo de ejecución (STOP / RUN / STEP)
   - Selección del editor
   - Historial para undo/redo
   Disponible como window.LLT.state
   ============================================================ */

(function (global) {
  'use strict';

  const { utils } = global.LLT;

  /* ----------------------------------------------------------
     ESTADO INICIAL
  ---------------------------------------------------------- */

  /** Señal individual de I/O (digital o analógica) */
  function createSignal(address, name, type) {
    const base = {
      address,           // 'I0.0', 'Q0.0', 'M0.0', 'AIW0', 'AQW0', etc.
      name,              // nombre simbólico editable
      type,              // 'input' | 'output' | 'mark' | 'timer' | 'counter' | 'analog'
      value:    false,   // valor lógico actual (digital)
      forced:   false,   // true si está forzado manualmente
      forceVal: false,   // valor forzado (digital)
    };

    // Propiedades extra para señales analógicas
    if (type === 'analog') {
      base.value    = 0;       // valor numérico actual (reemplaza el boolean)
      base.forceVal = 0;       // valor forzado numérico
      base.min      = 0;       // rango mínimo (informativo)
      base.max      = 27648;   // rango máximo (0–27648 = estándar S7 para 0–10V / 4–20mA)
      base.unit     = '';      // unidad de ingeniería (ej: '°C', 'bar', '%')
    }

    return base;
  }

  /** Elemento dentro de un rung */
  function createCell(type, address = '', name = '') {
    const base = {
      id:      utils.uid('cell'),
      type,              // 'contact-no' | 'contact-nc' | 'coil' | 'cmp-gt' | 'math-add' | etc.
      address: utils.normalizeAddress(address),
      name,
      energized: false,  // calculado por el simulador en cada scan
    };

    // Propiedades extra según tipo
    if (type === 'timer-on' || type === 'timer-off') {
      base.preset  = 1000;   // ms
      base.elapsed = 0;
      base.done    = false;
    }
    if (type === 'timer-pulse') {
      base.preset  = 1000;
      base.elapsed = 0;
      base.done    = false;
    }
    if (type === 'counter-up' || type === 'counter-dn') {
      base.preset  = 10;
      base.count   = 0;
      base.done    = false;
    }

    // ── Bloques analógicos: comparadores ──
    // Comparan una señal analógica con un umbral (setpoint)
    if (type === 'cmp-gt' || type === 'cmp-lt' || type === 'cmp-ge' ||
        type === 'cmp-le' || type === 'cmp-eq' || type === 'cmp-ne') {
      base.address2  = '';     // segunda señal analógica (opcional; vacío → usar setpoint)
      base.setpoint  = 0;      // umbral de comparación (si address2 está vacío)
      base.result    = false;  // resultado booleano (energiza el rung si true)
    }

    // ── Bloques analógicos: operaciones matemáticas ──
    // IN1 OP IN2 → OUT
    if (type === 'math-add' || type === 'math-sub' ||
        type === 'math-mul' || type === 'math-div' || type === 'math-mod') {
      base.address2  = '';     // segunda operando (puede ser constante si está vacío)
      base.operand2  = 0;      // constante usada si address2 está vacío
      base.addrOut   = '';     // señal de salida analógica (AQW o MW)
      base.result    = 0;      // resultado numérico (muestra en bloque)
    }

    // ── Bloque de escalado lineal: convierte rango PLC → rango físico ──
    // Fórmula: OUT = (IN - rawMin) / (rawMax - rawMin) * (engMax - engMin) + engMin
    if (type === 'norm') {
      base.rawMin    = 0;
      base.rawMax    = 27648;
      base.addrOut   = '';     // debe ser MD
      base.result    = 0;
      base.currentVal = 0;
    }
    if (type === 'scale') {
      base.engMin    = 0;
      base.engMax    = 100;
      base.addrOut   = '';     // debe ser MD
      base.result    = 0;
      base.currentVal = 0;
    }

    // ── Bloque MOVE analógico: copia valor de una señal a otra ──
    if (type === 'move-a') {
      base.addrOut   = '';
      base.result    = 0;
    }

    return base;
  }

  /** Rama paralela dentro de un rung */
  function createBranch() {
    return {
      id:   utils.uid('branch'),
      rows: [[]],   // array de filas; cada fila es array de celdas
    };
  }

  /** Rung (escalón) del programa */
  function createRung(index = 0) {
    return {
      id:        utils.uid('rung'),
      index,
      comment:   '',
      elements:  [],   // array de celdas o ramas en serie
      energized: false,
    };
  }

  /** Programa completo */
  function createProgram(name = 'SIN_NOMBRE') {
    return {
      name,
      description: '',
      createdAt:   Date.now(),
      modifiedAt:  Date.now(),
      rungs:       [],
    };
  }

  /* ----------------------------------------------------------
     TABLA DE SEÑALES — empieza vacía
  ---------------------------------------------------------- */

  function defaultSignals() {
    return {};
  }

  /* ----------------------------------------------------------
     STORE INTERNO
  ---------------------------------------------------------- */

  let _state = {
    program:       createProgram(),
    signals:       defaultSignals(),
    mode:          'STOP',
    scanCycle:     0,
    lastScanMs:    0,
    selectedTool:  null,
    selectedCellId: null,
    selectedRungId: null,
    activeExercise: null,
    _history:   [],
    _future:    [],
    _maxHistory: 50,
  };

  /* ----------------------------------------------------------
     SUSCRIPTORES
  ---------------------------------------------------------- */

  const _listeners = {};

  function emit(event, payload) {
    (_listeners[event] || []).forEach(fn => fn(payload));
    (_listeners['*']   || []).forEach(fn => fn({ event, payload }));
  }

  /* ----------------------------------------------------------
     API PÚBLICA
  ---------------------------------------------------------- */

  const state = {};

  /* ── Suscripción ── */

  state.on = function (event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
    return () => {
      _listeners[event] = _listeners[event].filter(f => f !== fn);
    };
  };

  /* ── Programa ── */

  state.getProgram = () => _state.program;

  state.setProgramName = function (name) {
    _state.program.name       = name;
    _state.program.modifiedAt = Date.now();
    emit('program:changed', { name });
  };

  state.newProgram = function (name = 'SIN_NOMBRE') {
    _snapshot();
    _state.program = createProgram(name);
    emit('program:new', _state.program);
    emit('rungs:changed', _state.program.rungs);
  };

  state.loadProgram = function (programData) {
    _snapshot();
    _state.program = programData;
    emit('program:loaded', programData);
    emit('rungs:changed', programData.rungs);
  };

  state.exportProgram = function () {
    return utils.deepClone({
      program: _state.program,
      signals: _state.signals,
    });
  };

  /* ── Rungs ── */

  state.getRungs = () => _state.program.rungs;

  state.getRung = (id) =>
    _state.program.rungs.find(r => r.id === id) || null;

  state.addRung = function (atIndex) {
    _snapshot();
    const rungs = _state.program.rungs;
    const idx   = (atIndex !== undefined) ? atIndex : rungs.length;
    const rung  = createRung(idx);
    _state.program.rungs = utils.arrayInsert(rungs, idx, rung);
    _reindexRungs();
    emit('rungs:changed', _state.program.rungs);
    emit('rung:added', { rung, index: idx });
    return rung;
  };

  state.removeRung = function (id) {
    _snapshot();
    const idx = _state.program.rungs.findIndex(r => r.id === id);
    if (idx === -1) return;
    _state.program.rungs = utils.arrayRemove(_state.program.rungs, idx);
    _reindexRungs();
    emit('rungs:changed', _state.program.rungs);
    emit('rung:removed', { id, index: idx });
  };

  state.moveRung = function (fromId, toIndex) {
    _snapshot();
    const rungs    = _state.program.rungs;
    const fromIndex = rungs.findIndex(r => r.id === fromId);
    if (fromIndex === -1) return;
    _state.program.rungs = utils.arrayMove(rungs, fromIndex, toIndex);
    _reindexRungs();
    emit('rungs:changed', _state.program.rungs);
  };

  state.setRungComment = function (id, comment) {
    const rung = state.getRung(id);
    if (!rung) return;
    rung.comment = comment;
    emit('rung:updated', rung);
  };

  /* ── Elementos (celdas) ── */

  state.addCell = function (rungId, type, address, name, atIndex, branchId, branchRow) {
    _snapshot();
    const rung = state.getRung(rungId);
    if (!rung) return null;

    const cell = createCell(type, address, name);

    if (branchId !== undefined) {
      const branch = rung.elements.find(el => el.id === branchId);
      if (!branch || !branch.rows) return null;
      const rowIndex = branchRow || 0;
      if (!branch.rows[rowIndex]) branch.rows[rowIndex] = [];
      const idx = (atIndex !== undefined) ? atIndex : branch.rows[rowIndex].length;
      branch.rows[rowIndex] = utils.arrayInsert(branch.rows[rowIndex], idx, cell);
    } else {
      const idx = (atIndex !== undefined) ? atIndex : rung.elements.length;
      rung.elements = utils.arrayInsert(rung.elements, idx, cell);
    }

    _state.program.modifiedAt = Date.now();
    emit('rung:updated', rung);
    return cell;
  };

  state.removeCell = function (rungId, cellId) {
    _snapshot();
    const rung = state.getRung(rungId);
    if (!rung) return;

    const idx = rung.elements.findIndex(el => el.id === cellId);
    if (idx !== -1) {
      rung.elements = utils.arrayRemove(rung.elements, idx);
      emit('rung:updated', rung);
      return;
    }

    for (const el of rung.elements) {
      if (el.rows) {
        for (let r = 0; r < el.rows.length; r++) {
          const ci = el.rows[r].findIndex(c => c.id === cellId);
          if (ci !== -1) {
            el.rows[r] = utils.arrayRemove(el.rows[r], ci);
            emit('rung:updated', rung);
            return;
          }
        }
      }
    }
  };

  state.updateCell = function (rungId, cellId, props) {
    _snapshot();
    const cell = state.findCell(rungId, cellId);
    if (!cell) return;
    Object.assign(cell, props);
    _state.program.modifiedAt = Date.now();
    emit('rung:updated', state.getRung(rungId));
  };

  state.findCell = function (rungId, cellId) {
    const rung = state.getRung(rungId);
    if (!rung) return null;
    for (const el of rung.elements) {
      if (el.id === cellId) return el;
      if (el.rows) {
        for (const row of el.rows) {
          const found = row.find(c => c.id === cellId);
          if (found) return found;
        }
      }
    }
    return null;
  };

  /* ── Ramas paralelas ── */

  state.addBranch = function (rungId, atIndex) {
    _snapshot();
    const rung = state.getRung(rungId);
    if (!rung) return null;
    const branch = createBranch();
    const idx = (atIndex !== undefined) ? atIndex : rung.elements.length;
    rung.elements = utils.arrayInsert(rung.elements, idx, branch);
    emit('rung:updated', rung);
    return branch;
  };

  state.addBranchRow = function (rungId, branchId) {
    const rung = state.getRung(rungId);
    if (!rung) return;
    const branch = rung.elements.find(el => el.id === branchId);
    if (!branch || !branch.rows) return;
    branch.rows.push([]);
    emit('rung:updated', rung);
  };

  /* ── Señales I/O digitales ── */

  state.getSignals = () => _state.signals;

  state.getSignal = (address) => _state.signals[address] || null;

  state.getSignalValue = function (address) {
    const sig = _state.signals[address];
    if (!sig) return false;
    if (sig.type === 'analog') return sig.forced ? sig.forceVal : sig.value; // devuelve número
    return sig.forced ? sig.forceVal : sig.value;
  };

  state.setSignalValue = function (address, value) {
    if (!_state.signals[address]) return;
    const sig = _state.signals[address];
    if (sig.type === 'analog') {
      sig.value = typeof value === 'number' ? value : 0;
    } else {
      sig.value = !!value;
    }
    emit('signal:changed', { address, value: sig.value });
  };

  /* ── Señales analógicas ── */

  /**
   * Lee el valor numérico de una señal analógica.
   * Si la señal no existe o no es analógica, devuelve 0.
   */
  state.getAnalogValue = function (address) {
    const sig = _state.signals[address];
    if (!sig || sig.type !== 'analog') return 0;
    return sig.forced ? sig.forceVal : sig.value;
  };

  /**
   * Escribe un valor numérico en una señal analógica.
   */
  state.setAnalogValue = function (address, value) {
    const sig = _state.signals[address];
    if (!sig || sig.type !== 'analog') return;
    const clamped = typeof value === 'number' ? value : 0;
    sig.value = clamped;
    emit('signal:changed', { address, value: clamped });
  };

  /**
   * Fuerza una señal analógica a un valor fijo.
   */
  state.forceAnalogSignal = function (address, value) {
    const sig = _state.signals[address];
    if (!sig || sig.type !== 'analog') return;
    sig.forced   = true;
    sig.forceVal = typeof value === 'number' ? value : 0;
    emit('signal:forced', { address, value: sig.forceVal });
    emit('signal:changed', { address, value: sig.forceVal });
  };

  state.forceSignal = function (address, value) {
    if (!_state.signals[address]) return;
    const sig = _state.signals[address];
    if (sig.type === 'analog') {
      state.forceAnalogSignal(address, value);
      return;
    }
    sig.forced   = true;
    sig.forceVal = !!value;
    emit('signal:forced', { address, value: !!value });
    emit('signal:changed', { address, value: !!value });
  };

  state.unforceSignal = function (address) {
    if (!_state.signals[address]) return;
    _state.signals[address].forced = false;
    emit('signal:unforced', { address });
  };

  state.addSignal = function (address, name, type, extra) {
    const normalized = utils.normalizeAddress(address);
    if (_state.signals[normalized]) return false;

    // Validar rangos según tipo de dirección
    if (type === 'analog') {
      const num = parseInt(normalized.replace(/^[A-Z]+/, ''));
      const isMD = normalized.startsWith('MD');
      const isAIW = normalized.startsWith('AIW');
      const isAQW = normalized.startsWith('AQW');
      const isMW  = normalized.startsWith('MW');

      if (isMD) {
        // MD: desde 100, múltiplos de 4
        if (num < 100 || num % 4 !== 0) return false;
      } else if (isAIW || isAQW || isMW) {
        // AIW/AQW/MW: desde 10, pares
        if (num < 10 || num % 2 !== 0) return false;
      } else {
        return false;
      }
    }

    const sig = createSignal(normalized, name, type);

    // Propiedades opcionales para analógicas
    if (extra && type === 'analog') {
      if (extra.min     !== undefined) sig.min     = extra.min;
      if (extra.max     !== undefined) sig.max     = extra.max;
      if (extra.unit    !== undefined) sig.unit    = extra.unit;
      if (extra.subtype !== undefined) sig.subtype = extra.subtype;
    }

    // MD siempre es real (float)
    if (normalized.startsWith('MD')) {
      sig.subtype = 'real';
      sig.value   = 0.0;
      sig.min     = extra?.min ?? -3.4e38;
      sig.max     = extra?.max ??  3.4e38;
    }

    _state.signals[normalized] = sig;
    emit('signals:changed', _state.signals);
    return true;
  };

  state.removeSignal = function (address) {
    delete _state.signals[address];
    emit('signals:changed', _state.signals);
  };

  state.updateSignalName = function (address, name) {
    if (!_state.signals[address]) return;
    _state.signals[address].name = name;
    emit('signal:updated', { address, name });
  };

  state.resetAllOutputs = function () {
    for (const sig of Object.values(_state.signals)) {
      if (sig.type === 'output' || sig.type === 'mark') {
        sig.value = false;
      }
      // Las salidas analógicas (AQW) se resetean a 0
      if (sig.type === 'analog' && sig.address && sig.address.startsWith('AQW')) {
        sig.value = 0;
      }
    }
    emit('signals:reset', null);
  };

  /* ── Modo PLC ── */

  state.getMode = () => _state.mode;

  state.setMode = function (mode) {
    if (!['STOP', 'RUN', 'STEP'].includes(mode)) return;
    const prev    = _state.mode;
    _state.mode   = mode;
    emit('mode:changed', { mode, prev });
  };

  /* ── Scan stats ── */

  state.getScanCycle  = () => _state.scanCycle;
  state.getLastScanMs = () => _state.lastScanMs;

  state.updateScanStats = function (ms) {
    _state.scanCycle++;
    _state.lastScanMs = ms;
    emit('scan:tick', { cycle: _state.scanCycle, ms });
  };

  state.resetScanStats = function () {
    _state.scanCycle  = 0;
    _state.lastScanMs = 0;
    emit('scan:reset', null);
  };

  /* ── Selección en el editor ── */

  state.getSelectedTool  = () => _state.selectedTool;
  state.getSelectedCell  = () => _state.selectedCellId;
  state.getSelectedRung  = () => _state.selectedRungId;

  state.selectTool = function (toolType) {
    _state.selectedTool = toolType;
    emit('tool:selected', { tool: toolType });
  };

  state.clearTool = function () {
    _state.selectedTool = null;
    emit('tool:cleared', null);
  };

  state.selectCell = function (cellId, rungId) {
    _state.selectedCellId = cellId;
    _state.selectedRungId = rungId;
    emit('selection:changed', { cellId, rungId });
  };

  state.selectRung = function (rungId) {
    _state.selectedCellId = null;
    _state.selectedRungId = rungId;
    emit('selection:changed', { cellId: null, rungId });
  };

  state.clearSelection = function () {
    _state.selectedCellId = null;
    _state.selectedRungId = null;
    emit('selection:changed', { cellId: null, rungId: null });
  };

  /* ── Ejercicio activo ── */

  state.setActiveExercise = function (exercise) {
    _state.activeExercise = exercise;
    emit('exercise:loaded', exercise);
  };

  state.getActiveExercise = () => _state.activeExercise;

  /* ── Undo / Redo ── */

  function _snapshot() {
    const snap = utils.deepClone({
      program: _state.program,
      signals: _state.signals,
    });
    _state._history.push(snap);
    if (_state._history.length > _state._maxHistory) {
      _state._history.shift();
    }
    _state._future = [];
  }

  state.undo = function () {
    if (_state._history.length === 0) return false;
    const current = utils.deepClone({
      program: _state.program,
      signals: _state.signals,
    });
    _state._future.push(current);
    const snap = _state._history.pop();
    _state.program = snap.program;
    _state.signals = snap.signals;
    emit('history:undo', null);
    emit('rungs:changed', _state.program.rungs);
    emit('signals:changed', _state.signals);
    return true;
  };

  state.redo = function () {
    if (_state._future.length === 0) return false;
    const current = utils.deepClone({
      program: _state.program,
      signals: _state.signals,
    });
    _state._history.push(current);
    const snap = _state._future.pop();
    _state.program = snap.program;
    _state.signals = snap.signals;
    emit('history:redo', null);
    emit('rungs:changed', _state.program.rungs);
    emit('signals:changed', _state.signals);
    return true;
  };

  state.canUndo = () => _state._history.length > 0;
  state.canRedo = () => _state._future.length > 0;

  /* ----------------------------------------------------------
     HELPERS INTERNOS
  ---------------------------------------------------------- */

  function _reindexRungs() {
    _state.program.rungs.forEach((r, i) => { r.index = i; });
  }

  /* ----------------------------------------------------------
     HELPERS PÚBLICOS: detectar si una señal es analógica
  ---------------------------------------------------------- */

  /**
   * Devuelve true si la dirección corresponde a una señal analógica.
   * Soporta: AIW0, AIW2, AQW0, AQW2 (palabras analógicas S7)
   * y MW analógicas (marcas de palabra).
   */
  state.isAnalogAddress = function (address) {
    if (!address) return false;
    const a = address.trim().toUpperCase();
    return /^AIW\d+$/.test(a) || /^AQW\d+$/.test(a) ||
           /^MW\d+$/.test(a)  || /^MD\d+$/.test(a);
  };

  state.isRealAddress = function (address) {
    if (!address) return false;
    return address.trim().toUpperCase().startsWith('MD');
  };

  /**
   * Retorna el tipo de señal adecuado para la dirección.
   * Extiende utils.getAddressType con soporte analógico.
   */
  state.getSignalTypeForAddress = function (address) {
    if (!address) return null;
    const a = address.trim().toUpperCase();
    if (/^AIW\d+$/.test(a)) return 'analog';
    if (/^AQW\d+$/.test(a)) return 'analog';
    if (/^MW\d+$/.test(a))  return 'analog';
    if (/^MD\d+$/.test(a))  return 'analog';
    return utils.getAddressType(address);
  };

  /* ----------------------------------------------------------
     EXPONER CONSTRUCTORES
  ---------------------------------------------------------- */
  state._createCell   = createCell;
  state._createRung   = createRung;
  state._createBranch = createBranch;
  state._createSignal = createSignal;

  /* ----------------------------------------------------------
     EXPORTAR AL NAMESPACE
  ---------------------------------------------------------- */
  global.LLT.state = state;

}(window));