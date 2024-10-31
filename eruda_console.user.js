// ==UserScript==
// @name         Eruda Console
// @namespace    http://tampermonkey.net/
// @version      2024-06-18
// @description  load the web page console to debug or get some information etc.
// @author       eitanliu
// @match        http://*/*
// @match        https://*/*
// @grant        GM_registerMenuCommand
// @run-at       document-end
// @downloadURL https://raw.githubusercontent.com/eitanliu/user_script/refs/heads/master/eruda_console.user.js
// @updateURL https://github.com/eitanliu/user_script/raw/refs/heads/master/eruda_console.user.js
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