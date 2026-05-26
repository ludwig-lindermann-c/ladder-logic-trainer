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
        gap:40px;background:#0d110e;user-select:none;
      ">

        <div style="display:flex;align-items:center;gap:60px">

          <!-- Detectores -->
          <div style="display:flex;flex-direction:column;gap:24px">

            <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
              <div style="font-size:10px;color:#4a6a7a;font-family:monospace;letter-spacing:.08em">Detector humo 1</div>
              <div id="sc-det1" style="
                width:56px;height:56px;border-radius:50%;
                background:#1a1a1a;border:3px solid #2a2a2a;
                display:flex;align-items:center;justify-content:center;
                cursor:pointer;box-sizing:border-box;transition:all .12s;
              ">
                <div id="sc-det1-led" style="
                  width:22px;height:22px;border-radius:50%;
                  background:#1a1a1a;border:2px solid #2a2a2a;
                  transition:all .12s;pointer-events:none;
                "></div>
              </div>
              <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.0 · toggle</div>
            </div>

            <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
              <div style="font-size:10px;color:#4a6a7a;font-family:monospace;letter-spacing:.08em">Detector humo 2</div>
              <div id="sc-det2" style="
                width:56px;height:56px;border-radius:50%;
                background:#1a1a1a;border:3px solid #2a2a2a;
                display:flex;align-items:center;justify-content:center;
                cursor:pointer;box-sizing:border-box;transition:all .12s;
              ">
                <div id="sc-det2-led" style="
                  width:22px;height:22px;border-radius:50%;
                  background:#1a1a1a;border:2px solid #2a2a2a;
                  transition:all .12s;pointer-events:none;
                "></div>
              </div>
              <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.1 · toggle</div>
            </div>

          </div>

          <!-- Sirena -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="font-size:10px;color:#4a6a4a;font-family:monospace;letter-spacing:.08em">Sirena</div>
            <div id="sc-sirena" style="
              width:100px;height:100px;
              background:#1a1a12;border:3px solid #2a2a1a;
              border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              transition:background .12s,border-color .12s;
              position:relative;
            ">
              <!-- Anillos concéntricos -->
              <div id="sc-ring1" style="
                width:70px;height:70px;border-radius:50%;
                border:2px solid #2a2a1a;
                display:flex;align-items:center;justify-content:center;
                transition:border-color .12s;
              ">
                <div id="sc-ring2" style="
                  width:40px;height:40px;border-radius:50%;
                  border:2px solid #2a2a1a;
                  display:flex;align-items:center;justify-content:center;
                  transition:border-color .12s;
                ">
                  <div id="sc-sirena-core" style="
                    width:16px;height:16px;border-radius:50%;
                    background:#2a2a1a;transition:background .12s;
                  "></div>
                </div>
              </div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#27500A;color:#97C459;border:1px solid #3B6D11">Q0.0 · Sirena</div>
            <div id="sc-sirena-status" style="font-size:10px;font-family:monospace;color:#3a4a3a;transition:color .15s">SILENCIO</div>
          </div>

        </div>

        <!-- Leyenda -->
        <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#378ADD"></div>
            <span style="font-size:10px;color:#4a5a6a;font-family:monospace">I0.0 · Detector_1 — toggle</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#378ADD"></div>
            <span style="font-size:10px;color:#4a5a6a;font-family:monospace">I0.1 · Detector_2 — toggle</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#639922"></div>
            <span style="font-size:10px;color:#4a5a4a;font-family:monospace">Q0.0 · Sirena</span>
          </div>
        </div>

      </div>
    `;

    _el.det1       = container.querySelector('#sc-det1');
    _el.det1Led    = container.querySelector('#sc-det1-led');
    _el.det2       = container.querySelector('#sc-det2');
    _el.det2Led    = container.querySelector('#sc-det2-led');
    _el.sirena     = container.querySelector('#sc-sirena');
    _el.ring1      = container.querySelector('#sc-ring1');
    _el.ring2      = container.querySelector('#sc-ring2');
    _el.sirenaCore = container.querySelector('#sc-sirena-core');
    _el.sirenaStatus = container.querySelector('#sc-sirena-status');
    _el.animFrame  = null;
    _el.pulse      = 0;

    let _det1On = false;
    let _det2On = false;

    const toggleDet = (addr, on, btnEl, ledEl) => {
      if (global.LLT.state.getMode() !== 'RUN') return;
      global.LLT.state.setSignalValue(addr, on);
      btnEl.style.borderColor = on ? '#cc3333' : '#2a2a2a';
      btnEl.style.background  = on ? '#2a0d0d' : '#1a1a1a';
      ledEl.style.background  = on ? '#cc3333' : '#1a1a1a';
      ledEl.style.borderColor = on ? '#ff6666' : '#2a2a2a';
    };

    _el.det1.addEventListener('click', () => {
      _det1On = !_det1On;
      toggleDet('I0.0', _det1On, _el.det1, _el.det1Led);
    });
    _el.det2.addEventListener('click', () => {
      _det2On = !_det2On;
      toggleDet('I0.1', _det2On, _el.det2, _el.det2Led);
    });
  }

  function update(signals, mode) {
    if (!_el.sirena) return;
    const on = mode === 'RUN' && !!signals['Q0.0']?.value;

    _el.sirena.style.background     = on ? '#2a1a00' : '#1a1a12';
    _el.sirena.style.borderColor    = on ? '#cc7700' : '#2a2a1a';
    _el.ring1.style.borderColor     = on ? '#aa5500' : '#2a2a1a';
    _el.ring2.style.borderColor     = on ? '#884400' : '#2a2a1a';
    _el.sirenaCore.style.background = on ? '#ffaa00' : '#2a2a1a';
    _el.sirenaStatus.textContent    = on ? 'ALARMA ACTIVA' : 'SILENCIO';
    _el.sirenaStatus.style.color    = on ? '#ffaa00' : '#3a4a3a';

    if (on && !_el.animFrame) {
      const pulse = () => {
        if (!_el.sirena) return;
        _el.pulse = (_el.pulse + 0.15) % (Math.PI * 2);
        const scale = 1 + Math.sin(_el.pulse) * 0.06;
        _el.sirena.style.transform = `scale(${scale})`;
        _el.animFrame = requestAnimationFrame(pulse);
      };
      _el.animFrame = requestAnimationFrame(pulse);
    } else if (!on && _el.animFrame) {
      cancelAnimationFrame(_el.animFrame);
      _el.animFrame = null;
      _el.sirena.style.transform = 'scale(1)';
    }
  }

  function destroy() {
    if (_el.animFrame) cancelAnimationFrame(_el.animFrame);
    _el = {};
  }

  global.LLT.scenes['ex_04'] = { build, update, destroy };

}(window));