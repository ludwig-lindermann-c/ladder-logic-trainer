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
        gap:20px;background:var(--clr-bg-deep);user-select:none;
      ">

        <div style="display:flex;align-items:flex-start;gap:48px">

          <!-- COLUMNA IZQUIERDA: sensores + estanque + EVAs -->
          <div style="display:flex;flex-direction:column;align-items:flex-start;gap:0">

            <!-- EVA1 y EVA2 sobre el estanque -->
            <!-- El estanque mide 140px. Los sensores ocupan 60px a la izquierda.
                 EVA1 centrada en x=87px (60 + 27), EVA2 en x=140px (60 + 80) del total -->
            <div style="position:relative;width:200px;height:40px;margin-bottom:0">
              <!-- EVA1 a ~1/3 del estanque -->
              <div style="position:absolute;left:70px;display:flex;flex-direction:column;align-items:center;gap:1px">
                <div style="font-size:9px;font-family:monospace;color:var(--text-muted)">EVA1</div>
                <div id="sc-pipe-eva1" style="width:14px;height:14px;background:var(--clr-bg-panel);border:1px solid var(--clr-border-mid);border-radius:2px;transition:background .2s"></div>
                <div style="font-size:8px;font-family:monospace;color:#27500A">Q0.0</div>
              </div>
              <!-- EVA2 a ~2/3 del estanque -->
              <div style="position:absolute;left:170px;display:flex;flex-direction:column;align-items:center;gap:1px">
                <div style="font-size:9px;font-family:monospace;color:var(--text-muted)">EVA2</div>
                <div id="sc-pipe-eva2" style="width:14px;height:14px;background:var(--clr-bg-panel);border:1px solid var(--clr-border-mid);border-radius:2px;transition:background .2s"></div>
                <div style="font-size:8px;font-family:monospace;color:#27500A">Q0.1</div>
              </div>
            </div>

            <!-- Sensores + estanque en fila -->
            <div style="display:flex;align-items:stretch">

              <!-- Sensores a la izquierda (60px) -->
              <div style="position:relative;width:60px;height:200px">
                <!-- I0.2 alto — 90% = top 20px -->
                <div style="position:absolute;top:16px;right:0;display:flex;align-items:center;gap:3px;justify-content:flex-end">
                  <div style="font-size:8px;font-family:monospace;color:var(--text-muted)">I0.2</div>
                  <div id="sc-led-alto" style="width:8px;height:8px;border-radius:50%;background:var(--clr-bg-elevated);transition:background .15s;flex-shrink:0"></div>
                  <div style="width:10px;height:2px;background:#2a3a2a;flex-shrink:0"></div>
                </div>
                <!-- I0.1 medio — 50% = top 100px -->
                <div style="position:absolute;top:96px;right:0;display:flex;align-items:center;gap:3px;justify-content:flex-end">
                  <div style="font-size:8px;font-family:monospace;color:var(--text-muted)">I0.1</div>
                  <div id="sc-led-medio" style="width:8px;height:8px;border-radius:50%;background:var(--clr-bg-elevated);transition:background .15s;flex-shrink:0"></div>
                  <div style="width:10px;height:2px;background:#2a3a2a;flex-shrink:0"></div>
                </div>
                <!-- I0.0 bajo — 2% = top 192px -->
                <div style="position:absolute;top:192px;right:0;display:flex;align-items:center;gap:3px;justify-content:flex-end">
                  <div style="font-size:8px;font-family:monospace;color:var(--text-muted)">I0.0</div>
                  <div id="sc-led-bajo" style="width:8px;height:8px;border-radius:50%;background:var(--clr-bg-elevated);transition:background .15s;flex-shrink:0"></div>
                  <div style="width:10px;height:2px;background:#2a3a2a;flex-shrink:0"></div>
                </div>
              </div>

              <!-- Estanque (140px) -->
              <div style="position:relative;width:140px;height:200px">
                <div style="
                  position:absolute;inset:0;
                  border:3px solid var(--clr-border-mid);border-radius:6px;
                  background:var(--clr-bg-deep);overflow:hidden;
                ">
                  <div id="sc-water-a" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:#2a4a1a;transition:height .3s ease;"></div>
                  <div id="sc-water-b" style="position:absolute;left:0;right:0;height:0%;background:#1a3a4a;transition:height .3s ease,bottom .3s ease;"></div>
                </div>
                <!-- Líneas guía -->
                <div style="position:absolute;top:20px;left:0;right:0;height:1px;background:var(--clr-bg-elevated);pointer-events:none"></div>
                <div style="position:absolute;top:100px;left:0;right:0;height:1px;background:var(--clr-bg-elevated);pointer-events:none"></div>
                <div style="position:absolute;top:196px;left:0;right:0;height:1px;background:var(--clr-bg-elevated);pointer-events:none"></div>
              </div>

            </div>

            <!-- EVA3 centrada bajo el estanque (desplazada 60px por los sensores) -->
            <div style="position:relative;width:200px;height:40px">
              <div style="position:absolute;left:120px;display:flex;flex-direction:column;align-items:center;gap:1px">
                <div id="sc-pipe-eva3" style="width:14px;height:14px;background:var(--clr-bg-panel);border:1px solid var(--clr-border-mid);border-radius:2px;transition:background .2s"></div>
                <div style="font-size:9px;font-family:monospace;color:var(--text-muted)">EVA3</div>
                <div style="font-size:8px;font-family:monospace;color:#27500A">Q0.2</div>
              </div>
            </div>

          </div>

          <!-- COLUMNA DERECHA: panel de control -->
          <div style="display:flex;flex-direction:column;gap:16px;padding-top:40px">

            <div style="display:flex;flex-direction:column;gap:12px">

              <div style="display:flex;align-items:center;gap:10px">
                <div id="sc-btn-iniciar" style="width:44px;height:44px;border-radius:50%;background:var(--clr-bg-panel);border:3px solid var(--clr-border-mid);display:flex;align-items:center;justify-content:center;cursor:pointer;box-sizing:border-box;transition:transform .08s">
                  <div id="sc-btn-iniciar-cap" style="width:28px;height:28px;border-radius:50%;background:#1a6a1a;border:2px solid #2a8a2a;transition:background .08s;pointer-events:none"></div>
                </div>
                <div>
                  <div style="font-size:10px;font-family:monospace;color:var(--text-secondary)">Iniciar mezcla</div>
                  <div style="font-size:9px;font-family:monospace;padding:1px 5px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5;display:inline-block;margin-top:2px">I0.3 · momentáneo</div>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:10px">
                <div id="sc-btn-abrir" style="width:44px;height:44px;border-radius:50%;background:var(--clr-bg-panel);border:3px solid var(--clr-border-mid);display:flex;align-items:center;justify-content:center;cursor:pointer;box-sizing:border-box;transition:transform .08s">
                  <div id="sc-btn-abrir-cap" style="width:28px;height:28px;border-radius:50%;background:#1a4a6a;border:2px solid #2a6a8a;transition:background .08s;pointer-events:none"></div>
                </div>
                <div>
                  <div style="font-size:10px;font-family:monospace;color:var(--text-secondary)">Abrir EVA3</div>
                  <div style="font-size:9px;font-family:monospace;padding:1px 5px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5;display:inline-block;margin-top:2px">I0.4 · momentáneo</div>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:10px">
                <div id="sc-btn-cerrar" style="width:44px;height:44px;border-radius:50%;background:var(--clr-bg-surface);border:3px solid var(--clr-border-mid);display:flex;align-items:center;justify-content:center;cursor:pointer;box-sizing:border-box;transition:transform .08s">
                  <div id="sc-btn-cerrar-cap" style="width:28px;height:28px;border-radius:50%;background:#8b0000;border:2px solid #cc0000;transition:background .08s;pointer-events:none"></div>
                </div>
                <div>
                  <div style="font-size:10px;font-family:monospace;color:#6a4a4a">Cerrar EVA3</div>
                  <div style="font-size:9px;font-family:monospace;padding:1px 5px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5;display:inline-block;margin-top:2px">I0.5 · momentáneo</div>
                </div>
              </div>

            </div>

            <div style="display:flex;flex-direction:column;gap:5px;padding:8px;border:1px solid var(--clr-border-subtle);border-radius:6px">
              <div style="font-size:9px;font-family:monospace;color:var(--text-muted);letter-spacing:.08em;margin-bottom:2px">ELECTROVÁLVULAS</div>
              <div style="display:flex;align-items:center;gap:6px">
                <div id="sc-led-eva1" style="width:8px;height:8px;border-radius:50%;background:var(--clr-bg-elevated);transition:background .15s"></div>
                <span style="font-size:10px;font-family:monospace;color:var(--text-secondary)">Q0.0 · EVA1</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <div id="sc-led-eva2" style="width:8px;height:8px;border-radius:50%;background:var(--clr-bg-elevated);transition:background .15s"></div>
                <span style="font-size:10px;font-family:monospace;color:var(--text-secondary)">Q0.1 · EVA2</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <div id="sc-led-eva3" style="width:8px;height:8px;border-radius:50%;background:var(--clr-bg-elevated);transition:background .15s"></div>
                <span style="font-size:10px;font-family:monospace;color:var(--text-secondary)">Q0.2 · EVA3</span>
              </div>
            </div>

            <div id="sc-status" style="font-size:10px;font-family:monospace;color:var(--text-secondary);letter-spacing:.06em;padding:6px 10px;border:1px solid var(--clr-border-subtle);border-radius:4px;max-width:160px;line-height:1.4">SISTEMA EN ESPERA</div>

          </div>

        </div>

        <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#378ADD"></div>
            <span style="font-size:9px;color:var(--text-muted);font-family:monospace">I0.0–I0.2 · Sensores automáticos</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#2a8a2a"></div>
            <span style="font-size:9px;color:var(--text-muted);font-family:monospace">Componente A (verde)</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:#1a6a8a"></div>
            <span style="font-size:9px;color:var(--text-muted);font-family:monospace">Componente B (azul)</span>
          </div>
        </div>

      </div>
    `;

    _el.waterA        = container.querySelector('#sc-water-a');
    _el.waterB        = container.querySelector('#sc-water-b');
    _el.ledBajo       = container.querySelector('#sc-led-bajo');
    _el.ledMedio      = container.querySelector('#sc-led-medio');
    _el.ledAlto       = container.querySelector('#sc-led-alto');
    _el.ledEva1       = container.querySelector('#sc-led-eva1');
    _el.ledEva2       = container.querySelector('#sc-led-eva2');
    _el.ledEva3       = container.querySelector('#sc-led-eva3');
    _el.pipeEva1      = container.querySelector('#sc-pipe-eva1');
    _el.pipeEva2      = container.querySelector('#sc-pipe-eva2');
    _el.pipeEva3      = container.querySelector('#sc-pipe-eva3');
    _el.status        = container.querySelector('#sc-status');
    _el.btnIniciar    = container.querySelector('#sc-btn-iniciar');
    _el.btnIniciarCap = container.querySelector('#sc-btn-iniciar-cap');
    _el.btnAbrir      = container.querySelector('#sc-btn-abrir');
    _el.btnAbrirCap   = container.querySelector('#sc-btn-abrir-cap');
    _el.btnCerrar     = container.querySelector('#sc-btn-cerrar');
    _el.btnCerrarCap  = container.querySelector('#sc-btn-cerrar-cap');
    _el.waterLevel    = 0;
    _el.levelA        = 0;
    _el.levelB        = 0;

    const makeBtn = (btnEl, capEl, addr, colorOn, colorOff) => {
      const press = (v) => {
        if (global.LLT.state.getMode() !== 'RUN') return;
        global.LLT.state.setSignalValue(addr, v);
        btnEl.style.transform  = v ? 'scale(0.92)' : 'scale(1)';
        capEl.style.background = v ? colorOn : colorOff;
      };
      btnEl.addEventListener('mousedown',  () => press(true));
      btnEl.addEventListener('mouseup',    () => press(false));
      btnEl.addEventListener('mouseleave', () => press(false));
      btnEl.addEventListener('touchstart', (e) => { e.preventDefault(); press(true); });
      btnEl.addEventListener('touchend',   () => press(false));
    };

    makeBtn(_el.btnIniciar, _el.btnIniciarCap, 'I0.3', '#0d4a0d', '#1a6a1a');
    makeBtn(_el.btnAbrir,   _el.btnAbrirCap,   'I0.4', '#0d2a4a', '#1a4a6a');
    makeBtn(_el.btnCerrar,  _el.btnCerrarCap,  'I0.5', '#4a0000', '#8b0000');

    _el.waterLevel = 0;
    _el.levelA     = 0;
    _el.levelB     = 0;
    global.LLT.state.setSignalValue('I0.0', false);
    global.LLT.state.setSignalValue('I0.1', false);
    global.LLT.state.setSignalValue('I0.2', false);
  }

  function update(signals, mode) {
    if (!_el.waterA) return;

    const eva1On = mode === 'RUN' && !!signals['Q0.0']?.value;
    const eva2On = mode === 'RUN' && !!signals['Q0.1']?.value;
    const eva3On = mode === 'RUN' && !!signals['Q0.2']?.value;

    if (mode === 'RUN') {
      if (eva1On && _el.waterLevel < 50) {
        _el.waterLevel = Math.min(50, _el.waterLevel + 0.12);
        _el.levelA     = _el.waterLevel;
      }
      if (eva2On && _el.waterLevel < 95) {
        _el.waterLevel = Math.min(95, _el.waterLevel + 0.12);
        _el.levelB     = Math.max(0, _el.waterLevel - _el.levelA);
      }
      if (eva3On && _el.waterLevel > 0) {
        _el.waterLevel = Math.max(0, _el.waterLevel - 0.2);
        _el.levelA     = Math.min(_el.levelA, _el.waterLevel);
        _el.levelB     = Math.max(0, _el.waterLevel - _el.levelA);
      }

      _el.waterA.style.height = _el.levelA + '%';
      _el.waterB.style.height = _el.levelB + '%';
      _el.waterB.style.bottom = _el.levelA + '%';

      const bajo  = _el.waterLevel >= 2;
      const medio = _el.waterLevel >= 50;
      const alto  = _el.waterLevel >= 90;

      if (bajo  !== global.LLT.state.getSignalValue('I0.0')) global.LLT.state.setSignalValue('I0.0', bajo);
      if (medio !== global.LLT.state.getSignalValue('I0.1')) global.LLT.state.setSignalValue('I0.1', medio);
      if (alto  !== global.LLT.state.getSignalValue('I0.2')) global.LLT.state.setSignalValue('I0.2', alto);
    }

    const nivelBajo  = !!signals['I0.0']?.value;
    const nivelMedio = !!signals['I0.1']?.value;
    const nivelAlto  = !!signals['I0.2']?.value;

    _el.ledBajo.style.background  = nivelBajo  ? '#378ADD' : '#1e2a1f';
    _el.ledMedio.style.background = nivelMedio ? '#378ADD' : '#1e2a1f';
    _el.ledAlto.style.background  = nivelAlto  ? '#378ADD' : '#1e2a1f';

    _el.ledEva1.style.background  = eva1On ? '#639922' : '#1e2a1f';
    _el.ledEva2.style.background  = eva2On ? '#639922' : '#1e2a1f';
    _el.ledEva3.style.background  = eva3On ? '#639922' : '#1e2a1f';
    _el.pipeEva1.style.background = eva1On ? '#2a8a1a' : '#1a2a1a';
    _el.pipeEva2.style.background = eva2On ? '#1a4a8a' : '#1a2a1a';
    _el.pipeEva3.style.background = eva3On ? '#2a8a1a' : '#1a2a1a';

    _el.status.textContent = eva3On     ? 'VACIANDO MEZCLA'
                           : nivelAlto  ? 'MEZCLA LISTA — abrir EVA3'
                           : eva2On     ? 'LLENANDO COMP. B...'
                           : eva1On     ? 'LLENANDO COMP. A...'
                           : !nivelBajo ? 'ESTANQUE VACÍO — presiona Iniciar'
                           : 'SISTEMA EN ESPERA';
    _el.status.style.color = eva3On     ? '#378ADD'
                           : nivelAlto  ? '#ba9500'
                           : eva2On     ? '#4a8aaa'
                           : eva1On     ? '#639922'
                           : !nivelBajo ? '#cc7700'
                           : '#3a4a3a';
  }

  function destroy() { _el = {}; }

  global.LLT.scenes['ex_12'] = { build, update, destroy };

}(window));