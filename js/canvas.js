/* ============================================================
   LADDER LOGIC TRAINER — canvas.js
   Renderiza los rungs en un <canvas> HTML5.
   Toda la interacción se maneja por coordenadas X/Y.
   ============================================================ */

(function (global) {
  'use strict';

  const { utils, state, components } = global.LLT;

  /* ----------------------------------------------------------
     CONSTANTES DE DIBUJO
  ---------------------------------------------------------- */
  const C = {
    FONT_MONO:    '11px "JetBrains Mono", monospace',
    FONT_UI:      '10px "Barlow Condensed", sans-serif',
    FONT_ADDR:    '10px "JetBrains Mono", monospace',

    RAIL_W:       6,      // ancho del rail L+/N
    RUNG_PAD_X:   20,     // padding horizontal del rung
    RUNG_PAD_Y:   16,     // padding vertical arriba/abajo
    WIRE_Y:       50,     // Y del hilo principal dentro del rung
    CELL_W:       80,     // ancho de celda
    CELL_H:       40,     // alto del símbolo
    BRANCH_H:     70,     // alto de cada fila de rama
    RUNG_MIN_H:   90,     // altura mínima de un rung
    RUNG_GAP:     12,     // espacio entre rungs
    BLOCK_W:      90,     // ancho de bloque funcional
    SPACER_W:     24,     // ancho del spacer entre elementos

    // Colores
    COL_RAIL:     '#2d9e4f',
    COL_WIRE:     '#3a4a38',
    COL_WIRE_ON:  '#39c960',
    COL_CONTACT:  '#6a7a68',
    COL_ON:       '#39c960',
    COL_ADDR:     '#8a9488',
    COL_ADDR_ON:  '#39c960',
    COL_NAME:     '#566054',
    COL_BG:       '#222724',
    COL_RUNG_BG:  '#2a2f2c',
    COL_SEL:      'rgba(45,158,79,0.15)',
    COL_SEL_BORD: '#2d9e4f',
    COL_SPACER:   '#2a3a28',
    COL_SPACER_H: '#39c960',
    COL_BTN_OPEN: '#2d9e4f',
    COL_BTN_CLOSE:'#c97d1a',
    COL_DOT:      '#39c960',
    COL_HINT:     '#3a4a38',
    COL_BLOCK_BG:  '#1a1f1a',
    COL_BLOCK_HDR: '#1e2820',
    COL_GREEN_DIM: '#1a3320',
    COL_AMBER_DIM: '#2e2010',

    // Analógico

    // Analógico
    COL_ANALOG:     '#1a9eb5',   // azul-cian industrial
    COL_ANALOG_ON:  '#22d3ee',   // cian brillante cuando activo
    COL_ANALOG_BG:  '#0d1e24',   // fondo del bloque analógico
    COL_ANALOG_HDR: '#0f2a32',   // fondo del header analógico
    COL_ANALOG_BAR: '#0e3040',   // fondo de la barra de progreso
    COL_ANALOG_FILL:'#1a9eb5',   // relleno de la barra
    ANALOG_BLOCK_W: 110,         // ancho de bloque analógico (más ancho que digital)
  };

  /* ----------------------------------------------------------
     ESTADO DEL CANVAS
  ---------------------------------------------------------- */
  let _canvas   = null;
  let _ctx      = null;
  let _hitMap   = [];     // [{ x,y,w,h, type, data }, ...]
  let _dpr      = 1;      // device pixel ratio
  let _totalH   = 0;

  // Herramienta activa (viene del state)
  // Rama abierta esperando cierre
  let _branchOpen = null; // { rungId, insertIdx, x, y }

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  function init(canvasEl) {
    _canvas = canvasEl;
    _ctx    = canvasEl.getContext('2d');
    _dpr    = window.devicePixelRatio || 1;

    _canvas.addEventListener('click',       _onClick);
    _canvas.addEventListener('mousemove',   _onMouseMove);
    _canvas.addEventListener('contextmenu', _onContextMenu);

    state.on('rungs:changed',  render);
    state.on('rung:updated',   render);
    state.on('rung:added',     render);
    state.on('program:new',    render);
    state.on('program:loaded', render);

    document.addEventListener('llt:scan-update', e => {
      // En RUN, re-renderizar para mostrar estado energizado
      render();
    });

    render();
  }

  function _syncThemeColors() {
    const isLight = document.documentElement.dataset.theme === 'light';
    if (isLight) {
      C.COL_RAIL     = '#1a7a36';
      C.COL_WIRE     = '#7a8878';
      C.COL_WIRE_ON  = '#1a7a36';
      C.COL_CONTACT  = '#3a4238';
      C.COL_ON       = '#1a7a36';
      C.COL_ADDR     = '#566054';
      C.COL_ADDR_ON  = '#1a7a36';
      C.COL_NAME     = '#6a7268';
      C.COL_BG       = '#d4d9d2';
      C.COL_RUNG_BG  = '#e2e6e0';
      C.COL_SEL      = 'rgba(26,122,54,0.12)';
      C.COL_SEL_BORD = '#1a7a36';
      C.COL_SPACER   = '#a8b0a6';
      C.COL_SPACER_H = '#1a7a36';
      C.COL_BTN_OPEN = '#1a7a36';
      C.COL_BTN_CLOSE= '#a05c00';
      C.COL_HINT      = '#8a9a88';
      C.COL_BLOCK_BG  = '#e8ebe6';
      C.COL_BLOCK_HDR = '#d4d9d2';
      C.COL_GREEN_DIM = '#c8e6d0';
      C.COL_AMBER_DIM  = '#f5e6c8';
      C.COL_ANALOG_BG  = '#d8eef2';
      C.COL_ANALOG_HDR = '#bde0e8';
      C.COL_ANALOG     = '#0e7a92';
      C.COL_ANALOG_ON  = '#0a5f72';
      C.COL_ANALOG_BAR = '#a8d4dc';
      C.COL_ANALOG_FILL= '#0e7a92';
    } else {
      C.COL_RAIL     = '#2d9e4f';
      C.COL_WIRE     = '#3a4a38';
      C.COL_WIRE_ON  = '#39c960';
      C.COL_CONTACT  = '#6a7a68';
      C.COL_ON       = '#39c960';
      C.COL_ADDR     = '#8a9488';
      C.COL_ADDR_ON  = '#39c960';
      C.COL_NAME     = '#566054';
      C.COL_BG       = '#222724';
      C.COL_RUNG_BG  = '#2a2f2c';
      C.COL_SEL      = 'rgba(45,158,79,0.15)';
      C.COL_SEL_BORD = '#2d9e4f';
      C.COL_SPACER   = '#2a3a28';
      C.COL_SPACER_H = '#39c960';
      C.COL_BTN_OPEN = '#2d9e4f';
      C.COL_BTN_CLOSE= '#c97d1a';
      C.COL_HINT      = '#3a4a38';
      C.COL_BLOCK_BG  = '#1a1f1a';
      C.COL_BLOCK_HDR = '#1e2820';
      C.COL_GREEN_DIM = '#1a3320';
      C.COL_AMBER_DIM  = '#2e2010';
      C.COL_ANALOG_BG  = '#0d1e24';
      C.COL_ANALOG_HDR = '#0f2a32';
      C.COL_ANALOG     = '#1a9eb5';
      C.COL_ANALOG_ON  = '#22d3ee';
      C.COL_ANALOG_BAR = '#0e3040';
      C.COL_ANALOG_FILL= '#1a9eb5';
    }
  }

  /* ----------------------------------------------------------
     RESIZE
  ---------------------------------------------------------- */
  function resize(w, h) {
    _canvas.style.width  = w + 'px';
    _canvas.style.height = Math.max(h, _totalH + 40) + 'px';
    _canvas.width        = w * _dpr;
    _canvas.height       = Math.max(h, _totalH + 40) * _dpr;
    _ctx.scale(_dpr, _dpr);
    render();
  }

  /* ----------------------------------------------------------
     RENDER PRINCIPAL
  ---------------------------------------------------------- */
function render() {
    if (!_ctx) return;
    const W = _canvas.width  / _dpr;
    const H = _canvas.height / _dpr;

    // Actualizar colores según tema activo
    _syncThemeColors();

    _hitMap = [];
    _ctx.clearRect(0, 0, W, H);

    const rungs = state.getRungs();

    if (rungs.length === 0) {
      _drawHint(W, H);
      return;
    }

    let y = C.RUNG_GAP;
    rungs.forEach(rung => {
      const rh = _rungHeight(rung);
      _drawRung(rung, y, W, rh);
      y += rh + C.RUNG_GAP;
    });

    _totalH = y;

    // Ajustar altura del canvas si los rungs crecen — sin llamar a render()
    const minH = _totalH + 40;
    if (_canvas.height / _dpr < minH) {
      const W2 = _canvas.width / _dpr;
      _canvas.style.width  = W2 + 'px';
      _canvas.style.height = minH + 'px';
      _canvas.width        = W2 * _dpr;
      _canvas.height       = minH * _dpr;
      _ctx.scale(_dpr, _dpr);
      // Re-dibujar sin recursión
      _ctx.clearRect(0, 0, W2, minH);
      let y2 = C.RUNG_GAP;
      state.getRungs().forEach(rung => {
        const rh = _rungHeight(rung);
        _drawRung(rung, y2, W2, rh);
        y2 += rh + C.RUNG_GAP;
      });
    }
  }

  /* ----------------------------------------------------------
     ALTURA DE UN RUNG
  ---------------------------------------------------------- */
  function _rungHeight(rung) {
    let extraBranch = 0;
    rung.elements.forEach(el => {
      if (el.rows) {
        // fila 0 = principal, filas 1..N = alternas
        extraBranch = Math.max(extraBranch, el.rows.length * C.BRANCH_H);
      }
    });
    return C.RUNG_MIN_H + extraBranch;
  }

  /* ----------------------------------------------------------
     DIBUJAR RUNG
  ---------------------------------------------------------- */
  function _drawRung(rung, ry, W, rh) {
    const wireY = ry + C.WIRE_Y;
    const on    = rung.energized;

    // Fondo
    _ctx.fillStyle = C.COL_RUNG_BG;
    _roundRect(C.RAIL_W, ry, W - C.RAIL_W * 2, rh, 4);
    _ctx.fill();

    // Número de rung
    _ctx.fillStyle = C.COL_NAME;
    _ctx.font      = C.FONT_UI;
    _ctx.fillText(String(rung.index), C.RAIL_W + 4, ry + 11);

    // Rail L+
    _ctx.fillStyle = on ? C.COL_RAIL : '#2a3a28';
    _ctx.fillRect(0, ry, C.RAIL_W, rh);

    // Rail N
    _ctx.fillStyle = on ? C.COL_RAIL : '#2a3a28';
    _ctx.fillRect(W - C.RAIL_W, ry, C.RAIL_W, rh);

    // Dibujar elementos y obtener el X final
    const startX = C.RAIL_W + C.RUNG_PAD_X;
    const endX   = W - C.RAIL_W - C.RUNG_PAD_X;

    // Hilo de entrada
    _drawWire(startX - C.RUNG_PAD_X, wireY, startX, wireY, on);

    // Separar contactos/ramas de bobinas
    const coilTypes = ['coil','coil-set','coil-reset','coil-not'];

    // Una rama es "de bobinas" si TODAS sus celdas en todas las filas son bobinas
    function isBranchOfCoils(el) {
      if (!el.rows) return false;
      return el.rows.every(row => row.every(cell => coilTypes.includes(cell.type)));
    }

    function isRightEl(el) {
      return coilTypes.includes(el.type) || isBranchOfCoils(el);
    }

    const leftEls  = rung.elements.filter(el => !isRightEl(el));
    const rightEls = rung.elements.filter(el =>  isRightEl(el));

    // Calcular ancho de las bobinas para posicionarlas desde la derecha
    const coilW      = rightEls.reduce((sum) => sum + C.CELL_W + C.SPACER_W, 0);
    const rightStartX = W - C.RAIL_W - C.RUNG_PAD_X - coilW;

    // ── Dibujar contactos/ramas (izquierda) ──
    // Usamos la posición real en rung.elements como insertIdx
    let curX = startX;
    curX = _drawSpacer(rung.id, curX, wireY, 0, null, null, ry, rh);

    leftEls.forEach((item) => {
      const realIdx = rung.elements.indexOf(item); // posición real
      if (item.rows) {
        const branchPower = state.getMode() === 'RUN' ? rung.energized : false;
        curX = _drawBranch(item, rung.id, curX, ry, wireY, rh, branchPower);
      } else {
        curX = _drawCell(item, rung.id, curX, wireY, item.energized);
      }
      // Spacer después de este elemento con su índice real + 1
      curX = _drawSpacer(rung.id, curX, wireY, realIdx + 1, null, null, ry, rh);
    });

    // Hilo de relleno
    const fillEndX = rightEls.length > 0 ? rightStartX : W - C.RAIL_W;
    _drawWire(curX, wireY, fillEndX, wireY, on);

    // ── Dibujar bobinas (derecha) ──
    // Sus insertIdx son sus posiciones reales en rung.elements
    let rightX = rightStartX;
    rightEls.forEach((el) => {
      const realIdx = rung.elements.indexOf(el); // posición real en rung.elements
      rightX = _drawSpacer(rung.id, rightX, wireY, realIdx, null, null, ry, rh);
      rightX = _drawCell(el, rung.id, rightX, wireY, el.energized);
    });

    // Spacer final (después de la última bobina) con idx = total de elementos
    if (rightEls.length > 0) {
      rightX = _drawSpacer(rung.id, rightX, wireY, rung.elements.length, null, null, ry, rh);
      _drawWire(rightX, wireY, W - C.RAIL_W, wireY, on);
    }

    // Hit area del rung — al inicio del array (prioridad baja, los spacers ganan)
    _hitMap.unshift({ x: C.RAIL_W, y: ry, w: W - C.RAIL_W * 2, h: rh, type: 'rung', data: { rungId: rung.id } });
  }

  /* ----------------------------------------------------------
     DIBUJAR SPACER (botones ↳ y ↱)
     Retorna el nuevo X.
  ---------------------------------------------------------- */
  function _drawSpacer(rungId, x, wireY, insertIdx, branchId, rowIdx, ry, rh) {
    const bw     = 20;
    const bh     = 14;
    const totalW = bw + 4;

    // En modo RUN no dibujar botones — solo pasar el espacio mínimo
    if (state.getMode() === 'RUN') {
      _drawWire(x, wireY, x + 6, wireY, false);
      return x + 6;
    }

    const isOpenActive = _branchOpen &&
      _branchOpen.rungId === rungId &&
      _branchOpen.insertIdx === insertIdx && !branchId;

    const isCloseReady = _branchOpen &&
      _branchOpen.rungId === rungId &&
      insertIdx > _branchOpen.insertIdx && !branchId;

    const btnX = x + 2;

    // ── Botón ↳ SIEMPRE arriba del hilo ──
    const openY = wireY - bh - 3;
    _ctx.fillStyle   = isOpenActive ? C.COL_GREEN_DIM : C.COL_BLOCK_HDR;
    _ctx.strokeStyle = isOpenActive ? C.COL_BTN_OPEN : C.COL_SPACER;
    _ctx.lineWidth   = 1;
    _roundRect(btnX, openY, bw, bh, 3);
    _ctx.fill(); _ctx.stroke();
    _ctx.fillStyle = isOpenActive ? C.COL_ON : C.COL_NAME;
    _ctx.font      = 'bold 11px monospace';
    _ctx.textAlign = 'center';
    _ctx.fillText('↳', btnX + bw / 2, openY + bh - 2);
    _ctx.textAlign = 'left';

    // ── Botón ↱ SIEMPRE abajo del hilo ──
    const closeY = wireY + 3;
    _ctx.fillStyle   = isCloseReady ? C.COL_AMBER_DIM : C.COL_BLOCK_HDR;
    _ctx.strokeStyle = isCloseReady ? C.COL_BTN_CLOSE : C.COL_SPACER;
    _ctx.lineWidth   = 1;
    _roundRect(btnX, closeY, bw, bh, 3);
    _ctx.fill(); _ctx.stroke();
    _ctx.fillStyle = isCloseReady ? C.COL_BTN_CLOSE : C.COL_NAME;
    _ctx.font      = 'bold 11px monospace';
    _ctx.textAlign = 'center';
    _ctx.fillText('↱', btnX + bw / 2, closeY + bh - 2);
    _ctx.textAlign = 'left';

    // Hit areas — ambos siempre presentes
    _addHit(btnX, openY, bw, bh, 'spacer-open', {
      rungId, insertIdx,
      branchId: branchId || null,
      rowIdx:   rowIdx !== null && rowIdx !== undefined ? rowIdx : null,
    });
    _addHit(btnX, closeY, bw, bh, 'spacer-close', {
      rungId, insertIdx,
      branchId: branchId || null,
      rowIdx:   rowIdx !== null && rowIdx !== undefined ? rowIdx : null,
    });

    // Hilo del spacer
    _drawWire(x, wireY, x + totalW, wireY, false);

    return x + totalW;
  }

  /* ----------------------------------------------------------
     DIBUJAR CELDA
     Retorna el nuevo X.
  ---------------------------------------------------------- */
  function _drawCell(cell, rungId, x, wireY, on) {
    const def  = components.getDef(cell.type);
    const isBlock  = def && def.isBlock;
    const isAnalog = def && def.isAnalog;
    const cw   = isAnalog ? C.ANALOG_BLOCK_W : (isBlock ? C.BLOCK_W : C.CELL_W);
    const cx   = x + cw / 2;
    const col  = on ? C.COL_ON : C.COL_CONTACT;

    // Dirección (encima)
    if (cell.address) {
      _ctx.fillStyle = on ? C.COL_ADDR_ON : C.COL_ADDR;
      _ctx.font      = C.FONT_ADDR;
      _ctx.textAlign = 'center';
      _ctx.fillText(cell.address, cx, wireY - C.CELL_H / 2 - 3);
    }

    // Símbolo
    _ctx.strokeStyle = col;
    _ctx.lineWidth   = 2;
    _ctx.lineCap     = 'round';

    if (isBlock) {
      if (isAnalog) {
        _drawAnalogBlock(cell, cx, wireY, on, cw, rungId);
      } else {
        _drawBlock(cell, cx, wireY, on, cw, rungId);
      }
    } else {
      // Borrar la línea del hilo que pasa por detrás del símbolo
      const symH = C.CELL_H + 4;
      _ctx.fillStyle = C.COL_RUNG_BG;
      _ctx.fillRect(x + 8, wireY - symH / 2, cw - 16, symH);

      // NC: solo en RUN muestra estado real (cerrado=verde, abierto=apagado)
      // En STOP todos los elementos se ven apagados
      let visualOn = on;
      if (cell.type === 'contact-nc' && state.getMode() === 'RUN') {
        const sigVal = cell.address ? !!state.getSignalValue(cell.address) : false;
        visualOn = !sigVal;
      }

      _drawSymbol(cell.type, cx, wireY, visualOn, cw);
    }

    // Nombre simbólico (debajo)
    const sig  = cell.address ? state.getSignal(cell.address) : null;
    const name = sig ? sig.name : (cell.name || '');
    if (name) {
      _ctx.fillStyle = C.COL_NAME;
      _ctx.font      = C.FONT_UI;
      _ctx.textAlign = 'center';
      _ctx.fillText(name.length > 10 ? name.slice(0, 9) + '…' : name,
        cx, wireY + C.CELL_H / 2 + 12);
    }

    _ctx.textAlign = 'left';

    // Selección
    const selCellId = state.getSelectedCell();
    if (selCellId === cell.id) {
      _ctx.strokeStyle = C.COL_SEL_BORD;
      _ctx.lineWidth   = 1;
      _ctx.fillStyle   = C.COL_SEL;
      _roundRect(x, wireY - C.CELL_H / 2 - 14, cw, C.CELL_H + 28, 4);
      _ctx.fill();
      _ctx.stroke();
    }

    // Hit area
    _addHit(x, wireY - C.CELL_H / 2 - 14, cw, C.CELL_H + 28, 'cell', {
      cellId: cell.id, rungId, type: cell.type,
    });

    return x + cw;
  }

  /* ----------------------------------------------------------
     DIBUJAR SÍMBOLO LADDER
  ---------------------------------------------------------- */
  function _drawSymbol(type, cx, cy, on, cw) {
    const col = on ? C.COL_ON : C.COL_CONTACT;
    _ctx.strokeStyle = col;
    _ctx.lineWidth   = 2;
    _ctx.lineCap     = 'round';

    const hw = cw / 2 - 8;  // mitad del hilo exterior
    const gap = 8;              // separación entre barras verticales

    // Barras verticales del contacto separadas por 'gap' — símbolo compacto con hilo a los lados
    const barL = cx - gap;   // barra izquierda
    const barR = cx + gap;   // barra derecha

    switch (type) {
      case 'contact-no':
        _wire(cx - hw, cy, barL, cy);
        _vline(barL, cy - 12, cy + 12);
        _vline(barR, cy - 12, cy + 12);
        _wire(barR, cy, cx + hw, cy);
        break;

      case 'contact-nc':
        _wire(cx - hw, cy, barL, cy);
        _vline(barL, cy - 12, cy + 12);
        _vline(barR, cy - 12, cy + 12);
        _wire(barR, cy, cx + hw, cy);
        _ctx.beginPath();
        _ctx.moveTo(barL, cy - 11);
        _ctx.lineTo(barR, cy + 11);
        _ctx.stroke();
        break;

      case 'contact-pos':
        _wire(cx - hw, cy, barL, cy);
        _vline(barL, cy - 12, cy + 12);
        _vline(barR, cy - 12, cy + 12);
        _wire(barR, cy, cx + hw, cy);
        _ctx.fillStyle = col;
        _ctx.font      = 'bold 10px monospace';
        _ctx.textAlign = 'center';
        _ctx.fillText('P', cx, cy + 4);
        break;

      case 'contact-neg':
        _wire(cx - hw, cy, barL, cy);
        _vline(barL, cy - 12, cy + 12);
        _vline(barR, cy - 12, cy + 12);
        _wire(barR, cy, cx + hw, cy);
        _ctx.fillStyle = col;
        _ctx.font      = 'bold 10px monospace';
        _ctx.textAlign = 'center';
        _ctx.fillText('N', cx, cy + 4);
        break;

      case 'coil':
        _wire(cx - hw, cy, cx - 14, cy);
        _ctx.beginPath();
        _ctx.arc(cx, cy, 13, 0, Math.PI * 2);
        _ctx.strokeStyle = col;
        if (on) { _ctx.fillStyle = 'rgba(57,201,96,0.15)'; _ctx.fill(); }
        _ctx.stroke();
        _wire(cx + 14, cy, cx + hw, cy);
        break;

      case 'coil-set':
        _drawCoilWithLetter(cx, cy, hw, col, on, 'S');
        break;
      case 'coil-reset':
        _drawCoilWithLetter(cx, cy, hw, col, on, 'R');
        break;
      case 'coil-not':
        _drawCoilWithLetter(cx, cy, hw, col, on, '/');
        break;

      case 'wire-h':
        _wire(cx - hw, cy, cx + hw, cy);
        break;

      default:
        _wire(cx - hw, cy, cx + hw, cy);
    }
  }

  function _drawCoilWithLetter(cx, cy, hw, col, on, letter) {
    _wire(cx - hw, cy, cx - 14, cy);
    _ctx.beginPath();
    _ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    _ctx.strokeStyle = col;
    if (on) { _ctx.fillStyle = 'rgba(57,201,96,0.15)'; _ctx.fill(); }
    _ctx.stroke();
    _wire(cx + 14, cy, cx + hw, cy);
    _ctx.fillStyle = col;
    _ctx.font      = 'bold 11px monospace';
    _ctx.textAlign = 'center';
    _ctx.fillText(letter, cx, cy + 4);
  }

  /* ----------------------------------------------------------
     DIBUJAR BLOQUE FUNCIONAL
  ---------------------------------------------------------- */
  function _drawBlock(cell, cx, cy, on, bw, rungId) {
    const bh  = 44;
    const col = on ? C.COL_ON : C.COL_CONTACT;
    const lbl = { 'timer-on':'TON','timer-off':'TOF','counter-up':'CTU','counter-dn':'CTD','timer-pulse':'TP','counter-rst':'RST' }[cell.type] || '';
    const isTimer = cell.type.startsWith('timer');

    // RST: bloque simplificado sin PV/CV
    if (cell.type === 'counter-rst') {
      _wire(cx - bw/2 - 10, cy, cx - bw/2, cy);
      _wire(cx + bw/2, cy, cx + bw/2 + 10, cy);
      _ctx.strokeStyle = on ? C.COL_ON : '#3a4a38';
      _ctx.lineWidth   = 1.5;
      _ctx.fillStyle   = C.COL_BLOCK_BG;
      _roundRect(cx - bw/2, cy - 18, bw, 36, 3);
      _ctx.fill(); _ctx.stroke();
      // Detectar si el contador asociado es CTD para mostrar L, sino R
      let rstLabel = 'R';
      let rstDesc  = 'Reset';
      state.getRungs().forEach(rung => {
        rung.elements.forEach(el => {
          if ((el.type === 'counter-dn') && el.address === cell.address) {
            rstLabel = 'R/L'; rstDesc = 'Load';
          }
          if ((el.type === 'counter-up') && el.address === cell.address) {
            rstLabel = 'R/L'; rstDesc = 'Reset';
          }
        });
      });

      _ctx.fillStyle = on ? C.COL_ON : '#8a9488';
      _ctx.font      = 'bold 11px monospace';
      _ctx.textAlign = 'center';
      _ctx.fillText(rstLabel, cx, cy - 5);
      _ctx.fillStyle = on ? C.COL_ON : '#6a7a68';
      _ctx.font      = '8px monospace';
      _ctx.fillText(rstDesc, cx, cy + 6);
      _ctx.fillStyle = on ? C.COL_ON : '#566054';
      _ctx.font      = '8px monospace';
      _ctx.fillText(cell.address || '???', cx, cy + 16);
      _ctx.textAlign = 'left';
      _addHit(cx - bw/2, cy - 18, bw, 36, 'cell', { cellId: cell.id, rungId, type: cell.type });
      return cx + bw/2 + 10;
    }

    // Wires
    _wire(cx - bw / 2 - 10, cy, cx - bw / 2, cy);
    _wire(cx + bw / 2, cy, cx + bw / 2 + 10, cy);

    // Caja
    _ctx.strokeStyle = on ? C.COL_ON : '#3a4a38';
    _ctx.lineWidth   = 1.5;
    _ctx.fillStyle   = C.COL_BLOCK_BG;
    _roundRect(cx - bw / 2, cy - bh / 2, bw, bh, 3);
    _ctx.fill(); _ctx.stroke();

    // Header
    _ctx.fillStyle = C.COL_BLOCK_HDR;
    _roundRect(cx - bw / 2, cy - bh / 2, bw, 14, 3);
    _ctx.fill();
    _ctx.fillStyle = on ? C.COL_ON : '#8a9488';
    _ctx.font      = 'bold 9px monospace';
    _ctx.textAlign = 'center';
    _ctx.fillText(lbl, cx, cy - bh / 2 + 10);

    // Valores
    _ctx.fillStyle = '#6a7a68';
    _ctx.font      = '8px monospace';
    _ctx.textAlign = 'left';
    const v1 = isTimer ? `PT:${utils.formatTime(cell.preset||0)}`  : `PV:${cell.preset||0}`;
    const v2 = isTimer ? `ET:${utils.formatTime(cell.elapsed||0)}` : `CV:${cell.count||0}`;
    _ctx.fillText(v1, cx - bw / 2 + 4, cy + 2);
    _ctx.fillText(v2, cx - bw / 2 + 4, cy + 14);
  }

  /* ----------------------------------------------------------
     FORMATO NUMÉRICO — helper interno del canvas
  ---------------------------------------------------------- */
  function _fmtAnalog(n) {
    if (n === undefined || n === null) return '—';
    if (typeof n !== 'number') return String(n);
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  }

  /* ----------------------------------------------------------
     DIBUJAR BLOQUE ANALÓGICO
     Bloques CMP, MATH, SCALE y MOVE-A. Paleta azul-cian.
  ---------------------------------------------------------- */
  function _drawAnalogBlock(cell, cx, cy, on, bw, rungId) {
    const OP_SYM = {
      'cmp-gt':'>','cmp-lt':'<','cmp-ge':'≥','cmp-le':'≤','cmp-eq':'=','cmp-ne':'≠',
      'math-add':'+','math-sub':'-','math-mul':'×','math-div':'÷','math-mod':'%',
    };
    const HDR_LABEL = {
      'cmp-gt':'CMP','cmp-lt':'CMP','cmp-ge':'CMP','cmp-le':'CMP','cmp-eq':'CMP','cmp-ne':'CMP',
      'math-add':'ADD','math-sub':'SUB','math-mul':'MUL','math-div':'DIV','math-mod':'MOD',
      'scale':'SCALE','move-a':'MOVE',
    };

    const colBorder = on ? C.COL_ANALOG_ON  : C.COL_ANALOG;
    const colText   = on ? C.COL_ANALOG_ON  : '#6a8a98';
    const colLabel  = on ? '#5ab8cc'         : '#3a6a78';
    const colValue  = on ? '#e2f8ff'         : '#8aacb8';

    const hdr = HDR_LABEL[cell.type] || cell.type.toUpperCase();
    const op  = OP_SYM[cell.type] || '';

    // Filas de datos según tipo
    let rows = [];
    if (cell.type.startsWith('cmp-')) {
      const in2 = cell.address2 || _fmtAnalog(cell.setpoint ?? 0);
      rows = [
        { lbl: 'IN1', val: cell.address || '???' },
        { lbl: 'IN2', val: in2 },
        { lbl: 'VAL', val: _fmtAnalog(cell.currentVal), isResult: true },
      ];
    } else if (cell.type.startsWith('math-')) {
      const in2 = cell.address2 || _fmtAnalog(cell.operand2 ?? 0);
      rows = [
        { lbl: 'IN1', val: cell.address || '???' },
        { lbl: 'IN2', val: in2 },
        { lbl: 'OUT', val: cell.addrOut || '???' },
        { lbl: 'RES', val: _fmtAnalog(cell.result), isResult: true },
      ];
    } else if (cell.type === 'norm') {
      rows = [
        { lbl: 'IN',  val: cell.address || '???' },
        { lbl: 'MIN', val: _fmtAnalog(cell.rawMin ?? 0) },
        { lbl: 'MAX', val: _fmtAnalog(cell.rawMax ?? 27648) },
        { lbl: 'OUT', val: cell.addrOut || '???' },
        { lbl: 'VAL', val: _fmtAnalog(cell.result), isResult: true },
      ];
    } else if (cell.type === 'scale') {
      rows = [
        { lbl: 'IN',  val: cell.address || '???' },
        { lbl: 'MIN', val: _fmtAnalog(cell.engMin ?? 0) },
        { lbl: 'MAX', val: _fmtAnalog(cell.engMax ?? 100) },
        { lbl: 'OUT', val: cell.addrOut || '???' },
        { lbl: 'VAL', val: _fmtAnalog(cell.result), isResult: true },
      ];
    } else if (cell.type === 'move-a') {
      rows = [
        { lbl: 'IN',  val: cell.address || '???' },
        { lbl: 'OUT', val: cell.addrOut || '???' },
        { lbl: 'VAL', val: _fmtAnalog(cell.result), isResult: true },
      ];
    }

    const rowH = 13;
    const hdrH = 16;
    const padV = 4;
    const barH = 4;
    const bh   = hdrH + rows.length * rowH + padV * 2 + barH + 2;

    const boxX = cx - bw / 2;
    const boxY = cy - bh / 2;

    // Wires
    _drawWire(cx - bw / 2 - 10, cy, boxX, cy, on);
    _drawWire(cx + bw / 2, cy, cx + bw / 2 + 10, cy, on);

    // Fondo
    _ctx.fillStyle   = C.COL_ANALOG_BG;
    _ctx.strokeStyle = colBorder;
    _ctx.lineWidth   = 1.5;
    _roundRect(boxX, boxY, bw, bh, 3);
    _ctx.fill();
    _ctx.stroke();

    // Header
    _ctx.fillStyle = C.COL_ANALOG_HDR;
    _roundRect(boxX, boxY, bw, hdrH, 3);
    _ctx.fill();

    // Separador header
    _ctx.strokeStyle = colBorder;
    _ctx.lineWidth   = 0.5;
    _ctx.beginPath();
    _ctx.moveTo(boxX,      boxY + hdrH);
    _ctx.lineTo(boxX + bw, boxY + hdrH);
    _ctx.stroke();

    // Texto header
    _ctx.fillStyle = colText;
    _ctx.font      = 'bold 9px monospace';
    _ctx.textAlign = 'left';
    _ctx.fillText(hdr, boxX + 5, boxY + hdrH - 4);
    if (op) {
      _ctx.fillStyle = on ? '#22d3ee' : '#2a8a9a';
      _ctx.font      = 'bold 11px monospace';
      _ctx.textAlign = 'right';
      _ctx.fillText(op, boxX + bw - 4, boxY + hdrH - 3);
    }

    // Filas
    rows.forEach((row, i) => {
      const ry = boxY + hdrH + padV + i * rowH + rowH - 3;
      _ctx.fillStyle = colLabel;
      _ctx.font      = '7px monospace';
      _ctx.textAlign = 'left';
      _ctx.fillText(row.lbl, boxX + 4, ry);

      const isResult = !!row.isResult;
      _ctx.fillStyle = isResult ? (on ? '#22d3ee' : '#2a9ab5') : colValue;
      _ctx.font      = isResult ? 'bold 8px monospace' : '8px monospace';
      _ctx.textAlign = 'right';
      const v = String(row.val);
      _ctx.fillText(v.length > 13 ? v.slice(0, 12) + '…' : v, boxX + bw - 4, ry);
    });

    // Barra de progreso
    let ratio = 0;
    if (cell.type === 'norm') {
      // NORM siempre produce 0.0–1.0, la barra es directa
      ratio = cell.result ?? 0;
    } else if (cell.type === 'scale') {
      const range = (cell.engMax ?? 100) - (cell.engMin ?? 0);
      ratio = range !== 0 ? ((cell.result ?? 0) - (cell.engMin ?? 0)) / range : 0;
    } else if (cell.type.startsWith('cmp-')) {
      const sig = cell.address ? state.getSignal(cell.address) : null;
      if (sig && sig.type === 'analog') {
        const range = (sig.max ?? 27648) - (sig.min ?? 0);
        ratio = range !== 0 ? ((cell.currentVal ?? 0) - (sig.min ?? 0)) / range : 0;
      }
    } else if (cell.type.startsWith('math-') || cell.type === 'move-a') {
      const sig = cell.address ? state.getSignal(cell.address) : null;
      if (sig && sig.type === 'analog') {
        const range = (sig.max ?? 27648) - (sig.min ?? 0);
        ratio = range !== 0 ? ((cell.result ?? 0) - (sig.min ?? 0)) / range : 0;
      }
    }
    ratio = Math.max(0, Math.min(1, ratio));

    const barY = boxY + bh - barH - 2;
    const barW = bw - 8;
    const barX = boxX + 4;

    _ctx.fillStyle = C.COL_ANALOG_BAR;
    _roundRect(barX, barY, barW, barH, 2);
    _ctx.fill();
    if (ratio > 0) {
      _ctx.fillStyle = on ? C.COL_ANALOG_ON : C.COL_ANALOG_FILL;
      _roundRect(barX, barY, barW * ratio, barH, 2);
      _ctx.fill();
    }

    _ctx.textAlign = 'left';

    // Hit area
    _addHit(boxX, boxY, bw, bh, 'cell', { cellId: cell.id, rungId, type: cell.type });
  }

  /* ----------------------------------------------------------
     DIBUJAR RAMA PARALELA
     Retorna el nuevo X.
  ---------------------------------------------------------- */
  function _drawBranch(branch, rungId, x, ry, wireY, rh, powerIn) {
    const rows = branch.rows || [[]];

    // Calcular ancho de cada fila
    const rowWidths = rows.map(row => {
      let w = 0;
      row.forEach(cell => {
        const def = components.getDef(cell.type);
        const cw  = def && def.isAnalog ? C.ANALOG_BLOCK_W
                   : (def && def.isBlock ? C.BLOCK_W : C.CELL_W);
        w += cw + 28; // 28 = spacers
      });
      return Math.max(w, C.CELL_W + 28);
    });
    const branchW = Math.max(...rowWidths, C.CELL_W + 28);

    const forkX  = x + 8;
    const mergeX = forkX + branchW;
    const endX   = mergeX + 8;

    // Hilo de entrada al fork
    _drawWire(x, wireY, forkX, wireY, false);

    // Dibujar cada fila
    rows.forEach((row, rowIdx) => {
      const rowY = wireY + rowIdx * C.BRANCH_H;
      let rowOn = false;
      if (state.getMode() === 'RUN') {
        if (rowIdx === 0) {
          rowOn = !!branch.energized;
        } else {
          rowOn = row.length > 0 && !!row[row.length - 1]?.energized;
        }
      }

      // Hilo de la fila
      _drawWire(forkX, rowY, mergeX, rowY, rowOn);

      // Spacer inicial de la fila
      let cx = forkX;
      cx = _drawSpacer(rungId, cx, rowY, 0, branch.id, rowIdx, ry, rh);

      // Celdas
      row.forEach((cell, ci) => {
        cx = _drawCell(cell, rungId, cx, rowY, cell.energized);
        cx = _drawSpacer(rungId, cx, rowY, ci + 1, branch.id, rowIdx, ry, rh);
      });

      // Placeholder si fila vacía
      if (row.length === 0) {
        _ctx.fillStyle  = C.COL_BLOCK_HDR;
        _ctx.strokeStyle= C.COL_SPACER;
        _ctx.lineWidth  = 1;
        _ctx.setLineDash([4, 3]);
        _roundRect(forkX + 20, rowY - 14, branchW - 40, 28, 4);
        _ctx.fill(); _ctx.stroke();
        _ctx.setLineDash([]);
        _ctx.fillStyle  = '#4a6048';
        _ctx.font       = C.FONT_UI;
        _ctx.textAlign  = 'center';
        _ctx.fillText('click para insertar', forkX + branchW / 2, rowY + 4);
        _ctx.textAlign  = 'left';

        _addHit(forkX + 20, rowY - 14, branchW - 40, 28, 'branch-placeholder', {
          rungId, branchId: branch.id, rowIdx,
        });
      }
    });

    // En STOP nada se ve energizado
    const isRun = state.getMode() === 'RUN';
    const anyAltOn = isRun && rows.slice(1).some(row =>
      row.length > 0 && row[row.length - 1]?.energized
    );
    const leftOn  = isRun && powerIn;
    const rightOn = isRun && ((rows[0]?.length > 0 && rows[0][rows[0].length-1]?.energized) || anyAltOn);

    const lastY = wireY + (rows.length - 1) * C.BRANCH_H;

    // Rail vertical izquierdo
    _ctx.strokeStyle = leftOn ? C.COL_WIRE_ON : C.COL_WIRE;
    _ctx.lineWidth   = 2;
    _ctx.beginPath();
    _ctx.moveTo(forkX, wireY);
    _ctx.lineTo(forkX, lastY);
    _ctx.stroke();

    // Rail vertical derecho
    _ctx.strokeStyle = rightOn ? C.COL_WIRE_ON : C.COL_WIRE;
    _ctx.beginPath();
    _ctx.moveTo(mergeX, wireY);
    _ctx.lineTo(mergeX, lastY);
    _ctx.stroke();

    // Dots
    _ctx.fillStyle = leftOn ? C.COL_WIRE_ON : C.COL_WIRE;
    _ctx.beginPath(); _ctx.arc(forkX, wireY, 4, 0, Math.PI*2); _ctx.fill();
    _ctx.fillStyle = rightOn ? C.COL_WIRE_ON : C.COL_WIRE;
    _ctx.beginPath(); _ctx.arc(mergeX, wireY, 4, 0, Math.PI*2); _ctx.fill();

    // Botón + fila paralela — solo visible en modo STOP
    if (state.getMode() === 'RUN') {
      return endX;
    }
    const addY = lastY + C.BRANCH_H * 0.5 - 9;
    _ctx.fillStyle  = C.COL_BLOCK_HDR;
    _ctx.strokeStyle= C.COL_SPACER;
    _ctx.lineWidth  = 1;
    _ctx.setLineDash([3, 3]);
    _roundRect(forkX + 4, addY, branchW - 8, 18, 3);
    _ctx.fill(); _ctx.stroke();
    _ctx.setLineDash([]);
    _ctx.fillStyle  = C.COL_NAME;
    _ctx.font       = C.FONT_UI;
    _ctx.textAlign  = 'center';
    _ctx.fillText('↳ agregar fila paralela', forkX + branchW / 2, addY + 12);
    _ctx.textAlign  = 'left';

    _addHit(forkX + 4, addY, branchW - 8, 18, 'branch-add-row', {
      rungId, branchId: branch.id,
    });

    // Hilo de salida del merge
    _drawWire(mergeX, wireY, endX, wireY, false);

    return endX;
  }

  /* ----------------------------------------------------------
     DIBUJAR HINT (canvas vacío)
  ---------------------------------------------------------- */
  function _drawHint(W, H) {
    _ctx.fillStyle = C.COL_HINT;
    _ctx.font      = '14px "Barlow Condensed", sans-serif';
    _ctx.textAlign = 'center';
    _ctx.fillText('Sin rungs — haz click en + Rung para comenzar', W / 2, H / 2);
    _ctx.font      = '12px "Barlow Condensed", sans-serif';
    _ctx.fillStyle = '#2a3a28';
    _ctx.fillText('Luego selecciona un componente del panel izquierdo y haz click en el rung',
      W / 2, H / 2 + 22);
    _ctx.textAlign = 'left';
  }

  /* ----------------------------------------------------------
     HELPERS DE DIBUJO
  ---------------------------------------------------------- */
  function _wire(x1, y1, x2, y2) {
    _ctx.beginPath();
    _ctx.moveTo(x1, y1);
    _ctx.lineTo(x2, y2);
    _ctx.stroke();
  }

  function _vline(x, y1, y2) {
    _ctx.beginPath();
    _ctx.moveTo(x, y1);
    _ctx.lineTo(x, y2);
    _ctx.stroke();
  }

  function _drawWire(x1, y1, x2, y2, on) {
    _ctx.strokeStyle = on ? C.COL_WIRE_ON : C.COL_WIRE;
    _ctx.lineWidth   = 2;
    _ctx.lineCap     = 'round';
    _wire(x1, y1, x2, y2);
  }

  function _roundRect(x, y, w, h, r) {
    _ctx.beginPath();
    _ctx.moveTo(x + r, y);
    _ctx.lineTo(x + w - r, y);
    _ctx.arcTo(x + w, y, x + w, y + r, r);
    _ctx.lineTo(x + w, y + h - r);
    _ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    _ctx.lineTo(x + r, y + h);
    _ctx.arcTo(x, y + h, x, y + h - r, r);
    _ctx.lineTo(x, y + r);
    _ctx.arcTo(x, y, x + r, y, r);
    _ctx.closePath();
  }

  /* ----------------------------------------------------------
     HIT MAP
  ---------------------------------------------------------- */
  function _addHit(x, y, w, h, type, data) {
    _hitMap.push({ x, y, w, h, type, data });
  }

  function _hitTest(px, py) {
    // Iterar al revés para que los elementos encima tengan prioridad
    for (let i = _hitMap.length - 1; i >= 0; i--) {
      const h = _hitMap[i];
      if (px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h) {
        return h;
      }
    }
    return null;
  }

  function _canvasXY(e) {
    const rect = _canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left),
      y: (e.clientY - rect.top),
    };
  }

  /* ----------------------------------------------------------
     EVENTOS DEL CANVAS
  ---------------------------------------------------------- */
  function _onClick(e) {
    const { x, y } = _canvasXY(e);
    const hit = _hitTest(x, y);
    if (!hit) return;

    // En modo RUN no permitir modificaciones
    if (state.getMode() === 'RUN') return;

    const tool = state.getSelectedTool();

    switch (hit.type) {

      case 'spacer-open': {
        const { rungId, insertIdx, branchId, rowIdx } = hit.data;
        if (tool && !branchId) {
          // Insertar componente: bobinas siempre al final, contactos antes de la primera bobina
          const realIdx = _smartInsertIdx(rungId, tool);
          state.addCell(rungId, tool, '', '', realIdx);
          _openEditor(rungId, realIdx);
        } else if (branchId && tool) {
          // Insertar en rama
          state.addCell(rungId, tool, '', '', insertIdx, branchId, rowIdx);
          _openEditor(rungId, insertIdx, branchId, rowIdx);
        } else if (!tool && !branchId) {
          // Sin herramienta: abrir rama
          _branchOpen = { rungId, insertIdx };
          utils.toast('Rama abierta ↳ — ahora haz click en ↱ para cerrarla', 'success', 2500);
          render();
        } else if (!tool && branchId) {
          state.addBranchRow(rungId, branchId);
          utils.toast('Fila paralela agregada', 'success', 1500);
        }
        break;
      }

      case 'spacer-close': {
        const { rungId, insertIdx } = hit.data;
        if (!_branchOpen || _branchOpen.rungId !== rungId) {
          utils.toast('Primero abre una rama con ↳', 'warning', 2000);
          break;
        }
        if (insertIdx <= _branchOpen.insertIdx) {
          utils.toast('El cierre debe estar a la derecha de la apertura', 'warning', 2000);
          break;
        }
        _createBranch(rungId, _branchOpen.insertIdx, insertIdx);
        _branchOpen = null;
        render();
        break;
      }

      case 'cell': {
        const { cellId, rungId } = hit.data;
        if (tool) {
          // Si es bobina, ignorar la celda clickeada y poner al final
          if (COIL_TYPES.includes(tool)) {
            const idx = _smartInsertIdx(rungId, tool);
            state.addCell(rungId, tool, '', '', idx);
            _openEditor(rungId, idx);
          } else {
            _insertAfterCell(rungId, cellId);
          }
        } else {
          state.selectCell(cellId, rungId);
          global.LLT.editor.showInlineEditor(cellId, rungId);
          render();
        }
        break;
      }

      case 'rung': {
        const { rungId } = hit.data;
        if (tool) {
          const idx = _smartInsertIdx(rungId, tool);
          state.addCell(rungId, tool, '', '', idx);
          _openEditor(rungId, idx);
        } else {
          state.selectRung(rungId);
          render();
        }
        break;
      }

      case 'branch-placeholder': {
        const { rungId, branchId, rowIdx } = hit.data;
        if (tool) {
          state.addCell(rungId, tool, '', '', 0, branchId, rowIdx);
          _openEditor(rungId, 0, branchId, rowIdx);
        } else {
          utils.toast('Selecciona un componente del panel izquierdo', 'warning', 2000);
        }
        break;
      }

      case 'branch-add-row': {
        const { rungId, branchId } = hit.data;
        state.addBranchRow(rungId, branchId);
        utils.toast('Fila paralela agregada', 'success', 1500);
        break;
      }
    }
  }

  function _onMouseMove(e) {
    if (state.getMode() === 'RUN') {
      _canvas.style.cursor = 'default';
      return;
    }
    const { x, y } = _canvasXY(e);
    const hit = _hitTest(x, y);
    if (hit && (hit.type === 'spacer-open' || hit.type === 'spacer-close' ||
                hit.type === 'cell' || hit.type === 'branch-add-row' ||
                hit.type === 'branch-placeholder')) {
      _canvas.style.cursor = 'pointer';
    } else {
      _canvas.style.cursor = 'default';
    }
  }

  function _onContextMenu(e) {
    e.preventDefault();
    const { x, y } = _canvasXY(e);
    const hit = _hitTest(x, y);
    if (!hit) return;
    global.LLT.editor.showContextMenu(e.clientX, e.clientY, hit);
  }

  /* ----------------------------------------------------------
     CALCULAR ÍNDICE DE INSERCIÓN
     Contactos van antes de la primera bobina.
     Bobinas siempre van al final.
  ---------------------------------------------------------- */
  const COIL_TYPES = ['coil', 'coil-set', 'coil-reset', 'coil-not'];

  function _smartInsertIdx(rungId, tool) {
    const rung = state.getRung(rungId);
    if (!rung) return 0;
    const elements = rung.elements;

    if (COIL_TYPES.includes(tool)) {
      // Bobina siempre al final
      return elements.length;
    }

    // Contacto/bloque: insertar antes de la primera bobina
    const firstCoilIdx = elements.findIndex(el => COIL_TYPES.includes(el.type));
    if (firstCoilIdx !== -1) return firstCoilIdx;

    return elements.length;
  }

  /* ----------------------------------------------------------
     CREAR RAMA PARALELA
  ---------------------------------------------------------- */
  function _createBranch(rungId, openIdx, closeIdx) {
    const rung = state.getRung(rungId);
    if (!rung) return;

    // Guardar referencias originales de los elementos entre openIdx y closeIdx
    const toMove = rung.elements.slice(openIdx, closeIdx);

    // Si no hay elementos entre los dos puntos, crear rama vacía igualmente
    // (el usuario quiere una rama paralela sin mover nada)

    // Eliminar esos elementos del rung usando removeCell
    for (let i = closeIdx - 1; i >= openIdx; i--) {
      const el = rung.elements[i];
      if (el) state.removeCell(rungId, el.id);
    }

    // Crear rama en la posición openIdx
    const rungNow = state.getRung(rungId);
    if (!rungNow) return;
    const branch = state.addBranch(rungId, openIdx);
    if (!branch) return;

    // Insertar los elementos originales en la fila 0 de la rama
    const rungFinal = state.getRung(rungId);
    const branchObj = rungFinal?.elements.find(el => el.id === branch.id);
    if (branchObj) {
      branchObj.rows[0] = toMove;   // referencias originales — el simulador las ve
      branchObj.rows.push([]);       // fila 1 vacía para contactos paralelos
    }

    render();
    utils.toast('Rama creada — inserta contactos en la fila inferior', 'success', 2500);
  }

  /* ----------------------------------------------------------
     INSERTAR DESPUÉS DE UNA CELDA
  ---------------------------------------------------------- */
  function _insertAfterCell(rungId, cellId) {
    const tool = state.getSelectedTool();
    if (!tool) return;
    const rung = state.getRung(rungId);
    if (!rung) return;

    // Buscar en elementos principales
    const idx = rung.elements.findIndex(el => el.id === cellId);
    if (idx !== -1) {
      // Si es bobina, siempre al final
      // Si es contacto, insertar después de la celda clickeada pero antes de cualquier bobina
      let insertIdx = idx + 1;
      if (COIL_TYPES.includes(tool)) {
        insertIdx = rung.elements.length;
      } else {
        // No insertar después de una bobina
        const firstCoilIdx = rung.elements.findIndex(el => COIL_TYPES.includes(el.type));
        if (firstCoilIdx !== -1 && insertIdx > firstCoilIdx) {
          insertIdx = firstCoilIdx;
        }
      }
      state.addCell(rungId, tool, '', '', insertIdx);
      _openEditor(rungId, insertIdx);
      return;
    }

    // Buscar en ramas
    for (const el of rung.elements) {
      if (!el.rows) continue;
      for (let ri = 0; ri < el.rows.length; ri++) {
        const ci = el.rows[ri].findIndex(c => c.id === cellId);
        if (ci !== -1) {
          state.addCell(rungId, tool, '', '', ci + 1, el.id, ri);
          _openEditor(rungId, ci + 1, el.id, ri);
          return;
        }
      }
    }
  }

  /* ----------------------------------------------------------
     ABRIR EDITOR DE DIRECCIÓN
  ---------------------------------------------------------- */
  function _openEditor(rungId, idx, branchId, rowIdx) {
    setTimeout(() => {
      const rung = state.getRung(rungId);
      if (!rung) return;
      let cell = null;
      if (branchId !== undefined) {
        const branch = rung.elements.find(el => el.id === branchId);
        cell = branch?.rows[rowIdx]?.[idx];
      } else {
        cell = rung.elements[idx];
      }
      if (!cell) return;
      const def = components.getDef(cell.type);
      if (!def?.hasAddress) return;
      global.LLT.editor.showInlineEditor(cell.id, rungId);
    }, 40);
  }

  /* ----------------------------------------------------------
     API PÚBLICA
  ---------------------------------------------------------- */
  global.LLT.canvas = { init, render, resize, getHitMap: () => _hitMap };

}(window));