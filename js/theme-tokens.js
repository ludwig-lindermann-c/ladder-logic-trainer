// js/theme-tokens.js
(function (global) {
  'use strict';

  global.LLT = global.LLT || {};

  const _root = document.documentElement;

  function _css(varName) {
    return getComputedStyle(_root).getPropertyValue(varName).trim();
  }

  global.LLT.theme = {
    // Fondos
    get bgDeep()    { return _css('--clr-bg-deep'); },
    get bgBase()    { return _css('--clr-bg-base'); },
    get bgPanel()   { return _css('--clr-bg-panel'); },
    get bgSurface() { return _css('--clr-bg-surface'); },
    get bgElevated(){ return _css('--clr-bg-elevated'); },

    // Bordes
    get borderSubtle() { return _css('--clr-border-subtle'); },
    get borderMid()    { return _css('--clr-border-mid'); },
    get borderStrong() { return _css('--clr-border-strong'); },

    // Texto
    get textPrimary()   { return _css('--text-primary'); },
    get textSecondary() { return _css('--text-secondary'); },
    get textMuted()     { return _css('--text-muted'); },
    get textAccent()    { return _css('--text-accent'); },

    // Acento verde
    get green()      { return _css('--clr-green'); },
    get greenBright(){ return _css('--clr-green-bright'); },
    get greenDim()   { return _css('--clr-green-dim'); },

    // Ámbar
    get amber()      { return _css('--clr-amber'); },
    get amberBright(){ return _css('--clr-amber-bright'); },

    // Error
    get error()      { return _css('--clr-error'); },
    get errorDim()   { return _css('--clr-error-dim'); },
  };

}(window));