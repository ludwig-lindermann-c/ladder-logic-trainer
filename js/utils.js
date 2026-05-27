/* ============================================================
   LADDER LOGIC TRAINER — utils.js
   Funciones auxiliares puras, sin dependencias externas.
   Disponibles globalmente como window.LLT.utils
   ============================================================ */

(function (global) {
  'use strict';

  /* ----------------------------------------------------------
     NAMESPACE RAÍZ
  ---------------------------------------------------------- */
  global.LLT = global.LLT || {};

  const utils = {};

  /* ----------------------------------------------------------
     IDENTIFICADORES ÚNICOS
  ---------------------------------------------------------- */

  /**
   * Genera un ID único con prefijo opcional.
   * @param {string} prefix - ej: 'rung', 'cell', 'comp'
   * @returns {string} ej: 'rung_a3f9b2'
   */
  utils.uid = function (prefix = 'id') {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
  };

  /* ----------------------------------------------------------
     VALIDACIÓN DE DIRECCIONES PLC
     Formatos soportados: I0.0, Q0.0, M0.0, T0, C0, DB1.DBX0.0
  ---------------------------------------------------------- */

  const ADDRESS_PATTERNS = {
    input:   /^I([0-9])\.[0-7]$/,
    output:  /^Q([0-9])\.[0-7]$/,
    mark:    /^M([0-9])\.[0-7]$/,
    timer:   /^T([0-9]|[1-9][0-9])$/,
    counter: /^C([0-9]|[1-9][0-9])$/,
    aiw:     /^AIW([1-9][0-9]|[1-9]\d*)$/,
    aqw:     /^AQW([1-9][0-9]|[1-9]\d*)$/,
    mw:      /^MW([1-9][0-9]|[1-9]\d*)$/,
    md:      /^MD([1-9][0-9]{2,}|[1-9]\d*)$/,
  };

  /**
   * Valida si una cadena es una dirección PLC válida.
   * @param {string} addr
   * @returns {boolean}
   */
  utils.isValidAddress = function (addr) {
    if (!addr || typeof addr !== 'string') return false;
    const normalized = addr.trim().toUpperCase();
    return Object.values(ADDRESS_PATTERNS).some(re => re.test(normalized));
  };

  /**
   * Devuelve el tipo de dirección PLC o null si no es válida.
   * @param {string} addr
   * @returns {'input'|'output'|'mark'|'timer'|'counter'|'db'|null}
   */
  utils.getAddressType = function (addr) {
    if (!addr) return null;
    const normalized = addr.trim().toUpperCase();
    for (const [type, re] of Object.entries(ADDRESS_PATTERNS)) {
      if (re.test(normalized)) return type;
    }
    return null;
  };

  utils.isAnalogAddress = function (addr) {
    if (!addr) return false;
    const a = addr.trim().toUpperCase();
    return /^AIW\d+$/.test(a) || /^AQW\d+$/.test(a) ||
           /^MW\d+$/.test(a)  || /^MD\d+$/.test(a);
  };

  /**
   * Normaliza una dirección (trim + uppercase).
   * @param {string} addr
   * @returns {string}
   */
  utils.normalizeAddress = function (addr) {
    return (addr || '').trim().toUpperCase();
  };

  /* ----------------------------------------------------------
     MANIPULACIÓN DE ARRAYS
  ---------------------------------------------------------- */

  /**
   * Inserta un elemento en un array en la posición indicada.
   * Devuelve un nuevo array (inmutable).
   */
  utils.arrayInsert = function (arr, index, item) {
    const copy = [...arr];
    copy.splice(index, 0, item);
    return copy;
  };

  /**
   * Elimina el elemento en la posición indicada.
   * Devuelve un nuevo array (inmutable).
   */
  utils.arrayRemove = function (arr, index) {
    const copy = [...arr];
    copy.splice(index, 1);
    return copy;
  };

  /**
   * Mueve un elemento de fromIndex a toIndex.
   * Devuelve un nuevo array (inmutable).
   */
  utils.arrayMove = function (arr, fromIndex, toIndex) {
    const copy = [...arr];
    const [item] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, item);
    return copy;
  };

  /**
   * Clona en profundidad un objeto serializable.
   */
  utils.deepClone = function (obj) {
    return JSON.parse(JSON.stringify(obj));
  };

  /* ----------------------------------------------------------
     DOM HELPERS
  ---------------------------------------------------------- */

  /**
   * Shorthand para document.getElementById.
   * @param {string} id
   * @returns {HTMLElement|null}
   */
  utils.byId = function (id) {
    return document.getElementById(id);
  };

  /**
   * Shorthand para document.querySelector.
   * @param {string} selector
   * @param {Element} [root=document]
   * @returns {Element|null}
   */
  utils.qs = function (selector, root = document) {
    return root.querySelector(selector);
  };

  /**
   * Shorthand para document.querySelectorAll (devuelve Array).
   * @param {string} selector
   * @param {Element} [root=document]
   * @returns {Element[]}
   */
  utils.qsa = function (selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  };

  /**
   * Crea un elemento HTML con atributos y clases opcionales.
   * @param {string} tag
   * @param {object} opts - { cls, id, attrs, text }
   * @returns {HTMLElement}
   */
  utils.createElement = function (tag, opts = {}) {
    const el = document.createElement(tag);
    if (opts.cls) {
      const classes = Array.isArray(opts.cls) ? opts.cls : opts.cls.split(' ');
      el.classList.add(...classes.filter(Boolean));
    }
    if (opts.id)    el.id = opts.id;
    if (opts.text)  el.textContent = opts.text;
    if (opts.html)  el.innerHTML = opts.html;
    if (opts.attrs) {
      for (const [k, v] of Object.entries(opts.attrs)) {
        el.setAttribute(k, v);
      }
    }
    return el;
  };

  /**
   * Elimina todos los hijos de un elemento.
   * @param {HTMLElement} el
   */
  utils.clearChildren = function (el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  };

  /* ----------------------------------------------------------
     EVENTOS
  ---------------------------------------------------------- */

  /**
   * Agrega múltiples listeners de una vez.
   * @param {EventTarget} target
   * @param {string[]} events
   * @param {Function} handler
   */
  utils.onEvents = function (target, events, handler) {
    events.forEach(ev => target.addEventListener(ev, handler));
  };

  /**
   * Delega un evento desde un ancestro a elementos que
   * coincidan con un selector CSS.
   * @param {EventTarget} parent
   * @param {string} event
   * @param {string} selector
   * @param {Function} handler
   */
  utils.delegate = function (parent, event, selector, handler) {
    parent.addEventListener(event, function (e) {
      const target = e.target.closest(selector);
      if (target && parent.contains(target)) {
        handler.call(target, e, target);
      }
    });
  };

  /* ----------------------------------------------------------
     FORMATO Y PRESENTACIÓN
  ---------------------------------------------------------- */

  /**
   * Formatea milisegundos como string legible.
   * @param {number} ms
   * @returns {string} ej: '1.250 s', '350 ms'
   */
  utils.formatTime = function (ms) {
    if (ms >= 1000) return `${(ms / 1000).toFixed(3)} s`;
    return `${ms} ms`;
  };

  /**
   * Rellena un número con ceros a la izquierda.
   * @param {number} n
   * @param {number} width
   * @returns {string}
   */
  utils.zeroPad = function (n, width = 2) {
    return String(n).padStart(width, '0');
  };

  /**
   * Trunca un string si supera maxLen, añadiendo '…'.
   * @param {string} str
   * @param {number} maxLen
   * @returns {string}
   */
  utils.truncate = function (str, maxLen = 16) {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
  };

  /* ----------------------------------------------------------
     SERIALIZACIÓN / EXPORTACIÓN
  ---------------------------------------------------------- */

  /**
   * Descarga un objeto como archivo JSON.
   * @param {object} data
   * @param {string} filename
   */
  utils.downloadJSON = function (data, filename = 'programa.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Lee un archivo JSON seleccionado por el usuario.
   * Devuelve una Promise con el objeto parseado.
   * @returns {Promise<object>}
   */
  utils.loadJSONFile = function () {
    return new Promise((resolve, reject) => {
      const input    = document.createElement('input');
      input.type     = 'file';
      input.accept   = '.json,application/json';
      input.onchange = function () {
        const file   = input.files[0];
        if (!file) return reject(new Error('No se seleccionó archivo'));
        const reader = new FileReader();
        reader.onload  = e => {
          try { resolve(JSON.parse(e.target.result)); }
          catch (err) { reject(new Error('JSON inválido')); }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsText(file);
      };
      input.click();
    });
  };

  /* ----------------------------------------------------------
     TOAST — Notificaciones no bloqueantes
  ---------------------------------------------------------- */

  let _toastContainer = null;

  function getToastContainer () {
    if (!_toastContainer) {
      _toastContainer = utils.createElement('div', { cls: 'toast-container', id: 'toast-container' });
      document.body.appendChild(_toastContainer);
    }
    return _toastContainer;
  }

  /**
   * Muestra una notificación toast.
   * @param {string} message
   * @param {'success'|'warning'|'error'|'info'} type
   * @param {number} duration - ms antes de desaparecer (0 = permanente)
   */
  utils.toast = function (message, type = 'info', duration = 3000) {
    const container = getToastContainer();
    const toast = utils.createElement('div', {
      cls:  `toast toast--${type}`,
      text: message,
    });
    container.appendChild(toast);
    if (duration > 0) {
      setTimeout(() => {
        toast.style.opacity    = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 320);
      }, duration);
    }
    return toast;
  };

  /* ----------------------------------------------------------
     THROTTLE / DEBOUNCE
  ---------------------------------------------------------- */

  /**
   * Limita la frecuencia de ejecución de una función.
   * @param {Function} fn
   * @param {number} limit - ms mínimos entre ejecuciones
   * @returns {Function}
   */
  utils.throttle = function (fn, limit) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= limit) {
        last = now;
        return fn.apply(this, args);
      }
    };
  };

  /**
   * Retrasa la ejecución hasta que pase un tiempo de inactividad.
   * @param {Function} fn
   * @param {number} delay - ms de espera
   * @returns {Function}
   */
  utils.debounce = function (fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  /* ----------------------------------------------------------
     VALIDACIÓN DE PROGRAMA
  ---------------------------------------------------------- */

  /**
   * Verifica que un rung tenga al menos un elemento y una bobina.
   * @param {object} rung - objeto de rung del state
   * @returns {{ valid: boolean, errors: string[] }}
   */
  utils.validateRung = function (rung) {
    const errors = [];
    if (!rung.elements || rung.elements.length === 0) {
      errors.push('El rung está vacío.');
    }
    const hasOutput = (rung.elements || []).some(el =>
      el.type && el.type.startsWith('coil')
    );
    if (!hasOutput) {
      errors.push('El rung no tiene bobina de salida.');
    }
    return { valid: errors.length === 0, errors };
  };

  /**
   * Verifica que un programa completo tenga rungs válidos.
   * @param {object[]} rungs
   * @returns {{ valid: boolean, errors: string[] }}
   */
  utils.validateProgram = function (rungs) {
    const errors = [];
    if (!rungs || rungs.length === 0) {
      errors.push('El programa no tiene rungs.');
      return { valid: false, errors };
    }
    rungs.forEach((rung, i) => {
      const result = utils.validateRung(rung);
      result.errors.forEach(e => errors.push(`Rung ${i + 1}: ${e}`));
    });
    return { valid: errors.length === 0, errors };
  };

  /* ----------------------------------------------------------
     EXPORTAR AL NAMESPACE
  ---------------------------------------------------------- */
  global.LLT.utils = utils;

}(window));