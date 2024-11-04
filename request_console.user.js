// ==UserScript==
// @name           HttpRequest Console
// @namespace      http://tampermonkey.net/
// @version        1.0.1
// @description    XMLHttpRequest fetch Console
// @author         eitanliu
// @match          http://*/*
// @match          https://*/*
// @icon           data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIyNHB4IiBmaWxsPSJ1bmRlZmluZWQiPjxwYXRoIGQ9Im0zMjAtMTYwLTU2LTU3IDEwMy0xMDNIODB2LTgwaDI4N0wyNjQtNTAzbDU2LTU3IDIwMCAyMDAtMjAwIDIwMFptMzIwLTI0MEw0NDAtNjAwbDIwMC0yMDAgNTYgNTctMTAzIDEwM2gyODd2ODBINTkzbDEwMyAxMDMtNTYgNTdaIi8+PC9zdmc+
// @grant          none
// @require https://cdn.jsdelivr.net/npm/eruda@3.3.0/eruda.min.js
// @downloadURL https://github.com/eitanliu/user_script/raw/refs/heads/main/request_console.user.js
// @updateURL https://github.com/eitanliu/user_script/raw/refs/heads/main/request_console.user.js
// ==/UserScript==

(function () {
  'use strict';
  var _hri = {
    _originalXHR: undefined,
    _originalFetch: undefined,
    isConsole() {
      return true;
    },
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
     * @param {any|string|String|Headers} headers
     * @returns
     */
    parseHeaders(headers) {
      var headerMap = {};
      if (typeof headers === 'string' || headers instanceof String) {
        headers.split(/\r?\n/).forEach(line => {
          var index = line.indexOf(': ');
          var key = line.substring(0, index);
          var value = line.substring(index + 2);
          if (key.trim() !== '') headerMap[key] = value;
        });
        return headerMap;
      } else if (headers instanceof Headers) {
        for (let pair of headers) {
          headerMap[pair[0]] = pair[1];
        }
        return headerMap;
      }
      return headers;
    },
    parseUrl(url, base) {
      try {
        if (base === undefined || base === null || base == '')
          return new URL(url)
        else
          return new URL(url, base);
      } catch (e) {
      }
      return url;
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
        // console.log('ParseData Error Type: ', contentType, '\nData: ', data, '\nError: ', error);
      }
      return data;
    },
    /**
     * @param {string} path
     * @returns {boolean}
     */
    existsWindowProperty(path) {
      return _hri.existsPathProperty(window, path)
    },
    /**
     * @param {*} obj
     * @param {string} path
     * @returns {boolean}
     */
    existsPathProperty(obj, path) {
      if (typeof obj === 'undefined' || obj === null) return false;
      const parts = path.split('.');
      return _hri.existsPartsProperty(obj, parts)
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
  if (typeof _hri._originalXHR === 'undefined') {
    _hri._originalXHR = window.XMLHttpRequest;
    let isDebug = _hri.isDebug();

    let originalOpen = window.XMLHttpRequest.prototype.open
    /**
     * method: string, url: string | URL, async: boolean, username?: string | null, password?: string | null
     * @param {string} method
     * @param {string | URL} url
     * @param {boolean} async
     * @param {string | null} user
     * @param {string | null} password
     * @returns
     */
    window.XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
      let requestHeaders = {};
      let request = {
        'url': url,
        'method': method,
        'headers': requestHeaders,
        'async': async,
        'user': user,
        'password': password,
      };

      let xhr = this;

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
            let reqData = _hri.parseData(data, reqContentType);
            request['contentType'] = reqContentType;
            request['content'] = reqData;

            let resUrl = xhr.responseURL;
            let resource = {
              'url': resUrl,
              'location': window.location,
              'request': request,
              'duration': duration,
              'type': 'xhr'
            };

            if (isDebug) {

              let headers = _hri.parseHeaders(xhr.getAllResponseHeaders());
              let contentType = xhr.getResponseHeader('Content-Type') || xhr.getResponseHeader('content-type');
              let content = _hri.parseData(xhr.response, contentType);

              let response = {
                'status': xhr.status,
                'headers': headers,
                'contentType': contentType,
                'content': content
              };

              resource['response'] = response;

              if (isDebug) {
                console.log(`Request: ${method} xhr ${_hri.parseUrl(reqUrl, location.href)}\nResponse: ${xhr.status} ${contentType} ${resUrl}\n`, resource);
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

      return originalOpen.apply(this, arguments);
    };
  }

  /**
   * @type {function(input, init): Promise<Response>}
   */
  let _originalFetch;
  if (typeof _hri._originalFetch === 'undefined') {
    _originalFetch = window.fetch;
    _hri._originalFetch = _originalFetch;

    /**
     * @param {URL|RequestInfo} input
     * @param {RequestInit|undefined} init
     * @returns {Promise<Response>}
     */
    function xFetch(input, init) {
      let isDebug = _hri.isDebug();
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
        reqHeaders = _hri.parseHeaders(input.headers);
      }
      let reqContentType = reqHeaders?.['Content-Type'] || reqHeaders?.['content-type'];
      let reqData = _hri.parseData(init?.body, reqContentType);
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
            'url': resUrl,
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
                content = resp2
              }
            } catch (error) {
              console.log('ParseData Error Type: ', contentType, '\nData: ', content, '\nError: ', error);
            }
            let response = {
              'status': resp.status,
              'headers': respHeaders,
              'contentType': contentType,
              'content': _hri.parseData(content, contentType)
            };

            resource['response'] = response;


            if (isDebug) {
              console.log(`Request: ${method} xhr ${_hri.parseUrl(reqUrl, location.href)}\nResponse: ${resp.status} ${contentType} ${resUrl}\n`, resource);
            }
          }
          return resp;
        }).catch(error => {
          let endTime = new Date().getTime();
          let duration = endTime - startTime;
          if (isDebug) {
            console.log(`RequestError: ${method} ${_hri.parseUrl(reqUrl, location.href)}\n ${duration}\n`, error);
          }
          throw error;
        });
      return resp
    }
    window.fetch = xFetch;
  }

  window.addEventListener("load", (event) => {
    if (_hri.isConsole()) eruda.init({
      useShadowDom: true,
      autoScale: true,
      defaults: {
        displaySize: 40,
        transparency: 0.95
      }
    });
  });
})();
