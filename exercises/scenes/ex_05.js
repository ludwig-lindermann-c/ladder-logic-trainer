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
        <div style="display:flex;align-items:center;gap:70px">

          <!-- Botón abrir -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="font-size:10px;color:#4a6a4a;font-family:monospace;letter-spacing:.08em">Abrir</div>
            <div id="sc-btn-abrir" style="
              width:64px;height:64px;border-radius:50%;
              background:#1a2a1a;border:4px solid #2a3a2a;
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;box-sizing:border-box;transition:transform .08s;
            ">
              <div id="sc-btn-abrir-cap" style="
                width:40px;height:40px;border-radius:50%;
                background:#1a6a1a;border:2px solid #2a8a2a;
                transition:background .08s;pointer-events:none;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.0 · momentáneo</div>
          </div>

          <!-- Válvula mariposa -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
            <div style="font-size:10px;color:#4a6a4a;font-family:monospace;letter-spacing:.08em">Válvula mariposa</div>
            <div style="position:relative;width:160px;height:80px;display:flex;align-items:center;justify-content:center">
              <div style="position:absolute;left:0;top:50%;transform:translateY(-50%);width:36px;height:18px;background:#1e2a1f;border-radius:2px;"></div>
              <div id="sc-valve-body" style="
                width:64px;height:64px;border-radius:50%;
                background:#1a2a1a;border:3px solid #2a3a2a;
                display:flex;align-items:center;justify-content:center;
                transition:background .2s,border-color .2s;position:relative;z-index:1;
              ">
                <div id="sc-valve-stem" style="
                  position:absolute;top:-12px;left:50%;transform:translateX(-50%);
                  width:4px;height:14px;background:#2a3a2a;border-radius:2px;
                  transition:background .2s;
                "></div>
                <div id="sc-valve-disc" style="
                  width:40px;height:10px;
                  background:#2a3a2a;border-radius:3px;
                  transition:transform .4s ease,background .2s;
                "></div>
              </div>
              <div style="position:absolute;right:0;top:50%;transform:translateY(-50%);width:36px;height:18px;background:#1e2a1f;border-radius:2px;"></div>
              <div id="sc-flow" style="
                position:absolute;left:36px;top:50%;transform:translateY(-50%);
                width:88px;height:10px;background:transparent;border-radius:2px;
                transition:background .3s;z-index:0;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#27500A;color:#97C459;border:1px solid #3B6D11">Q0.0 · Valvula</div>
            <div id="sc-valve-status" style="font-size:11px;font-family:monospace;color:#3a4a3a;letter-spacing:.1em;transition:color .2s">CERRADA</div>
          </div>

          <!-- Botón cerrar -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <div style="font-size:10px;color:#6a2a2a;font-family:monospace;letter-spacing:.08em">Cerrar</div>
            <div id="sc-btn-cerrar" style="
              width:64px;height:64px;border-radius:50%;
              background:#2a1a1a;border:4px solid #3a2a2a;
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;box-sizing:border-box;transition:transform .08s;
            ">
              <div id="sc-btn-cerrar-cap" style="
                width:40px;height:40px;border-radius:50%;
                background:#8b0000;border:2px solid #cc0000;
                transition:background .08s;pointer-events:none;
              "></div>
            </div>
            <div style="font-size:9px;font-family:monospace;padding:2px 6px;border-radius:3px;background:#0C447C;color:#85B7EB;border:1px solid #185FA5">I0.1 · momentáneo</div>
          </div>

        </div>

        <!-- Leyenda -->
        <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#1a6a1a"></div>
            <span style="font-size:10px;color:#4a5a4a;font-family:monospace">I0.0 · Btn_Abrir — momentáneo</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#cc0000"></div>
            <span style="font-size:10px;color:#6a4a4a;font-family:monospace">I0.1 · Btn_Cerrar — momentáneo</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#639922"></div>
            <span style="font-size:10px;color:#4a5a4a;font-family:monospace">Q0.0 · Valvula</span>
          </div>
        </div>

      </div>
    `;

    _el.btnAbrir     = container.querySelector('#sc-btn-abrir');
    _el.btnAbrirCap  = container.querySelector('#sc-btn-abrir-cap');
    _el.btnCerrar    = container.querySelector('#sc-btn-cerrar');
    _el.btnCerrarCap = container.querySelector('#sc-btn-cerrar-cap');
    _el.valveBody    = container.querySelector('#sc-valve-body');
    _el.valveDisc    = container.querySelector('#sc-valve-disc');
    _el.valveStem    = container.querySelector('#sc-valve-stem');
    _el.valveStatus  = container.querySelector('#sc-valve-status');
    _el.flow         = container.querySelector('#sc-flow');

    const press = (addr, v, btnEl, capEl, colorOn, colorOff) => {
      if (global.LLT.state.getMode() !== 'RUN') return;
      global.LLT.state.setSignalValue(addr, v);
      btnEl.style.transform  = v ? 'scale(0.92)' : 'scale(1)';
      capEl.style.background = v ? colorOn : colorOff;
    };

    _el.btnAbrir.addEventListener('mousedown',  () => press('I0.0', true,  _el.btnAbrir,  _el.btnAbrirCap,  '#0d4a0d', '#1a6a1a'));
    _el.btnAbrir.addEventListener('mouseup',    () => press('I0.0', false, _el.btnAbrir,  _el.btnAbrirCap,  '#0d4a0d', '#1a6a1a'));
    _el.btnAbrir.addEventListener('mouseleave', () => press('I0.0', false, _el.btnAbrir,  _el.btnAbrirCap,  '#0d4a0d', '#1a6a1a'));
    _el.btnAbrir.addEventListener('touchstart', (e) => { e.preventDefault(); press('I0.0', true,  _el.btnAbrir,  _el.btnAbrirCap,  '#0d4a0d', '#1a6a1a'); });
    _el.btnAbrir.addEventListener('touchend',   () => press('I0.0', false, _el.btnAbrir,  _el.btnAbrirCap,  '#0d4a0d', '#1a6a1a'));

    _el.btnCerrar.addEventListener('mousedown',  () => press('I0.1', true,  _el.btnCerrar, _el.btnCerrarCap, '#4a0000', '#8b0000'));
    _el.btnCerrar.addEventListener('mouseup',    () => press('I0.1', false, _el.btnCerrar, _el.btnCerrarCap, '#4a0000', '#8b0000'));
    _el.btnCerrar.addEventListener('mouseleave', () => press('I0.1', false, _el.btnCerrar, _el.btnCerrarCap, '#4a0000', '#8b0000'));
    _el.btnCerrar.addEventListener('touchstart', (e) => { e.preventDefault(); press('I0.1', true,  _el.btnCerrar, _el.btnCerrarCap, '#4a0000', '#8b0000'); });
    _el.btnCerrar.addEventListener('touchend',   () => press('I0.1', false, _el.btnCerrar, _el.btnCerrarCap, '#4a0000', '#8b0000'));
  }

  function update(signals, mode) {
    if (!_el.valveBody) return;
    const open = mode === 'RUN' && !!signals['Q0.0']?.value;
    _el.valveBody.style.background  = open ? '#0d2a0d' : '#1a2a1a';
    _el.valveBody.style.borderColor = open ? '#3B6D11' : '#2a3a2a';
    _el.valveStem.style.background  = open ? '#639922' : '#2a3a2a';
    _el.valveDisc.style.transform   = open ? 'rotate(90deg)' : 'rotate(0deg)';
    _el.valveDisc.style.background  = open ? '#639922' : '#2a3a2a';
    _el.flow.style.background       = open ? '#1a3a1a' : 'transparent';
    _el.valveStatus.textContent     = open ? 'ABIERTA' : 'CERRADA';
    _el.valveStatus.style.color     = open ? '#639922' : '#3a4a3a';
  }

  function destroy() { _el = {}; }

  global.LLT.scenes['ex_05'] = { build, update, destroy };

}(window));