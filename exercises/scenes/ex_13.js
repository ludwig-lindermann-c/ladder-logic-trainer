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
        gap:20px;background:#0d110e;user-select:none;
      ">

        <div style="display:flex;align-items:stretch;gap:48px">

          <!-- EDIFICIO -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:0">

            <div style="display:flex;align-items:stretch;gap:0">

              <!-- Etiquetas pisos + luces piloto -->
              <div style="display:flex;flex-direction:column;width:60px">

                <!-- Piso 3 -->
                <div style="height:90px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px">
                  <div style="font-size:9px;font-family:monospace;color:#3a5a3a">PISO 3</div>
                  <div id="sc-luz3" style="width:14px;height:14px;border-radius:50%;background:#1a1a12;border:2px solid #2a2a1a;transition:background .15s,border-color .15s"></div>
                  <div style="font-size:8px;font-family:monospace;color:#27500A">Q0.4</div>
                </div>

                <!-- Piso 2 -->
                <div style="height:90px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px">
                  <div style="font-size:9px;font-family:monospace;color:#3a5a3a">PISO 2</div>
                  <div id="sc-luz2" style="width:14px;height:14px;border-radius:50%;background:#1a1a12;border:2px solid #2a2a1a;transition:background .15s,border-color .15s"></div>
                  <div style="font-size:8px;font-family:monospace;color:#27500A">Q0.3</div>
                </div>

                <!-- Piso 1 -->
                <div style="height:90px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px">
                  <div style="font-size:9px;font-family:monospace;color:#3a5a3a">PISO 1</div>
                  <div id="sc-luz1" style="width:14px;height:14px;border-radius:50%;background:#1a1a12;border:2px solid #2a2a1a;transition:background .15s,border-color .15s"></div>
                  <div style="font-size:8px;font-family:monospace;color:#27500A">Q0.2</div>
                </div>

              </div>

              <!-- Shaft del ascensor -->
              <div style="position:relative;width:80px;height:270px;border:2px solid #2a3a2a;background:#0a0f0a;overflow:hidden">

                <!-- Líneas de piso -->
                <div style="position:absolute;top:0;left:0;right:0;height:1px;background:#1a2a1a"></div>
                <div style="position:absolute;top:90px;left:0;right:0;height:1px;background:#1a2a1a"></div>
                <div style="position:absolute;top:180px;left:0;right:0;height:1px;background:#1a2a1a"></div>
                <div style="position:absolute;bottom:0;left:0;right:0;height:1px;background:#1a2a1a"></div>

                <!-- Sensores -->
                <div id="sc-sensor3" style="position:absolute;right:4px;top:40px;width:6px;height:6px;border-radius:50%;background:#1e2a1f;transition:background .15s"></div>
                <div style="position:absolute;right:12px;top:38px;font-size:7px;font-family:monospace;color:#2a4a2a">S6</div>
                <div id="sc-sensor2" style="position:absolute;right:4px;top:130px;width:6px;height:6px;border-radius:50%;background:#1e2a1f;transition:background .15s"></div>
                <div style="position:absolute;right:12px;top:128px;font-size:7px;font-family:monospace;color:#2a4a2a">S5</div>
                <div id="sc-sensor1" style="position:absolute;right:4px;top:220px;width:6px;height:6px;border-radius:50%;background:#1e2a1f;transition:background .15s"></div>
                <div style="position:absolute;right:12px;top:218px;font-size:7px;font-family:monospace;color:#2a4a2a">S4</div>

                <!-- Cable -->
                <div style="position:absolute;left:50%;width:2px;top:0;bottom:0;background:#1a2a1a;transform:translateX(-50%)"></div>

                <!-- Cabina — se mueve con translateY -->
                <!-- top=0 es piso 3, top=180 es piso 1 -->
                <div id="sc-cabin" style="
                  position:absolute;
                  left:8px;right:8px;
                  top:190px;
                  height:70px;
                  background:#1a2a1a;
                  border:2px solid #2a4a2a;
                  border-radius:3px;
                  transition:background .2s,border-color .2s;
                  z-index:2;
                ">
                  <div style="position:absolute;inset:5px;border:1px dashed #2a4a2a;border-radius:2px"></div>
                  <!-- Flecha dirección -->
                  <div id="sc-cabin-arrow" style="
                    position:absolute;top:50%;left:50%;
                    transform:translate(-50%,-50%);
                    font-size:16px;color:#2a4a2a;
                    transition:color .2s;
                  ">●</div>
                </div>

              </div>

            </div>

            <!-- Indicadores KM -->
            <div style="display:flex;gap:16px;margin-top:10px">
              <div style="display:flex;align-items:center;gap:4px">
                <div id="sc-led-km1" style="width:8px;height:8px;border-radius:50%;background:#1e2a1f;transition:background .15s"></div>
                <span style="font-size:9px;font-family:monospace;color:#3a4a3a">Q0.0 KM1 ↑</span>
              </div>
              <div style="display:flex;align-items:center;gap:4px">
                <div id="sc-led-km2" style="width:8px;height:8px;border-radius:50%;background:#1e2a1f;transition:background .15s"></div>
                <span style="font-size:9px;font-family:monospace;color:#3a4a3a">Q0.1 KM2 ↓</span>
              </div>
            </div>

          </div>

          <!-- BOTONERA -->
          <div style="display:flex;flex-direction:column;gap:16px;padding-top:20px">

            <div style="font-size:10px;font-family:monospace;color:#4a6a4a;letter-spacing:.08em;margin-bottom:4px">BOTONERA</div>

            <div style="display:flex;align-items:center;gap:10px">
              <div id="sc-btn-p3" style="width:48px;height:48px;border-radius:50%;background:#1a1a2a;border:3px solid #2a2a3a;display:flex;align-items:center;justify-content:center;cursor:pointer;box-sizing:border-box;transition:transform .08s">
                <div id="sc-btn-p3-cap" style="width:30px;height:30px;border-radius:50%;background:#1a1a6a;border:2px solid #2a2acc;transition:background .08s;pointer-events:none"></div>
              </div>
              <div>
                <div style="font-size:10px;font-family:monospace;color:#4a4a7a">Piso 3</div>
                <div style="font-size:9px;font-family:monospace;padding:1px 5px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5;display:inline-block;margin-top:2px">I0.2 · S3</div>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:10px">
              <div id="sc-btn-p2" style="width:48px;height:48px;border-radius:50%;background:#1a1a2a;border:3px solid #2a2a3a;display:flex;align-items:center;justify-content:center;cursor:pointer;box-sizing:border-box;transition:transform .08s">
                <div id="sc-btn-p2-cap" style="width:30px;height:30px;border-radius:50%;background:#1a1a6a;border:2px solid #2a2acc;transition:background .08s;pointer-events:none"></div>
              </div>
              <div>
                <div style="font-size:10px;font-family:monospace;color:#4a4a7a">Piso 2</div>
                <div style="font-size:9px;font-family:monospace;padding:1px 5px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5;display:inline-block;margin-top:2px">I0.1 · S2</div>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:10px">
              <div id="sc-btn-p1" style="width:48px;height:48px;border-radius:50%;background:#1a1a2a;border:3px solid #2a2a3a;display:flex;align-items:center;justify-content:center;cursor:pointer;box-sizing:border-box;transition:transform .08s">
                <div id="sc-btn-p1-cap" style="width:30px;height:30px;border-radius:50%;background:#1a1a6a;border:2px solid #2a2acc;transition:background .08s;pointer-events:none"></div>
              </div>
              <div>
                <div style="font-size:10px;font-family:monospace;color:#4a4a7a">Piso 1</div>
                <div style="font-size:9px;font-family:monospace;padding:1px 5px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5;display:inline-block;margin-top:2px">I0.0 · S1</div>
              </div>
            </div>

            <div id="sc-status" style="font-size:10px;font-family:monospace;color:#378ADD;letter-spacing:.06em;padding:6px 10px;border:1px solid #1e2a1f;border-radius:4px;max-width:160px;line-height:1.4;margin-top:8px">EN PISO 1</div>

          </div>

        </div>

        <!-- Leyenda -->
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#378ADD"></div>
            <span style="font-size:9px;color:#4a5a6a;font-family:monospace">S4-S6 · Sensores posición automáticos</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#ffe066"></div>
            <span style="font-size:9px;color:#5a5a4a;font-family:monospace">Q0.2-Q0.4 · Luces piloto piso</span>
          </div>
        </div>

      </div>
    `;

    _el.cabin      = container.querySelector('#sc-cabin');
    _el.cabinArrow = container.querySelector('#sc-cabin-arrow');
    _el.sensor1    = container.querySelector('#sc-sensor1');
    _el.sensor2    = container.querySelector('#sc-sensor2');
    _el.sensor3    = container.querySelector('#sc-sensor3');
    _el.luz1       = container.querySelector('#sc-luz1');
    _el.luz2       = container.querySelector('#sc-luz2');
    _el.luz3       = container.querySelector('#sc-luz3');
    _el.ledKm1     = container.querySelector('#sc-led-km1');
    _el.ledKm2     = container.querySelector('#sc-led-km2');
    _el.status     = container.querySelector('#sc-status');
    _el.btnP1      = container.querySelector('#sc-btn-p1');
    _el.btnP1Cap   = container.querySelector('#sc-btn-p1-cap');
    _el.btnP2      = container.querySelector('#sc-btn-p2');
    _el.btnP2Cap   = container.querySelector('#sc-btn-p2-cap');
    _el.btnP3      = container.querySelector('#sc-btn-p3');
    _el.btnP3Cap   = container.querySelector('#sc-btn-p3-cap');

    // cabinTop: 195=piso1, 105=piso2, 15=piso3
    _el.cabinTop   = 190;
    _el.animFrame  = null;

    const makeBtn = (btnEl, capEl, addr) => {
      const press = (v) => {
        if (global.LLT.state.getMode() !== 'RUN') return;
        global.LLT.state.setSignalValue(addr, v);
        btnEl.style.transform  = v ? 'scale(0.92)' : 'scale(1)';
        capEl.style.background = v ? '#0d0d4a' : '#1a1a6a';
      };
      btnEl.addEventListener('mousedown',  () => press(true));
      btnEl.addEventListener('mouseup',    () => press(false));
      btnEl.addEventListener('mouseleave', () => press(false));
      btnEl.addEventListener('touchstart', (e) => { e.preventDefault(); press(true); });
      btnEl.addEventListener('touchend',   () => press(false));
    };

    makeBtn(_el.btnP1, _el.btnP1Cap, 'I0.0');
    makeBtn(_el.btnP2, _el.btnP2Cap, 'I0.1');
    makeBtn(_el.btnP3, _el.btnP3Cap, 'I0.2');

    // Estado inicial — piso 1
    global.LLT.state.setSignalValue('I0.3', true);
    global.LLT.state.setSignalValue('I0.4', false);
    global.LLT.state.setSignalValue('I0.5', false);

    // Animación cabina
    const animate = () => {
      if (!_el.cabin) return;

      const sigs  = global.LLT.state.getSignals();
      const mode  = global.LLT.state.getMode();
      const km1On = mode === 'RUN' && !!sigs['Q0.0']?.value;
      const km2On = mode === 'RUN' && !!sigs['Q0.1']?.value;

      // Mover cabina — sube = top disminuye, baja = top aumenta
      if (km1On && _el.cabinTop > 10) {
        _el.cabinTop = Math.max(10,  _el.cabinTop - 0.5);
      } else if (km2On && _el.cabinTop < 190) {
        _el.cabinTop = Math.min(190, _el.cabinTop + 0.5);
      }

      _el.cabin.style.top = _el.cabinTop + 'px';

      // Sensores según posición cabina
      if (mode === 'RUN') {
        const atP1 = _el.cabinTop >= 188;
        const atP2 = _el.cabinTop >= 98 && _el.cabinTop <= 102;
        const atP3 = _el.cabinTop <= 12;

        if (atP1 !== !!sigs['I0.3']?.value) global.LLT.state.setSignalValue('I0.3', atP1);
        if (atP2 !== !!sigs['I0.4']?.value) global.LLT.state.setSignalValue('I0.4', atP2);
        if (atP3 !== !!sigs['I0.5']?.value) global.LLT.state.setSignalValue('I0.5', atP3);
      }

      _el.animFrame = requestAnimationFrame(animate);
    };
    _el.animFrame = requestAnimationFrame(animate);
  }

  function update(signals, mode) {
    if (!_el.cabin) return;

    const km1On = mode === 'RUN' && !!signals['Q0.0']?.value;
    const km2On = mode === 'RUN' && !!signals['Q0.1']?.value;
    const s1On  = !!signals['I0.3']?.value;
    const s2On  = !!signals['I0.4']?.value;
    const s3On  = !!signals['I0.5']?.value;
    const l1On  = mode === 'RUN' && !!signals['Q0.2']?.value;
    const l2On  = mode === 'RUN' && !!signals['Q0.3']?.value;
    const l3On  = mode === 'RUN' && !!signals['Q0.4']?.value;

    // Sensores
    _el.sensor1.style.background = s1On ? '#378ADD' : '#1e2a1f';
    _el.sensor2.style.background = s2On ? '#378ADD' : '#1e2a1f';
    _el.sensor3.style.background = s3On ? '#378ADD' : '#1e2a1f';

    // Luces piloto
    _el.luz1.style.background  = l1On ? '#ffe066' : '#1a1a12';
    _el.luz1.style.borderColor = l1On ? '#ba9500' : '#2a2a1a';
    _el.luz2.style.background  = l2On ? '#ffe066' : '#1a1a12';
    _el.luz2.style.borderColor = l2On ? '#ba9500' : '#2a2a1a';
    _el.luz3.style.background  = l3On ? '#ffe066' : '#1a1a12';
    _el.luz3.style.borderColor = l3On ? '#ba9500' : '#2a2a1a';

    // LEDs KM
    _el.ledKm1.style.background = km1On ? '#639922' : '#1e2a1f';
    _el.ledKm2.style.background = km2On ? '#ba9500' : '#1e2a1f';

    // Cabina color y flecha
    _el.cabin.style.background  = km1On ? '#0d2a0d' : km2On ? '#2a2a0d' : '#1a2a1a';
    _el.cabin.style.borderColor = km1On ? '#3B6D11' : km2On ? '#6a6a00' : '#2a4a2a';
    _el.cabinArrow.textContent  = km1On ? '▲' : km2On ? '▼' : '●';
    _el.cabinArrow.style.color  = km1On ? '#639922' : km2On ? '#ba9500' : '#2a4a2a';

    // Estado
    _el.status.textContent = km1On      ? 'SUBIENDO ▲'
                           : km2On      ? 'BAJANDO ▼'
                           : s3On       ? 'EN PISO 3'
                           : s2On       ? 'EN PISO 2'
                           : s1On       ? 'EN PISO 1'
                           : 'EN TRÁNSITO';
    _el.status.style.color = km1On ? '#639922'
                           : km2On ? '#ba9500'
                           : '#378ADD';
  }

  function destroy() {
    if (_el.animFrame) cancelAnimationFrame(_el.animFrame);
    _el = {};
  }

  global.LLT.scenes['ex_13'] = { build, update, destroy };

}(window));