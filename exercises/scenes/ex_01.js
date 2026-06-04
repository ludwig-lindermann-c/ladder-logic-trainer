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
        gap:48px;background:var(--clr-bg-deep);user-select:none;
      ">
        <div style="display:flex;align-items:center;gap:100px;position:relative">

          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="font-size:10px;color:var(--text-secondary);font-family:monospace;letter-spacing:.08em">Pulsador marcha</div>
            <div id="sc-btn" style="
              width:70px;height:70px;border-radius:50%;
              background:var(--clr-bg-panel);border:4px solid var(--clr-border-mid);
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;box-sizing:border-box;transition:transform .08s;
            ">
              <div id="sc-btn-cap" style="
                width:44px;height:44px;border-radius:50%;
                background:#c0392b;border:2px solid #922b21;
                transition:background .08s;pointer-events:none;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.0 · Pulsador_Marcha</div>
          </div>

          <div id="sc-wire" style="
            position:absolute;top:35px;left:74px;
            width:calc(100% - 148px);height:2px;
            background:var(--clr-bg-elevated);transition:background .12s;
          "></div>

          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="font-size:10px;color:var(--text-secondary);font-family:monospace;letter-spacing:.08em">Lámpara piloto</div>
            <div id="sc-lamp" style="
              width:70px;height:70px;border-radius:50%;
              background:#1a1a12;border:4px solid var(--clr-border-mid);
              display:flex;align-items:center;justify-content:center;
              transition:background .12s,border-color .12s;
            ">
              <div id="sc-lamp-inner" style="
                width:42px;height:42px;border-radius:50%;
                background:#2a2a18;transition:background .12s;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#27500A;color:#97C459;border:1px solid #3B6D11">Q0.0 · Lampara</div>
          </div>

        </div>

        <div style="display:flex;gap:28px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#378ADD"></div>
            <span style="font-size:10px;color:var(--text-muted);font-family:monospace">Entrada · I0.0 · Pulsador_Marcha — mantener presionado</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#639922"></div>
            <span style="font-size:10px;color:var(--text-muted);font-family:monospace">Salida · Q0.0 · Lampara</span>
          </div>
        </div>
      </div>
    `;

    _el.btn      = container.querySelector('#sc-btn');
    _el.btnCap   = container.querySelector('#sc-btn-cap');
    _el.lamp     = container.querySelector('#sc-lamp');
    _el.lampInner= container.querySelector('#sc-lamp-inner');
    _el.wire     = container.querySelector('#sc-wire');

    const press = (v) => {
      if (global.LLT.state.getMode() !== 'RUN') return;
      global.LLT.state.setSignalValue('I0.0', v);
      _el.btn.style.transform  = v ? 'scale(0.92)' : 'scale(1)';
      _el.btnCap.style.background = v ? '#7b241c' : '#c0392b';
    };

    _el.btn.addEventListener('mousedown',  () => press(true));
    _el.btn.addEventListener('mouseup',    () => press(false));
    _el.btn.addEventListener('mouseleave', () => press(false));
    _el.btn.addEventListener('touchstart', (e) => { e.preventDefault(); press(true); });
    _el.btn.addEventListener('touchend',   () => press(false));
  }

  function update(signals, mode) {
    if (!_el.lamp) return;
    const on = mode === 'RUN' && !!signals['Q0.0']?.value;
    _el.lamp.style.background      = on ? '#7a6200' : '#1a1a12';
    _el.lamp.style.borderColor     = on ? '#ba9500' : '#2a2a1a';
    _el.lampInner.style.background = on ? '#ffe066' : '#2a2a18';
    _el.wire.style.background      = on ? '#3B6D11' : '#1e2a1f';
  }

  function destroy() { _el = {}; }

  global.LLT.scenes['ex_01'] = { build, update, destroy };

}(window));