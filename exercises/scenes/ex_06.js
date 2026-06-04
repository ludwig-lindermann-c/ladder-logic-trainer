(function (global) {
  'use strict';

  if (!global.LLT.scenes) global.LLT.scenes = {};

  let _el = {};
  let _damaged = false;

  function build(container) {
    container.innerHTML = `
      <div style="
        width:100%;height:100%;
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        gap:32px;background:var(--clr-bg-deep);user-select:none;
      ">

        <!-- Botones -->
        <div style="display:flex;align-items:center;gap:40px">

          <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
            <div style="font-size:10px;color:var(--text-secondary);font-family:monospace">Adelante</div>
            <div id="sc-btn-fwd" style="
              width:58px;height:58px;border-radius:50%;
              background:var(--clr-bg-panel);border:3px solid var(--clr-border-mid);
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;box-sizing:border-box;transition:transform .08s;
            ">
              <div id="sc-btn-fwd-cap" style="
                width:36px;height:36px;border-radius:50%;
                background:#1a6a1a;border:2px solid #2a8a2a;
                transition:background .08s;pointer-events:none;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 5px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.0</div>
          </div>

          <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
            <div style="font-size:10px;color:#6a2a2a;font-family:monospace">Paro</div>
            <div id="sc-btn-stop" style="
              width:58px;height:58px;border-radius:50%;
              background:var(--clr-bg-surface);border:3px solid var(--clr-border-mid);
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;box-sizing:border-box;transition:transform .08s;
            ">
              <div id="sc-btn-stop-cap" style="
                width:36px;height:36px;border-radius:50%;
                background:#8b0000;border:2px solid #cc0000;
                transition:background .08s;pointer-events:none;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 5px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.2</div>
          </div>

          <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
            <div style="font-size:10px;color:#4a4a6a;font-family:monospace">Atrás</div>
            <div id="sc-btn-rev" style="
              width:58px;height:58px;border-radius:50%;
              background:var(--clr-bg-surface);border:3px solid var(--clr-border-mid);
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;box-sizing:border-box;transition:transform .08s;
            ">
              <div id="sc-btn-rev-cap" style="
                width:36px;height:36px;border-radius:50%;
                background:#1a1a8b;border:2px solid #2a2acc;
                transition:background .08s;pointer-events:none;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 5px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.1</div>
          </div>

        </div>

        <!-- Motor -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
          <div style="font-size:10px;color:var(--text-secondary);font-family:monospace;letter-spacing:.08em">Motor</div>
          <div style="display:flex;align-items:center;gap:16px">

            <!-- Flecha dirección -->
            <div id="sc-arrow-fwd" style="
              font-size:24px;color:#1e2a1f;
              transition:color .2s;
            ">◀</div>

            <!-- Cuerpo motor -->
            <div id="sc-motor" style="
              width:100px;height:100px;border-radius:12px;
              background:var(--clr-bg-surface);border:3px solid var(--clr-border-mid);
              display:flex;align-items:center;justify-content:center;
              transition:background .2s,border-color .2s;
              position:relative;overflow:hidden;
            ">
              <div id="sc-motor-ring" style="
                width:66px;height:66px;border-radius:50%;
                border:4px solid var(--clr-border-mid);
                display:flex;align-items:center;justify-content:center;
                transition:border-color .2s;
              ">
                <div id="sc-motor-dot" style="
                  width:14px;height:14px;border-radius:50%;
                  background:#2a2a2a;transition:background .2s;
                "></div>
              </div>
              <!-- Humo daño -->
              <div id="sc-smoke" style="
                position:absolute;inset:0;
                display:none;align-items:center;justify-content:center;
                font-size:28px;
              ">💨</div>
            </div>

            <!-- Flecha dirección -->
            <div id="sc-arrow-rev" style="
              font-size:24px;color:#1e2a1f;
              transition:color .2s;
            ">▶</div>

          </div>

          <!-- Estado -->
          <div id="sc-motor-status" style="
            font-size:11px;font-family:monospace;
            color:var(--text-secondary);letter-spacing:.1em;transition:color .2s;
          ">DETENIDO</div>

          <!-- Indicador contactores -->
          <div style="display:flex;gap:16px;margin-top:4px">
            <div style="display:flex;align-items:center;gap:5px">
              <div id="sc-led-fwd" style="width:8px;height:8px;border-radius:50%;background:var(--clr-bg-elevated);transition:background .15s"></div>
              <span style="font-size:9px;font-family:monospace;color:var(--text-secondary)">Q0.0 Adelante</span>
            </div>
            <div style="display:flex;align-items:center;gap:5px">
              <div id="sc-led-rev" style="width:8px;height:8px;border-radius:50%;background:var(--clr-bg-elevated);transition:background .15s"></div>
              <span style="font-size:9px;font-family:monospace;color:var(--text-secondary)">Q0.1 Atrás</span>
            </div>
          </div>

          <!-- Alerta daño -->
          <div id="sc-damage-alert" style="
            display:none;font-size:11px;font-family:monospace;
            color:#cc3333;letter-spacing:.06em;
            padding:6px 14px;border:1px solid #4a1a1a;
            border-radius:4px;background:#1a0d0d;margin-top:4px;
            text-align:center;
          ">
            ⚠ FALLA — AMBOS CONTACTORES ACTIVOS — MOTOR DAÑADO
            <br>
            <button id="sc-btn-reset-damage" style="
              margin-top:6px;font-family:monospace;font-size:9px;
              padding:3px 10px;border-radius:3px;cursor:pointer;
              background:#2a0d0d;border:1px solid #6a1a1a;color:#cc6666;
              letter-spacing:.06em;
            ">↺ Restaurar motor</button>
          </div>

        </div>

        <!-- Leyenda -->
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#1a6a1a"></div>
            <span style="font-size:9px;color:var(--text-muted);font-family:monospace">I0.0 Btn_Adelante</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#1a1a8b"></div>
            <span style="font-size:9px;color:#4a4a5a;font-family:monospace">I0.1 Btn_Atras</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#8b0000"></div>
            <span style="font-size:9px;color:#5a4a4a;font-family:monospace">I0.2 Btn_Paro</span>
          </div>
        </div>

      </div>
    `;

    _el.btnFwd      = container.querySelector('#sc-btn-fwd');
    _el.btnFwdCap   = container.querySelector('#sc-btn-fwd-cap');
    _el.btnRev      = container.querySelector('#sc-btn-rev');
    _el.btnRevCap   = container.querySelector('#sc-btn-rev-cap');
    _el.btnStop     = container.querySelector('#sc-btn-stop');
    _el.btnStopCap  = container.querySelector('#sc-btn-stop-cap');
    _el.motor       = container.querySelector('#sc-motor');
    _el.motorRing   = container.querySelector('#sc-motor-ring');
    _el.motorDot    = container.querySelector('#sc-motor-dot');
    _el.motorStatus = container.querySelector('#sc-motor-status');
    _el.arrowFwd    = container.querySelector('#sc-arrow-fwd');
    _el.arrowRev    = container.querySelector('#sc-arrow-rev');
    _el.ledFwd      = container.querySelector('#sc-led-fwd');
    _el.ledRev      = container.querySelector('#sc-led-rev');
    _el.smoke       = container.querySelector('#sc-smoke');
    _el.damageAlert = container.querySelector('#sc-damage-alert');
    _el.animFrame   = null;
    _el.angle       = 0;
    _el.direction   = 1;
    _damaged        = false;

    const pressBtn = (addr, v, btnEl, capEl, colorOn, colorOff) => {
      if (global.LLT.state.getMode() !== 'RUN') return;
      global.LLT.state.setSignalValue(addr, v);
      btnEl.style.transform  = v ? 'scale(0.92)' : 'scale(1)';
      capEl.style.background = v ? colorOn : colorOff;
    };

    _el.btnFwd.addEventListener('mousedown',  () => pressBtn('I0.0', true,  _el.btnFwd,  _el.btnFwdCap,  '#0d4a0d', '#1a6a1a'));
    _el.btnFwd.addEventListener('mouseup',    () => pressBtn('I0.0', false, _el.btnFwd,  _el.btnFwdCap,  '#0d4a0d', '#1a6a1a'));
    _el.btnFwd.addEventListener('mouseleave', () => pressBtn('I0.0', false, _el.btnFwd,  _el.btnFwdCap,  '#0d4a0d', '#1a6a1a'));
    _el.btnFwd.addEventListener('touchstart', (e) => { e.preventDefault(); pressBtn('I0.0', true,  _el.btnFwd,  _el.btnFwdCap,  '#0d4a0d', '#1a6a1a'); });
    _el.btnFwd.addEventListener('touchend',   () => pressBtn('I0.0', false, _el.btnFwd,  _el.btnFwdCap,  '#0d4a0d', '#1a6a1a'));

    _el.btnRev.addEventListener('mousedown',  () => pressBtn('I0.1', true,  _el.btnRev,  _el.btnRevCap,  '#0d0d4a', '#1a1a8b'));
    _el.btnRev.addEventListener('mouseup',    () => pressBtn('I0.1', false, _el.btnRev,  _el.btnRevCap,  '#0d0d4a', '#1a1a8b'));
    _el.btnRev.addEventListener('mouseleave', () => pressBtn('I0.1', false, _el.btnRev,  _el.btnRevCap,  '#0d0d4a', '#1a1a8b'));
    _el.btnRev.addEventListener('touchstart', (e) => { e.preventDefault(); pressBtn('I0.1', true,  _el.btnRev,  _el.btnRevCap,  '#0d0d4a', '#1a1a8b'); });
    _el.btnRev.addEventListener('touchend',   () => pressBtn('I0.1', false, _el.btnRev,  _el.btnRevCap,  '#0d0d4a', '#1a1a8b'));

    _el.btnStop.addEventListener('mousedown',  () => pressBtn('I0.2', true,  _el.btnStop, _el.btnStopCap, '#4a0000', '#8b0000'));
    _el.btnStop.addEventListener('mouseup',    () => pressBtn('I0.2', false, _el.btnStop, _el.btnStopCap, '#4a0000', '#8b0000'));
    _el.btnStop.addEventListener('mouseleave', () => pressBtn('I0.2', false, _el.btnStop, _el.btnStopCap, '#4a0000', '#8b0000'));
    _el.btnStop.addEventListener('touchstart', (e) => { e.preventDefault(); pressBtn('I0.2', true,  _el.btnStop, _el.btnStopCap, '#4a0000', '#8b0000'); });
    _el.btnStop.addEventListener('touchend',   () => pressBtn('I0.2', false, _el.btnStop, _el.btnStopCap, '#4a0000', '#8b0000'));
    container.addEventListener('click', (e) => {
      if (e.target.id === 'sc-btn-reset-damage') {
        _damaged = false;
        global.LLT.state.setSignalValue('Q0.0', false);
        global.LLT.state.setSignalValue('Q0.1', false);
        global.LLT.state.setSignalValue('I0.0', false);
        global.LLT.state.setSignalValue('I0.1', false);
        _el.smoke.style.display       = 'none';
        _el.damageAlert.style.display = 'none';
        _el.motor.style.background      = '#1a1a1a';
        _el.motor.style.borderColor     = '#2a2a2a';
        _el.motorRing.style.borderColor = '#2a2a2a';
        _el.motorDot.style.background   = '#2a2a2a';
        _el.motorDot.style.transform    = 'translate(0,0)';
        _el.motorStatus.textContent     = 'DETENIDO';
        _el.motorStatus.style.color     = '#3a4a3a';
        _el.ledFwd.style.background     = '#1e2a1f';
        _el.ledRev.style.background     = '#1e2a1f';
        _el.arrowFwd.style.color        = '#1e2a1f';
        _el.arrowRev.style.color        = '#1e2a1f';
      }
    });
  }

  function update(signals, mode) {
    if (!_el.motor) return;

    const fwd = mode === 'RUN' && !!signals['Q0.0']?.value;
    const rev = mode === 'RUN' && !!signals['Q0.1']?.value;

    // Detección de falla — ambos contactores activos
    const damaged = fwd && rev;
    if (damaged) _damaged = true;

    _el.ledFwd.style.background = fwd ? '#639922' : '#1e2a1f';
    _el.ledRev.style.background = rev ? '#4a4acc' : '#1e2a1f';

    if (_damaged) {
      _el.motor.style.background      = '#2a0d0d';
      _el.motor.style.borderColor     = '#6a1a1a';
      _el.motorRing.style.borderColor = '#cc3333';
      _el.motorDot.style.background   = '#cc3333';
      _el.motorStatus.textContent     = 'MOTOR DAÑADO';
      _el.motorStatus.style.color     = '#cc3333';
      _el.smoke.style.display         = 'flex';
      _el.damageAlert.style.display   = 'block';
      _el.arrowFwd.style.color        = '#1e2a1f';
      _el.arrowRev.style.color        = '#1e2a1f';
      if (_el.animFrame) { cancelAnimationFrame(_el.animFrame); _el.animFrame = null; }
      return;
    }

    _el.smoke.style.display       = 'none';
    _el.damageAlert.style.display = 'none';

    const running = fwd || rev;
    _el.direction = fwd ? 1 : -1;

    _el.motor.style.background      = running ? '#0d1f0d' : '#1a1a1a';
    _el.motor.style.borderColor     = running ? '#2a4a2a' : '#2a2a2a';
    _el.motorRing.style.borderColor = running ? (fwd ? '#3B6D11' : '#4a4acc') : '#2a2a2a';
    _el.motorDot.style.background   = running ? (fwd ? '#639922' : '#6a6acc') : '#2a2a2a';
    _el.arrowFwd.style.color        = fwd ? '#639922' : '#1e2a1f';
    _el.arrowRev.style.color        = rev ? '#6a6acc' : '#1e2a1f';
    _el.motorStatus.textContent     = fwd ? 'GIRANDO ADELANTE' : rev ? 'GIRANDO ATRÁS' : 'DETENIDO';
    _el.motorStatus.style.color     = running ? (fwd ? '#639922' : '#6a6acc') : '#3a4a3a';

    if (running && !_el.animFrame) {
      const spin = () => {
        if (!_el.motorDot) return;
        _el.angle = (_el.angle + 6 * _el.direction) % 360;
        const r = 22;
        const x = Math.cos(_el.angle * Math.PI / 180) * r;
        const y = Math.sin(_el.angle * Math.PI / 180) * r;
        _el.motorDot.style.transform = `translate(${x}px,${y}px)`;
        _el.animFrame = requestAnimationFrame(spin);
      };
      _el.animFrame = requestAnimationFrame(spin);
    } else if (!running && _el.animFrame) {
      cancelAnimationFrame(_el.animFrame);
      _el.animFrame = null;
      _el.motorDot.style.transform = 'translate(0,0)';
    }
  }

  function destroy() {
    if (_el.animFrame) cancelAnimationFrame(_el.animFrame);
    _el = {};
    _damaged = false;
  }

  global.LLT.scenes['ex_06'] = { build, update, destroy };

}(window));