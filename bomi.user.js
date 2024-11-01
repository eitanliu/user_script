// ==UserScript==
// @name         bomi
// @namespace    http://tampermonkey.net/
// @version      2024-06-18
// @description  try to take over the world!
// @author       eitanliu
// @match        http://*/*
// @match        https://*/*
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIyNHB4IiBmaWxsPSJ1bmRlZmluZWQiPjxwYXRoIGQ9Ik0zNTItMTIwSDIwMHEtMzMgMC01Ni41LTIzLjVUMTIwLTIwMHYtMTUycTQ4IDAgODQtMzAuNXQzNi03Ny41cTAtNDctMzYtNzcuNVQxMjAtNTY4di0xNTJxMC0zMyAyMy41LTU2LjVUMjAwLTgwMGgxNjBxMC00MiAyOS03MXQ3MS0yOXE0MiAwIDcxIDI5dDI5IDcxaDE2MHEzMyAwIDU2LjUgMjMuNVQ4MDAtNzIwdjE2MHE0MiAwIDcxIDI5dDI5IDcxcTAgNDItMjkgNzF0LTcxIDI5djE2MHEwIDMzLTIzLjUgNTYuNVQ3MjAtMTIwSDU2OHEwLTUwLTMxLjUtODVUNDYwLTI0MHEtNDUgMC03Ni41IDM1VDM1Mi0xMjBabS0xNTItODBoODVxMjQtNjYgNzctOTN0OTgtMjdxNDUgMCA5OCAyN3Q3NyA5M2g4NXYtMjQwaDgwcTggMCAxNC02dDYtMTRxMC04LTYtMTR0LTE0LTZoLTgwdi0yNDBINDgwdi04MHEwLTgtNi0xNHQtMTQtNnEtOCAwLTE0IDZ0LTYgMTR2ODBIMjAwdjg4cTU0IDIwIDg3IDY3dDMzIDEwNXEwIDU3LTMzIDEwNHQtODcgNjh2ODhabTI2MC0yNjBaIi8+PC9zdmc+
// @grant        none
// @downloadURL https://github.com/eitanliu/user_script/raw/refs/heads/main/bomi.user.js
// @updateURL https://github.com/eitanliu/user_script/raw/refs/heads/main/bomi.user.js
// ==/UserScript==

(function () {
  'use strict';
  var _bomi = {
    isDebug() {
      return true;
    },
    /**
     * @param {string} event
     * @param {URL} url 
     */
    onPageChange(event, url) {
      let host = url.host;
      let path = url.pathname;
      if (_bomi.isDebug()) console.log(`BOMI onPageChange ${event} ${host} ${path}`, url)
      if (_bomi.existsWindowProperty('_xbomi.onPageChange')) {
        _xbomi.onPageChange(event, JSON.stringify(url))
      }
    },
    /**
     * @param {any|string|String} headers 
     * @returns 
     */
    parseHeaders(headers) {
      if (typeof headers === 'string' || headers instanceof String) {
        var headerMap = {};
        headers.split(/\r?\n/).forEach(line => {
          var index = line.indexOf(': ');
          var key = line.substring(0, index);
          var value = line.substring(index + 2);
          if (key.trim() !== '') headerMap[key] = value;
        });
        return headerMap;
      }
      return headers;
    },
    parseData(data, contentType) {
      if (contentType == null || !(typeof data === 'string' || data instanceof String)) return data;

      try {
        if (contentType.includes('application/json')) {
          return JSON.parse(data);
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          let params = new URLSearchParams(data);
          return Array.from(params).reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});
        }
      } catch (error) {
        if (_bomi.isDebug()) console.log('ParseData Error Type: ', contentType, '\nData: ', data, '\nError: ', error);
        return data;
      }
      return data;
    },
    /**
     * @param {string} path
     * @returns {boolean}
     */
    existsWindowProperty(path) {
      return _bomi.existsPathProperty(window, path)
    },
    /**
     * @param {*} obj
     * @param {string} path
     * @returns {boolean}
     */
    existsPathProperty(obj, path) {
      if (typeof obj === 'undefined' || obj === null) return false;
      const parts = path.split('.');
      return _bomi.existsPartsProperty(obj, parts)
    },
    /**
     *
     * @param {*} obj
     * @param {string[]} parts
     * @returns {boolean}
     */
    existsPartsProperty(obj, parts) {
      let current = obj;
      for (let i = 0; i < parts.length; i++) {
        if (typeof current[parts[i]] === 'undefined') return false;
        current = current[parts[i]];
      }
      return true;
    }
  };

  window.addEventListener('hashchange', (event) => {
    if (_bomi.isDebug()) console.log(`BOMI hashchange ${location.href} \nnew${event.newURL} \nold: ${event.oldURL}\n`, location);
    if (_bomi.existsWindowProperty('_xbomi.hashChange')) {
      _xbomi.hashChange(JSON.stringify(location))
    }
  });

  window.addEventListener('popstate', (event) => {
    // if (_bomi.isDebug()) console.log(`BOMI popState ${location.href}`, location);
    if (_bomi.existsWindowProperty('_xbomi.popState')) {
      _xbomi.popState(JSON.stringify(location))
    }
    _bomi.onPageChange('popState', location)
  });

  let originalPushState = history.pushState;
  let originalReplaceState = history.replaceState;

  history.pushState = function (data, unused, url) {
    let result = originalPushState.apply(this, arguments);
    // if (_bomi.isDebug()) console.log(`BOMI pushState ${location.href} \nnewUrl ${url}\n`, location);
    if (_bomi.existsWindowProperty('_xbomi.pushState')) {
      _xbomi.pushState(JSON.stringify(location))
    }
    _bomi.onPageChange('pushState', location)
    return result
  };

  history.replaceState = function (data, unused, url) {
    let result = originalReplaceState.apply(this, arguments);
    // if (_bomi.isDebug()) console.log(`BOMI replaceState ${location.href} \nnewUrl ${url}\n`, location);
    if (_bomi.existsWindowProperty('_xbomi.replaceState')) {
      _xbomi.replaceState(JSON.stringify(location))
    }
    _bomi.onPageChange('replaceState', location)
    return result
  };

  document.addEventListener("DOMContentLoaded", (event) => {
    if (_bomi.isDebug()) console.log(`BOMI domLoaded ${location.href}\n`, location);
    if (_bomi.existsWindowProperty('_xbomi.domContentLoaded')) {
      _xbomi.domContentLoaded(JSON.stringify(location))
    }
  });

  document.addEventListener("readystatechange", (event) => {
    let readyState = document.readyState;
    // if (_bomi.isDebug()) console.log(`BOMI readystate: ${readyState} ${location.href}\n`, location);
    if (_bomi.existsWindowProperty('_xbomi.readyStateChange')) {
      _xbomi.readyStateChange(readyState, JSON.stringify(location))
    }
    _bomi.onPageChange(readyState, location)
    switch (readyState) {
      case 'loading':
        break;
      case 'interactive':
        break;
      case 'complete':
        break;
    }
  });

  window.addEventListener("load", (event) => {
    if (_bomi.isDebug()) console.log(`BOMI load ${location.href}\n`, location);
    if (_bomi.existsWindowProperty('_xbomi.windowLoaded')) {
      _xbomi.windowLoaded(JSON.stringify(location))
    }
  });

})();
