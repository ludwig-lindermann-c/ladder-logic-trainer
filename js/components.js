/* ============================================================
   LADDER LOGIC TRAINER — components.js
   Renderiza rungs como HTML. Cada espacio entre elementos
   tiene dos botones: ↳ (abrir rama) y ↱ (cerrar rama).

   Añadido: catálogo de bloques analógicos (CMP, MATH, SCALE, MOVE-A)
   ============================================================ */

(function (global) {
  'use strict';

  const { utils, state } = global.LLT;

  /* ----------------------------------------------------------
     CATÁLOGO
  ---------------------------------------------------------- */
  const CATALOG = {
    // ── Contactos ──
    'contact-no':  { label: 'Contacto NO',     category: 'contacts', hasAddress: true  },
    'contact-nc':  { label: 'Contacto NC',     category: 'contacts', hasAddress: true  },
    'contact-pos': { label: 'Flanco +',        category: 'contacts', hasAddress: true  },
    'contact-neg': { label: 'Flanco -',        category: 'contacts', hasAddress: true  },

    // ── Bobinas ──
    'coil':        { label: 'Bobina',          category: 'coils',    hasAddress: true  },
    'coil-set':    { label: 'Bobina Set',      category: 'coils',    hasAddress: true  },
    'coil-reset':  { label: 'Bobina Reset',    category: 'coils',    hasAddress: true  },
    'coil-not':    { label: 'Bobina /',        category: 'coils',    hasAddress: true  },

    // ── Bloques digitales ──
    'timer-on':    { label: 'TON',             category: 'blocks',   hasAddress: true,  isBlock: true },
    'timer-off':   { label: 'TOF',             category: 'blocks',   hasAddress: true,  isBlock: true },
    'counter-up':  { label: 'CTU',             category: 'blocks',   hasAddress: true,  isBlock: true },
    'counter-dn':  { label: 'CTD',             category: 'blocks',   hasAddress: true,  isBlock: true },
    'timer-pulse': { label: 'TP',              category: 'blocks',   hasAddress: true,  isBlock: true },
    'counter-rst': { label: 'Reset/Load',      category: 'blocks',   hasAddress: true,  isBlock: true },

    // ── Hilo ──
    'wire-h':      { label: 'Hilo',            category: 'wires',    hasAddress: false },

    // ── Bloques analógicos: Comparadores ──
    // IN1 (address) comparado con IN2 (address2) o setpoint
    'cmp-gt':      { label: 'CMP >',           category: 'analog',   hasAddress: true,  isBlock: true, isAnalog: true },
    'cmp-lt':      { label: 'CMP <',           category: 'analog',   hasAddress: true,  isBlock: true, isAnalog: true },
    'cmp-ge':      { label: 'CMP ≥',           category: 'analog',   hasAddress: true,  isBlock: true, isAnalog: true },
    'cmp-le':      { label: 'CMP ≤',           category: 'analog',   hasAddress: true,  isBlock: true, isAnalog: true },
    'cmp-eq':      { label: 'CMP =',           category: 'analog',   hasAddress: true,  isBlock: true, isAnalog: true },
    'cmp-ne':      { label: 'CMP ≠',           category: 'analog',   hasAddress: true,  isBlock: true, isAnalog: true },

    // ── Bloques analógicos: Operaciones matemáticas ──
    // IN1 (address) OP IN2 (address2 o operand2) → OUT (addrOut)
    'math-add':    { label: 'MATH +',          category: 'analog',   hasAddress: true,  isBlock: true, isAnalog: true },
    'math-sub':    { label: 'MATH -',          category: 'analog',   hasAddress: true,  isBlock: true, isAnalog: true },
    'math-mul':    { label: 'MATH ×',          category: 'analog',   hasAddress: true,  isBlock: true, isAnalog: true },
    'math-div':    { label: 'MATH ÷',          category: 'analog',   hasAddress: true,  isBlock: true, isAnalog: true },
    'math-mod':    { label: 'MATH %',          category: 'analog',   hasAddress: true,  isBlock: true, isAnalog: true },

    // ── Escalado lineal ──
    'scale':       { label: 'SCALE',           category: 'analog',   hasAddress: true,  isBlock: true, isAnalog: true },

    // ── MOVE analógico ──
    'move-a':      { label: 'MOVE',            category: 'analog',   hasAddress: true,  isBlock: true, isAnalog: true },
  };

  /* ----------------------------------------------------------
     ETIQUETAS DE TIPO → nombre corto para la UI
  ---------------------------------------------------------- */
  const TYPE_LABEL = {
    'timer-on':   'TON',
    'timer-off':  'TOF',
    'timer-pulse':'TP',
    'counter-up': 'CTU',
    'counter-dn': 'CTD',
    'counter-rst':'RST',
    'cmp-gt':     'CMP',
    'cmp-lt':     'CMP',
    'cmp-ge':     'CMP',
    'cmp-le':     'CMP',
    'cmp-eq':     'CMP',
    'cmp-ne':     'CMP',
    'math-add':   'ADD',
    'math-sub':   'SUB',
    'math-mul':   'MUL',
    'math-div':   'DIV',
    'math-mod':   'MOD',
    'scale':      'SCALE',
    'move-a':     'MOVE',
  };

  // Símbolo del operador para comparadores y matemáticas
  const OP_SYMBOL = {
    'cmp-gt':  '>',
    'cmp-lt':  '<',
    'cmp-ge':  '≥',
    'cmp-le':  '≤',
    'cmp-eq':  '=',
    'cmp-ne':  '≠',
    'math-add':'+',
    'math-sub':'-',
    'math-mul':'×',
    'math-div':'÷',
    'math-mod':'%',
  };

  /* ----------------------------------------------------------
     SVG SÍMBOLOS (elementos digitales, sin cambios)
  ---------------------------------------------------------- */
  function symbolSVG(type, on) {
    const c  = on ? 'var(--rung-wire-active)' : 'var(--contact-no-stroke)';
    const cf = on ? 'var(--coil-fill-active)' : 'none';
    const s  = `stroke="${c}" stroke-width="2" stroke-linecap="round"`;

    const svgOpen  = `<svg viewBox="0 0 60 36" class="cell-svg" aria-hidden="true">`;
    const svgClose = `</svg>`;

    const contactLines = `
      <line x1="0"  y1="18" x2="16" y2="18" ${s}/>
      <line x1="16" y1="4"  x2="16" y2="32" ${s}/>
      <line x1="44" y1="4"  x2="44" y2="32" ${s}/>
      <line x1="44" y1="18" x2="60" y2="18" ${s}/>`;

    switch (type) {
      case 'contact-no':
        return svgOpen + contactLines + svgClose;

      case 'contact-nc':
        return svgOpen + contactLines +
          `<line x1="16" y1="5" x2="44" y2="31" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>` +
          svgClose;

      case 'contact-pos':
        return svgOpen + contactLines +
          `<text x="30" y="23" text-anchor="middle" font-size="11" font-weight="bold"
            font-family="var(--font-mono)" fill="${c}" stroke="none">P</text>` +
          svgClose;

      case 'contact-neg':
        return svgOpen + contactLines +
          `<text x="30" y="23" text-anchor="middle" font-size="11" font-weight="bold"
            font-family="var(--font-mono)" fill="${c}" stroke="none">N</text>` +
          svgClose;

      case 'coil':
        return svgOpen +
          `<line x1="0" y1="18" x2="12" y2="18" ${s}/>
           <circle cx="30" cy="18" r="14" fill="${cf}" stroke="${c}" stroke-width="2"/>
           <line x1="48" y1="18" x2="60" y2="18" ${s}/>` +
          svgClose;

      case 'coil-set':
        return svgOpen +
          `<line x1="0" y1="18" x2="12" y2="18" ${s}/>
           <circle cx="30" cy="18" r="14" fill="${cf}" stroke="${c}" stroke-width="2"/>
           <line x1="48" y1="18" x2="60" y2="18" ${s}/>
           <text x="30" y="23" text-anchor="middle" font-size="11" font-weight="bold"
             font-family="var(--font-mono)" fill="${c}" stroke="none">S</text>` +
          svgClose;

      case 'coil-reset':
        return svgOpen +
          `<line x1="0" y1="18" x2="12" y2="18" ${s}/>
           <circle cx="30" cy="18" r="14" fill="${cf}" stroke="${c}" stroke-width="2"/>
           <line x1="48" y1="18" x2="60" y2="18" ${s}/>
           <text x="30" y="23" text-anchor="middle" font-size="11" font-weight="bold"
             font-family="var(--font-mono)" fill="${c}" stroke="none">R</text>` +
          svgClose;

      case 'coil-not':
        return svgOpen +
          `<line x1="0" y1="18" x2="12" y2="18" ${s}/>
           <circle cx="30" cy="18" r="14" fill="${cf}" stroke="${c}" stroke-width="2"/>
           <line x1="48" y1="18" x2="60" y2="18" ${s}/>
           <text x="30" y="23" text-anchor="middle" font-size="13"
             font-family="var(--font-mono)" fill="${c}" stroke="none">/</text>` +
          svgClose;

      case 'wire-h':
        return svgOpen +
          `<line x1="0" y1="18" x2="60" y2="18" ${s}/>` +
          svgClose;

      default:
        return svgOpen +
          `<line x1="0" y1="18" x2="60" y2="18" stroke="var(--rung-wire-color)" stroke-width="2"/>` +
          svgClose;
    }
  }

  /* ----------------------------------------------------------
     FORMATO NUMÉRICO para bloques analógicos
  ---------------------------------------------------------- */
  function _fmtNum(n) {
    if (n === undefined || n === null) return '—';
    if (typeof n !== 'number') return String(n);
    // Si es entero, sin decimales; si tiene parte decimal, máx 2
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  }

  /* ----------------------------------------------------------
     RENDER DE CELDA
  ---------------------------------------------------------- */
  function renderCell(cell, rungId) {
    const def = CATALOG[cell.type] || {};
    const sig = cell.address ? state.getSignal(cell.address) : null;
    const nm  = sig ? sig.name : (cell.name || '');
    const on  = !!cell.energized;

    const div = document.createElement('div');
    div.className = `lad-cell${on ? ' lad-cell--on' : ''}${def.isAnalog ? ' lad-cell--analog' : ''}`;
    div.dataset.cellId  = cell.id;
    div.dataset.rungId  = rungId;
    div.dataset.type    = cell.type;
    div.dataset.address = cell.address || '';
    div.setAttribute('tabindex', '0');
    div.setAttribute('title', `${def.label || cell.type}${cell.address ? ' — ' + cell.address : ''}`);

    if (def.isBlock) {
      const typeLabel = TYPE_LABEL[cell.type] || cell.type.toUpperCase();
      const isTimer   = cell.type.startsWith('timer');
      const isAnalog  = !!def.isAnalog;

      // ── RST ──
      if (cell.type === 'counter-rst') {
        div.innerHTML = `
          <span class="cell-addr">${cell.address || '???'}</span>
          <div class="cell-block">
            <div class="cell-block__hdr" style="padding:6px 8px">
              <b>RST</b>
            </div>
            <div class="cell-block__row" style="justify-content:center;padding:4px 8px">
              <span style="color:var(--text-secondary)">${cell.address || '???'}</span>
            </div>
          </div>`;

      // ── Comparadores ──
      } else if (cell.type.startsWith('cmp-')) {
        const op   = OP_SYMBOL[cell.type] || '?';
        const in2  = cell.address2 || _fmtNum(cell.setpoint ?? 0);
        const curV = _fmtNum(cell.currentVal);
        div.innerHTML = `
          <span class="cell-addr">${cell.address || '???'}</span>
          <div class="cell-block cell-block--analog">
            <div class="cell-block__hdr cell-block__hdr--analog">
              <b>${typeLabel}</b><span class="cell-block__op">${op}</span>
            </div>
            <div class="cell-block__row">
              <span class="cell-block__lbl">IN1</span>
              <span class="cell-block__val mono" data-field="in1">${cell.address || '???'}</span>
            </div>
            <div class="cell-block__row">
              <span class="cell-block__lbl">IN2</span>
              <span class="cell-block__val mono" data-field="in2">${in2}</span>
            </div>
            <div class="cell-block__row cell-block__row--result">
              <span class="cell-block__lbl">VAL</span>
              <span class="cell-block__val mono" data-field="curval">${curV}</span>
            </div>
          </div>
          ${nm ? `<span class="cell-name">${nm}</span>` : ''}`;

      // ── Matemáticas ──
      } else if (cell.type.startsWith('math-')) {
        const op  = OP_SYMBOL[cell.type] || '?';
        const in2 = cell.address2 || _fmtNum(cell.operand2 ?? 0);
        div.innerHTML = `
          <span class="cell-addr">${cell.address || '???'}</span>
          <div class="cell-block cell-block--analog">
            <div class="cell-block__hdr cell-block__hdr--analog">
              <b>${typeLabel}</b><span class="cell-block__op">${op}</span>
            </div>
            <div class="cell-block__row">
              <span class="cell-block__lbl">IN1</span>
              <span class="cell-block__val mono">${cell.address || '???'}</span>
            </div>
            <div class="cell-block__row">
              <span class="cell-block__lbl">IN2</span>
              <span class="cell-block__val mono">${in2}</span>
            </div>
            <div class="cell-block__row">
              <span class="cell-block__lbl">OUT</span>
              <span class="cell-block__val mono">${cell.addrOut || '???'}</span>
            </div>
            <div class="cell-block__row cell-block__row--result">
              <span class="cell-block__lbl">RES</span>
              <span class="cell-block__val mono" data-field="result">${_fmtNum(cell.result)}</span>
            </div>
          </div>
          ${nm ? `<span class="cell-name">${nm}</span>` : ''}`;

      // ── Escalado ──
      } else if (cell.type === 'scale') {
        div.innerHTML = `
          <span class="cell-addr">${cell.address || '???'}</span>
          <div class="cell-block cell-block--analog">
            <div class="cell-block__hdr cell-block__hdr--analog">
              <b>SCALE</b>
            </div>
            <div class="cell-block__row">
              <span class="cell-block__lbl">IN</span>
              <span class="cell-block__val mono">${cell.address || '???'}</span>
            </div>
            <div class="cell-block__row">
              <span class="cell-block__lbl">RAW</span>
              <span class="cell-block__val mono">${cell.rawMin ?? 0}…${cell.rawMax ?? 27648}</span>
            </div>
            <div class="cell-block__row">
              <span class="cell-block__lbl">ENG</span>
              <span class="cell-block__val mono">${cell.engMin ?? 0}…${cell.engMax ?? 100}</span>
            </div>
            <div class="cell-block__row">
              <span class="cell-block__lbl">OUT</span>
              <span class="cell-block__val mono">${cell.addrOut || '???'}</span>
            </div>
            <div class="cell-block__row cell-block__row--result">
              <span class="cell-block__lbl">VAL</span>
              <span class="cell-block__val mono" data-field="result">${_fmtNum(cell.result)}</span>
            </div>
          </div>
          ${nm ? `<span class="cell-name">${nm}</span>` : ''}`;

      // ── MOVE analógico ──
      } else if (cell.type === 'move-a') {
        div.innerHTML = `
          <span class="cell-addr">${cell.address || '???'}</span>
          <div class="cell-block cell-block--analog">
            <div class="cell-block__hdr cell-block__hdr--analog">
              <b>MOVE</b>
            </div>
            <div class="cell-block__row">
              <span class="cell-block__lbl">IN</span>
              <span class="cell-block__val mono">${cell.address || '???'}</span>
            </div>
            <div class="cell-block__row">
              <span class="cell-block__lbl">OUT</span>
              <span class="cell-block__val mono">${cell.addrOut || '???'}</span>
            </div>
            <div class="cell-block__row cell-block__row--result">
              <span class="cell-block__lbl">VAL</span>
              <span class="cell-block__val mono" data-field="result">${_fmtNum(cell.result)}</span>
            </div>
          </div>
          ${nm ? `<span class="cell-name">${nm}</span>` : ''}`;

      // ── TON / TOF / TP / CTU / CTD (sin cambios) ──
      } else {
        div.innerHTML = `
          <span class="cell-addr">${cell.address || '???'}</span>
          <div class="cell-block">
            <div class="cell-block__hdr">
              <b>${typeLabel}</b>
              <span>${cell.address || '???'}</span>
            </div>
            <div class="cell-block__row">
              <span>${isTimer ? 'PT' : 'PV'}</span>
              <span data-field="preset">${isTimer ? utils.formatTime(cell.preset||0) : (cell.preset||0)}</span>
            </div>
            <div class="cell-block__row">
              <span>${isTimer ? 'ET' : 'CV'}</span>
              <span data-field="elapsed">${isTimer ? utils.formatTime(cell.elapsed||0) : (cell.count||0)}</span>
            </div>
          </div>
          ${nm ? `<span class="cell-name">${nm}</span>` : ''}`;
      }

    } else {
      // Elementos no-bloque (contactos, bobinas, hilo)
      div.innerHTML = `
        ${def.hasAddress ? `<span class="cell-addr">${cell.address || '???'}</span>` : ''}
        ${symbolSVG(cell.type, on)}
        ${nm ? `<span class="cell-name">${nm}</span>` : ''}`;
    }

    return div;
  }

  /* ----------------------------------------------------------
     SPACER — sin cambios
  ---------------------------------------------------------- */
  function renderSpacer(rungId, insertIdx, branchCtx) {
    const sp = document.createElement('div');
    sp.className = 'rung-spacer';

    const btnOpen = document.createElement('button');
    btnOpen.className   = 'spacer-btn spacer-btn--open';
    btnOpen.textContent = '↳';
    btnOpen.title       = 'Abrir rama paralela aquí';
    btnOpen.dataset.action     = 'branch-open';
    btnOpen.dataset.insertIdx  = insertIdx;
    btnOpen.dataset.rungId     = rungId;
    if (branchCtx) {
      btnOpen.dataset.branchId = branchCtx.branchId;
      btnOpen.dataset.rowIdx   = branchCtx.rowIdx;
    }

    const btnClose = document.createElement('button');
    btnClose.className   = 'spacer-btn spacer-btn--close';
    btnClose.textContent = '↱';
    btnClose.title       = 'Cerrar rama paralela aquí';
    btnClose.dataset.action    = 'branch-close';
    btnClose.dataset.insertIdx = insertIdx;
    btnClose.dataset.rungId    = rungId;
    if (branchCtx) {
      btnClose.dataset.branchId = branchCtx.branchId;
      btnClose.dataset.rowIdx   = branchCtx.rowIdx;
    }

    sp.appendChild(btnOpen);
    sp.appendChild(btnClose);
    return sp;
  }

  /* ----------------------------------------------------------
     RENDER DE RAMA PARALELA — sin cambios
  ---------------------------------------------------------- */
  function renderBranch(branch, rungId) {
    const rows = branch.rows || [[]];
    const div  = document.createElement('div');
    div.className        = 'lad-branch';
    div.dataset.branchId = branch.id;
    div.dataset.rungId   = rungId;

    rows.forEach((row, rowIdx) => {
      const rowDiv = document.createElement('div');
      rowDiv.className         = `lad-branch__row lad-branch__row--${rowIdx === 0 ? 'main' : 'alt'}`;
      rowDiv.dataset.branchRow = rowIdx;
      rowDiv.dataset.branchId  = branch.id;
      rowDiv.dataset.rungId    = rungId;

      rowDiv.appendChild(renderSpacer(rungId, 0, { branchId: branch.id, rowIdx }));

      row.forEach((cell, ci) => {
        rowDiv.appendChild(renderCell(cell, rungId));
        rowDiv.appendChild(renderSpacer(rungId, ci + 1, { branchId: branch.id, rowIdx }));
      });

      if (row.length === 0) {
        const ph = document.createElement('span');
        ph.className   = 'branch-ph';
        ph.textContent = 'insertar contacto';
        rowDiv.appendChild(ph);
      }

      div.appendChild(rowDiv);
    });

    const addRow = document.createElement('button');
    addRow.className        = 'branch-add-row';
    addRow.textContent      = '↳ agregar fila paralela';
    addRow.dataset.branchId = branch.id;
    addRow.dataset.rungId   = rungId;
    div.appendChild(addRow);

    return div;
  }

  /* ----------------------------------------------------------
     RENDER DE RUNG COMPLETO — sin cambios
  ---------------------------------------------------------- */
  function renderRung(rung) {
    const wrap = document.createElement('div');
    wrap.className         = `rung${rung.energized ? ' rung--powered' : ''}`;
    wrap.dataset.rungId    = rung.id;
    wrap.dataset.rungIndex = rung.index;

    const num = document.createElement('span');
    num.className   = 'rung__num';
    num.textContent = rung.index;
    wrap.appendChild(num);

    const railL = document.createElement('div');
    railL.className = 'rung__rail rung__rail--left';
    wrap.appendChild(railL);

    const body = document.createElement('div');
    body.className = 'rung__body';

    body.appendChild(renderSpacer(rung.id, 0));

    rung.elements.forEach((item, idx) => {
      if (item.rows !== undefined) {
        body.appendChild(renderBranch(item, rung.id));
      } else {
        body.appendChild(renderCell(item, rung.id));
      }
      body.appendChild(renderSpacer(rung.id, idx + 1));
    });

    wrap.appendChild(body);

    const railR = document.createElement('div');
    railR.className = 'rung__rail rung__rail--right';
    wrap.appendChild(railR);

    return wrap;
  }

  /* ----------------------------------------------------------
     PATCH ENERGIZADO — actualiza valores analógicos en el DOM
  ---------------------------------------------------------- */
  function patchRungEnergy(rungEl, rung) {
    rungEl.classList.toggle('rung--powered', !!rung.energized);

    function findCell(id) {
      for (const el of rung.elements) {
        if (el.id === id) return el;
        if (el.rows) {
          for (const row of el.rows) {
            const f = row.find(c => c.id === id);
            if (f) return f;
          }
        }
      }
      return null;
    }

    rungEl.querySelectorAll('.lad-cell').forEach(cellEl => {
      const cell = findCell(cellEl.dataset.cellId);
      if (!cell) return;
      const wasOn = cellEl.classList.contains('lad-cell--on');
      const isOn  = !!cell.energized;
      if (wasOn !== isOn) {
        cellEl.classList.toggle('lad-cell--on', isOn);
        const svg = cellEl.querySelector('.cell-svg');
        if (svg) {
          const tmp = document.createElement('div');
          tmp.innerHTML = symbolSVG(cell.type, isOn);
          if (tmp.firstElementChild) svg.replaceWith(tmp.firstElementChild);
        }
      }

      // ── Actualizar valores digitales ──
      const presetEl  = cellEl.querySelector('[data-field="preset"]');
      const elapsedEl = cellEl.querySelector('[data-field="elapsed"]');
      if (presetEl && cell.preset !== undefined)
        presetEl.textContent = cell.type.startsWith('timer') ? utils.formatTime(cell.preset) : String(cell.preset);
      if (elapsedEl)
        elapsedEl.textContent = cell.type.startsWith('timer') ? utils.formatTime(cell.elapsed||0) : String(cell.count||0);

      // ── Actualizar valores analógicos ──
      const resultEl = cellEl.querySelector('[data-field="result"]');
      if (resultEl && cell.result !== undefined)
        resultEl.textContent = _fmtNum(cell.result);

      const curvalEl = cellEl.querySelector('[data-field="curval"]');
      if (curvalEl && cell.currentVal !== undefined)
        curvalEl.textContent = _fmtNum(cell.currentVal);
    });
  }

  /* ----------------------------------------------------------
     API PÚBLICA
  ---------------------------------------------------------- */
  global.LLT.components = {
    CATALOG,
    renderRung,
    renderCell,
    renderBranch,
    patchRungEnergy,
    isKnownType:   t => !!CATALOG[t],
    getDef:        t => CATALOG[t] || null,
    getByCategory: cat => Object.entries(CATALOG)
      .filter(([,d]) => d.category === cat)
      .map(([type,d]) => ({ type, ...d })),
  };

}(window));