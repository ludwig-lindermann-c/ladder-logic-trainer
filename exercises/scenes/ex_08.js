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

          <!-- Interruptor máquina -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="font-size:10px;color:var(--text-secondary);font-family:monospace;letter-spacing:.08em">Máquina</div>
            <div id="sc-sw" style="
              width:64px;height:32px;border-radius:16px;
              background:var(--clr-bg-surface);border:2px solid var(--clr-border-mid);
              display:flex;align-items:center;padding:4px;
              cursor:pointer;box-sizing:border-box;
              transition:background .15s,border-color .15s;
            ">
              <div id="sc-sw-knob" style="
                width:22px;height:22px;border-radius:50%;
                background:#444;border:1px solid #555;
                transition:transform .15s,background .15s;
                pointer-events:none;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.0 · toggle</div>
            <div id="sc-maquina-status" style="font-size:10px;font-family:monospace;color:var(--text-secondary)">APAGADA</div>
          </div>

          <!-- Ventilador -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
            <div style="font-size:10px;color:var(--text-secondary);font-family:monospace;letter-spacing:.08em">Ventilador</div>
            <div style="
              width:100px;height:100px;border-radius:50%;
              background:var(--clr-bg-deep);border:3px solid var(--clr-border-subtle);
              display:flex;align-items:center;justify-content:center;
              position:relative;
            ">
              <!-- Aspas -->
              <div id="sc-fan" style="
                width:70px;height:70px;position:relative;
                display:flex;align-items:center;justify-content:center;
              ">
                <div style="position:absolute;width:100%;height:100%;display:flex;align-items:center;justify-content:center">
                  <div id="sc-blade1" style="position:absolute;width:28px;height:10px;background:var(--clr-bg-elevated);border-radius:5px;left:4px;transform-origin:right center;transition:background .2s"></div>
                  <div id="sc-blade2" style="position:absolute;width:28px;height:10px;background:var(--clr-bg-elevated);border-radius:5px;right:4px;transform-origin:left center;transition:background .2s"></div>
                  <div id="sc-blade3" style="position:absolute;width:10px;height:28px;background:var(--clr-bg-elevated);border-radius:5px;top:4px;transform-origin:center bottom;transition:background .2s"></div>
                  <div id="sc-blade4" style="position:absolute;width:10px;height:28px;background:var(--clr-bg-elevated);border-radius:5px;bottom:4px;transform-origin:center top;transition:background .2s"></div>
                </div>
                <!-- Centro -->
                <div style="
                  width:16px;height:16px;border-radius:50%;
                  background:var(--clr-bg-elevated);border:2px solid var(--clr-border-mid);
                  position:relative;z-index:1;
                "></div>
              </div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#27500A;color:#97C459;border:1px solid #3B6D11">Q0.0 · Ventilador</div>
            <div id="sc-fan-status" style="font-size:10px;font-family:monospace;color:var(--text-secondary);transition:color .15s">DETENIDO</div>
          </div>

        </div>

        <!-- PT y ET del TOF -->
        <div style="display:flex;align-items:center;gap:20px;padding:8px 20px;border:1px solid var(--clr-border-subtle);border-radius:6px">
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <div style="font-size:9px;font-family:monospace;color:var(--text-secondary);letter-spacing:.08em">PT</div>
            <div id="sc-tof-pt" style="font-size:16px;font-family:monospace;color:var(--text-muted);min-width:80px;text-align:center">0 ms</div>
          </div>
          <div style="width:1px;height:30px;background:var(--clr-bg-elevated)"></div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <div style="font-size:9px;font-family:monospace;color:var(--text-secondary);letter-spacing:.08em">ET</div>
            <div id="sc-tof-et" style="font-size:16px;font-family:monospace;color:var(--text-muted);min-width:80px;text-align:center;transition:color .15s">0 ms</div>
          </div>
        </div>

        <!-- Leyenda -->
        <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#378ADD"></div>
            <span style="font-size:10px;color:var(--text-muted);font-family:monospace">I0.0 · Maquina_ON — toggle</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#639922"></div>
            <span style="font-size:10px;color:var(--text-muted);font-family:monospace">Q0.0 · Ventilador</span>
          </div>
        </div>

      </div>
    `;

    _el.sw          = container.querySelector('#sc-sw');
    _el.swKnob      = container.querySelector('#sc-sw-knob');
    _el.fan         = container.querySelector('#sc-fan');
    _el.blade1      = container.querySelector('#sc-blade1');
    _el.blade2      = container.querySelector('#sc-blade2');
    _el.blade3      = container.querySelector('#sc-blade3');
    _el.blade4      = container.querySelector('#sc-blade4');
    _el.fanStatus   = container.querySelector('#sc-fan-status');
    _el.maquinaStatus = container.querySelector('#sc-maquina-status');
    _el.tofPt       = container.querySelector('#sc-tof-pt');
    _el.tofEt       = container.querySelector('#sc-tof-et');
    _el.animFrame   = null;
    _el.angle       = 0;
    _el.swOn        = false;

    _el.sw.addEventListener('click', () => {
      if (global.LLT.state.getMode() !== 'RUN') return;
      _el.swOn = !_el.swOn;
      global.LLT.state.setSignalValue('I0.0', _el.swOn);
      _el.sw.style.background   = _el.swOn ? '#1a3a1a' : '#1a1a1a';
      _el.sw.style.borderColor  = _el.swOn ? '#3B6D11' : '#2a2a2a';
      _el.swKnob.style.transform  = _el.swOn ? 'translateX(32px)' : 'translateX(0)';
      _el.swKnob.style.background = _el.swOn ? '#639922' : '#444';
      _el.maquinaStatus.textContent = _el.swOn ? 'ENCENDIDA' : 'APAGADA';
      _el.maquinaStatus.style.color = _el.swOn ? '#639922' : '#3a4a3a';
    });
    _el.sw.addEventListener('touchstart', (e) => { e.preventDefault(); _el.sw.click(); });
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
    if (!_el.fan) return;

    const fanOn = mode === 'RUN' && !!signals['Q0.0']?.value;

    // PT y ET del TOF
    const tofCell = _findTimerCell('T0');
    if (tofCell) {
      _el.tofPt.textContent = Math.round(tofCell.preset  || 0) + ' ms';
      _el.tofEt.textContent = Math.round(tofCell.elapsed || 0) + ' ms';
      _el.tofEt.style.color = (tofCell.elapsed || 0) > 0 ? '#639922' : '#3a5a3a';
    }

    const bladeColor = fanOn ? '#2a4a2a' : '#1e2a1f';
    _el.blade1.style.background = bladeColor;
    _el.blade2.style.background = bladeColor;
    _el.blade3.style.background = bladeColor;
    _el.blade4.style.background = bladeColor;

    _el.fanStatus.textContent = fanOn ? 'GIRANDO' : 'DETENIDO';
    _el.fanStatus.style.color = fanOn ? '#639922' : '#3a4a3a';

    if (fanOn && !_el.animFrame) {
      const spin = () => {
        if (!_el.fan) return;
        _el.angle = (_el.angle + 8) % 360;
        _el.fan.style.transform = `rotate(${_el.angle}deg)`;
        _el.animFrame = requestAnimationFrame(spin);
      };
      _el.animFrame = requestAnimationFrame(spin);
    } else if (!fanOn && _el.animFrame) {
      cancelAnimationFrame(_el.animFrame);
      _el.animFrame = null;
    }
  }

  function destroy() {
    if (_el.animFrame) cancelAnimationFrame(_el.animFrame);
    _el = {};
  }

  global.LLT.scenes['ex_08'] = { build, update, destroy };

}(window));