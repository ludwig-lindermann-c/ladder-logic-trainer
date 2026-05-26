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

          <!-- Sensores -->
          <div style="display:flex;flex-direction:column;gap:24px">

            <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
              <div style="font-size:10px;color:#4a6a7a;font-family:monospace;letter-spacing:.08em">Sensor posición</div>
              <div id="sc-sens-pos" style="
                width:56px;height:56px;border-radius:8px;
                background:#1a1a2a;border:3px solid #2a2a3a;
                display:flex;align-items:center;justify-content:center;
                cursor:pointer;box-sizing:border-box;transition:all .12s;
              ">
                <div id="sc-sens-pos-led" style="
                  width:20px;height:20px;border-radius:50%;
                  background:#1a1a2a;border:2px solid #2a2a3a;
                  transition:all .12s;pointer-events:none;
                "></div>
              </div>
              <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.0 · toggle</div>
            </div>

            <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
              <div style="font-size:10px;color:#4a6a7a;font-family:monospace;letter-spacing:.08em">Sensor seguridad</div>
              <div id="sc-sens-seg" style="
                width:56px;height:56px;border-radius:8px;
                background:#1a1a2a;border:3px solid #2a2a3a;
                display:flex;align-items:center;justify-content:center;
                cursor:pointer;box-sizing:border-box;transition:all .12s;
              ">
                <div id="sc-sens-seg-led" style="
                  width:20px;height:20px;border-radius:50%;
                  background:#1a1a2a;border:2px solid #2a2a3a;
                  transition:all .12s;pointer-events:none;
                "></div>
              </div>
              <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.1 · toggle</div>
            </div>

          </div>

          <!-- Puerta -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="font-size:10px;color:#4a6a4a;font-family:monospace;letter-spacing:.08em">Válvula / Puerta</div>
            <div style="
              width:120px;height:120px;
              background:#111811;border:2px solid #1e2a1f;
              border-radius:8px;position:relative;
              overflow:hidden;display:flex;
              align-items:center;justify-content:center;
            ">
              <!-- Marco puerta -->
              <div style="
                width:70px;height:90px;
                border:3px solid #2a3a2a;
                border-radius:4px;position:relative;
                background:#0d110e;
              ">
                <!-- Hoja puerta izquierda -->
                <div id="sc-door-left" style="
                  position:absolute;left:0;top:0;
                  width:50%;height:100%;
                  background:#1e2e1e;border-right:1px solid #2a3a2a;
                  transform-origin:left center;
                  transition:transform .4s ease;
                "></div>
                <!-- Hoja puerta derecha -->
                <div id="sc-door-right" style="
                  position:absolute;right:0;top:0;
                  width:50%;height:100%;
                  background:#1e2e1e;border-left:1px solid #2a3a2a;
                  transform-origin:right center;
                  transition:transform .4s ease;
                "></div>
              </div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#27500A;color:#97C459;border:1px solid #3B6D11">Q0.0 · Valvula_Puerta</div>
            <div id="sc-door-status" style="font-size:10px;font-family:monospace;color:#3a4a3a;transition:color .15s">CERRADA</div>
          </div>

        </div>

        <!-- Leyenda -->
        <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#378ADD"></div>
            <span style="font-size:10px;color:#4a5a6a;font-family:monospace">I0.0 · Sensor_Posicion — toggle</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#378ADD"></div>
            <span style="font-size:10px;color:#4a5a6a;font-family:monospace">I0.1 · Sensor_Seguridad — toggle</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#639922"></div>
            <span style="font-size:10px;color:#4a5a4a;font-family:monospace">Q0.0 · Valvula_Puerta</span>
          </div>
        </div>

      </div>
    `;

    _el.sensPos     = container.querySelector('#sc-sens-pos');
    _el.sensPosLed  = container.querySelector('#sc-sens-pos-led');
    _el.sensSeg     = container.querySelector('#sc-sens-seg');
    _el.sensSegLed  = container.querySelector('#sc-sens-seg-led');
    _el.doorLeft    = container.querySelector('#sc-door-left');
    _el.doorRight   = container.querySelector('#sc-door-right');
    _el.doorStatus  = container.querySelector('#sc-door-status');

    let _posOn = false;
    let _segOn = false;

    const toggleSensor = (addr, on, btnEl, ledEl) => {
      if (global.LLT.state.getMode() !== 'RUN') return;
      global.LLT.state.setSignalValue(addr, on);
      btnEl.style.borderColor = on ? '#185FA5' : '#2a2a3a';
      btnEl.style.background  = on ? '#0d1f3a' : '#1a1a2a';
      ledEl.style.background  = on ? '#378ADD' : '#1a1a2a';
      ledEl.style.borderColor = on ? '#85B7EB' : '#2a2a3a';
    };

    _el.sensPos.addEventListener('click', () => {
      _posOn = !_posOn;
      toggleSensor('I0.0', _posOn, _el.sensPos, _el.sensPosLed);
    });
    _el.sensSeg.addEventListener('click', () => {
      _segOn = !_segOn;
      toggleSensor('I0.1', _segOn, _el.sensSeg, _el.sensSegLed);
    });
  }

  function update(signals, mode) {
    if (!_el.doorLeft) return;
    const open = mode === 'RUN' && !!signals['Q0.0']?.value;
    _el.doorLeft.style.transform  = open ? 'scaleX(0.1)' : 'scaleX(1)';
    _el.doorRight.style.transform = open ? 'scaleX(0.1)' : 'scaleX(1)';
    _el.doorStatus.textContent    = open ? 'ABIERTA' : 'CERRADA';
    _el.doorStatus.style.color    = open ? '#639922' : '#3a4a3a';
  }

  function destroy() { _el = {}; }

  global.LLT.scenes['ex_03'] = { build, update, destroy };

}(window));