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
        background:#0d110e; box-sizing:border-box;
      ">

        <!-- PANEL IZQUIERDO — Entradas -->
        <div style="
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          gap:28px; padding:24px;
        ">
          <div style="font-size:10px;color:#378ADD;font-family:monospace;letter-spacing:.1em;margin-bottom:4px">ENTRADAS</div>

          <!-- Pulsadores -->
          <div style="display:flex;flex-direction:column;gap:6px;width:100%;max-width:220px">
            <div style="font-size:9px;color:#3a5a6a;font-family:monospace;letter-spacing:.08em;margin-bottom:2px">PULSADORES — momentáneos</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              ${[0,1,2,3].map(i => `
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                  <div id="sc-pbtn-${i}" data-addr="I0.${i}" style="
                    width:54px;height:54px;border-radius:50%;
                    background:#1a2a1a;border:3px solid #2a3a2a;
                    display:flex;align-items:center;justify-content:center;
                    cursor:pointer;box-sizing:border-box;transition:transform .08s;
                  ">
                    <div id="sc-pbtn-cap-${i}" style="
                      width:34px;height:34px;border-radius:50%;
                      background:#c0392b;border:2px solid #922b21;
                      transition:background .08s;pointer-events:none;
                    "></div>
                  </div>
                  <div style="font-size:9px;font-family:monospace;padding:1px 5px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.${i}</div>
                  <div style="font-size:9px;color:#3a5a6a;font-family:monospace">P${i+1}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Interruptores -->
          <div style="display:flex;flex-direction:column;gap:6px;width:100%;max-width:220px">
            <div style="font-size:9px;color:#3a5a6a;font-family:monospace;letter-spacing:.08em;margin-bottom:2px">INTERRUPTORES — toggle</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              ${[4,5,6,7].map(i => `
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                  <div id="sc-sw-${i}" data-addr="I0.${i}" style="
                    width:54px;height:28px;border-radius:14px;
                    background:#1a1a1a;border:2px solid #2a2a2a;
                    display:flex;align-items:center;padding:3px;
                    cursor:pointer;box-sizing:border-box;transition:background .15s,border-color .15s;
                    position:relative;
                  ">
                    <div id="sc-sw-knob-${i}" style="
                      width:20px;height:20px;border-radius:50%;
                      background:#444;border:1px solid #555;
                      transition:transform .15s,background .15s;
                      pointer-events:none;
                    "></div>
                  </div>
                  <div style="font-size:9px;font-family:monospace;padding:1px 5px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.${i}</div>
                  <div style="font-size:9px;color:#3a5a6a;font-family:monospace">S${i-3}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- DIVISOR -->
        <div style="background:#1e2a1f"></div>

        <!-- PANEL DERECHO — Salidas -->
        <div style="
          display:flex;flex-direction:column;
          align-items:center;justify-content:center;
          gap:28px;padding:24px;
        ">
          <div style="font-size:10px;color:#639922;font-family:monospace;letter-spacing:.1em;margin-bottom:4px">SALIDAS</div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:220px">
            ${[0,1,2,3,4,5,6,7].map(i => `
              <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                <div id="sc-lamp-${i}" style="
                  width:48px;height:48px;border-radius:50%;
                  background:#1a1a12;border:3px solid #2a2a1a;
                  display:flex;align-items:center;justify-content:center;
                  transition:background .12s,border-color .12s;
                ">
                  <div id="sc-lamp-inner-${i}" style="
                    width:28px;height:28px;border-radius:50%;
                    background:#2a2a18;transition:background .12s;
                  "></div>
                </div>
                <div style="font-size:9px;font-family:monospace;padding:1px 5px;border-radius:3px;background:#27500A;color:#97C459;border:1px solid #3B6D11">Q0.${i}</div>
                <div style="font-size:9px;color:#3a5a6a;font-family:monospace">L${i+1}</div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    _elements = {};
    _switchState = { 'I0.4': false, 'I0.5': false, 'I0.6': false, 'I0.7': false };

    // Pulsadores — momentáneos
    [0,1,2,3].forEach(i => {
      const btn  = container.querySelector(`#sc-pbtn-${i}`);
      const cap  = container.querySelector(`#sc-pbtn-cap-${i}`);
      const addr = `I0.${i}`;

      const press = (v) => {
        if (global.LLT.state.getMode() !== 'RUN') return;
        global.LLT.state.setSignalValue(addr, v);
        btn.style.transform    = v ? 'scale(0.92)' : 'scale(1)';
        cap.style.background   = v ? '#7b241c' : '#c0392b';
      };

      btn.addEventListener('mousedown',  () => press(true));
      btn.addEventListener('mouseup',    () => press(false));
      btn.addEventListener('mouseleave', () => press(false));
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); press(true); });
      btn.addEventListener('touchend',   () => press(false));
    });

    // Interruptores — toggle
    [4,5,6,7].forEach(i => {
      const sw   = container.querySelector(`#sc-sw-${i}`);
      const knob = container.querySelector(`#sc-sw-knob-${i}`);
      const addr = `I0.${i}`;

      sw.addEventListener('click', () => {
        if (global.LLT.state.getMode() !== 'RUN') return;
        const newVal = !_switchState[addr];
        _switchState[addr] = newVal;
        global.LLT.state.setSignalValue(addr, newVal);
        sw.style.background   = newVal ? '#1a3a1a' : '#1a1a1a';
        sw.style.borderColor  = newVal ? '#3B6D11' : '#2a2a2a';
        knob.style.transform  = newVal ? 'translateX(26px)' : 'translateX(0)';
        knob.style.background = newVal ? '#639922' : '#444';
      });
    });

    // Referencias a lámparas
    [0,1,2,3,4,5,6,7].forEach(i => {
      _elements[`lamp_${i}`]      = container.querySelector(`#sc-lamp-${i}`);
      _elements[`lampInner_${i}`] = container.querySelector(`#sc-lamp-inner-${i}`);
    });
  }

  function update(signals, mode) {
    [0,1,2,3,4,5,6,7].forEach(i => {
      const lamp      = _elements[`lamp_${i}`];
      const lampInner = _elements[`lampInner_${i}`];
      if (!lamp) return;
      const on = mode === 'RUN' && !!signals[`Q0.${i}`]?.value;
      lamp.style.background      = on ? '#7a6200' : '#1a1a12';
      lamp.style.borderColor     = on ? '#ba9500' : '#2a2a1a';
      lampInner.style.background = on ? '#ffe066' : '#2a2a18';
    });
  }

  function destroy() {
    _elements    = {};
    _switchState = {};
  }

  global.LLT.scenes['ex_00'] = { build, update, destroy };

}(window));