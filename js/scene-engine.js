/* ============================================================
   LADDER LOGIC TRAINER — scene-engine.js
   Motor de escenas visuales. Carga la escena asociada al
   ejercicio activo y la actualiza en cada scan tick.
   Disponible como window.LLT.sceneEngine
   ============================================================ */

(function (global) {
  'use strict';

  const { state, utils } = global.LLT;

  let _currentScene  = null;   // instancia de escena activa
  let _container     = null;   // div donde se renderiza
  let _scanUnsub     = null;   // para desuscribirse del scan tick

  /* ----------------------------------------------------------
     CONTENEDOR — se inyecta en el layout al inicializar
  ---------------------------------------------------------- */
  function init() {
    // Crear el panel de escena (oculto por defecto)
    const scenePanel = document.createElement('div');
    scenePanel.id         = 'scene-panel';
    scenePanel.style.cssText = `
      display: none;
      position: absolute;
      inset: 0;
      background: #0d110e;
      z-index: 10;
      flex-direction: column;
    `;

    // Barra superior de la escena
    const sceneBar = document.createElement('div');
    sceneBar.id = 'scene-bar';
    sceneBar.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 14px;
      background: #111612;
      border-bottom: 1px solid #1e2a1f;
      flex-shrink: 0;
    `;
    sceneBar.innerHTML = `
      <span id="scene-title" style="font-family:monospace;font-size:11px;color:#8a9a8a;letter-spacing:.06em"></span>
      <button id="btn-back-editor" style="
        font-family:monospace;font-size:10px;padding:3px 10px;
        background:#1a1a12;border:1px solid #2a2a1a;color:#8a9a8a;
        border-radius:3px;cursor:pointer;letter-spacing:.06em;
      ">← Editor</button>
    `;

    // Contenedor del canvas de escena
    _container = document.createElement('div');
    _container.id = 'scene-canvas';
    _container.style.cssText = `
      flex: 1;
      position: relative;
      overflow: hidden;
    `;

    scenePanel.appendChild(sceneBar);
    scenePanel.appendChild(_container);

    // Insertar dentro del canvas-area (panel central)
    const canvasArea = document.querySelector('.canvas-area');
    if (canvasArea) {
      canvasArea.style.position = 'relative';
      canvasArea.appendChild(scenePanel);
    }

    // Botón volver al editor
    utils.byId('btn-back-editor')?.addEventListener('click', hideScene);

    // Botón "Ver escena" en la barra del canvas (lo agregamos aquí)
    _injectSceneButton();

    // Suscribirse al scan tick para actualizar la escena
    _scanUnsub = state.on('scan:tick', _onScanTick);
  }

  /* ----------------------------------------------------------
     BOTÓN VER ESCENA — se inyecta en la barra del canvas
  ---------------------------------------------------------- */
  function _injectSceneButton() {
    const toolbar = document.querySelector('.canvas-toolbar__right');
    if (!toolbar) return;

    const btn = document.createElement('button');
    btn.id        = 'btn-show-scene';
    btn.className = 'icon-btn';
    btn.title     = 'Ver escena del ejercicio';
    btn.textContent = '⬡ Escena';
    btn.style.display = 'none';   // oculto hasta que haya ejercicio activo
    btn.addEventListener('click', showScene);
    toolbar.appendChild(btn);
  }

  /* ----------------------------------------------------------
     CARGAR ESCENA
  ---------------------------------------------------------- */
  async function loadScene(exerciseId) {
    // Destruir escena anterior si existe
    _destroyCurrentScene();

    try {
      // Cargar el módulo de la escena dinámicamente
      const script = document.createElement('script');
      script.src = `exercises/scenes/${exerciseId}.js`;

      await new Promise((resolve, reject) => {
        script.onload  = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      // La escena se registra en LLT.scenes[exerciseId]
      const sceneDef = global.LLT.scenes?.[exerciseId];
      if (!sceneDef) {
        console.warn(`[SceneEngine] No se encontró escena para ${exerciseId}`);
        _hideSceneButton();
        return;
      }

      _currentScene = sceneDef;

      // Título en la barra
      const ex = state.getActiveExercise();
      const titleEl = utils.byId('scene-title');
      if (titleEl && ex) titleEl.textContent = `Escena — ${ex.title}`;

      // Construir la escena en el contenedor
      _currentScene.build(_container, state.getSignals());

      // Mostrar botón Ver escena
      _showSceneButton();

    } catch (err) {
      console.warn(`[SceneEngine] Sin escena para ${exerciseId}:`, err.message);
      _hideSceneButton();
    }
  }

  /* ----------------------------------------------------------
     MOSTRAR / OCULTAR
  ---------------------------------------------------------- */
  function showScene() {
    const panel = utils.byId('scene-panel');
    if (panel) panel.style.display = 'flex';
  }

  function hideScene() {
    const panel = utils.byId('scene-panel');
    if (panel) panel.style.display = 'none';
  }

  function _showSceneButton() {
    const btn = utils.byId('btn-show-scene');
    if (btn) btn.style.display = '';
  }

  function _hideSceneButton() {
    const btn = utils.byId('btn-show-scene');
    if (btn) btn.style.display = 'none';
  }

  /* ----------------------------------------------------------
     SCAN TICK — actualizar escena en cada ciclo
  ---------------------------------------------------------- */
  function _onScanTick() {
    // Actualizar escena normal
    if (_currentScene) {
      const panel = utils.byId('scene-panel');
      if (panel && panel.style.display !== 'none') {
        try {
          _currentScene.update(state.getSignals(), state.getMode());
        } catch (err) {
          console.error('[SceneEngine] Error en update:', err);
        }
      }
    }
    // Actualizar escena split
    if (_splitScene && _splitContainer) {
      try {
        _splitScene.update(state.getSignals(), state.getMode());
      } catch (err) {
        console.error('[SceneEngine] Error en split update:', err);
      }
    }
  }

  /* ----------------------------------------------------------
     DESTRUIR ESCENA ACTUAL
  ---------------------------------------------------------- */
  function _destroyCurrentScene() {
    if (_currentScene?.destroy) {
      try { _currentScene.destroy(); } catch (e) {}
    }
    _currentScene = null;
    if (_container) _container.innerHTML = '';
    hideScene();
    _hideSceneButton();
  }

  /* ----------------------------------------------------------
     API PÚBLICA
  ---------------------------------------------------------- */
  /* ----------------------------------------------------------
     CARGAR ESCENA EN CONTENEDOR EXTERNO (split view)
  ---------------------------------------------------------- */
  let _splitContainer   = null;
  let _splitScene       = null;

  function loadSceneInto(exerciseId, container) {
    // Destruir escena split anterior
    if (_splitScene?.destroy) {
      try { _splitScene.destroy(); } catch (e) {}
    }
    _splitScene     = null;
    _splitContainer = container;
    if (container) container.innerHTML = '';

    const sceneDef = global.LLT.scenes?.[exerciseId];
    if (!sceneDef) {
      console.warn(`[SceneEngine] No se encontró escena para ${exerciseId}`);
      return;
    }

    _splitScene = sceneDef;
    _splitScene.build(container, state.getSignals());
  }

  function destroySplit() {
    if (_splitScene?.destroy) {
      try { _splitScene.destroy(); } catch (e) {}
    }
    _splitScene     = null;
    _splitContainer = null;
  }

  /* ----------------------------------------------------------
     API PÚBLICA
  ---------------------------------------------------------- */
  global.LLT.sceneEngine = {
    init,
    loadScene,
    loadSceneInto,
    destroySplit,
    showScene,
    hideScene,
  };

}(window));