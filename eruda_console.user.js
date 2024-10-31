// ==UserScript==
// @name         Eruda Console
// @namespace    http://tampermonkey.net/
// @version      2024-06-18
// @description  load the web page console to debug or get some information etc.
// @author       eitanliu
// @match        http://*/*
// @match        https://*/*
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIyNHB4IiBmaWxsPSJ1bmRlZmluZWQiPjxwYXRoIGQ9Ik0xNjAtMTYwcS0zMyAwLTU2LjUtMjMuNVQ4MC0yNDB2LTQ4MHEwLTMzIDIzLjUtNTYuNVQxNjAtODAwaDY0MHEzMyAwIDU2LjUgMjMuNVQ4ODAtNzIwdjQ4MHEwIDMzLTIzLjUgNTYuNVQ4MDAtMTYwSDE2MFptMC04MGg2NDB2LTQwMEgxNjB2NDAwWm0xNDAtNDAtNTYtNTYgMTAzLTEwNC0xMDQtMTA0IDU3LTU2IDE2MCAxNjAtMTYwIDE2MFptMTgwIDB2LTgwaDI0MHY4MEg0ODBaIi8+PC9zdmc+
// @grant        GM_registerMenuCommand
// @run-at       document-end
// @downloadURL https://raw.githubusercontent.com/eitanliu/user_script/refs/heads/main/eruda_console.user.js
// @updateURL https://github.com/eitanliu/user_script/raw/refs/heads/main/eruda_console.user.js
// ==/UserScript==

(function () {
  'use strict';

  const JSURL = 'https://cdn.jsdelivr.net/npm/eruda@3.2.1/eruda.min.js'
  function loadScript(url, callback) {
    if (document.querySelector("#eruda")) {
      callback();
      return
    }
    const script = document.createElement('script');
    script.setAttribute("id", "eruda")
    script.type = 'text/javascript';

    script.onload = function () {
      callback();
    };

    script.src = url;
    document.head.appendChild(script);
  }

  let show = true;

  try {
    if (show) {
      loadScript(JSURL, () => {
        eruda.init({
          useShadowDom: true,
          autoScale: true,
          defaults: {
            displaySize: 40,
            transparency: 0.9
          }
        });
      });
    }

    GM_registerMenuCommand("打开/关闭", function (event) {
      show = !show;
      if (show) {
        loadScript(JSURL, () => {
          eruda.init({
            useShadowDom: true,
            autoScale: true,
            defaults: {
              displaySize: 40,
              transparency: 0.9
            }
          });
        });
      } else {
        eruda && eruda.destroy();
      }
    }, "openEruda");

  } catch (ex) {
  }

})();