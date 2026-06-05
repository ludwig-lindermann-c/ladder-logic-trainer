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
        gap:24px;background:var(--clr-bg-deep);user-select:none;
      ">

        <div style="display:flex;align-items:flex-start;gap:48px">

          <!-- HORNO -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="font-size:10px;font-family:monospace;color:var(--text-secondary);letter-spacing:.08em">HORNO INDUSTRIAL</div>

            <!-- Cuerpo del horno -->
            <div id="sc-horno" style="
              width:160px;height:160px;
              border-radius:12px;
              background:#1a1a12;
              border:4px solid var(--clr-border-mid);
              display:flex;align-items:center;justify-content:center;
              position:relative;overflow:hidden;
              transition:background .3s,border-color .3s;
            ">
              <!-- Resplandor interior -->
              <div id="sc-horno-glow" style="
                position:absolute;inset:0;
                background:radial-gradient(circle, transparent 40%, transparent 100%);
                transition:background .3s;
              "></div>

              <!-- Resistencias -->
              <div style="display:flex;flex-direction:column;gap:8px;position:relative;z-index:1">
                <div id="sc-resist1" style="width:100px;height:6px;border-radius:3px;background:#2a2a1a;transition:background .3s"></div>
                <div id="sc-resist2" style="width:100px;height:6px;border-radius:3px;background:#2a2a1a;transition:background .3s"></div>
                <div id="sc-resist3" style="width:100px;height:6px;border-radius:3px;background:#2a2a1a;transition:background .3s"></div>
              </div>

              <!-- Temperatura display -->
              <div style="
                position:absolute;bottom:8px;right:8px;
                background:rgba(0,0,0,0.6);
                border-radius:4px;padding:2px 6px;
              ">
                <div id="sc-temp-display" style="font-size:14px;font-family:monospace;color:#ffe066">0°C</div>
              </div>
            </div>

            <!-- Termómetro -->
            <div style="display:flex;align-items:flex-end;gap:6px">
              <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
                <div style="font-size:8px;font-family:monospace;color:var(--text-muted)">300°C</div>
                <div style="width:20px;height:120px;border:2px solid var(--clr-border-mid);border-radius:10px;background:var(--clr-bg-surface);position:relative;overflow:hidden">
                  <div id="sc-thermo-fill" style="
                    position:absolute;bottom:0;left:0;right:0;
                    height:0%;
                    background:#cc3333;
                    border-radius:0;
                    transition:height .3s ease, background .3s;
                  "></div>
                  <!-- Líneas de referencia -->
                  <div style="position:absolute;right:0;bottom:26%;width:8px;height:1px;background:#cc7700;opacity:0.6"></div>
                  <div style="position:absolute;right:0;bottom:20%;width:6px;height:1px;background:#639922;opacity:0.6"></div>
                  <div style="position:absolute;right:0;bottom:83%;width:8px;height:1px;background:#cc3333;opacity:0.6"></div>
                </div>
                <div style="font-size:8px;font-family:monospace;color:var(--text-muted)">0°C</div>
              </div>
              <div style="position:relative;height:120px;width:100px;margin-bottom:20px">
                <!-- 250°C = 83.3% de 300 → bottom: 83.3% de 120px = 100px -->
                <div style="position:absolute;bottom:87px;left:0;display:flex;align-items:center;gap:4px">
                  <div style="width:8px;height:1px;background:#cc3333"></div>
                  <span style="font-size:8px;font-family:monospace;color:var(--text-muted);white-space:nowrap">250°C alarma</span>
                </div>
                <!-- 80°C = 26.7% de 300 → bottom: 26.7% de 120px = 32px -->
                <div style="position:absolute;bottom:21px;left:0;display:flex;align-items:center;gap:4px">
                  <div style="width:8px;height:1px;background:#cc7700"></div>
                  <span style="font-size:8px;font-family:monospace;color:var(--text-muted);white-space:nowrap">80°C vent. ON</span>
                </div>
                <!-- 60°C = 20% de 300 → bottom: 20% de 120px = 24px -->
                <div style="position:absolute;bottom:13px;left:0;display:flex;align-items:center;gap:4px">
                  <div style="width:8px;height:1px;background:#639922"></div>
                  <span style="font-size:8px;font-family:monospace;color:var(--text-muted);white-space:nowrap">60°C vent. OFF</span>
                </div>
              </div>
            </div>

          </div>

          <!-- PANEL DE CONTROL -->
          <div style="display:flex;flex-direction:column;gap:16px;padding-top:10px">

            <!-- Slider temperatura (simula AIW10) -->
            <div style="display:flex;flex-direction:column;gap:6px;padding:10px;border:1px solid var(--clr-border-subtle);border-radius:6px">
              <div style="font-size:9px;font-family:monospace;color:var(--text-secondary);letter-spacing:.08em">SENSOR TEMPERATURA — AIW10</div>
              <div style="display:flex;align-items:center;gap:8px">
                <input id="sc-slider" type="range" min="0" max="27648" value="0" step="1" style="
                  flex:1;accent-color:#cc3333;cursor:pointer;
                "/>
                <span id="sc-slider-val" style="font-size:10px;font-family:monospace;color:#cc3333;min-width:48px;text-align:right">0</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="font-size:8px;font-family:monospace;color:var(--text-muted)">0°C (frío)</span>
                <span style="font-size:8px;font-family:monospace;color:var(--text-muted)">300°C (crítico)</span>
              </div>
            </div>

            <!-- Señales analógicas -->
            <div style="display:flex;flex-direction:column;gap:4px;padding:8px;border:1px solid var(--clr-border-subtle);border-radius:6px">
              <div style="font-size:9px;font-family:monospace;color:var(--text-secondary);letter-spacing:.08em;margin-bottom:2px">SEÑALES ANALÓGICAS</div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:9px;font-family:monospace;color:var(--text-muted)">AIW10 (raw)</span>
                <span id="sc-aiw10" style="font-size:9px;font-family:monospace;color:#1a9eb5">0</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:9px;font-family:monospace;color:var(--text-muted)">MD100 (norm)</span>
                <span id="sc-md100" style="font-size:9px;font-family:monospace;color:#1a9eb5">0.00000</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:9px;font-family:monospace;color:var(--text-muted)">MD104 (°C)</span>
                <span id="sc-md104" style="font-size:10px;font-family:monospace;color:#cc3333;font-weight:600">0.00</span>
              </div>
            </div>

            <!-- Salidas -->
            <div style="display:flex;flex-direction:column;gap:6px;padding:8px;border:1px solid var(--clr-border-subtle);border-radius:6px">
              <div style="font-size:9px;font-family:monospace;color:var(--text-secondary);letter-spacing:.08em;margin-bottom:2px">ACTUADORES</div>

              <!-- Ventilador -->
              <div style="display:flex;align-items:center;gap:10px">
                <div id="sc-fan" style="
                  width:36px;height:36px;
                  display:flex;align-items:center;justify-content:center;
                  font-size:22px;
                  transition:color .2s;color:var(--clr-border-mid);
                ">🌀</div>
                <div>
                  <div style="font-size:9px;font-family:monospace;color:var(--text-secondary)">Ventilador</div>
                  <div id="sc-fan-status" style="font-size:9px;font-family:monospace;color:var(--text-muted)">DETENIDO</div>
                  <div style="font-size:8px;font-family:monospace;padding:1px 4px;border-radius:2px;background:#27500A;color:#97C459;border:1px solid #3B6D11;display:inline-block;margin-top:1px">Q0.0</div>
                </div>
              </div>

              <!-- Alarma -->
              <div style="display:flex;align-items:center;gap:10px">
                <div id="sc-alarma-led" style="
                  width:36px;height:36px;border-radius:50%;
                  background:var(--clr-error-dim);
                  border:3px solid var(--clr-border-mid);
                  display:flex;align-items:center;justify-content:center;
                  font-size:16px;
                  transition:background .2s,border-color .2s;
                ">⚠</div>
                <div>
                  <div style="font-size:9px;font-family:monospace;color:var(--text-secondary)">Alarma crítica</div>
                  <div id="sc-alarma-status" style="font-size:9px;font-family:monospace;color:var(--text-muted)">NORMAL</div>
                  <div style="font-size:8px;font-family:monospace;padding:1px 4px;border-radius:2px;background:#27500A;color:#97C459;border:1px solid #3B6D11;display:inline-block;margin-top:1px">Q0.1</div>
                </div>
              </div>

            </div>

            <!-- Estado -->
            <div id="sc-estado" style="
              font-size:10px;font-family:monospace;
              color:var(--text-secondary);letter-spacing:.06em;
              padding:6px 10px;border:1px solid var(--clr-border-subtle);
              border-radius:4px;text-align:center;
              min-width:240px;min-height:32px;
              display:flex;align-items:center;justify-content:center;
            ">HORNO FRÍO</div>

          </div>

        </div>

        <!-- Leyenda -->
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#1a9eb5"></div>
            <span style="font-size:9px;color:var(--text-muted);font-family:monospace">AIW10 → NORM → MD100 → SCALE → MD104 (°C)</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#639922"></div>
            <span style="font-size:9px;color:var(--text-muted);font-family:monospace">Q0.0 · Ventilador (ON>80°C / OFF<60°C)</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#cc3333"></div>
            <span style="font-size:9px;color:var(--text-muted);font-family:monospace">Q0.1 · Alarma (>250°C)</span>
          </div>
        </div>

      </div>
    `;

    _el.slider      = container.querySelector('#sc-slider');
    _el.sliderVal   = container.querySelector('#sc-slider-val');
    _el.horno       = container.querySelector('#sc-horno');
    _el.hornoGlow   = container.querySelector('#sc-horno-glow');
    _el.resist1     = container.querySelector('#sc-resist1');
    _el.resist2     = container.querySelector('#sc-resist2');
    _el.resist3     = container.querySelector('#sc-resist3');
    _el.thermoFill  = container.querySelector('#sc-thermo-fill');
    _el.tempDisplay = container.querySelector('#sc-temp-display');
    _el.aiw10       = container.querySelector('#sc-aiw10');
    _el.md100       = container.querySelector('#sc-md100');
    _el.md104       = container.querySelector('#sc-md104');
    _el.fan         = container.querySelector('#sc-fan');
    _el.fanStatus   = container.querySelector('#sc-fan-status');
    _el.alarmaLed   = container.querySelector('#sc-alarma-led');
    _el.alarmaStatus= container.querySelector('#sc-alarma-status');
    _el.estado      = container.querySelector('#sc-estado');
    _el.animFrame   = null;
    _el.fanAngle    = 0;

    // Slider controla AIW10
    _el.slider.addEventListener('input', () => {
      if (global.LLT.state.getMode() !== 'RUN') return;
      const val = parseInt(_el.slider.value);
      global.LLT.state.forceAnalogSignal('AIW10', val);
      _el.sliderVal.textContent = val;
    });
  }

  function update(signals, mode) {
    if (!_el.horno) return;

    const aiw10 = global.LLT.state.getAnalogValue('AIW10') || 0;
    const md100 = global.LLT.state.getAnalogValue('MD100') || 0;
    const md104 = global.LLT.state.getAnalogValue('MD104') || 0;

    const ventOn  = mode === 'RUN' && !!signals['Q0.0']?.value;
    const alarmaOn= mode === 'RUN' && !!signals['Q0.1']?.value;

    // Actualizar displays analógicos
    _el.aiw10.textContent = Math.round(aiw10);
    _el.md100.textContent = md100.toFixed(5);
    _el.md104.textContent = md104.toFixed(2) + '°C';
    _el.tempDisplay.textContent = md104.toFixed(1) + '°C';

    // Actualizar slider si no está siendo manipulado
    if (!_el.sliderVal._dragging) {
      _el.slider.value = Math.round(aiw10);
      _el.sliderVal.textContent = Math.round(aiw10);
    }

    // Termómetro — barra proporcional a 0-300°C
    const ratio = Math.max(0, Math.min(1, md104 / 300));
    _el.thermoFill.style.height = (ratio * 100) + '%';

    // Color de la barra según temperatura
    const barColor = md104 > 250 ? '#cc3333'
                   : md104 > 80  ? '#cc7700'
                   : md104 > 40  ? '#ba9500'
                   : '#378ADD';
    _el.thermoFill.style.background = barColor;

    // Color del horno
    const hornoColor = md104 > 250 ? '#2a0a00'
                     : md104 > 150 ? '#2a1000'
                     : md104 > 80  ? '#1a1200'
                     : md104 > 40  ? '#161008'
                     : '#1a1a12';
    _el.horno.style.background = hornoColor;

    // Resistencias
    const resistColor = md104 > 200 ? '#cc4400'
                       : md104 > 100 ? '#884400'
                       : md104 > 50  ? '#442200'
                       : '#2a2a1a';
    _el.resist1.style.background = resistColor;
    _el.resist2.style.background = resistColor;
    _el.resist3.style.background = resistColor;

    // Resplandor
    const glowIntensity = Math.min(1, md104 / 200);
    const glowColor = `rgba(${Math.round(180 * glowIntensity)}, ${Math.round(60 * glowIntensity)}, 0, ${glowIntensity * 0.4})`;
    _el.hornoGlow.style.background = `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`;

    // Ventilador
    _el.fanStatus.textContent = ventOn ? 'GIRANDO' : 'DETENIDO';
    _el.fanStatus.style.color = ventOn ? '#639922' : 'var(--text-muted)';
    _el.fan.style.color       = ventOn ? '#639922' : 'var(--clr-border-mid)';

    if (ventOn && !_el.animFrame) {
      const spin = () => {
        if (!_el.fan) return;
        _el.fanAngle = (_el.fanAngle + 15) % 360;
        _el.fan.style.transform = `rotate(${_el.fanAngle}deg)`;
        _el.animFrame = requestAnimationFrame(spin);
      };
      _el.animFrame = requestAnimationFrame(spin);
    } else if (!ventOn && _el.animFrame) {
      cancelAnimationFrame(_el.animFrame);
      _el.animFrame = null;
      _el.fan.style.transform = 'rotate(0deg)';
    }

    // Alarma
    _el.alarmaLed.style.background   = alarmaOn ? '#cc3333' : 'var(--clr-error-dim)';
    _el.alarmaLed.style.borderColor  = alarmaOn ? '#ff6666' : 'var(--clr-border-mid)';
    _el.alarmaStatus.textContent     = alarmaOn ? '¡TEMPERATURA CRÍTICA!' : 'NORMAL';
    _el.alarmaStatus.style.color     = alarmaOn ? '#cc3333' : 'var(--text-muted)';

    // Estado general
    const tempC = md104;
    _el.estado.textContent = alarmaOn    ? '🔴 ALARMA — TEMPERATURA CRÍTICA'
                           : ventOn      ? '🌀 VENTILADOR ACTIVO — ENFRIANDO'
                           : tempC > 60  ? '🟡 TEMPERATURA ELEVADA'
                           : tempC > 10  ? '🟢 TEMPERATURA NORMAL'
                           : '⬜ HORNO FRÍO';
    _el.estado.style.color = alarmaOn    ? '#cc3333'
                           : ventOn      ? '#639922'
                           : tempC > 60  ? '#ba9500'
                           : 'var(--text-secondary)';
  }

  function destroy() {
    if (_el.animFrame) cancelAnimationFrame(_el.animFrame);
    _el = {};
  }

  global.LLT.scenes['ex_15'] = { build, update, destroy };

}(window));