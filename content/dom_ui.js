"use strict";
DomUtils.UI = {
  container: null,
  styleIn: null,
  styleOut: null,
  root: null,
  flashLastingTime: 400,
  addElement: function(element) {
    MainPort.sendMessage({ handler: "initInnerCSS" }, this.InitInner);
    this.container || this.init();
    this.container.style.display = "none";
    this.root = this.container.createShadowRoot();
    this.root.appendChild(element);
    this.addElement = function(element) { this.root.appendChild(element); };
  },
  addElementList: function(els, attrs) {
    var parent, _i, _len;
    parent = DomUtils.createElement("div");
    parent.className = attrs.className;
    parent.id = attrs.id;
    for (_i = 0, _len = els.length; _i < _len; _i++) {
      parent.appendChild(els[_i]);
    }
    this.addElement(parent);
    return parent;
  },
  adjust: null,
  init: function(showing) {
    var el = this.container = DomUtils.createElement("vimium");
    if (this.styleOut) {
      el.appendChild(this.styleOut);
      showing !== false && document.documentElement.appendChild(el);
    }
    this.init = null;
  },
  InitInner: function(innerCss) {
    var _this = DomUtils.UI;
    _this.InitInner = null;
    _this.styleIn = _this.createStyle(innerCss);
    _this.root.insertBefore(_this.styleIn, _this.root.firstElementChild);
    setTimeout(_this.Toggle, 17, true);
    _this.adjust();
  },
  Toggle: function(enabled) {
    DomUtils.UI.container.style.display = enabled ? "" : "none";
    enabled && VInsertMode.heldEl && VInsertMode.heldEl.focus();
  },
  createStyle: function(text) {
    var css = DomUtils.createElement("style");
    css.type = "text/css";
    css.textContent = text;
    return css;
  },
  insertInnerCSS: function(inner) {
    this.styleIn && (this.styleIn.textContent = inner);
  },
  insertCSS: function(outer, showing) {
    if (this.styleOut) {
      if (outer) {
        this.styleOut.textContent = outer;
      } else {
        this.styleOut.remove();
        this.styleOut = null;
      }
    } else {
      this.styleOut = this.createStyle(outer);
      if (this.container) {
        this.container.appendChild(this.styleOut);
      } else {
        this.init(showing);
      }
    }
  },
  removeSelection: function(root) {
    var sel = (root || this.root).getSelection(), el, ind;
    if (sel.type !== "Range" || !sel.anchorNode) {
      return false;
    }
    if (!root && (el = VInsertMode.lock)) {
      ind = el.selectionDirection === "forward" && el.selectionEnd < el.value.length ?
          el.selectionStart : el.selectionEnd;
      el.setSelectionRange(ind, ind);
    } else {
      sel.removeAllRanges();
    }
    return true;
  },
  simulateSelect: function(element, flash, suppressRepeated) {
    if (element !== VInsertMode.lock) { element.focus(); }
    DomUtils.simulateClick(element);
    flash === true && this.flashOutline(element);
    if (element !== VInsertMode.lock) { return; }
    var len = element.value ? +element.value.length : -1;
    if (len > 0) {
      try {
        if (element.setSelectionRange && !element.selectionEnd) {
          element.setSelectionRange(len, len);
        }
      } catch (element) {}
    }
    suppressRepeated === true && LinkHints.suppressTail(true);
  },
  flashOutline: function(clickEl, virtual) {
    var rect, bcr;
    DomUtils.prepareCrop();
    if (clickEl.classList.contains("OIUrl") && Vomnibar.vomnibarUI.box
        && Vomnibar.vomnibarUI.box.contains(clickEl)) {
      rect = Vomnibar.vomnibarUI.computeHint(clickEl.parentElement.parentElement, clickEl);
    } else {
      rect = DomUtils.getVisibleClientRect(clickEl);
      bcr = VRect.fromClientRect(clickEl.getBoundingClientRect());
      if (!rect || VRect.isContaining(bcr, rect)) {
        rect = bcr;
      }
    }
    if (virtual !== true) {
      this.flashVRect(rect);
    }
    return rect;
  },
  flashVRect: function(rect, time) {
    var flashEl = DomUtils.createElement("div"), x, y;
    flashEl.className = "R Flash";
    if (rect[0] < 0 || rect[1] < 0 || rect[2] > window.innerWidth ||
        rect[3] > window.innerHeight) {
      x = window.scrollX; y = window.scrollY;
      flashEl.style.position = "absolute";
    } else {
      x = 0; y = 0;
    }
    flashEl.style.left = x + rect[0] + "px";
    flashEl.style.top = y + rect[1] + "px";
    flashEl.style.width = (rect[2] - rect[0]) + "px";
    flashEl.style.height = (rect[3] - rect[1]) + "px";
    this.addElement(flashEl);
    return setTimeout(function() {
      flashEl.remove();
    }, time || this.flashLastingTime);
  },
  SuppressMost: function(event) {
    var n = event.keyCode;
    if (n != KeyCodes.esc) {
      return (n > KeyCodes.f1 + 1 && n <= KeyCodes.f12) ? 1 : 2;
    }
    if (this && KeyboardUtils.isPlain(event) && this.handlerId) {
      handlerStack.remove(this.handlerId);
      return 2;
    }
    return 1;
  }
};
