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
        gap:32px;background:#0d110e;user-select:none;
      ">

        <!-- Banda transportadora -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
          <div style="font-size:10px;color:#4a6a4a;font-family:monospace;letter-spacing:.08em">Banda transportadora</div>

          <div style="position:relative;width:420px;height:90px">

            <!-- Estructura banda -->
            <div style="
              position:absolute;bottom:0;left:20px;right:20px;
              height:18px;background:#1a2a1a;border-radius:2px;
              border:1px solid #2a3a2a;
            "></div>

            <!-- Rodillo izquierdo -->
            <div style="
              position:absolute;bottom:0;left:8px;
              width:20px;height:20px;border-radius:50%;
              background:#1e2a1f;border:2px solid #2a3a2a;
            "></div>

            <!-- Rodillo derecho -->
            <div style="
              position:absolute;bottom:0;right:8px;
              width:20px;height:20px;border-radius:50%;
              background:#1e2a1f;border:2px solid #2a3a2a;
            "></div>

            <!-- Caja -->
            <div id="sc-box" style="
              position:absolute;bottom:20px;left:20px;
              width:56px;height:48px;
              background:#2a2a1a;border:2px solid #3a3a2a;
              border-radius:3px;
              transition:left .05s linear;
            ">
              <div style="
                position:absolute;top:5px;left:5px;right:5px;bottom:5px;
                border:1px dashed #3a3a2a;border-radius:2px;
              "></div>
            </div>

          </div>

          <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#27500A;color:#97C459;border:1px solid #3B6D11">Q0.0 · Motor_Banda</div>
          <div id="sc-banda-status" style="font-size:10px;font-family:monospace;color:#3a4a3a;transition:color .15s">DETENIDA</div>
        </div>

        <!-- Indicador retardo -->
        <div style="display:flex;align-items:center;gap:20px;padding:8px 20px;border:1px solid #1e2a1f;border-radius:6px">
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <div style="font-size:9px;font-family:monospace;color:#3a4a3a;letter-spacing:.08em">PT</div>
            <div id="sc-ton-pt" style="font-size:16px;font-family:monospace;color:#3a5a3a;letter-spacing:.06em;min-width:80px;text-align:center">0 ms</div>
          </div>
          <div style="width:1px;height:30px;background:#1e2a1f"></div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <div style="font-size:9px;font-family:monospace;color:#3a4a3a;letter-spacing:.08em">ET</div>
            <div id="sc-ton-et" style="font-size:16px;font-family:monospace;color:#3a5a3a;letter-spacing:.06em;transition:color .15s;min-width:80px;text-align:center">0 ms</div>
          </div>
        </div>

        <!-- Botón marcha -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
          <div style="font-size:10px;color:#4a6a4a;font-family:monospace">Marcha</div>
          <div id="sc-btn-marcha" style="
            width:64px;height:64px;border-radius:50%;
            background:#1a2a1a;border:4px solid #2a3a2a;
            display:flex;align-items:center;justify-content:center;
            cursor:pointer;box-sizing:border-box;transition:transform .08s;
          ">
            <div id="sc-btn-marcha-cap" style="
              width:40px;height:40px;border-radius:50%;
              background:#1a6a1a;border:2px solid #2a8a2a;
              transition:background .08s;pointer-events:none;
            "></div>
          </div>
          <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.0 · toggle</div>
        </div>

        <!-- Leyenda -->
        <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#1a6a1a"></div>
            <span style="font-size:10px;color:#4a5a4a;font-family:monospace">I0.0 · Btn_Marcha — toggle</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#639922"></div>
            <span style="font-size:10px;color:#4a5a4a;font-family:monospace">Q0.0 · Motor_Banda</span>
          </div>
        </div>

      </div>
    `;

    _el.btnMarcha    = container.querySelector('#sc-btn-marcha');
    _el.btnMarchaCap = container.querySelector('#sc-btn-marcha-cap');
    _el.box          = container.querySelector('#sc-box');
    _el.bandaStatus  = container.querySelector('#sc-banda-status');
    _el.tonPt        = container.querySelector('#sc-ton-pt');
    _el.tonEt        = container.querySelector('#sc-ton-et');
    _el.boxPos       = 20;
    _el.animFrame    = null;
    _el.marchaOn     = false;

    const toggleMarcha = () => {
      if (global.LLT.state.getMode() !== 'RUN') return;
      _el.marchaOn = !_el.marchaOn;
      global.LLT.state.setSignalValue('I0.0', _el.marchaOn);
      _el.btnMarcha.style.borderColor    = _el.marchaOn ? '#3B6D11' : '#2a3a2a';
      _el.btnMarchaCap.style.background  = _el.marchaOn ? '#2a8a2a' : '#1a6a1a';
    };

    _el.btnMarcha.addEventListener('click',      toggleMarcha);
    _el.btnMarcha.addEventListener('touchstart', (e) => { e.preventDefault(); toggleMarcha(); });
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
    if (!_el.box) return;

    const motorOn = mode === 'RUN' && !!signals['Q0.0']?.value;
    const marchaOn = mode === 'RUN' && !!signals['I0.0']?.value;

    // PT y ET del TON — buscar el bloque en los rungs
    const tonCell = _findTimerCell('T0');
    if (tonCell) {
      _el.tonPt.textContent = Math.round(tonCell.preset  || 0) + ' ms';
      _el.tonEt.textContent = Math.round(tonCell.elapsed || 0) + ' ms';
      _el.tonEt.style.color = (tonCell.elapsed || 0) > 0 ? '#639922' : '#3a5a3a';
    }

    _el.bandaStatus.textContent = motorOn ? 'EN MARCHA' : (marchaOn ? 'ESPERANDO RETARDO...' : 'DETENIDA');
    _el.bandaStatus.style.color = motorOn ? '#639922' : (marchaOn ? '#ba9500' : '#3a4a3a');

    // Animación caja
    if (motorOn && !_el.animFrame) {
      const move = () => {
        if (!_el.box) return;
        _el.boxPos += 1.2;
        if (_el.boxPos > 360) _el.boxPos = 20;
        _el.box.style.left = _el.boxPos + 'px';
        _el.animFrame = requestAnimationFrame(move);
      };
      _el.animFrame = requestAnimationFrame(move);
    } else if (!motorOn && _el.animFrame) {
      cancelAnimationFrame(_el.animFrame);
      _el.animFrame = null;
    }
  }

  function destroy() {
    if (_el.animFrame) cancelAnimationFrame(_el.animFrame);
    _el = {};
  }

  global.LLT.scenes['ex_07'] = { build, update, destroy };

}(window));