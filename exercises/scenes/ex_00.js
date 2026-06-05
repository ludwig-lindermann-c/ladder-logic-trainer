(function (global) {
  'use strict';

  if (!global.LLT.scenes) global.LLT.scenes = {};

  let _elements = {};
  let _switchState = { 'I0.4': false, 'I0.5': false, 'I0.6': false, 'I0.7': false };

  function build(container) {
    container.innerHTML = `
      <div style="
        width:100%; height:100%;
        display:grid; grid-template-columns:1fr 1px 1fr;
        background:var(--clr-bg-deep); box-sizing:border-box;
        overflow-y:auto;
      ">

        <!-- PANEL IZQUIERDO — Entradas -->
        <div style="
          display:flex; flex-direction:column;
          align-items:center; justify-content:flex-start;
          gap:16px; padding:16px;
        ">
          <div style="font-size:10px;color:#378ADD;font-family:monospace;letter-spacing:.1em">ENTRADAS</div>

          <!-- Pulsadores -->
          <div style="display:flex;flex-direction:column;gap:4px;width:100%;max-width:240px">
            <div style="font-size:9px;color:var(--text-muted);font-family:monospace;letter-spacing:.08em">PULSADORES — momentáneos</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              ${[0,1,2,3].map(i => `
                <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
                  <div id="sc-pbtn-${i}" data-addr="I0.${i}" style="
                    width:44px;height:44px;border-radius:50%;
                    background:var(--clr-bg-panel);border:3px solid var(--clr-border-mid);
                    display:flex;align-items:center;justify-content:center;
                    cursor:pointer;box-sizing:border-box;transition:transform .08s;
                  ">
                    <div id="sc-pbtn-cap-${i}" style="
                      width:26px;height:26px;border-radius:50%;
                      background:#c0392b;border:2px solid #922b21;
                      transition:background .08s;pointer-events:none;
                    "></div>
                  </div>
                  <div style="font-size:8px;font-family:monospace;padding:1px 4px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.${i}</div>
                  <div style="font-size:8px;color:var(--text-muted);font-family:monospace">P${i+1}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Interruptores -->
          <div style="display:flex;flex-direction:column;gap:4px;width:100%;max-width:240px">
            <div style="font-size:9px;color:var(--text-muted);font-family:monospace;letter-spacing:.08em">INTERRUPTORES — toggle</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              ${[4,5,6,7].map(i => `
                <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
                  <div id="sc-sw-${i}" data-addr="I0.${i}" style="
                    width:48px;height:24px;border-radius:12px;
                    background:var(--clr-bg-surface);border:2px solid var(--clr-border-mid);
                    display:flex;align-items:center;padding:2px;
                    cursor:pointer;box-sizing:border-box;transition:background .15s,border-color .15s;
                  ">
                    <div id="sc-sw-knob-${i}" style="
                      width:18px;height:18px;border-radius:50%;
                      background:#444;border:1px solid #555;
                      transition:transform .15s,background .15s;
                      pointer-events:none;
                    "></div>
                  </div>
                  <div style="font-size:8px;font-family:monospace;padding:1px 4px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.${i}</div>
                  <div style="font-size:8px;color:var(--text-muted);font-family:monospace">S${i-3}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Divisor analógico -->
          <div style="width:100%;max-width:240px;height:1px;background:rgba(26,158,181,0.3)"></div>

          <!-- Entradas analógicas -->
          <div style="display:flex;flex-direction:column;gap:6px;width:100%;max-width:240px">
            <div style="font-size:9px;color:#1a9eb5;font-family:monospace;letter-spacing:.08em">ENTRADAS ANALÓGICAS — slider</div>
            ${['AIW10','AIW12'].map((addr, i) => `
              <div style="display:flex;flex-direction:column;gap:3px">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:8px;font-family:monospace;padding:1px 4px;border-radius:3px;background:#0C3040;color:#22d3ee;border:1px solid #1a9eb5">${addr}</span>
                  <span id="sc-aiw-val-${i}" style="font-size:9px;font-family:monospace;color:#22d3ee">0</span>
                </div>
                <input id="sc-aiw-slider-${i}" type="range" min="0" max="27648" value="0" step="1"
                  style="width:100%;accent-color:#1a9eb5;cursor:pointer;height:4px"/>
              </div>
            `).join('')}
          </div>

        </div>

        <!-- DIVISOR CENTRAL -->
        <div style="background:var(--clr-bg-elevated)"></div>

        <!-- PANEL DERECHO — Salidas -->
        <div style="
          display:flex;flex-direction:column;
          align-items:center;justify-content:flex-start;
          gap:16px;padding:16px;
        ">
          <div style="font-size:10px;color:#639922;font-family:monospace;letter-spacing:.1em">SALIDAS</div>

          <!-- Lámparas digitales -->
          <div style="display:flex;flex-direction:column;gap:4px;width:100%;max-width:240px">
            <div style="font-size:9px;color:var(--text-muted);font-family:monospace;letter-spacing:.08em">SALIDAS DIGITALES</div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
              ${[0,1,2,3,4,5,6,7].map(i => `
                <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
                  <div id="sc-lamp-${i}" style="
                    width:38px;height:38px;border-radius:50%;
                    background:#1a1a12;border:3px solid #2a2a1a;
                    display:flex;align-items:center;justify-content:center;
                    transition:background .12s,border-color .12s;
                  ">
                    <div id="sc-lamp-inner-${i}" style="
                      width:22px;height:22px;border-radius:50%;
                      background:#2a2a18;transition:background .12s;
                    "></div>
                  </div>
                  <div style="font-size:8px;font-family:monospace;padding:1px 4px;border-radius:3px;background:#27500A;color:#97C459;border:1px solid #3B6D11">Q0.${i}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Divisor analógico -->
          <div style="width:100%;max-width:240px;height:1px;background:rgba(26,158,181,0.3)"></div>

          <!-- Salidas analógicas -->
          <div style="display:flex;flex-direction:column;gap:8px;width:100%;max-width:240px">
            <div style="font-size:9px;color:#1a9eb5;font-family:monospace;letter-spacing:.08em">SALIDAS ANALÓGICAS</div>
            ${['AQW10','AQW12'].map((addr, i) => `
              <div style="display:flex;flex-direction:column;gap:3px">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:8px;font-family:monospace;padding:1px 4px;border-radius:3px;background:#27500A;color:#97C459;border:1px solid #3B6D11">${addr}</span>
                  <span id="sc-aqw-val-${i}" style="font-size:9px;font-family:monospace;color:#22d3ee">0</span>
                </div>
                <div style="height:8px;background:var(--clr-bg-surface);border-radius:4px;overflow:hidden;border:1px solid var(--clr-border-subtle)">
                  <div id="sc-aqw-bar-${i}" style="height:100%;width:0%;background:#1a9eb5;border-radius:4px;transition:width .1s ease"></div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Memorias reales -->
          <div style="display:flex;flex-direction:column;gap:6px;width:100%;max-width:240px">
            <div style="font-size:9px;color:#1a9eb5;font-family:monospace;letter-spacing:.08em">MEMORIAS REALES (MD)</div>
            ${['MD100','MD104','MD108'].map((addr, i) => `
              <div style="display:flex;justify-content:space-between;align-items:center;
                padding:4px 8px;background:var(--clr-bg-surface);border-radius:4px;
                border:1px solid var(--clr-border-subtle)">
                <span style="font-size:8px;font-family:monospace;color:#1a9eb5">${addr}</span>
                <span id="sc-md-val-${i}" style="font-size:9px;font-family:monospace;color:#22d3ee">0</span>
              </div>
            `).join('')}
          </div>

        </div>

      </div>
    `;

    _elements = {};
    _switchState = { 'I0.4': false, 'I0.5': false, 'I0.6': false, 'I0.7': false };

    // Pulsadores
    [0,1,2,3].forEach(i => {
      const btn  = container.querySelector(`#sc-pbtn-${i}`);
      const cap  = container.querySelector(`#sc-pbtn-cap-${i}`);
      const addr = `I0.${i}`;
      const press = (v) => {
        if (global.LLT.state.getMode() !== 'RUN') return;
        global.LLT.state.setSignalValue(addr, v);
        btn.style.transform  = v ? 'scale(0.92)' : 'scale(1)';
        cap.style.background = v ? '#7b241c' : '#c0392b';
      };
      btn.addEventListener('mousedown',  () => press(true));
      btn.addEventListener('mouseup',    () => press(false));
      btn.addEventListener('mouseleave', () => press(false));
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); press(true); });
      btn.addEventListener('touchend',   () => press(false));
    });

    // Interruptores
    [4,5,6,7].forEach(i => {
      const sw   = container.querySelector(`#sc-sw-${i}`);
      const knob = container.querySelector(`#sc-sw-knob-${i}`);
      const addr = `I0.${i}`;
      sw.addEventListener('click', () => {
        if (global.LLT.state.getMode() !== 'RUN') return;
        const newVal = !_switchState[addr];
        _switchState[addr] = newVal;
        global.LLT.state.setSignalValue(addr, newVal);
        sw.style.background   = newVal ? '#1a3a1a' : 'var(--clr-bg-surface)';
        sw.style.borderColor  = newVal ? '#3B6D11' : 'var(--clr-border-mid)';
        knob.style.transform  = newVal ? 'translateX(26px)' : 'translateX(0)';
        knob.style.background = newVal ? '#639922' : '#444';
      });
    });

    // Sliders analógicos AIW
    const aiwAddrs = ['AIW10', 'AIW12'];
    aiwAddrs.forEach((addr, i) => {
      const slider = container.querySelector(`#sc-aiw-slider-${i}`);
      const valEl  = container.querySelector(`#sc-aiw-val-${i}`);
      if (!slider) return;
      slider.addEventListener('input', () => {
        if (global.LLT.state.getMode() !== 'RUN') return;
        const val = parseInt(slider.value);
        global.LLT.state.forceAnalogSignal(addr, val);
        valEl.textContent = val;
      });
      _elements[`aiw_slider_${i}`] = slider;
      _elements[`aiw_val_${i}`]    = valEl;
    });

    // Referencias lámparas
    [0,1,2,3,4,5,6,7].forEach(i => {
      _elements[`lamp_${i}`]      = container.querySelector(`#sc-lamp-${i}`);
      _elements[`lampInner_${i}`] = container.querySelector(`#sc-lamp-inner-${i}`);
    });

    // Referencias AQW y MD
    ['AQW10','AQW12'].forEach((addr, i) => {
      _elements[`aqw_bar_${i}`] = container.querySelector(`#sc-aqw-bar-${i}`);
      _elements[`aqw_val_${i}`] = container.querySelector(`#sc-aqw-val-${i}`);
    });
    ['MD100','MD104','MD108'].forEach((addr, i) => {
      _elements[`md_val_${i}`] = container.querySelector(`#sc-md-val-${i}`);
    });
  }

  function update(signals, mode) {
    // Lámparas digitales
    [0,1,2,3,4,5,6,7].forEach(i => {
      const lamp      = _elements[`lamp_${i}`];
      const lampInner = _elements[`lampInner_${i}`];
      if (!lamp) return;
      const on = mode === 'RUN' && !!signals[`Q0.${i}`]?.value;
      lamp.style.background      = on ? '#7a6200' : '#1a1a12';
      lamp.style.borderColor     = on ? '#ba9500' : '#2a2a1a';
      lampInner.style.background = on ? '#ffe066' : '#2a2a18';
    });

    // Salidas analógicas AQW
    ['AQW10','AQW12'].forEach((addr, i) => {
      const bar = _elements[`aqw_bar_${i}`];
      const val = _elements[`aqw_val_${i}`];
      if (!bar) return;
      const v = global.LLT.state.getAnalogValue(addr) || 0;
      const ratio = Math.max(0, Math.min(1, v / 27648));
      bar.style.width = (ratio * 100).toFixed(1) + '%';
      bar.style.background = ratio > 0.8 ? '#cc7700' : ratio > 0.5 ? '#1a9eb5' : '#1a9eb5';
      val.textContent = Math.round(v);
    });

    // Memorias reales MD
    ['MD100','MD104','MD108'].forEach((addr, i) => {
      const el = _elements[`md_val_${i}`];
      if (!el) return;
      const v = global.LLT.state.getAnalogValue(addr) || 0;
      el.textContent = typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(4) : String(Math.round(v));
    });
  }

  function destroy() {
    _elements    = {};
    _switchState = {};
  }

  global.LLT.scenes['ex_00'] = { build, update, destroy };

}(window));