// ==UserScript==
// @name         HttpRequest Console
// @namespace    http://tampermonkey.net/
// @version      2024-06-18
// @description  try to take over the world!
// @author       eitanliu
// @match        http://*/*
// @match        https://*/*
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIyNHB4IiBmaWxsPSJ1bmRlZmluZWQiPjxwYXRoIGQ9Im0zMjAtMTYwLTU2LTU3IDEwMy0xMDNIODB2LTgwaDI4N0wyNjQtNTAzbDU2LTU3IDIwMCAyMDAtMjAwIDIwMFptMzIwLTI0MEw0NDAtNjAwbDIwMC0yMDAgNTYgNTctMTAzIDEwM2gyODd2ODBINTkzbDEwMyAxMDMtNTYgNTdaIi8+PC9zdmc+
// @grant        none
// @require https://cdn.jsdelivr.net/npm/eruda@3.3.0/eruda.min.js
// @downloadURL https://github.com/eitanliu/user_script/raw/refs/heads/main/request_console.user.js
// @updateURL https://github.com/eitanliu/user_script/raw/refs/heads/main/request_console.user.js
// ==/UserScript==

(function () {
  'use strict';
  var _xhrTools = {
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
      console.log(`XHR onPageChange ${event} ${host} ${path}`, url)
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
        if (contentType.includes('application/json')
          || contentType.includes('text/json')
        ) {
          return JSON.parse(data);
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          let params = new URLSearchParams(data);
          return Array.from(params).reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});
        }
      } catch (error) {
        console.log('ParseData Error Type: ', contentType, '\nData: ', data, '\nError: ', error);
        return data;
      }
      return data;
    },
    /**
     * @param {string} path
     * @returns {boolean}
     */
    existsWindowProperty(path) {
      return _xhrTools.existsPathProperty(window, path)
    },
    /**
     * @param {*} obj
     * @param {string} path
     * @returns {boolean}
     */
    existsPathProperty(obj, path) {
      if (typeof obj === 'undefined' || obj === null) return false;
      const parts = path.split('.');
      return _xhrTools.existsPartsProperty(obj, parts)
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


  /**
   * @type {new XMLHttpRequest}
   */
  let _originalXHR;
  if (typeof _originalXHR === 'undefined') {
    _originalXHR = window.XMLHttpRequest;
    let isDebug = _xhrTools.isDebug();

    window.XMLHttpRequest = function () {
      let request;
      let requestHeaders = {};

      let xhr = new _originalXHR();

      let originalSetRequestHeader = xhr.setRequestHeader;
      /**
       * @param {string} name 
       * @param {string} value 
       * @returns 
       */
      function setRequestHeader(name, value) {
        requestHeaders[name] = value
        return originalSetRequestHeader.apply(this, arguments);
      }
      xhr.setRequestHeader = setRequestHeader;

      let originalOpen = xhr.open;
      /**
       * method: string, url: string | URL, async: boolean, username?: string | null, password?: string | null
       * @param {string} method 
       * @param {string | URL} url 
       * @param {boolean} async 
       * @param {string | null} user 
       * @param {string | null} password 
       * @returns 
       */
      function open(method, url, async, user, password) {
        request = {
          'url': url,
          'method': method,
          'headers': requestHeaders,
          'async': async,
          'user': user,
          'password': password,
        };
        return originalOpen.apply(this, arguments);
      };
      xhr.open = open;

      let originalSend = xhr.send;
      /**
       * @param {Document | XMLHttpRequestBodyInit | null} data 
       * @returns 
       */
      function send(data) {
        let startTime = new Date().getTime();
        let originalOnreadystatechange = xhr.onreadystatechange;
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            let endTime = new Date().getTime();
            let duration = endTime - startTime;

            let method = request.method;
            let reqUrl = request.url;
            let reqContentType = requestHeaders['Content-Type'];
            let reqData = _xhrTools.parseData(data, reqContentType);
            request['contentType'] = reqContentType;
            request['content'] = reqData;

            let resUrl = xhr.responseURL;
            let resource = {
              'location': window.location,
              'request': request,
              'duration': duration,
              'type': 'xhr'
            };

            if (isDebug) {

              let headers = _xhrTools.parseHeaders(xhr.getAllResponseHeaders());
              let contentType = xhr.getResponseHeader('Content-Type') || xhr.getResponseHeader('content-type');
              let content = _xhrTools.parseData(xhr.response, contentType);

              let response = {
                'status': xhr.status,
                'headers': headers,
                'contentType': contentType,
                'content': content
              };

              resource['response'] = response;

              if (isDebug) {
                console.log(`Request: ${method} xhr ${reqUrl}\nResponse: ${contentType} ${resUrl}\n`, resource);
              }
            }
          }
          if (originalOnreadystatechange) {
            originalOnreadystatechange.apply(this, arguments);
          }
        };
        return originalSend.apply(this, arguments);
      };
      xhr.send = send;

      return xhr;
    };
  }

  /**
   * @type {function(input, init): Promise<Response>}
   */
  let _originalFetch;
  if (typeof _originalFetch === 'undefined') {
    _originalFetch = window.fetch;

    /**
     * @param {URL|RequestInfo} input 
     * @param {RequestInit|undefined} init 
     * @returns {Promise<Response>}
     */
    function xFetch(input, init) {
      let isDebug = _xhrTools.isDebug();
      let startTime = new Date().getTime();
      let method;
      let reqUrl;
      let reqHeaders = {};

      if (typeof input === 'string' || input instanceof URL) {
        method = init?.method || 'GET';
        reqUrl = input.toString();
        reqHeaders = init?.headers || {};
      } else {
        // input instanceof Request;
        reqUrl = input.url;
        method = input.method || 'GET';
        reqHeaders = input.headers;
      }
      let reqContentType = reqHeaders?.['Content-Type'] || reqHeaders?.['content-type'];
      let reqData = _xhrTools.parseData(init?.body, reqContentType);
      let request = {
        'url': reqUrl,
        'method': method,
        'headers': reqHeaders,
        'contentType': reqContentType,
        'content': reqData
      };

      let resp = _originalFetch(input, init)
        .then(async resp => {
          let resUrl = resp.url;
          let endTime = new Date().getTime();
          let duration = endTime - startTime;
          let resource = {
            'location': window.location,
            'request': request,
            'duration': duration,
            'type': 'fetch',
          };

          if (isDebug) {
            let respHeaders = {}
            for (let pair of resp.headers) {
              respHeaders[pair[0]] = pair[1];
            }
            let contentType = respHeaders['Content-Type'] || respHeaders['content-type'];
            let content;
            try {
              let resp2 = resp.clone()
              if (contentType && contentType.includes('application/json')) {
                content = await resp2.json()
              } else {
                content = await resp2.arrayBuffer()
              }
            } catch (error) {
              console.log('ParseData Error Type: ', contentType, '\nData: ', content, '\nError: ', error);
            }
            let response = {
              'status': resp.status,
              'headers': respHeaders,
              'contentType': contentType,
              'content': _xhrTools.parseData(content, contentType)
            };

            resource['response'] = response;


            if (isDebug) {
              console.log(`Request: ${method} fetch ${reqUrl}\nResponse: ${contentType} ${resUrl}\n`, resource);
            }
          }
          return resp;
        }).catch(error => {
          let endTime = new Date().getTime();
          let duration = endTime - startTime;
          if (isDebug) {
            console.log(`RequestError: ${method} ${reqUrl}\n ${duration}\n`, error);
          }
          throw error;
        });
      return resp
    }
    window.fetch = xFetch;
  }

  window.addEventListener("load", (event) => {
    if (_xhrTools.isDebug()) eruda.init({
      useShadowDom: true,
      autoScale: true,
      defaults: {
        displaySize: 40,
        transparency: 0.95
      }
    });
  });
})();
