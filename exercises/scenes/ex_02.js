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
        gap:40px;background:var(--clr-bg-deep);user-select:none;
      ">

        <div style="display:flex;align-items:center;gap:80px;position:relative">

          <!-- Pulsador marcha -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="font-size:10px;color:var(--text-secondary);font-family:monospace;letter-spacing:.08em">Marcha</div>
            <div id="sc-btn-marcha" style="
              width:60px;height:60px;border-radius:50%;
              background:var(--clr-bg-panel);border:4px solid var(--clr-border-mid);
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;box-sizing:border-box;transition:transform .08s;
            ">
              <div id="sc-btn-marcha-cap" style="
                width:36px;height:36px;border-radius:50%;
                background:#1a6a1a;border:2px solid #2a8a2a;
                transition:background .08s;pointer-events:none;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.0</div>
          </div>

          <!-- Motor -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="font-size:10px;color:var(--text-secondary);font-family:monospace;letter-spacing:.08em">Motor</div>
            <div id="sc-motor" style="
              width:80px;height:80px;border-radius:12px;
              background:var(--clr-bg-surface);border:3px solid var(--clr-border-mid);
              display:flex;align-items:center;justify-content:center;
              transition:background .15s,border-color .15s;
              position:relative;overflow:hidden;
            ">
              <div id="sc-motor-ring" style="
                width:52px;height:52px;border-radius:50%;
                border:4px solid var(--clr-border-mid);
                display:flex;align-items:center;justify-content:center;
                transition:border-color .15s;
              ">
                <div id="sc-motor-dot" style="
                  width:12px;height:12px;border-radius:50%;
                  background:#2a2a2a;transition:background .15s;
                "></div>
              </div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#27500A;color:#97C459;border:1px solid #3B6D11">Q0.0</div>
          </div>

          <!-- Botón emergencia -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="font-size:10px;color:#6a2a2a;font-family:monospace;letter-spacing:.08em">EMERGENCIA</div>
            <div id="sc-btn-emg" style="
              width:60px;height:60px;border-radius:50%;
              background:var(--clr-bg-surface);border:4px solid #4a2a2a;
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;box-sizing:border-box;transition:transform .08s;
            ">
              <div id="sc-btn-emg-cap" style="
                width:36px;height:36px;border-radius:50%;
                background:#8b0000;border:2px solid #cc0000;
                transition:background .08s;pointer-events:none;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.1</div>
          </div>

        </div>

        <!-- Estado motor -->
        <div id="sc-motor-status" style="
          font-size:11px;font-family:monospace;letter-spacing:.1em;
          color:var(--text-secondary);transition:color .15s;
        ">MOTOR DETENIDO</div>

        <!-- Leyenda -->
        <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#378ADD"></div>
            <span style="font-size:10px;color:var(--text-muted);font-family:monospace">I0.0 · Btn_Marcha — toggle</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#cc3333"></div>
            <span style="font-size:10px;color:#6a4a4a;font-family:monospace">I0.1 · Btn_Emergencia (NC) — momentáneo</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#639922"></div>
            <span style="font-size:10px;color:var(--text-muted);font-family:monospace">Q0.0 · Motor</span>
          </div>
        </div>

      </div>
    `;

    _el.btnMarcha    = container.querySelector('#sc-btn-marcha');
    _el.btnMarchaCap = container.querySelector('#sc-btn-marcha-cap');
    _el.btnEmg       = container.querySelector('#sc-btn-emg');
    _el.btnEmgCap    = container.querySelector('#sc-btn-emg-cap');
    _el.motor        = container.querySelector('#sc-motor');
    _el.motorRing    = container.querySelector('#sc-motor-ring');
    _el.motorDot     = container.querySelector('#sc-motor-dot');
    _el.motorStatus  = container.querySelector('#sc-motor-status');
    _el.animFrame    = null;
    _el.angle        = 0;

    let _marchaOn = false;

    const toggleMarcha = () => {
      if (global.LLT.state.getMode() !== 'RUN') return;
      _marchaOn = !_marchaOn;
      global.LLT.state.setSignalValue('I0.0', _marchaOn);
      _el.btnMarcha.style.transform      = _marchaOn ? 'scale(0.95)' : 'scale(1)';
      _el.btnMarcha.style.borderColor    = _marchaOn ? '#3B6D11' : '#2a3a2a';
      _el.btnMarchaCap.style.background  = _marchaOn ? '#2a8a2a' : '#1a6a1a';
    };

    const pressEmg = (v) => {
      if (global.LLT.state.getMode() !== 'RUN') return;
      global.LLT.state.setSignalValue('I0.1', v);
      _el.btnEmg.style.transform    = v ? 'scale(0.92)' : 'scale(1)';
      _el.btnEmgCap.style.background = v ? '#4a0000' : '#8b0000';
    };

    _el.btnMarcha.addEventListener('click',      toggleMarcha);
    _el.btnMarcha.addEventListener('touchstart', (e) => { e.preventDefault(); toggleMarcha(); });

    _el.btnEmg.addEventListener('mousedown',  () => pressEmg(true));
    _el.btnEmg.addEventListener('mouseup',    () => pressEmg(false));
    _el.btnEmg.addEventListener('mouseleave', () => pressEmg(false));
    _el.btnEmg.addEventListener('touchstart', (e) => { e.preventDefault(); pressEmg(true); });
    _el.btnEmg.addEventListener('touchend',   () => pressEmg(false));
  }

  function update(signals, mode) {
    if (!_el.motor) return;
    const on = mode === 'RUN' && !!signals['Q0.0']?.value;

    _el.motor.style.background      = on ? '#0d1f0d' : '#1a1a1a';
    _el.motor.style.borderColor     = on ? '#2a4a2a' : '#2a2a2a';
    _el.motorRing.style.borderColor = on ? '#3B6D11' : '#2a2a2a';
    _el.motorDot.style.background   = on ? '#639922' : '#2a2a2a';
    _el.motorStatus.textContent     = on ? 'MOTOR EN MARCHA' : 'MOTOR DETENIDO';
    _el.motorStatus.style.color     = on ? '#639922' : '#3a4a3a';

    if (on && !_el.animFrame) {
      const spin = () => {
        if (!_el.motorDot) return;
        _el.angle = (_el.angle + 6) % 360;
        const r = 18;
        const x = Math.cos(_el.angle * Math.PI / 180) * r;
        const y = Math.sin(_el.angle * Math.PI / 180) * r;
        _el.motorDot.style.transform = `translate(${x}px, ${y}px)`;
        _el.animFrame = requestAnimationFrame(spin);
      };
      _el.animFrame = requestAnimationFrame(spin);
    } else if (!on && _el.animFrame) {
      cancelAnimationFrame(_el.animFrame);
      _el.animFrame = null;
      _el.motorDot.style.transform = 'translate(0,0)';
    }
  }

  function destroy() {
    if (_el.animFrame) cancelAnimationFrame(_el.animFrame);
    _el = {};
  }

  global.LLT.scenes['ex_02'] = { build, update, destroy };

}(window));