/* ============================================================
   LADDER LOGIC TRAINER — editor.js
   Maneja la UI: toolbar, panel I/O, modals, botones.
   El dibujo del canvas lo hace canvas.js.
   ============================================================ */

(function (global) {
  'use strict';

  const { utils, state, components } = global.LLT;

  let _canvasEl   = null;
  let _zoom        = 1.0;
  let _viewport   = null;
  let _activeModal= null;
  let _ctxMenu    = null;

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  function init() {
    _viewport = utils.byId('canvas-viewport');
    _canvasEl = document.createElement('canvas');
    _canvasEl.id = 'llt-canvas';
    _canvasEl.style.cssText = 'display:block;background:#131614;';

    // Reemplazar el contenido del viewport por el canvas
    const content = utils.byId('canvas-content');
    if (content) content.remove();
    _viewport.appendChild(_canvasEl);

    // Inicializar el motor de canvas
    const vw = _viewport.clientWidth  || 800;
    const vh = _viewport.clientHeight || 500;
    _canvasEl.width  = vw;
    _canvasEl.height = vh;
    _canvasEl.style.width  = vw + 'px';
    _canvasEl.style.height = vh + 'px';

    global.LLT.canvas.init(_canvasEl);

    // Resize observer
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        global.LLT.canvas.resize(w, h);
      }
    });
    ro.observe(_viewport);

    _bindState();
    _bindToolbar();
    _bindKeyboard();
    _bindScanUpdate();

    // Panel I/O inicial
    _rebuildIOPanel();

  }

  /* ----------------------------------------------------------
     STATE EVENTS
  ---------------------------------------------------------- */
  function _bindState() {
    state.on('mode:changed',    ({ mode }) => {
      _updateModeUI(mode);
      // Bloquear toolbar en RUN
      const toolbar = document.querySelector('.toolbar');
      if (toolbar) toolbar.style.pointerEvents = mode === 'RUN' ? 'none' : '';
      const toolbarOp = mode === 'RUN' ? '0.4' : '1';
      if (toolbar) toolbar.style.opacity = toolbarOp;
      // Limpiar herramienta activa al entrar en RUN
      if (mode === 'RUN') state.clearTool();
    });
    state.on('scan:tick',       ({ cycle, ms }) => _updateStatusBar(cycle, ms));
    state.on('scan:reset',      () => _updateStatusBar(0, 0));
    state.on('signal:changed',  ({ address }) => _updateSignalRow(address));
    state.on('signal:updated',  () => _rebuildIOPanel());
    state.on('signal:forced',   ({ address }) => _updateSignalRow(address));
    state.on('signal:unforced', ({ address }) => _updateSignalRow(address));
    state.on('signals:changed', _rebuildIOPanel);
    state.on('tool:selected',   ({ tool }) => _highlightTool(tool));
    state.on('tool:cleared',    () => _highlightTool(null));
    state.on('rungs:changed',   () => {
      const cnt = utils.byId('canvas-rung-count');
      if (cnt) cnt.textContent = `${state.getRungs().length} rungs`;
      _updateProgramName();
    });
    state.on('program:new',    _updateProgramName);
    state.on('program:loaded', _updateProgramName);

    // Click en el nombre del programa → editar inline
    const nmEl = utils.byId('canvas-program-name');
    if (nmEl) {
      nmEl.style.cursor = 'pointer';
      nmEl.title = 'Click para renombrar';
      nmEl.addEventListener('click', () => {
        const current = state.getProgram().name || 'SIN_NOMBRE';
        const input = document.createElement('input');
        input.type      = 'text';
        input.value     = current;
        input.className = 'inline-editor__input';
        input.style.cssText = 'width:140px;font-size:11px;padding:2px 6px';
        nmEl.replaceWith(input);
        input.focus();
        input.select();

        function apply() {
          const val = input.value.trim().toUpperCase().replace(/\s+/g, '_') || 'SIN_NOMBRE';
          state.setProgramName(val);
          input.replaceWith(nmEl);
          nmEl.textContent = val;
        }

        input.addEventListener('blur',    apply);
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter')  { e.preventDefault(); apply(); }
          if (e.key === 'Escape') { input.replaceWith(nmEl); }
        });
      });
    }
  }

  /* ----------------------------------------------------------
     TOOLBAR
  ---------------------------------------------------------- */
  function _bindToolbar() {
    // Componentes — usar click directo en cada botón
    utils.qsa('.component-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.component;
        if (!type) return;
        _closeInlineEditor();
        state.getSelectedTool() === type ? state.clearTool() : state.selectTool(type);
      });
    });

    utils.byId('btn-add-rung')?.addEventListener('click', () => {
      const id = state.getSelectedRung();
      const rg = id ? state.getRung(id) : null;
      state.addRung(rg ? rg.index + 1 : state.getRungs().length);
    });

    utils.byId('btn-delete-rung')?.addEventListener('click', () => {
      const id = state.getSelectedRung();
      if (id) { state.removeRung(id); state.clearSelection(); }
      else utils.toast('Selecciona un rung primero', 'warning', 2000);
    });

    utils.byId('btn-zoom-in')?.addEventListener('click',  () => {
      _zoom = Math.min(2.0, _zoom + 0.15);
      _canvasEl.style.transform = `scale(${_zoom})`;
      _canvasEl.style.transformOrigin = 'top left';
    });
    utils.byId('btn-zoom-out')?.addEventListener('click', () => {
      _zoom = Math.max(0.4, _zoom - 0.15);
      _canvasEl.style.transform = `scale(${_zoom})`;
      _canvasEl.style.transformOrigin = 'top left';
    });
    utils.byId('btn-zoom-fit')?.addEventListener('click', () => {
      _zoom = 1.0;
      _canvasEl.style.transform = 'scale(1)';
    });

    utils.byId('btn-run')?.addEventListener('click',  () => global.LLT.simulator.start());
    utils.byId('btn-stop')?.addEventListener('click', () => global.LLT.simulator.stop());


    utils.delegate(document, 'click', '.menu-btn', (e, btn) => {
      const a = btn.dataset.action;
      if (a === 'new')  _newProgram();
      if (a === 'save' || a === 'export') _saveProgram();
      if (a === 'open') _openProgram();
    });

    utils.delegate(document, 'click', '.io-tab', (e, tab) => {
      utils.qsa('.io-tab').forEach(t => {
        t.classList.toggle('io-tab--active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      utils.qsa('.io-panel__content').forEach(p => {
        p.classList.toggle('io-panel__content--hidden', p.id !== `tab-${tab.dataset.tab}`);
      });
    });

    utils.delegate(document, 'click', '.io-toggle', (e, btn) => {
      e.stopPropagation();
      const addr = btn.dataset.signal;
      const sig  = state.getSignal(addr);
      if (!sig) return;
      sig.forced ? state.unforceSignal(addr) : state.forceSignal(addr, !state.getSignalValue(addr));
    });

    // Agregar variable desde el formulario inline del tab Variables
    utils.byId('btn-add-var')?.addEventListener('click', () => {
      const addrEl = utils.byId('var-addr-input');
      const nameEl = utils.byId('var-name-input');
      if (!addrEl || !nameEl) { _showAddVarModal(); return; }
      const addr = addrEl.value.trim().toUpperCase();
      const name = nameEl.value.trim();
      const isAnalog = state.isAnalogAddress(addr);
      if (!isAnalog && !utils.isValidAddress(addr)) {
        utils.toast('Dirección inválida', 'error', 2500);
        addrEl.focus(); return;
      }
      if (isAnalog) {
        const num = parseInt(addr.replace(/^[A-Z]+/, ''));
        const isMD = addr.startsWith('MD');
        if (isMD) {
          if (num < 100) { utils.toast('MD inválido — parte desde MD100', 'error', 4000); addrEl.focus(); return; }
          if (num % 4 !== 0) { utils.toast('MD inválido — debe ser múltiplo de 4: MD100, MD104…', 'error', 4000); addrEl.focus(); return; }
        } else {
          if (num < 10) { utils.toast('Dirección inválida — las analógicas parten desde 10: AIW10, MW10…', 'error', 4000); addrEl.focus(); return; }
          if (num % 2 !== 0) { utils.toast('Dirección inválida — debe ser par: AIW10, AIW12…', 'error', 4000); addrEl.focus(); return; }
        }
      }
      const sigType = state.getSignalTypeForAddress(addr);
      const ok = state.addSignal(addr, name || addr, sigType);
      if (ok) {
        utils.toast(`${addr} agregada`, 'success', 1500);
        addrEl.value = '';
        nameEl.value = '';
        addrEl.focus();
      } else {
        utils.toast('La señal ya existe', 'warning', 2000);
      }
    });

    // Enter en los inputs del formulario
    ['var-addr-input','var-name-input'].forEach(id => {
      utils.byId(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') utils.byId('btn-add-var')?.click();
      });
    });
  }

  /* ----------------------------------------------------------
     TECLADO
  ---------------------------------------------------------- */
  function _bindKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        _closeInlineEditor();
        state.clearTool();
        state.clearSelection();
        global.LLT.canvas.render();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (state.undo()) { utils.toast('Deshacer', 'info', 1000); }
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (state.redo()) { utils.toast('Rehacer', 'info', 1000); }
      }
    });
  }

  /* ----------------------------------------------------------
     SCAN UPDATE
  ---------------------------------------------------------- */
  function _bindScanUpdate() {
    document.addEventListener('llt:scan-update', () => {
      _updateIOValues();
    });
  }

  /* ----------------------------------------------------------
     EDITOR INLINE DE DIRECCIÓN
     Se muestra como un div flotante sobre el canvas.
  ---------------------------------------------------------- */
  let _inlineEditor = null;

  function showInlineEditor(cellId, rungId) {
    _closeInlineEditor();

    const cell = state.findCell(rungId, cellId);
    if (!cell) return;
    const def = components.getDef(cell.type);
    if (!def?.hasAddress) return;

    const sig = cell.address ? state.getSignal(cell.address) : null;

    const div = document.createElement('div');
    div.className = 'inline-editor';
    div.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 100;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-size:11px;color:var(--text-secondary);margin-bottom:6px;font-family:var(--font-ui)';
    title.textContent   = def.label;
    div.appendChild(title);

    // Definir analogDef aquí para usarlo en todo el editor
    const analogDef = components.getDef(cell.type);

    const addrIn = document.createElement('input');
    addrIn.type        = 'text';
    addrIn.className   = 'inline-editor__input';
    addrIn.placeholder = 'Dirección (I0.0, Q0.0…)';
    addrIn.value       = cell.address || '';
    div.appendChild(addrIn);

    const nameIn = document.createElement('input');
    nameIn.type        = 'text';
    nameIn.className   = 'inline-editor__input';
    nameIn.placeholder = 'Nombre (Start, Motor…)';
    nameIn.value       = sig ? sig.name : (cell.name || '');
    if (analogDef && analogDef.isAnalog) nameIn.style.display = 'none';
    div.appendChild(nameIn);

    // Campos extra para timers y contadores
    if ((cell.type.startsWith('timer') || cell.type.startsWith('counter')) && cell.type !== 'counter-rst') {
      const presetIn = document.createElement('input');
      presetIn.type          = 'number';
      presetIn.className     = 'inline-editor__input';
      presetIn.placeholder   = cell.type.startsWith('timer') ? 'Preset (ms)' : 'Preset';
      presetIn.value         = cell.preset || (cell.type.startsWith('timer') ? 1000 : 10);
      presetIn.min           = '0';
      presetIn.dataset.field = 'preset';
      div.appendChild(presetIn);
    }

    // Campos extra para bloques analógicos
    if (analogDef && analogDef.isAnalog) {

      // NORM: rawMin, rawMax, addrOut (MD)
      if (cell.type === 'norm') {
        const minIn = document.createElement('input');
        minIn.type          = 'number';
        minIn.className     = 'inline-editor__input';
        minIn.placeholder   = 'Mín raw (def: 0)';
        minIn.value         = cell.rawMin ?? 0;
        minIn.dataset.field = 'rawMin';
        div.appendChild(minIn);

        const maxIn = document.createElement('input');
        maxIn.type          = 'number';
        maxIn.className     = 'inline-editor__input';
        maxIn.placeholder   = 'Máx raw (def: 27648)';
        maxIn.value         = cell.rawMax ?? 27648;
        maxIn.dataset.field = 'rawMax';
        div.appendChild(maxIn);
      }

      // SCALE: engMin, engMax, addrOut (MD)
      if (cell.type === 'scale') {
        const engMinIn = document.createElement('input');
        engMinIn.type          = 'number';
        engMinIn.className     = 'inline-editor__input';
        engMinIn.placeholder   = 'Mín ingeniería (def: 0)';
        engMinIn.value         = cell.engMin ?? 0;
        engMinIn.dataset.field = 'engMin';
        div.appendChild(engMinIn);

        const engMaxIn = document.createElement('input');
        engMaxIn.type          = 'number';
        engMaxIn.className     = 'inline-editor__input';
        engMaxIn.placeholder   = 'Máx ingeniería (def: 100)';
        engMaxIn.value         = cell.engMax ?? 100;
        engMaxIn.dataset.field = 'engMax';
        div.appendChild(engMaxIn);
      }

      // CMP: address2 o setpoint
      if (cell.type.startsWith('cmp-')) {
        const addr2In = document.createElement('input');
        addr2In.type          = 'text';
        addr2In.className     = 'inline-editor__input';
        addr2In.placeholder   = 'IN2 — dirección (AIW12, MD100…) o dejar vacío';
        addr2In.value         = cell.address2 || '';
        addr2In.dataset.field = 'address2';
        div.appendChild(addr2In);

        const spIn = document.createElement('input');
        spIn.type          = 'number';
        spIn.className     = 'inline-editor__input';
        spIn.placeholder   = 'IN2 — constante (si no hay dirección arriba)';
        spIn.value         = cell.setpoint ?? 0;
        spIn.dataset.field = 'setpoint';
        div.appendChild(spIn);
      }

      // MATH: address2 o operand2
      if (cell.type.startsWith('math-')) {
        const addr2In = document.createElement('input');
        addr2In.type          = 'text';
        addr2In.className     = 'inline-editor__input';
        addr2In.placeholder   = 'IN2 — dirección (AIW12, MD100…) o dejar vacío';
        addr2In.value         = cell.address2 || '';
        addr2In.dataset.field = 'address2';
        div.appendChild(addr2In);

        const op2In = document.createElement('input');
        op2In.type          = 'number';
        op2In.className     = 'inline-editor__input';
        op2In.placeholder   = 'IN2 — constante (si no hay dirección arriba)';
        op2In.value         = cell.operand2 ?? 0;
        op2In.dataset.field = 'operand2';
        div.appendChild(op2In);
      }

      // addrOut — para NORM, SCALE, MATH, MOVE-A
      if (['norm','scale','math-add','math-sub','math-mul','math-div','math-mod','move-a'].includes(cell.type)) {
        const outIn = document.createElement('input');
        outIn.type          = 'text';
        outIn.className     = 'inline-editor__input';
        outIn.placeholder   = cell.type === 'norm' ? 'Salida MD (ej: MD100)' : 'Salida MD/MW (ej: MD104)';
        outIn.value         = cell.addrOut || '';
        outIn.dataset.field = 'addrOut';
        div.appendChild(outIn);
      }
    }

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:6px;margin-top:6px';

    const btnOk  = document.createElement('button');
    btnOk.className   = 'inline-editor__btn inline-editor__btn--ok';
    btnOk.textContent = '✓ OK';

    const btnDel = document.createElement('button');
    btnDel.className   = 'inline-editor__btn inline-editor__btn--del';
    btnDel.textContent = '✕ Eliminar';

    row.appendChild(btnOk);
    row.appendChild(btnDel);
    div.appendChild(row);
    document.body.appendChild(div);
    _inlineEditor = div;

    addrIn.focus();
    addrIn.select();

    function apply() {
      const addr   = addrIn.value.trim().toUpperCase();
      const name   = nameIn.value.trim();

      // Campos digitales
      const presetEl = div.querySelector('[data-field="preset"]');
      const preset   = presetEl ? Number(presetEl.value) : undefined;

      // Campos analógicos
      const rawMinEl  = div.querySelector('[data-field="rawMin"]');
      const rawMaxEl  = div.querySelector('[data-field="rawMax"]');
      const engMinEl  = div.querySelector('[data-field="engMin"]');
      const engMaxEl  = div.querySelector('[data-field="engMax"]');
      const address2El = div.querySelector('[data-field="address2"]');
      const setpointEl = div.querySelector('[data-field="setpoint"]');
      const operand2El = div.querySelector('[data-field="operand2"]');
      const addrOutEl  = div.querySelector('[data-field="addrOut"]');

      // Validar dirección principal
      const isAnalog = state.isAnalogAddress(addr);
      if (addr && !isAnalog && !utils.isValidAddress(addr)) {
        addrIn.style.borderColor = 'var(--clr-error)';
        utils.toast(`Dirección inválida: ${addr}`, 'error', 2500);
        addrIn.focus();
        return;
      }

      // Validar addrOut si existe
      const addrOut = addrOutEl ? addrOutEl.value.trim().toUpperCase() : undefined;
      if (addrOut && !state.isAnalogAddress(addrOut)) {
        utils.toast(`Dirección de salida inválida: ${addrOut}`, 'error', 2500);
        addrOutEl.focus();
        return;
      }

      // Construir updates
      const updates = { address: addr, name };
      if (preset    !== undefined) updates.preset   = preset;
      if (rawMinEl)  updates.rawMin   = Number(rawMinEl.value);
      if (rawMaxEl)  updates.rawMax   = Number(rawMaxEl.value);
      if (engMinEl)  updates.engMin   = Number(engMinEl.value);
      if (engMaxEl)  updates.engMax   = Number(engMaxEl.value);
      if (address2El) updates.address2 = address2El.value.trim().toUpperCase();
      if (setpointEl) updates.setpoint  = Number(setpointEl.value);
      if (operand2El) updates.operand2  = Number(operand2El.value);
      if (addrOut !== undefined) updates.addrOut = addrOut;

      state.updateCell(rungId, cellId, updates);

      // Registrar señal principal si no existe
      if (addr) {
        const sigType = state.getSignalTypeForAddress(addr) || utils.getAddressType(addr);
        if (state.getSignal(addr)) { if (name) state.updateSignalName(addr, name); }
        else state.addSignal(addr, name || addr, sigType);
      }

      // Registrar señal de salida si no existe
      if (addrOut) {
        const outType = state.getSignalTypeForAddress(addrOut);
        if (!state.getSignal(addrOut)) {
          state.addSignal(addrOut, addrOut, outType);
        }
      }

      _closeInlineEditor();
      global.LLT.canvas.render();
    }

    btnOk.addEventListener('click',  e => { e.stopPropagation(); apply(); });
    btnDel.addEventListener('click', e => {
      e.stopPropagation();
      _closeInlineEditor();
      state.removeCell(rungId, cellId);
      global.LLT.canvas.render();
    });

    addrIn.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); nameIn.focus(); }
      if (e.key === 'Escape') { e.preventDefault(); _closeInlineEditor(); }
    });
    nameIn.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); apply(); }
      if (e.key === 'Escape') { e.preventDefault(); _closeInlineEditor(); }
    });
  }

  function _closeInlineEditor() {
    if (_inlineEditor) { _inlineEditor.remove(); _inlineEditor = null; }
  }

  /* ----------------------------------------------------------
     CONTEXT MENU
  ---------------------------------------------------------- */
  function showContextMenu(clientX, clientY, hit) {
    if (_ctxMenu) { _ctxMenu.remove(); _ctxMenu = null; }

    const items = [];

    if (hit.type === 'cell') {
      const { cellId, rungId } = hit.data;
      items.push({ label: 'Editar', fn: () => showInlineEditor(cellId, rungId) });
      items.push({ label: 'Eliminar celda', fn: () => {
        state.removeCell(rungId, cellId);
        global.LLT.canvas.render();
      }, danger: true });
      items.push({ sep: true });
    }

    if (hit.type === 'cell' || hit.type === 'rung') {
      const rungId = hit.data.rungId;
      items.push({ label: 'Agregar rung abajo', fn: () => {
        const r = state.getRung(rungId);
        state.addRung(r ? r.index + 1 : state.getRungs().length);
      }});
      items.push({ label: 'Eliminar rung', fn: () => {
        state.removeRung(rungId);
        global.LLT.canvas.render();
      }, danger: true });
    }

    if (items.length === 0) return;

    const menu = document.createElement('div');
    menu.className  = 'context-menu';
    menu.style.left = `${clientX}px`;
    menu.style.top  = `${clientY}px`;

    items.forEach(item => {
      if (item.sep) {
        menu.appendChild(utils.createElement('div', { cls: 'context-menu__sep' }));
        return;
      }
      const btn = utils.createElement('button', {
        cls:  `context-menu__item${item.danger ? ' context-menu__item--danger' : ''}`,
        text: item.label,
      });
      btn.addEventListener('click', () => { item.fn(); menu.remove(); _ctxMenu = null; });
      menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    _ctxMenu = menu;
    setTimeout(() => {
      document.addEventListener('click', () => {
        menu.remove(); _ctxMenu = null;
      }, { once: true });
    }, 50);
  }

  /* ----------------------------------------------------------
     PANEL I/O
  ---------------------------------------------------------- */
  function _rebuildIOPanel() {
    ['list-inputs','list-outputs','list-marks'].forEach((id, i) => {
      const types = ['input','output','mark'];
      const list  = utils.byId(id);
      if (!list) return;
      utils.clearChildren(list);
      Object.values(state.getSignals())
        .filter(s => s.type === types[i])
        .forEach(sig => list.appendChild(_buildIORow(sig)));
    });
    _buildVarTable();
  }

  function _buildIORow(sig) {
    const val = state.getSignalValue(sig.address);
    const row = utils.createElement('div', {
      cls:   `io-row io-row--${val ? 'on' : 'off'}${sig.forced ? ' io-row--forced' : ''}`,
      attrs: { 'data-signal': sig.address },
    });
    row.appendChild(utils.createElement('button', { cls: 'io-toggle', attrs: { 'data-signal': sig.address } }));
    row.appendChild(utils.createElement('span',   { cls: 'io-address mono', text: sig.address }));
    row.appendChild(utils.createElement('span',   { cls: 'io-name',        text: sig.name }));
    row.appendChild(utils.createElement('span',   { cls: 'io-value mono',  text: val ? '1' : '0', attrs: { 'data-value': sig.address } }));
    return row;
  }

  function _updateSignalRow(address) {
    const row = document.querySelector(`.io-row[data-signal="${address}"]`);
    if (!row) return;
    const sig = state.getSignal(address);
    if (!sig) return;

    // Señales analógicas — delegar al parche si está disponible
    if (sig.type === 'analog') {
      if (global.LLT.editor._updateAnalogRow) {
        global.LLT.editor._updateAnalogRow(address);
      }
      return;
    }

    // Digital — comportamiento original
    const val = state.getSignalValue(address);
    row.className = `io-row io-row--${val ? 'on' : 'off'}${sig.forced ? ' io-row--forced' : ''}`;
    const v = row.querySelector(`[data-value="${address}"]`);
    if (v) v.textContent = val ? '1' : '0';
  }

  function _updateIOValues() {
    Object.values(state.getSignals()).forEach(s => _updateSignalRow(s.address));
  }

  function _buildVarTable() {
    const tbody = utils.byId('var-table-body');
    if (!tbody) return;
    utils.clearChildren(tbody);
    const sigs = Object.values(state.getSignals());
    if (sigs.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.style.cssText = 'text-align:center;color:var(--text-muted);padding:var(--space-3);font-size:var(--text-xs)';
      td.textContent = 'Sin variables definidas';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    sigs.forEach(sig => {
      const tr = document.createElement('tr');
      [sig.address, sig.name, sig.type].forEach(t => {
        const td = document.createElement('td');
        td.textContent = t;
        tr.appendChild(td);
      });
      // Botón eliminar
      const tdDel = document.createElement('td');
      const btnDel = document.createElement('button');
      btnDel.textContent = '✕';
      btnDel.style.cssText = 'color:var(--text-error);background:none;border:none;cursor:pointer;font-size:10px;padding:0 4px';
      btnDel.title = `Eliminar ${sig.address}`;
      btnDel.addEventListener('click', () => {
        state.removeSignal(sig.address);
        utils.toast(`${sig.address} eliminada`, 'info', 1500);
      });
      tdDel.appendChild(btnDel);
      tr.appendChild(tdDel);
      tbody.appendChild(tr);
    });
  }

  /* ----------------------------------------------------------
     UI UPDATES
  ---------------------------------------------------------- */
  function _updateModeUI(mode) {
    const dot    = utils.byId('plc-status');
    const modeEl = utils.byId('status-mode');
    if (dot) { dot.dataset.state = mode.toLowerCase(); const l = dot.querySelector('.plc-status__label'); if (l) l.textContent = mode; }
    if (modeEl) modeEl.textContent = mode;
    utils.byId('btn-run') ?.classList.toggle('active', mode === 'RUN');
    utils.byId('btn-stop')?.classList.toggle('active', mode === 'STOP');
  }

  function _updateStatusBar(cycle, ms) {
    const s = utils.byId('status-scan');
    const c = utils.byId('status-cycle');
    if (s) s.textContent = `Scan: ${ms} ms`;
    if (c) c.textContent = `Ciclo: ${cycle}`;
  }

  function _highlightTool(tool) {
    utils.qsa('.component-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.component === tool);
      btn.setAttribute('aria-pressed', String(btn.dataset.component === tool));
    });
  }

  /* ----------------------------------------------------------
     MODAL AGREGAR VARIABLE
  ---------------------------------------------------------- */
  function _showAddVarModal() {
    document.getElementById('add-var-modal')?.remove();
    const modal = document.createElement('div');
    modal.id        = 'add-var-modal';
    modal.className = 'modal-backdrop open';
    modal.innerHTML = `<div class="modal">
      <h2 class="modal__title">Nueva variable</h2>
      <div class="modal__field"><label class="modal__label">Dirección</label>
        <input id="v-addr" class="modal__input" type="text" placeholder="I0.0, Q0.0…"/></div>
      <div class="modal__field"><label class="modal__label">Nombre</label>
        <input id="v-name" class="modal__input" type="text" placeholder="Motor_1…"/></div>
      <div class="modal__actions">
        <button class="btn-secondary" id="v-cancel">Cancelar</button>
        <button class="btn-primary"   id="v-ok">Agregar</button>
      </div></div>`;
    document.body.appendChild(modal);
    document.getElementById('v-cancel').onclick = () => modal.remove();
    document.getElementById('v-ok').onclick = () => {
      const addr = document.getElementById('v-addr').value.trim().toUpperCase();
      const name = document.getElementById('v-name').value.trim();
      const isAnalog = state.isAnalogAddress(addr);
      if (!isAnalog && !utils.isValidAddress(addr)) { utils.toast('Dirección inválida', 'error', 2500); return; }
      if (isAnalog) {
        const num = parseInt(addr.replace(/^[A-Z]+/, ''));
        const isMD = addr.startsWith('MD');
        if (isMD) {
          if (num < 100) { utils.toast('MD inválido — parte desde MD100', 'error', 4000); return; }
          if (num % 4 !== 0) { utils.toast('MD inválido — debe ser múltiplo de 4: MD100, MD104…', 'error', 4000); return; }
        } else {
          if (num < 10) { utils.toast('Dirección inválida — las analógicas parten desde 10: AIW10, MW10…', 'error', 4000); return; }
          if (num % 2 !== 0) { utils.toast('Dirección inválida — debe ser par: AIW10, AIW12…', 'error', 4000); return; }
        }
      }
      const sigType = state.getSignalTypeForAddress(addr);
      state.addSignal(addr, name || addr, sigType)
        ? utils.toast(`${addr} agregada`, 'success', 2000)
        : utils.toast('Señal ya existe', 'warning', 2000);
      modal.remove();
    };
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.getElementById('v-addr').focus();
  }

  /* ----------------------------------------------------------
     PROGRAMA
  ---------------------------------------------------------- */
  function _updateProgramName() {
    const nm = utils.byId('canvas-program-name');
    if (nm) nm.textContent = state.getProgram().name || 'SIN_NOMBRE';
  }

  function _newProgram() {
    if (state.getRungs().length && !confirm('¿Descartar el programa actual?')) return;
    // Limpiar señales
    Object.keys(state.getSignals()).forEach(addr => state.removeSignal(addr));
    state.newProgram('SIN_NOMBRE');
  }

  async function _saveProgram() {
    const data = state.exportProgram();
    const name = data.program.name || 'SIN_NOMBRE';
    const json = JSON.stringify(data, null, 2);

    // Intentar showSaveFilePicker (Chrome/Edge)
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `${name}.json`,
          types: [{ description: 'Programa Ladder', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        utils.toast(`"${name}" guardado`, 'success', 2000);
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // usuario canceló
      }
    }

    // Fallback para otros browsers
    utils.downloadJSON(data, `${name}.json`);
    utils.toast(`"${name}" guardado`, 'success', 1500);
  }

  async function _openProgram() {
    try {
      const data = await utils.loadJSONFile();
      if (!data.program?.rungs) { utils.toast('Archivo inválido', 'error', 2500); return; }
      state.loadProgram(data.program);
      if (data.signals) Object.values(data.signals).forEach(s => state.addSignal(s.address, s.name, s.type));
      utils.toast(`"${data.program.name}" cargado`, 'success', 2000);
    } catch (err) { utils.toast(err.message, 'error', 2500); }
  }

  /* ----------------------------------------------------------
     API PÚBLICA
  ---------------------------------------------------------- */
  /* ----------------------------------------------------------
     EJERCICIOS
  ---------------------------------------------------------- */

  let _exercises = [];

  function loadExercises(exercises) {
    _exercises = exercises || [];
    _buildExerciseList();
  }

  function _buildExerciseList() {
    const list = utils.byId('exercise-list');
    if (!list) return;
    utils.clearChildren(list);

    if (_exercises.length === 0) {
      list.innerHTML = '<p style="color:var(--text-muted);font-size:var(--text-xs);padding:var(--space-2)">Sin ejercicios disponibles.</p>';
      return;
    }

    _exercises.forEach(ex => {
      const card = document.createElement('div');
      card.className   = 'exercise-card';
      card.dataset.exId = ex.id;

      card.innerHTML = `
        <div class="exercise-card__header">
          <span class="exercise-card__level">Nivel ${ex.level}</span>
          <span class="exercise-card__title">${ex.title}</span>
        </div>
        <p class="exercise-card__desc">${ex.description}</p>
        <div class="exercise-card__actions">
          <button class="exercise-btn exercise-btn--load"   data-ex="${ex.id}">Cargar</button>
        </div>
        <div class="exercise-card__result" id="result-${ex.id}" style="display:none"></div>
      `;

      list.appendChild(card);
    });

    // Delegar clicks en los botones
    list.addEventListener('click', e => {
      const btnLoad   = e.target.closest('.exercise-btn--load');
      if (btnLoad) _loadExercise(btnLoad.dataset.ex);
    });
  }

  function _loadExercise(exId) {
    const ex = _exercises.find(e => e.id === exId);
    if (!ex) return;

    if (state.getMode() === 'RUN') global.LLT.simulator.stop();

    state.setActiveExercise(ex);
    global.LLT.validator.loadExerciseSignals(ex);

    utils.qsa('.exercise-card').forEach(card => {
      card.classList.toggle('exercise-card--active', card.dataset.exId === exId);
    });
    utils.qsa('.exercise-btn--verify').forEach(btn => {
      btn.disabled = btn.dataset.ex !== exId;
    });

    const resultEl = utils.byId(`result-${exId}`);
    if (resultEl) resultEl.style.display = 'none';

    _showExerciseModal(ex);

    // ← LÍNEA NUEVA: cargar escena visual
    global.LLT.sceneEngine.loadScene(exId);
  }

  function _showExerciseModal(ex) {
    document.getElementById('ex-modal')?.remove();

    const modal = document.createElement('div');
    modal.id        = 'ex-modal';
    modal.className = 'modal-backdrop open';

    const hintsHTML = ex.hint_steps.map((h, i) =>
      `<li style="margin-bottom:4px"><span style="color:var(--text-muted)">${i + 1}.</span> ${h}</li>`
    ).join('');

    const signalsHTML = ex.signals.map(s =>
      `<tr>
        <td class="mono" style="font-size:var(--text-xs)">${s.address}</td>
        <td style="font-size:var(--text-xs)">${s.name}</td>
        <td style="font-size:var(--text-xs);color:var(--text-muted)">${s.type}</td>
      </tr>`
    ).join('');

    modal.innerHTML = `
      <div class="modal" style="max-width:420px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3)">
          <h2 class="modal__title" style="margin:0">Nivel ${ex.level} — ${ex.title}</h2>
          <button id="ex-modal-close" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--text-secondary)">✕</button>
        </div>

        <p style="font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:var(--space-3)">${ex.objective}</p>

        <h3 style="font-size:var(--text-xs);font-weight:600;margin-bottom:var(--space-2);color:var(--text-primary)">Señales disponibles</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:var(--space-3)">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              <th style="font-size:var(--text-xs);text-align:left;padding:2px 4px">Dir.</th>
              <th style="font-size:var(--text-xs);text-align:left;padding:2px 4px">Nombre</th>
              <th style="font-size:var(--text-xs);text-align:left;padding:2px 4px">Tipo</th>
            </tr>
          </thead>
          <tbody>${signalsHTML}</tbody>
        </table>

        <h3 style="font-size:var(--text-xs);font-weight:600;margin-bottom:var(--space-2);color:var(--text-primary)">Pistas</h3>
        <ol style="padding-left:0;list-style:none;margin-bottom:var(--space-3)">${hintsHTML}</ol>

        <div class="modal__actions">
          <button class="btn-primary" id="ex-modal-close-btn">Entendido, a programar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    document.getElementById('ex-modal-close')?.addEventListener('click', close);
    document.getElementById('ex-modal-close-btn')?.addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
  }

  async function _verifyExercise(exId) {
    const ex = _exercises.find(e => e.id === exId);
    if (!ex) return;

    const resultEl = utils.byId(`result-${exId}`);
    const btnVerify = document.querySelector(`.exercise-btn--verify[data-ex="${exId}"]`);

    // Mostrar estado de espera
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = '<span style="color:var(--text-muted);font-size:var(--text-xs)">⏳ Verificando…</span>';
    }
    if (btnVerify) btnVerify.disabled = true;

    const outcome = await global.LLT.validator.validate(ex);

    if (btnVerify) btnVerify.disabled = false;

    // Error del validador (ej: simulador en STOP)
    if (outcome.error) {
      if (resultEl) {
        resultEl.style.display = 'block';
        resultEl.innerHTML = `<span style="color:var(--clr-error);font-size:var(--text-xs)">⚠ ${outcome.error}</span>`;
      }
      utils.toast(outcome.error, 'warning', 3000);
      return;
    }

    // Construir detalle de resultados
    const rows = outcome.stimulusResults.map(r => {
      const icon   = r.pass ? '✓' : '✗';
      const color  = r.pass ? 'var(--clr-success, #4caf50)' : 'var(--clr-error, #f44336)';
      const detail = r.results.map(res =>
        `${res.address}: esperado ${res.expected ? '1' : '0'}, obtenido ${res.actual ? '1' : '0'}`
      ).join(' | ');
      return `
        <div style="display:flex;gap:6px;align-items:baseline;margin-bottom:3px">
          <span style="color:${color};font-size:11px;flex-shrink:0">${icon}</span>
          <div>
            <span style="font-size:10px;color:var(--text-secondary)">${r.label}</span>
            ${!r.pass ? `<br><span style="font-size:9px;color:var(--text-muted)">${detail}</span>` : ''}
          </div>
        </div>`;
    }).join('');

    const pct     = Math.round(outcome.score * 100);
    const mainClr = outcome.success ? 'var(--clr-success, #4caf50)' : 'var(--clr-error, #f44336)';
    const mainMsg = outcome.success
      ? `✓ Correcto — ${pct}%`
      : `✗ Incorrecto — ${pct}% (${outcome.passed}/${outcome.total})`;

    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <div style="margin-bottom:6px;font-size:var(--text-xs);font-weight:600;color:${mainClr}">${mainMsg}</div>
        <div>${rows}</div>
      `;
    }

    utils.toast(
      outcome.success ? `✓ ${ex.title} — superado` : `✗ Revisa los estímulos fallidos`,
      outcome.success ? 'success' : 'error',
      3000
    );
  }

  /* ----------------------------------------------------------
     API PÚBLICA
  ---------------------------------------------------------- */
  global.LLT.editor = {
    init,
    showInlineEditor,
    showContextMenu,
    loadExercises,
  };
}(window));