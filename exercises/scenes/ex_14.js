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

        <div style="display:flex;align-items:flex-start;gap:40px">

          <!-- PUENTE GRÚA -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:0">

            <!-- Viga superior con riel -->
            <div style="position:relative;width:320px;height:20px">
              <div style="position:absolute;inset:0;background:#1a2a1a;border:2px solid #2a3a2a;border-radius:3px"></div>
              <div style="position:absolute;left:8px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:2px">
                <div id="sc-s3" style="width:8px;height:8px;border-radius:50%;background:#1e2a1f;transition:background .15s"></div>
                <div style="font-size:7px;font-family:monospace;color:#2a4a2a">S3</div>
              </div>
              <div style="position:absolute;right:8px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:2px">
                <div id="sc-s4" style="width:8px;height:8px;border-radius:50%;background:#1e2a1f;transition:background .15s"></div>
                <div style="font-size:7px;font-family:monospace;color:#2a4a2a">S4</div>
              </div>
              <div id="sc-trolley" style="
                position:absolute;top:-4px;left:20px;
                width:30px;height:28px;
                background:#1e2e1e;border:2px solid #2a4a2a;
                border-radius:3px;transition:background .2s,border-color .2s;
              "></div>
            </div>

            <!-- Área de trabajo -->
            <div style="position:relative;width:320px;height:200px">
              <div style="position:absolute;left:0;top:0;bottom:0;width:12px;background:#1a2a1a;border:1px solid #2a3a2a;border-radius:2px"></div>
              <div style="position:absolute;right:0;top:0;bottom:0;width:12px;background:#1a2a1a;border:1px solid #2a3a2a;border-radius:2px"></div>
              <div id="sc-cable" style="position:absolute;left:29px;top:0;width:2px;height:160px;background:#2a3a2a;transition:height .05s linear;"></div>
              <div id="sc-hook" style="position:absolute;left:20px;top:158px;width:20px;height:20px;transition:top .05s linear,left .05s linear;">
                <div style="width:20px;height:14px;background:#1e2e1e;border:2px solid #2a4a2a;border-radius:3px;position:relative;">
                  <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:6px;height:6px;border:2px solid #2a4a2a;border-radius:50% 50% 50% 0;border-top:none;"></div>
                </div>
              </div>
              <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:2px">
                <div id="sc-s1" style="width:8px;height:8px;border-radius:50%;background:#1e2a1f;transition:background .15s"></div>
                <div style="font-size:7px;font-family:monospace;color:#2a4a2a">S1</div>
              </div>
              <div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:2px">
                <div id="sc-s2" style="width:8px;height:8px;border-radius:50%;background:#1e2a1f;transition:background .15s"></div>
                <div style="font-size:7px;font-family:monospace;color:#2a4a2a">S2</div>
              </div>
              <div style="position:absolute;left:26px;top:20px;width:2px;height:160px;border-left:1px dashed #1a2a1a"></div>
              <div style="position:absolute;left:26px;top:20px;height:2px;width:268px;border-top:1px dashed #1a2a1a"></div>
              <div style="position:absolute;right:26px;top:20px;width:2px;height:160px;border-left:1px dashed #1a2a1a"></div>
            </div>

          </div>

          <!-- PANEL CONTROL -->
          <div style="display:flex;flex-direction:column;gap:12px;padding-top:10px">

            <!-- Botón Start -->
            <div style="display:flex;align-items:center;gap:10px">
              <div id="sc-btn-start" style="
                width:54px;height:54px;border-radius:50%;
                background:#1a2a1a;border:3px solid #2a3a2a;
                display:flex;align-items:center;justify-content:center;
                cursor:pointer;box-sizing:border-box;transition:transform .08s;
              ">
                <div id="sc-btn-start-cap" style="
                  width:34px;height:34px;border-radius:50%;
                  background:#1a6a1a;border:2px solid #2a8a2a;
                  transition:background .08s;pointer-events:none;
                "></div>
              </div>
              <div>
                <div style="font-size:10px;font-family:monospace;color:#4a6a4a">START</div>
                <div style="font-size:9px;font-family:monospace;padding:1px 5px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5;display:inline-block;margin-top:2px">I0.0 · momentáneo</div>
              </div>
            </div>

            <!-- Contactores -->
            <div style="display:flex;flex-direction:column;gap:4px;padding:8px;border:1px solid #1e2a1f;border-radius:6px">
              <div style="font-size:9px;font-family:monospace;color:#2a4a2a;letter-spacing:.08em;margin-bottom:2px">CONTACTORES</div>
              <div style="display:flex;align-items:center;gap:6px">
                <div id="sc-led-km1" style="width:8px;height:8px;border-radius:50%;background:#1e2a1f;transition:background .15s"></div>
                <span style="font-size:9px;font-family:monospace;color:#3a4a3a">Q0.0 · KM1 Sube</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <div id="sc-led-km2" style="width:8px;height:8px;border-radius:50%;background:#1e2a1f;transition:background .15s"></div>
                <span style="font-size:9px;font-family:monospace;color:#3a4a3a">Q0.1 · KM2 Baja</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <div id="sc-led-km3" style="width:8px;height:8px;border-radius:50%;background:#1e2a1f;transition:background .15s"></div>
                <span style="font-size:9px;font-family:monospace;color:#3a4a3a">Q0.2 · KM3 Izquierda</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <div id="sc-led-km4" style="width:8px;height:8px;border-radius:50%;background:#1e2a1f;transition:background .15s"></div>
                <span style="font-size:9px;font-family:monospace;color:#3a4a3a">Q0.3 · KM4 Derecha</span>
              </div>
            </div>

            <!-- Visor contador ciclos -->
            <div style="display:flex;flex-direction:column;gap:4px;padding:8px;border:1px solid #1e2a1f;border-radius:6px">
              <div style="font-size:9px;font-family:monospace;color:#2a4a2a;letter-spacing:.08em;margin-bottom:2px">CONTADOR CICLOS — C0</div>
              <div style="display:flex;gap:16px;align-items:baseline">
                <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
                  <div style="font-size:8px;font-family:monospace;color:#3a4a3a">CV</div>
                  <div id="sc-cv" style="font-size:22px;font-family:monospace;color:#639922;min-width:36px;text-align:center">0</div>
                </div>
                <div style="font-size:14px;font-family:monospace;color:#2a4a2a">/</div>
                <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
                  <div style="font-size:8px;font-family:monospace;color:#3a4a3a">PV</div>
                  <div id="sc-pv" style="font-size:22px;font-family:monospace;color:#3a5a3a;min-width:36px;text-align:center">—</div>
                </div>
              </div>
              <!-- Luz límite de uso -->
              <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
                <div id="sc-luz-limite" style="
                  width:16px;height:16px;border-radius:50%;
                  background:#1a0d0d;border:2px solid #2a1a1a;
                  transition:background .15s,border-color .15s;
                "></div>
                <span style="font-size:9px;font-family:monospace;color:#3a4a3a">Q0.4 · Límite de uso</span>
              </div>
            </div>

            <!-- Fase y estado -->
            <div style="display:flex;flex-direction:column;gap:3px;padding:8px;border:1px solid #1e2a1f;border-radius:6px">
              <div id="sc-fase" style="font-size:10px;font-family:monospace;color:#3a4a3a;letter-spacing:.06em">EN ESPERA</div>
              <div id="sc-status" style="font-size:10px;font-family:monospace;color:#378ADD;letter-spacing:.06em">ABAJO / IZQ</div>
            </div>

          </div>

        </div>

        <!-- Leyenda -->
        <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#378ADD"></div>
            <span style="font-size:9px;color:#4a5a6a;font-family:monospace">S1-S4 · Sensores automáticos</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#639922"></div>
            <span style="font-size:9px;color:#4a5a4a;font-family:monospace">KM1↑ KM2↓ KM3← KM4→</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#cc3333"></div>
            <span style="font-size:9px;color:#5a4a4a;font-family:monospace">Q0.4 · Límite de uso</span>
          </div>
        </div>

      </div>
    `;

    _el.trolley     = container.querySelector('#sc-trolley');
    _el.hook        = container.querySelector('#sc-hook');
    _el.cable       = container.querySelector('#sc-cable');
    _el.s1          = container.querySelector('#sc-s1');
    _el.s2          = container.querySelector('#sc-s2');
    _el.s3          = container.querySelector('#sc-s3');
    _el.s4          = container.querySelector('#sc-s4');
    _el.ledKm1      = container.querySelector('#sc-led-km1');
    _el.ledKm2      = container.querySelector('#sc-led-km2');
    _el.ledKm3      = container.querySelector('#sc-led-km3');
    _el.ledKm4      = container.querySelector('#sc-led-km4');
    _el.fase        = container.querySelector('#sc-fase');
    _el.status      = container.querySelector('#sc-status');
    _el.cv          = container.querySelector('#sc-cv');
    _el.pv          = container.querySelector('#sc-pv');
    _el.luzLimite   = container.querySelector('#sc-luz-limite');
    _el.btnStart    = container.querySelector('#sc-btn-start');
    _el.btnStartCap = container.querySelector('#sc-btn-start-cap');
    _el.animFrame   = null;
    _el.hookX       = 20;
    _el.hookY       = 168;

    const press = (v) => {
      if (global.LLT.state.getMode() !== 'RUN') return;
      global.LLT.state.setSignalValue('I0.0', v);
      _el.btnStart.style.transform     = v ? 'scale(0.92)' : 'scale(1)';
      _el.btnStartCap.style.background = v ? '#0d4a0d' : '#1a6a1a';
    };

    _el.btnStart.addEventListener('mousedown',  () => press(true));
    _el.btnStart.addEventListener('mouseup',    () => press(false));
    _el.btnStart.addEventListener('mouseleave', () => press(false));
    _el.btnStart.addEventListener('touchstart', (e) => { e.preventDefault(); press(true); });
    _el.btnStart.addEventListener('touchend',   () => press(false));

    global.LLT.state.setSignalValue('I0.1', true);
    global.LLT.state.setSignalValue('I0.2', false);
    global.LLT.state.setSignalValue('I0.3', true);
    global.LLT.state.setSignalValue('I0.4', false);

    const SPEED_V = 0.6;
    const SPEED_H = 0.8;
    const LEFT_X  = 20;
    const RIGHT_X = 270;
    const TOP_Y   = 20;
    const BOT_Y   = 168;

    const animate = () => {
      if (!_el.hook) return;

      const sigs  = global.LLT.state.getSignals();
      const mode  = global.LLT.state.getMode();
      const km1On = mode === 'RUN' && !!sigs['Q0.0']?.value;
      const km2On = mode === 'RUN' && !!sigs['Q0.1']?.value;
      const km3On = mode === 'RUN' && !!sigs['Q0.2']?.value;
      const km4On = mode === 'RUN' && !!sigs['Q0.3']?.value;

      if (km1On && _el.hookY > TOP_Y) _el.hookY = Math.max(TOP_Y, _el.hookY - SPEED_V);
      if (km2On && _el.hookY < BOT_Y) _el.hookY = Math.min(BOT_Y, _el.hookY + SPEED_V);
      if (km4On && _el.hookX < RIGHT_X) _el.hookX = Math.min(RIGHT_X, _el.hookX + SPEED_H);
      if (km3On && _el.hookX > LEFT_X)  _el.hookX = Math.max(LEFT_X,  _el.hookX - SPEED_H);

      _el.hook.style.top  = _el.hookY + 'px';
      _el.hook.style.left = _el.hookX + 'px';
      _el.cable.style.height = _el.hookY + 'px';
      _el.cable.style.left   = (_el.hookX + 9) + 'px';
      _el.trolley.style.left = (_el.hookX - 5) + 'px';

      if (mode === 'RUN') {
        const atAbajo     = _el.hookY >= BOT_Y - 2;
        const atArriba    = _el.hookY <= TOP_Y + 2;
        const atIzquierda = _el.hookX <= LEFT_X  + 2;
        const atDerecha   = _el.hookX >= RIGHT_X - 2;

        if (atAbajo     !== !!sigs['I0.1']?.value) global.LLT.state.setSignalValue('I0.1', atAbajo);
        if (atArriba    !== !!sigs['I0.2']?.value) global.LLT.state.setSignalValue('I0.2', atArriba);
        if (atIzquierda !== !!sigs['I0.3']?.value) global.LLT.state.setSignalValue('I0.3', atIzquierda);
        if (atDerecha   !== !!sigs['I0.4']?.value) global.LLT.state.setSignalValue('I0.4', atDerecha);
      }

      _el.animFrame = requestAnimationFrame(animate);
    };
    _el.animFrame = requestAnimationFrame(animate);
  }

  function _findCounterCell(address) {
    const rungs = global.LLT.state.getRungs();
    for (const rung of rungs) {
      for (const el of rung.elements) {
        if (el.address === address && el.count !== undefined) return el;
        if (el.rows) {
          for (const row of el.rows) {
            for (const cell of row) {
              if (cell.address === address && cell.count !== undefined) return cell;
            }
          }
        }
      }
    }
    return null;
  }

  function update(signals, mode) {
    if (!_el.hook) return;

    const km1On   = mode === 'RUN' && !!signals['Q0.0']?.value;
    const km2On   = mode === 'RUN' && !!signals['Q0.1']?.value;
    const km3On   = mode === 'RUN' && !!signals['Q0.2']?.value;
    const km4On   = mode === 'RUN' && !!signals['Q0.3']?.value;
    const limiteOn= mode === 'RUN' && !!signals['Q0.4']?.value;
    const s1On    = !!signals['I0.1']?.value;
    const s2On    = !!signals['I0.2']?.value;
    const s3On    = !!signals['I0.3']?.value;
    const s4On    = !!signals['I0.4']?.value;

    _el.s1.style.background = s1On ? '#378ADD' : '#1e2a1f';
    _el.s2.style.background = s2On ? '#378ADD' : '#1e2a1f';
    _el.s3.style.background = s3On ? '#378ADD' : '#1e2a1f';
    _el.s4.style.background = s4On ? '#378ADD' : '#1e2a1f';

    _el.ledKm1.style.background = km1On ? '#639922' : '#1e2a1f';
    _el.ledKm2.style.background = km2On ? '#ba9500' : '#1e2a1f';
    _el.ledKm3.style.background = km3On ? '#378ADD' : '#1e2a1f';
    _el.ledKm4.style.background = km4On ? '#378ADD' : '#1e2a1f';

    const moving = km1On || km2On || km3On || km4On;
    _el.trolley.style.background  = moving ? '#0d2a0d' : '#1e2e1e';
    _el.trolley.style.borderColor = moving ? '#3B6D11' : '#2a4a2a';

    // Contador C0
    const ctr = _findCounterCell('C0');
    if (ctr) {
      _el.cv.textContent = ctr.count  || 0;
      _el.pv.textContent = ctr.preset || '—';
      _el.cv.style.color = limiteOn ? '#cc3333' : '#639922';
    }

    // Luz límite
    _el.luzLimite.style.background  = limiteOn ? '#cc3333' : '#1a0d0d';
    _el.luzLimite.style.borderColor = limiteOn ? '#ff6666' : '#2a1a1a';

    // Fase
    const m = signals;
    _el.fase.textContent = !!m['M0.0']?.value ? 'FASE 1 — Subiendo ▲'
                         : !!m['M0.1']?.value ? 'FASE 2 — Derecha →'
                         : !!m['M0.2']?.value ? 'FASE 3 — Bajando ▼'
                         : !!m['M0.3']?.value ? 'FASE 4 — Subiendo ▲'
                         : !!m['M0.4']?.value ? 'FASE 5 — Izquierda ←'
                         : !!m['M0.5']?.value ? 'FASE 6 — Bajando ▼'
                         : moving ? 'EN MOVIMIENTO'
                         : limiteOn ? 'LÍMITE ALCANZADO'
                         : 'EN ESPERA';
    _el.fase.style.color = km1On ? '#639922'
                         : km2On ? '#ba9500'
                         : km3On || km4On ? '#378ADD'
                         : limiteOn ? '#cc3333'
                         : '#3a4a3a';

    const posV = s2On ? 'ARRIBA' : s1On ? 'ABAJO' : '···';
    const posH = s3On ? 'IZQ'    : s4On ? 'DER'   : '···';
    _el.status.textContent = `${posV} / ${posH}`;
    _el.status.style.color = moving ? '#639922' : '#378ADD';
  }

  function destroy() {
    if (_el.animFrame) cancelAnimationFrame(_el.animFrame);
    _el = {};
  }

  global.LLT.scenes['ex_14'] = { build, update, destroy };

}(window));