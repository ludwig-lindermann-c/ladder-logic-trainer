/* ============================================================
   LADDER LOGIC TRAINER — state.js
   Store central de la aplicación. Gestiona:
   - Programa (rungs y elementos)
   - Señales I/O (entradas, salidas, marcas)
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

  /** Señal individual de I/O */
  function createSignal(address, name, type) {
    return {
      address,           // 'I0.0', 'Q0.0', 'M0.0', etc.
      name,              // nombre simbólico editable
      type,              // 'input' | 'output' | 'mark' | 'timer' | 'counter'
      value:    false,   // valor lógico actual
      forced:   false,   // true si está forzado manualmente
      forceVal: false,   // valor forzado
    };
  }

  /** Elemento dentro de un rung */
  function createCell(type, address = '', name = '') {
    const base = {
      id:      utils.uid('cell'),
      type,              // 'contact-no' | 'contact-nc' | 'coil' | etc.
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
    if (type === 'counter-up' || type === 'counter-dn') {
      base.preset  = 10;
      base.count   = 0;
      base.done    = false;
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
     Las señales se crean al asignar direcciones a componentes
     o manualmente desde el panel de Variables.
  ---------------------------------------------------------- */

  function defaultSignals() {
    return {};
  }

  /* ----------------------------------------------------------
     STORE INTERNO
  ---------------------------------------------------------- */

  let _state = {
    // Programa activo
    program:       createProgram(),

    // Tabla de señales { 'I0.0': Signal, ... }
    signals:       defaultSignals(),

    // Modo del PLC simulado
    mode:          'STOP',   // 'STOP' | 'RUN' | 'STEP'

    // Ciclo de scan actual
    scanCycle:     0,
    lastScanMs:    0,

    // Editor: componente seleccionado para insertar
    selectedTool:  null,   // string: 'contact-no', 'coil', etc.

    // Editor: celda o rung seleccionado en el canvas
    selectedCellId: null,
    selectedRungId: null,

    // Ejercicio activo
    activeExercise: null,

    // Historial undo/redo
    _history:   [],
    _future:    [],
    _maxHistory: 50,
  };

  /* ----------------------------------------------------------
     SUSCRIPTORES (patrón Observer simple)
  ---------------------------------------------------------- */

  const _listeners = {};   // { eventName: [fn, fn, ...] }

  function emit(event, payload) {
    (_listeners[event] || []).forEach(fn => fn(payload));
    (_listeners['*']   || []).forEach(fn => fn({ event, payload }));
  }

  /* ----------------------------------------------------------
     API PÚBLICA
  ---------------------------------------------------------- */

  const state = {};

  /* ── Suscripción ── */

  /**
   * Suscribirse a un evento del store.
   * @param {string} event - nombre del evento o '*' para todos
   * @param {Function} fn
   * @returns {Function} unsuscribe
   */
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

  /**
   * Agrega una celda a un rung en la posición indicada.
   * Si branchId se especifica, inserta dentro de esa rama.
   */
  state.addCell = function (rungId, type, address, name, atIndex, branchId, branchRow) {
    _snapshot();
    const rung = state.getRung(rungId);
    if (!rung) return null;

    const cell = createCell(type, address, name);

    if (branchId !== undefined) {
      // Insertar dentro de una rama paralela
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

    // Busca en elementos directos
    const idx = rung.elements.findIndex(el => el.id === cellId);
    if (idx !== -1) {
      rung.elements = utils.arrayRemove(rung.elements, idx);
      emit('rung:updated', rung);
      return;
    }

    // Busca dentro de ramas
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

  /**
   * Busca una celda por id dentro de un rung (incluyendo ramas).
   */
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

  /* ── Señales I/O ── */

  state.getSignals = () => _state.signals;

  state.getSignal = (address) => _state.signals[address] || null;

  state.getSignalValue = function (address) {
    const sig = _state.signals[address];
    if (!sig) return false;
    return sig.forced ? sig.forceVal : sig.value;
  };

  state.setSignalValue = function (address, value) {
    if (!_state.signals[address]) return;
    _state.signals[address].value = !!value;
    emit('signal:changed', { address, value: !!value });
  };

  state.forceSignal = function (address, value) {
    if (!_state.signals[address]) return;
    _state.signals[address].forced   = true;
    _state.signals[address].forceVal = !!value;
    emit('signal:forced', { address, value: !!value });
    emit('signal:changed', { address, value: !!value });
  };

  state.unforceSignal = function (address) {
    if (!_state.signals[address]) return;
    _state.signals[address].forced = false;
    emit('signal:unforced', { address });
  };

  state.addSignal = function (address, name, type) {
    const normalized = utils.normalizeAddress(address);
    if (_state.signals[normalized]) return false;   // ya existe
    _state.signals[normalized] = createSignal(normalized, name, type);
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

  state.getScanCycle = () => _state.scanCycle;
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
    _state._future = [];   // nueva acción borra el futuro
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
     EXPONER CONSTRUCTORES (útiles para el editor y simulador)
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