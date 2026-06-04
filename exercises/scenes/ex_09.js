(function (global) {
  'use strict';

  if (!global.LLT.scenes) global.LLT.scenes = {};

  let _el = {};

  function build(container) {
    container.innerHTML = `
      <div style="
        width:100%;height:100%;
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        gap:32px;background:var(--clr-bg-deep);user-select:none;
      ">

        <div style="display:flex;align-items:center;gap:80px">

          <!-- Sensor falla -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="font-size:10px;color:#6a4a2a;font-family:monospace;letter-spacing:.08em">Sensor falla</div>
            <div id="sc-btn-falla" style="
              width:64px;height:64px;border-radius:8px;
              background:var(--clr-bg-surface);border:3px solid var(--clr-border-mid);
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;box-sizing:border-box;transition:all .08s;
            ">
              <div id="sc-btn-falla-led" style="
                width:28px;height:28px;border-radius:4px;
                background:var(--clr-bg-surface);border:2px solid var(--clr-border-mid);
                transition:all .08s;pointer-events:none;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.0 · momentáneo</div>
            <div id="sc-falla-status" style="font-size:10px;font-family:monospace;color:var(--text-secondary)">SIN FALLA</div>
          </div>

          <!-- Luz de aviso -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
            <div style="font-size:10px;color:var(--text-secondary);font-family:monospace;letter-spacing:.08em">Luz de aviso</div>
            <div id="sc-luz" style="
              width:80px;height:80px;border-radius:50%;
              background:#1a1a12;border:4px solid var(--clr-border-mid);
              display:flex;align-items:center;justify-content:center;
              transition:background .1s,border-color .1s;
            ">
              <div id="sc-luz-inner" style="
                width:50px;height:50px;border-radius:50%;
                background:#2a2a18;transition:background .1s;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#27500A;color:#97C459;border:1px solid #3B6D11">Q0.0 · Luz_Aviso</div>
            <div id="sc-luz-status" style="font-size:10px;font-family:monospace;color:var(--text-secondary);transition:color .1s">APAGADA</div>
          </div>

        </div>

        <!-- PT y ET del TP -->
        <div style="display:flex;align-items:center;gap:20px;padding:8px 20px;border:1px solid var(--clr-border-subtle);border-radius:6px">
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <div style="font-size:9px;font-family:monospace;color:var(--text-secondary);letter-spacing:.08em">PT</div>
            <div id="sc-tp-pt" style="font-size:16px;font-family:monospace;color:var(--text-muted);min-width:80px;text-align:center">0 ms</div>
          </div>
          <div style="width:1px;height:30px;background:var(--clr-bg-elevated)"></div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <div style="font-size:9px;font-family:monospace;color:var(--text-secondary);letter-spacing:.08em">ET</div>
            <div id="sc-tp-et" style="font-size:16px;font-family:monospace;color:var(--text-muted);min-width:80px;text-align:center;transition:color .15s">0 ms</div>
          </div>
        </div>

        <!-- Leyenda -->
        <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#cc7700"></div>
            <span style="font-size:10px;color:#5a4a3a;font-family:monospace">I0.0 · Sensor_Falla — momentáneo</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#639922"></div>
            <span style="font-size:10px;color:var(--text-muted);font-family:monospace">Q0.0 · Luz_Aviso</span>
          </div>
        </div>

        <div style="font-size:10px;color:#3a3a2a;font-family:monospace;text-align:center">
          Presiona brevemente — la luz debe durar exactamente el PT del TP
        </div>

      </div>
    `;

    _el.btnFalla    = container.querySelector('#sc-btn-falla');
    _el.btnFallaLed = container.querySelector('#sc-btn-falla-led');
    _el.fallaStatus = container.querySelector('#sc-falla-status');
    _el.luz         = container.querySelector('#sc-luz');
    _el.luzInner    = container.querySelector('#sc-luz-inner');
    _el.luzStatus   = container.querySelector('#sc-luz-status');
    _el.tpPt        = container.querySelector('#sc-tp-pt');
    _el.tpEt        = container.querySelector('#sc-tp-et');

    const press = (v) => {
      if (global.LLT.state.getMode() !== 'RUN') return;
      global.LLT.state.setSignalValue('I0.0', v);
      _el.btnFalla.style.borderColor    = v ? '#cc7700' : '#2a2a2a';
      _el.btnFalla.style.background     = v ? '#2a1a00' : '#1a1a1a';
      _el.btnFallaLed.style.background  = v ? '#cc7700' : '#1a1a1a';
      _el.btnFallaLed.style.borderColor = v ? '#ffaa00' : '#2a2a2a';
      _el.fallaStatus.textContent       = v ? 'FALLA DETECTADA' : 'SIN FALLA';
      _el.fallaStatus.style.color       = v ? '#cc7700' : '#3a4a3a';
    };

    _el.btnFalla.addEventListener('mousedown',  () => press(true));
    _el.btnFalla.addEventListener('mouseup',    () => press(false));
    _el.btnFalla.addEventListener('mouseleave', () => press(false));
    _el.btnFalla.addEventListener('touchstart', (e) => { e.preventDefault(); press(true); });
    _el.btnFalla.addEventListener('touchend',   () => press(false));
  }

  function _findTimerCell(address) {
    const rungs = global.LLT.state.getRungs();
    for (const rung of rungs) {
      for (const el of rung.elements) {
        if (el.address === address && el.preset !== undefined) return el;
        if (el.rows) {
          for (const row of el.rows) {
            for (const cell of row) {
              if (cell.address === address && cell.preset !== undefined) return cell;
            }
          }
        }
      }
    }
    return null;
  }

  function update(signals, mode) {
    if (!_el.luz) return;

    const luzOn = mode === 'RUN' && !!signals['Q0.0']?.value;

    // PT y ET del TP
    const tpCell = _findTimerCell('T0');
    if (tpCell) {
      _el.tpPt.textContent = Math.round(tpCell.preset  || 0) + ' ms';
      _el.tpEt.textContent = Math.round(tpCell.elapsed || 0) + ' ms';
      _el.tpEt.style.color = (tpCell.elapsed || 0) > 0 ? '#ba9500' : '#3a5a3a';
    }

    _el.luz.style.background      = luzOn ? '#7a6200' : '#1a1a12';
    _el.luz.style.borderColor     = luzOn ? '#ba9500' : '#2a2a1a';
    _el.luzInner.style.background = luzOn ? '#ffe066' : '#2a2a18';
    _el.luzStatus.textContent     = luzOn ? 'DESTELLO ACTIVO' : 'APAGADA';
    _el.luzStatus.style.color     = luzOn ? '#ba9500' : '#3a4a3a';
  }

  function destroy() { _el = {}; }

  global.LLT.scenes['ex_09'] = { build, update, destroy };

}(window));