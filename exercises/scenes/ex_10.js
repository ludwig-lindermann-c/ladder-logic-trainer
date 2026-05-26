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
        gap:28px;background:#0d110e;user-select:none;
      ">

        <!-- Banda con sensor -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <div style="font-size:10px;color:#4a6a4a;font-family:monospace;letter-spacing:.08em">Línea de producción</div>

          <div style="position:relative;width:420px;height:90px">

            <div style="
              position:absolute;bottom:0;left:20px;right:20px;
              height:18px;background:#1a2a1a;border-radius:2px;
              border:1px solid #2a3a2a;
            "></div>

            <div style="
              position:absolute;bottom:0;left:8px;
              width:22px;height:22px;border-radius:50%;
              background:#1e2a1f;border:2px solid #2a3a2a;
            "></div>

            <div style="
              position:absolute;bottom:0;right:8px;
              width:22px;height:22px;border-radius:50%;
              background:#1e2a1f;border:2px solid #2a3a2a;
            "></div>

            <div style="
              position:absolute;bottom:16px;right:80px;
              width:4px;height:30px;
              background:#185FA5;border-radius:2px;
            "></div>
            <div style="
              position:absolute;bottom:48px;right:68px;
              font-size:8px;font-family:monospace;color:#378ADD;
            ">I0.0</div>

            <div id="sc-box" style="
              position:absolute;bottom:20px;left:20px;
              width:52px;height:46px;
              background:#2a2a1a;border:2px solid #3a3a2a;
              border-radius:3px;
            ">
              <div style="
                position:absolute;top:5px;left:5px;right:5px;bottom:5px;
                border:1px dashed #3a3a2a;border-radius:2px;
              "></div>
            </div>

          </div>
        </div>

        <div style="display:flex;align-items:center;gap:40px">

          <!-- Display contador -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
            <div style="font-size:9px;font-family:monospace;color:#3a4a3a;letter-spacing:.08em">CONTADOR</div>
            <div style="
              padding:10px 20px;
              background:#0d1f0d;border:2px solid #1a3a1a;
              border-radius:6px;
            ">
              <div style="display:flex;align-items:baseline;gap:6px">
                <div id="sc-cv" style="font-size:32px;font-family:monospace;color:#639922;min-width:40px;text-align:right">0</div>
                <div style="font-size:14px;font-family:monospace;color:#3a5a3a">/</div>
                <div id="sc-pv" style="font-size:32px;font-family:monospace;color:#3a5a3a;min-width:40px">10</div>
              </div>
              <div style="font-size:9px;font-family:monospace;color:#2a4a2a;text-align:center;margin-top:2px">CV / PV</div>
            </div>
          </div>

          <!-- Luz lote completo -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="font-size:10px;color:#4a6a4a;font-family:monospace;letter-spacing:.08em">Lote completo</div>
            <div id="sc-luz-lote" style="
              width:64px;height:64px;border-radius:50%;
              background:#1a1a12;border:3px solid #2a2a1a;
              display:flex;align-items:center;justify-content:center;
              transition:background .12s,border-color .12s;
            ">
              <div id="sc-luz-lote-inner" style="
                width:40px;height:40px;border-radius:50%;
                background:#2a2a18;transition:background .12s;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#27500A;color:#97C459;border:1px solid #3B6D11">Q0.0 · Luz_Lote</div>
          </div>

          <!-- Botón reset -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="font-size:10px;color:#6a4a2a;font-family:monospace;letter-spacing:.08em">Reset</div>
            <div id="sc-btn-reset" style="
              width:58px;height:58px;border-radius:50%;
              background:#2a1a0d;border:3px solid #3a2a1a;
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;box-sizing:border-box;transition:transform .08s;
            ">
              <div id="sc-btn-reset-cap" style="
                width:36px;height:36px;border-radius:50%;
                background:#8b4a00;border:2px solid #cc6a00;
                transition:background .08s;pointer-events:none;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.1 · momentáneo</div>
          </div>

        </div>

        <!-- Indicador sensor -->
        <div style="display:flex;align-items:center;gap:8px;padding:6px 14px;border:1px solid #1e2a1f;border-radius:6px">
          <div id="sc-sensor-led" style="width:8px;height:8px;border-radius:50%;background:#1e2a1f;transition:background .1s"></div>
          <span style="font-size:10px;font-family:monospace;color:#3a4a3a">Sensor I0.0 — activo mientras la caja está frente al sensor</span>
        </div>

        <!-- Leyenda -->
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#378ADD"></div>
            <span style="font-size:10px;color:#4a5a6a;font-family:monospace">I0.0 · Sensor_Pieza — automático</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#8b4a00"></div>
            <span style="font-size:10px;color:#5a4a3a;font-family:monospace">I0.1 · Btn_Reset — momentáneo</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#639922"></div>
            <span style="font-size:10px;color:#4a5a4a;font-family:monospace">Q0.0 · Luz_Lote_Completo</span>
          </div>
        </div>

      </div>
    `;

    _el.box          = container.querySelector('#sc-box');
    _el.cv           = container.querySelector('#sc-cv');
    _el.pv           = container.querySelector('#sc-pv');
    _el.luzLote      = container.querySelector('#sc-luz-lote');
    _el.luzLoteInner = container.querySelector('#sc-luz-lote-inner');
    _el.btnReset     = container.querySelector('#sc-btn-reset');
    _el.btnResetCap  = container.querySelector('#sc-btn-reset-cap');
    _el.sensorLed    = container.querySelector('#sc-sensor-led');
    _el.animFrame    = null;
    _el.boxPos       = 20;

    // Botón reset
    const pressReset = (v) => {
      if (global.LLT.state.getMode() !== 'RUN') return;
      global.LLT.state.setSignalValue('I0.1', v);
      _el.btnReset.style.transform     = v ? 'scale(0.92)' : 'scale(1)';
      _el.btnResetCap.style.background = v ? '#5a2a00' : '#8b4a00';
    };

    _el.btnReset.addEventListener('mousedown',  () => pressReset(true));
    _el.btnReset.addEventListener('mouseup',    () => pressReset(false));
    _el.btnReset.addEventListener('mouseleave', () => pressReset(false));
    _el.btnReset.addEventListener('touchstart', (e) => { e.preventDefault(); pressReset(true); });
    _el.btnReset.addEventListener('touchend',   () => pressReset(false));

    // Animación continua — I0.0 activo mientras la caja está frente al sensor
    const SENSOR_X  = 336;
    const BOX_WIDTH = 52;

    const moveBox = () => {
      if (!_el.box) return;
      _el.boxPos += 0.8;
      if (_el.boxPos > 360) _el.boxPos = 20;
      _el.box.style.left = _el.boxPos + 'px';

      const inSensor = (_el.boxPos + BOX_WIDTH) >= SENSOR_X && _el.boxPos <= (SENSOR_X + 4);

      if (global.LLT.state.getMode() === 'RUN') {
        const current = global.LLT.state.getSignalValue('I0.0');
        if (inSensor !== current) {
          global.LLT.state.setSignalValue('I0.0', inSensor);
        }
      }

      _el.animFrame = requestAnimationFrame(moveBox);
    };
    _el.animFrame = requestAnimationFrame(moveBox);
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
    if (!_el.luzLote) return;

    const loteOn = mode === 'RUN' && !!signals['Q0.0']?.value;

    const ctrCell = _findCounterCell('C0');
    if (ctrCell) {
      _el.cv.textContent = ctrCell.count  || 0;
      _el.pv.textContent = ctrCell.preset || 10;
      _el.cv.style.color = loteOn ? '#ffe066' : '#639922';
    }

    _el.luzLote.style.background      = loteOn ? '#7a6200' : '#1a1a12';
    _el.luzLote.style.borderColor     = loteOn ? '#ba9500' : '#2a2a1a';
    _el.luzLoteInner.style.background = loteOn ? '#ffe066' : '#2a2a18';

    const sensorOn = mode === 'RUN' && !!signals['I0.0']?.value;
    if (_el.sensorLed) {
      _el.sensorLed.style.background = sensorOn ? '#378ADD' : '#1e2a1f';
    }
  }

  function destroy() {
    if (_el.animFrame) cancelAnimationFrame(_el.animFrame);
    _el = {};
  }

  global.LLT.scenes['ex_10'] = { build, update, destroy };

}(window));