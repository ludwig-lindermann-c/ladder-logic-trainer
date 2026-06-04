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

          <!-- Botón inicio -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="font-size:10px;color:var(--text-secondary);font-family:monospace;letter-spacing:.08em">Inicio ciclo</div>
            <div id="sc-btn-inicio" style="
              width:64px;height:64px;border-radius:50%;
              background:var(--clr-bg-panel);border:4px solid var(--clr-border-mid);
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;box-sizing:border-box;transition:transform .08s;
            ">
              <div id="sc-btn-inicio-cap" style="
                width:40px;height:40px;border-radius:50%;
                background:#1a6a1a;border:2px solid #2a8a2a;
                transition:background .08s;pointer-events:none;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.0 · momentáneo</div>
          </div>

          <!-- Semáforo -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
            <div style="font-size:10px;color:var(--text-secondary);font-family:monospace;letter-spacing:.08em">Semáforo</div>
            <div style="
              width:80px;
              background:var(--clr-bg-deep);border:3px solid #222;
              border-radius:12px;padding:10px 0;
              display:flex;flex-direction:column;
              align-items:center;gap:10px;
            ">
              <!-- Rojo -->
              <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
                <div id="sc-luz-roja" style="
                  width:44px;height:44px;border-radius:50%;
                  background:#1a0d0d;border:2px solid var(--clr-border-mid);
                  transition:background .15s,border-color .15s;
                "></div>
                <div style="font-size:8px;font-family:monospace;color:#3a2a2a">Q0.0</div>
              </div>
              <!-- Amarillo -->
              <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
                <div id="sc-luz-amarilla" style="
                  width:44px;height:44px;border-radius:50%;
                  background:#1a1a0d;border:2px solid #2a2a1a;
                  transition:background .15s,border-color .15s;
                "></div>
                <div style="font-size:8px;font-family:monospace;color:#3a3a2a">Q0.2</div>
              </div>
              <!-- Verde -->
              <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
                <div id="sc-luz-verde" style="
                  width:44px;height:44px;border-radius:50%;
                  background:#0d1a0d;border:2px solid #1a2a1a;
                  transition:background .15s,border-color .15s;
                "></div>
                <div style="font-size:8px;font-family:monospace;color:#2a3a2a">Q0.1</div>
              </div>
            </div>
          </div>

          <!-- Timers -->
          <div style="display:flex;flex-direction:column;gap:16px">

            <div style="display:flex;flex-direction:column;gap:4px">
              <div style="font-size:9px;font-family:monospace;color:#5a3a3a;letter-spacing:.06em">T0 · Rojo</div>
              <div style="display:flex;gap:12px">
                <div style="display:flex;flex-direction:column;align-items:center;gap:1px">
                  <div style="font-size:8px;font-family:monospace;color:#3a3a3a">PT</div>
                  <div id="sc-t0-pt" style="font-size:13px;font-family:monospace;color:#3a3a3a;min-width:60px;text-align:center">0 ms</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:center;gap:1px">
                  <div style="font-size:8px;font-family:monospace;color:#3a3a3a">ET</div>
                  <div id="sc-t0-et" style="font-size:13px;font-family:monospace;color:#3a3a3a;min-width:60px;text-align:center">0 ms</div>
                </div>
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:4px">
              <div style="font-size:9px;font-family:monospace;color:var(--text-muted);letter-spacing:.06em">T1 · Verde</div>
              <div style="display:flex;gap:12px">
                <div style="display:flex;flex-direction:column;align-items:center;gap:1px">
                  <div style="font-size:8px;font-family:monospace;color:#3a3a3a">PT</div>
                  <div id="sc-t1-pt" style="font-size:13px;font-family:monospace;color:#3a3a3a;min-width:60px;text-align:center">0 ms</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:center;gap:1px">
                  <div style="font-size:8px;font-family:monospace;color:#3a3a3a">ET</div>
                  <div id="sc-t1-et" style="font-size:13px;font-family:monospace;color:#3a3a3a;min-width:60px;text-align:center">0 ms</div>
                </div>
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:4px">
              <div style="font-size:9px;font-family:monospace;color:#5a5a2a;letter-spacing:.06em">T2 · Amarillo</div>
              <div style="display:flex;gap:12px">
                <div style="display:flex;flex-direction:column;align-items:center;gap:1px">
                  <div style="font-size:8px;font-family:monospace;color:#3a3a3a">PT</div>
                  <div id="sc-t2-pt" style="font-size:13px;font-family:monospace;color:#3a3a3a;min-width:60px;text-align:center">0 ms</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:center;gap:1px">
                  <div style="font-size:8px;font-family:monospace;color:#3a3a3a">ET</div>
                  <div id="sc-t2-et" style="font-size:13px;font-family:monospace;color:#3a3a3a;min-width:60px;text-align:center">0 ms</div>
                </div>
              </div>
            </div>

          </div>

        </div>

        <!-- Estado -->
        <div id="sc-semaforo-status" style="
          font-size:11px;font-family:monospace;
          color:var(--text-secondary);letter-spacing:.1em;
        ">DETENIDO — presiona Inicio para arrancar</div>

        <!-- Leyenda -->
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#cc0000"></div>
            <span style="font-size:10px;color:#5a4a4a;font-family:monospace">Q0.0 · Luz_Roja</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#639922"></div>
            <span style="font-size:10px;color:var(--text-muted);font-family:monospace">Q0.1 · Luz_Verde</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#ba9500"></div>
            <span style="font-size:10px;color:#5a5a4a;font-family:monospace">Q0.2 · Luz_Amarilla</span>
          </div>
        </div>

      </div>
    `;

    _el.btnInicio    = container.querySelector('#sc-btn-inicio');
    _el.btnInicioCap = container.querySelector('#sc-btn-inicio-cap');
    _el.luzRoja      = container.querySelector('#sc-luz-roja');
    _el.luzAmarilla  = container.querySelector('#sc-luz-amarilla');
    _el.luzVerde     = container.querySelector('#sc-luz-verde');
    _el.status       = container.querySelector('#sc-semaforo-status');
    _el.t0pt         = container.querySelector('#sc-t0-pt');
    _el.t0et         = container.querySelector('#sc-t0-et');
    _el.t1pt         = container.querySelector('#sc-t1-pt');
    _el.t1et         = container.querySelector('#sc-t1-et');
    _el.t2pt         = container.querySelector('#sc-t2-pt');
    _el.t2et         = container.querySelector('#sc-t2-et');

    const press = (v) => {
      if (global.LLT.state.getMode() !== 'RUN') return;
      global.LLT.state.setSignalValue('I0.0', v);
      _el.btnInicio.style.transform      = v ? 'scale(0.92)' : 'scale(1)';
      _el.btnInicioCap.style.background  = v ? '#0d4a0d' : '#1a6a1a';
    };

    _el.btnInicio.addEventListener('mousedown',  () => press(true));
    _el.btnInicio.addEventListener('mouseup',    () => press(false));
    _el.btnInicio.addEventListener('mouseleave', () => press(false));
    _el.btnInicio.addEventListener('touchstart', (e) => { e.preventDefault(); press(true); });
    _el.btnInicio.addEventListener('touchend',   () => press(false));
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
    if (!_el.luzRoja) return;

    const rojoOn    = mode === 'RUN' && !!signals['Q0.0']?.value;
    const verdeOn   = mode === 'RUN' && !!signals['Q0.1']?.value;
    const amarilloOn= mode === 'RUN' && !!signals['Q0.2']?.value;

    _el.luzRoja.style.background     = rojoOn    ? '#cc0000' : '#1a0d0d';
    _el.luzRoja.style.borderColor    = rojoOn    ? '#ff4444' : '#2a1a1a';
    _el.luzVerde.style.background    = verdeOn   ? '#1a8a1a' : '#0d1a0d';
    _el.luzVerde.style.borderColor   = verdeOn   ? '#2acc2a' : '#1a2a1a';
    _el.luzAmarilla.style.background = amarilloOn? '#ba9500' : '#1a1a0d';
    _el.luzAmarilla.style.borderColor= amarilloOn? '#ffe066' : '#2a2a1a';

    const running = rojoOn || verdeOn || amarilloOn;
    _el.status.textContent = rojoOn     ? 'ROJO — vehículos detenidos'
                           : verdeOn    ? 'VERDE — vehículos circulan'
                           : amarilloOn ? 'AMARILLO — precaución'
                           : running    ? 'EN CICLO'
                           : 'DETENIDO — presiona Inicio para arrancar';
    _el.status.style.color = rojoOn     ? '#cc4444'
                           : verdeOn    ? '#639922'
                           : amarilloOn ? '#ba9500'
                           : '#3a4a3a';

    // Timers
    const t0 = _findTimerCell('T0');
    const t1 = _findTimerCell('T1');
    const t2 = _findTimerCell('T2');

    if (t0) {
      _el.t0pt.textContent = Math.round(t0.preset  || 0) + ' ms';
      _el.t0et.textContent = Math.round(t0.elapsed || 0) + ' ms';
      _el.t0et.style.color = (t0.elapsed || 0) > 0 ? '#cc4444' : '#3a3a3a';
    }
    if (t1) {
      _el.t1pt.textContent = Math.round(t1.preset  || 0) + ' ms';
      _el.t1et.textContent = Math.round(t1.elapsed || 0) + ' ms';
      _el.t1et.style.color = (t1.elapsed || 0) > 0 ? '#639922' : '#3a3a3a';
    }
    if (t2) {
      _el.t2pt.textContent = Math.round(t2.preset  || 0) + ' ms';
      _el.t2et.textContent = Math.round(t2.elapsed || 0) + ' ms';
      _el.t2et.style.color = (t2.elapsed || 0) > 0 ? '#ba9500' : '#3a3a3a';
    }
  }

  function destroy() { _el = {}; }

  global.LLT.scenes['ex_11'] = { build, update, destroy };

}(window));