/* ============================================================
   LADDER LOGIC TRAINER — editor_analog_patch.js
   Parche para editor.js: añade soporte de señales analógicas
   al panel I/O, al modal de nueva variable y a la tabla de
   variables.

   INSTRUCCIONES DE INTEGRACIÓN:
   ────────────────────────────
   Opción A (recomendada): fusionar manualmente las funciones
     marcadas con "REEMPLAZAR" en tu editor.js.

   Opción B: cargar este archivo DESPUÉS de editor.js en index.html:
     <script src="js/editor_analog_patch.js"></script>

   El parche sobreescribe las funciones internas mediante el
   patrón de extensión del namespace LLT.editor.
   ============================================================ */

(function (global) {
  'use strict';

  // Esperar a que editor.js haya inicializado LLT.editor
  document.addEventListener('DOMContentLoaded', () => {
    const { utils, state } = global.LLT;

    /* ----------------------------------------------------------
       HELPERS
    ---------------------------------------------------------- */
    function _fmtAnalogVal(n) {
      if (typeof n !== 'number') return String(n);
      return Number.isInteger(n) ? String(n) : n.toFixed(2);
    }

    function _isAnalogAddress(addr) {
      if (!addr) return false;
      const a = addr.trim().toUpperCase();
      return /^AIW\d+$/.test(a) || /^AQW\d+$/.test(a) || /^MW\d+$/.test(a);
    }

    /* ----------------------------------------------------------
       ACTUALIZAR FILA DE SEÑAL I/O (digital Y analógica)
       Reemplaza editor._updateSignalRow
    ---------------------------------------------------------- */
    function _updateSignalRow(address) {
      const row = document.querySelector(`.io-row[data-signal="${address}"]`);
      if (!row) return;

      const sig = state.getSignal(address);
      if (!sig) return;

      if (sig.type === 'analog') {
        const val = state.getAnalogValue(address);
        row.className = `io-row io-row--analog${sig.forced ? ' io-row--forced' : ''}`;

        // Actualizar valor numérico
        const vEl = row.querySelector(`[data-value="${address}"]`);
        if (vEl) vEl.textContent = _fmtAnalogVal(val);

        // Actualizar barra de progreso
        const barFill = row.querySelector('.io-analog-bar__fill');
        if (barFill) {
          const min   = sig.min ?? 0;
          const max   = sig.max ?? 27648;
          const range = max - min;
          const ratio = range !== 0 ? Math.max(0, Math.min(1, (val - min) / range)) : 0;
          barFill.style.width = `${(ratio * 100).toFixed(1)}%`;
        }

        // Actualizar slider si existe
        const slider = row.querySelector('input[type="range"]');
        if (slider && !sig.forced) slider.value = val;

      } else {
        // Digital — comportamiento original
        const val = state.getSignalValue(address);
        row.className = `io-row io-row--${val ? 'on' : 'off'}${sig?.forced ? ' io-row--forced' : ''}`;
        const v = row.querySelector(`[data-value="${address}"]`);
        if (v) v.textContent = val ? '1' : '0';
      }
    }

    /* ----------------------------------------------------------
       CONSTRUIR FILA I/O (digital Y analógica)
       Reemplaza editor._buildIORow
    ---------------------------------------------------------- */
    function _buildIORow(sig) {
      if (sig.type === 'analog') {
        return _buildAnalogIORow(sig);
      }

      // Digital — igual que antes
      const val = state.getSignalValue(sig.address);
      const row = utils.createElement('div', {
        cls:   `io-row io-row--${val ? 'on' : 'off'}${sig.forced ? ' io-row--forced' : ''}`,
        attrs: { 'data-signal': sig.address },
      });
      row.appendChild(utils.createElement('button', { cls: 'io-toggle', attrs: { 'data-signal': sig.address } }));
      row.appendChild(utils.createElement('span',   { cls: 'io-address mono', text: sig.address }));
      row.appendChild(utils.createElement('span',   { cls: 'io-name',         text: sig.name }));
      row.appendChild(utils.createElement('span',   { cls: 'io-value mono',   text: val ? '1' : '0', attrs: { 'data-value': sig.address } }));
      return row;
    }

    /* ----------------------------------------------------------
       FILA I/O ANALÓGICA
    ---------------------------------------------------------- */
    function _buildAnalogIORow(sig) {
      const val   = state.getAnalogValue(sig.address);
      const min   = sig.min ?? 0;
      const max   = sig.max ?? 27648;
      const range = max - min;
      const ratio = range !== 0 ? Math.max(0, Math.min(1, (val - min) / range)) : 0;

      const row = utils.createElement('div', {
        cls:   `io-row io-row--analog${sig.forced ? ' io-row--forced' : ''}`,
        attrs: { 'data-signal': sig.address },
      });

      // Dirección + nombre
      // Dirección + nombre en una línea
      const header = utils.createElement('div', { cls: 'io-row__header' });
      header.appendChild(utils.createElement('span', { cls: 'io-address mono', text: sig.address }));
      const nameEl = utils.createElement('span', { cls: 'io-name', text: sig.name });
      if (sig.unit) nameEl.title = `Unidad: ${sig.unit}`;
      header.appendChild(nameEl);
      row.appendChild(header);

      // Barra de progreso
      const bar  = utils.createElement('div',  { cls: 'io-analog-bar' });
      const fill = utils.createElement('div',  { cls: 'io-analog-bar__fill' });
      fill.style.width = `${(ratio * 100).toFixed(1)}%`;
      bar.appendChild(fill);
      row.appendChild(bar);

      // Valor numérico
      const valEl = utils.createElement('span', {
        cls:   'io-value mono',
        text:  _fmtAnalogVal(val) + (sig.unit ? ` ${sig.unit}` : ''),
        attrs: { 'data-value': sig.address },
      });
      row.appendChild(valEl);

      // Si es entrada analógica (AIW) → slider para simular valor
      if (sig.address.startsWith('AIW') || sig.address.startsWith('MW')) {
        const sliderWrap = utils.createElement('div', { cls: 'io-analog-slider' });
        const slider     = document.createElement('input');
        slider.type  = 'range';
        slider.min   = min;
        slider.max   = max;
        slider.step  = 1;
        slider.value = val;

        const sliderVal = utils.createElement('span', {
          cls:  'io-analog-slider__value mono',
          text: _fmtAnalogVal(val),
        });

        slider.addEventListener('input', () => {
          const newVal = parseFloat(slider.value);
          sliderVal.textContent = _fmtAnalogVal(newVal);
          // Forzar la señal con el valor del slider
          state.forceAnalogSignal(sig.address, newVal);
          // Actualizar visualmente la fila
          _updateSignalRow(sig.address);
        });

        sliderWrap.appendChild(slider);
        sliderWrap.appendChild(sliderVal);
        row.appendChild(sliderWrap);
      }

      return row;
    }

    /* ----------------------------------------------------------
       RECONSTRUIR PANEL I/O — incluye pestaña analógica
    ---------------------------------------------------------- */
    function _rebuildIOPanel() {
      // Paneles digitales originales
      ['list-inputs', 'list-outputs', 'list-marks'].forEach((id, i) => {
        const types = ['input', 'output', 'mark'];
        const list  = utils.byId(id);
        if (!list) return;
        utils.clearChildren(list);
        Object.values(state.getSignals())
          .filter(s => s.type === types[i])
          .forEach(sig => list.appendChild(_buildIORow(sig)));
      });

      // Panel analógico
      _rebuildAnalogPanel();

      // Tabla de variables (incluye analógicas)
      _buildVarTable();
    }

    /* ----------------------------------------------------------
       PANEL ANALÓGICO (lista de señales AIW / AQW / MW analógicas)
    ---------------------------------------------------------- */
    function _rebuildAnalogPanel() {
      const list = utils.byId('list-analogs');
      if (!list) return;
      utils.clearChildren(list);

      const analogs = Object.values(state.getSignals()).filter(s => s.type === 'analog');
      if (analogs.length === 0) {
        list.appendChild(utils.createElement('div', {
          cls:  'io-empty',
          text: 'Sin señales analógicas',
        }));
        return;
      }
      analogs.forEach(sig => list.appendChild(_buildAnalogIORow(sig)));
    }

    /* ----------------------------------------------------------
       TABLA DE VARIABLES — incluye tipo analog y unidad
    ---------------------------------------------------------- */
    function _buildVarTable() {
      const tbody = utils.byId('var-table-body');
      if (!tbody) return;
      utils.clearChildren(tbody);

      const sigs = Object.values(state.getSignals());
      if (sigs.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5;
        td.style.cssText = 'text-align:center;color:var(--text-muted);padding:var(--space-3);font-size:var(--text-xs)';
        td.textContent = 'Sin variables definidas';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
      }

      sigs.forEach(sig => {
        const tr = document.createElement('tr');

        // Dirección
        const tdAddr = document.createElement('td');
        tdAddr.textContent = sig.address;
        tr.appendChild(tdAddr);

        // Nombre
        const tdName = document.createElement('td');
        tdName.textContent = sig.name;
        tr.appendChild(tdName);

        // Tipo
        const tdType = document.createElement('td');
        tdType.textContent = sig.type;
        if (sig.type === 'analog') {
          tdType.style.color = 'var(--analog-primary)';
          tdType.style.fontWeight = '600';
        }
        tr.appendChild(tdType);

        // Valor actual
        const tdVal = document.createElement('td');
        if (sig.type === 'analog') {
          tdVal.textContent = _fmtAnalogVal(state.getAnalogValue(sig.address)) + (sig.unit ? ` ${sig.unit}` : '');
          tdVal.style.color = 'var(--analog-text-on, #8aacb8)';
          tdVal.setAttribute('data-value', sig.address);
        } else {
          const v = state.getSignalValue(sig.address);
          tdVal.textContent = v ? '1' : '0';
          tdVal.setAttribute('data-value', sig.address);
        }
        tr.appendChild(tdVal);

        // Botón eliminar
        const tdDel = document.createElement('td');
        const btnDel = document.createElement('button');
        btnDel.textContent = '✕';
        btnDel.style.cssText = 'color:var(--text-error);background:none;border:none;cursor:pointer;font-size:10px;padding:0 4px';
        btnDel.title = `Eliminar ${sig.address}`;
        btnDel.addEventListener('click', () => {
          state.removeSignal(sig.address);
          utils.toast(`${sig.address} eliminada`, 'info', 1500);
        });
        tdDel.appendChild(btnDel);
        tr.appendChild(tdDel);

        tbody.appendChild(tr);
      });
    }

    /* ----------------------------------------------------------
       MODAL AGREGAR VARIABLE (extendido con soporte analógico)
    ---------------------------------------------------------- */
    function _showAddVarModal() {
      document.getElementById('add-var-modal')?.remove();
      const modal = document.createElement('div');
      modal.id        = 'add-var-modal';
      modal.className = 'modal-backdrop open';
      modal.innerHTML = `
        <div class="modal">
          <h2 class="modal__title">Nueva variable</h2>
          <div class="modal__field">
            <label class="modal__label">Dirección</label>
            <input id="v-addr" class="modal__input" type="text"
              placeholder="I0.0, Q0.0, AIW10, AQW10, MW10…"/>
          </div>
          <div class="modal__field">
            <label class="modal__label">Nombre</label>
            <input id="v-name" class="modal__input" type="text" placeholder="Temperatura_1…"/>
          </div>

          <!-- Campos analógicos — se muestran solo cuando la dirección es AIW/AQW/MW -->
          <div id="v-analog-fields" style="display:none">
            <div class="modal__analog-badge">⚡ Señal analógica</div>
            <div class="modal__field modal__field--analog">
              <div>
                <label class="modal__label">Valor mínimo (raw)</label>
                <input id="v-min" class="modal__input" type="number" value="0" step="1"/>
              </div>
              <div>
                <label class="modal__label">Valor máximo (raw)</label>
                <input id="v-max" class="modal__input" type="number" value="27648" step="1"/>
              </div>
            </div>
            <div class="modal__field">
              <label class="modal__label">Unidad de ingeniería (opcional)</label>
              <input id="v-unit" class="modal__input" type="text" placeholder="°C, bar, %, m³/h…"/>
            </div>
          </div>

          <div class="modal__actions">
            <button class="btn-secondary" id="v-cancel">Cancelar</button>
            <button class="btn-primary"   id="v-ok">Agregar</button>
          </div>
        </div>`;

      document.body.appendChild(modal);

      const addrInput = document.getElementById('v-addr');
      const analogFields = document.getElementById('v-analog-fields');

      // Mostrar/ocultar campos analógicos según la dirección
      addrInput.addEventListener('input', () => {
        const isAnalog = _isAnalogAddress(addrInput.value);
        analogFields.style.display = isAnalog ? '' : 'none';
      });

      document.getElementById('v-cancel').onclick = () => modal.remove();

      document.getElementById('v-ok').onclick = () => {
        const addr = addrInput.value.trim().toUpperCase();
        const name = document.getElementById('v-name').value.trim();
        const isAnalog = _isAnalogAddress(addr);

        // Validar dirección
        let sigType;
        if (isAnalog) {
          sigType = 'analog';
        } else {
          if (!utils.isValidAddress(addr)) {
            utils.toast('Dirección inválida', 'error', 2500);
            return;
          }
          sigType = utils.getAddressType(addr);
        }

        // Extra para analógicas
        const extra = isAnalog ? {
          min:  parseFloat(document.getElementById('v-min')?.value  ?? 0),
          max:  parseFloat(document.getElementById('v-max')?.value  ?? 27648),
          unit: document.getElementById('v-unit')?.value.trim() ?? '',
        } : undefined;

        // Validar analógicas antes de intentar agregar
        if (sigType === 'analog') {
          const num = parseInt(addr.replace(/^[A-Z]+/, ''));
          if (num % 2 !== 0) {
            utils.toast(`${addr} inválida — las analógicas deben ser pares: AIW10, AIW12…`, 'error', 4000);
            return;
          }
          if (num < 10) {
            utils.toast(`${addr} inválida — las analógicas parten desde el 10: AIW10, AIW12…`, 'error', 4000);
            return;
          }
        }

        const added = state.addSignal(addr, name || addr, sigType, extra);
        added
          ? utils.toast(`${addr} agregada`, 'success', 2000)
          : utils.toast('Señal ya existe', 'warning', 2000);
        modal.remove();
      };

      modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
      addrInput.focus();
    }

    /* ----------------------------------------------------------
       INYECTAR PESTAÑA "ANALÓGICO" EN EL PANEL I/O
       Se busca el panel I/O y se agrega la sección si existe en el HTML.
       Si el HTML ya tiene un <ul id="list-analogs">, este código lo
       rellena automáticamente.
    ---------------------------------------------------------- */
    function _injectAnalogPanel() {
      // Si ya existe el panel en el HTML no hacer nada
      if (utils.byId('list-analogs')) {
        _rebuildAnalogPanel();
        return;
      }

      // Buscar el contenedor de señales I/O
      const ioPanel = document.querySelector('.io-section, .panel-io, [data-panel="io"]');
      if (!ioPanel) return;

      // Crear sección analógica
      const section = utils.createElement('div', { cls: 'io-group', attrs: { 'data-group': 'analog' } });
      const label   = utils.createElement('div', { cls: 'io-group__label', text: 'Analógico' });
      const list    = utils.createElement('div', { id: 'list-analogs', cls: 'io-list io-list--analog' });
      section.appendChild(label);
      section.appendChild(list);
      ioPanel.appendChild(section);

      _rebuildAnalogPanel();
    }

    /* ----------------------------------------------------------
       ESCUCHAR CAMBIOS DE SEÑALES ANALÓGICAS
    ---------------------------------------------------------- */
    state.on('signal:changed', ({ address }) => {
      const sig = state.getSignal(address);
      if (sig && sig.type === 'analog') {
        _updateSignalRow(address);
        const tdVal = document.querySelector(`#var-table-body td[data-value="${address}"]`);
        if (tdVal) {
          const v = state.getAnalogValue(address);
          tdVal.textContent = _fmtAnalogVal(v) + (sig.unit ? ` ${sig.unit}` : '');
        }
      }
    });

    // Interceptar scan-update para actualizar todas las analógicas en RUN
    document.addEventListener('llt:scan-update', () => {
      if (state.getMode() !== 'RUN') return;
      Object.values(state.getSignals())
        .filter(s => s.type === 'analog')
        .forEach(sig => {
          _updateSignalRow(sig.address);
          const tdVal = document.querySelector(`#var-table-body td[data-value="${sig.address}"]`);
          if (tdVal) {
            const v = state.getAnalogValue(sig.address);
            tdVal.textContent = _fmtAnalogVal(v) + (sig.unit ? ` ${sig.unit}` : '');
          }
        });
    });

    state.on('signals:changed', () => {
      _rebuildIOPanel();
    });

    /* ----------------------------------------------------------
       SOBREESCRIBIR FUNCIONES EN LLT.editor (si ya fue inicializado)
       Esto permite usar el parche como archivo separado.
    ---------------------------------------------------------- */
    if (global.LLT.editor) {
      // Exponer las funciones del parche
      global.LLT.editor._buildIORow      = _buildIORow;
      global.LLT.editor._updateSignalRow = _updateSignalRow;
      global.LLT.editor._rebuildIOPanel  = _rebuildIOPanel;
      global.LLT.editor.showAddVarModal  = _showAddVarModal;
      global.LLT.editor._updateAnalogRow = _updateSignalRow;
    }

    // Inyectar panel analógico
    _injectAnalogPanel();

    // Rebuildear el panel I/O completo
    _rebuildIOPanel();

    utils.toast('Módulo analógico cargado', 'info', 2000);
  });

}(window));