(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

// Intentionally use native-promise-only here... Other promise libraries (es6-promise)
// duck-punch the global Promise definition which messes up Angular 2 since it
// also duck-punches the global Promise definition. For now, keep native-promise-only.

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
};

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var Promise = require("native-promise-only");
require('whatwg-fetch');
var EventEmitter = require('eventemitter2').EventEmitter2;
var copy = require('shallow-copy');
var cookies = require('browser-cookies');

/**
 * The Formio interface class.
 *
 *   let formio = new Formio('https://examples.form.io/example');
 */

var Formio = function () {
  function Formio(path) {
    var _this = this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Formio);

    // Ensure we have an instance of Formio.
    if (!(this instanceof Formio)) {
      return new Formio(path);
    }

    // Initialize our variables.
    this.base = '';
    this.projectsUrl = '';
    this.projectUrl = '';
    this.projectId = '';
    this.formUrl = '';
    this.formsUrl = '';
    this.formId = '';
    this.submissionsUrl = '';
    this.submissionUrl = '';
    this.submissionId = '';
    this.actionsUrl = '';
    this.actionId = '';
    this.actionUrl = '';
    this.query = '';

    if (options.hasOwnProperty('base')) {
      this.base = options.base;
    } else if (Formio.baseUrl) {
      this.base = Formio.baseUrl;
    } else {
      this.base = window.location.href.match(/http[s]?:\/\/api./)[0];
    }

    if (!path) {
      // Allow user to create new projects if this was instantiated without
      // a url
      this.projectUrl = this.base + '/project';
      this.projectsUrl = this.base + '/project';
      this.projectId = false;
      this.query = '';
      return;
    }

    if (options.hasOwnProperty('project')) {
      this.projectUrl = options.project;
    }

    var project = this.projectUrl || Formio.projectUrl;

    // The baseURL is the same as the projectUrl. This is almost certainly against
    // the Open Source server.
    if (project && this.base === project) {
      this.noProject = true;
      this.projectUrl = this.base;
    }

    // Normalize to an absolute path.
    if (path.indexOf('http') !== 0 && path.indexOf('//') !== 0) {
      path = this.base + path;
    }

    var hostparts = Formio.getUrlParts(path);
    var parts = [];
    var hostName = hostparts[1] + hostparts[2];
    path = hostparts.length > 3 ? hostparts[3] : '';
    var queryparts = path.split('?');
    if (queryparts.length > 1) {
      path = queryparts[0];
      this.query = '?' + queryparts[1];
    }

    // Register a specific path.
    var registerPath = function registerPath(name, base) {
      _this[name + 'sUrl'] = base + '/' + name;
      var regex = new RegExp('\/' + name + '\/([^/]+)');
      if (path.search(regex) !== -1) {
        parts = path.match(regex);
        _this[name + 'Url'] = parts ? base + parts[0] : '';
        _this[name + 'Id'] = parts.length > 1 ? parts[1] : '';
        base += parts[0];
      }
      return base;
    };

    // Register an array of items.
    var registerItems = function registerItems(items, base, staticBase) {
      for (var i in items) {
        if (items.hasOwnProperty(i)) {
          var item = items[i];
          if (item instanceof Array) {
            registerItems(item, base, true);
          } else {
            var newBase = registerPath(item, base);
            base = staticBase ? base : newBase;
          }
        }
      }
    };

    if (!this.projectUrl || this.projectUrl === this.base) {
      this.projectUrl = hostName;
    }

    if (!this.noProject) {
      // Determine the projectUrl and projectId
      if (path.search(/(^|\/)(project)($|\/)/) !== -1) {
        // Get project id as project/:projectId.
        registerItems(['project'], hostName);
      } else if (hostName === this.base) {
        // Get project id as first part of path (subdirectory).
        if (hostparts.length > 3 && path.split('/').length > 1) {
          var pathParts = path.split('/');
          pathParts.shift(); // Throw away the first /.
          this.projectId = pathParts.shift();
          path = '/' + pathParts.join('/');
          this.projectUrl = hostName + '/' + this.projectId;
        }
      } else {
        // Get project id from subdomain.
        if (hostparts.length > 2 && (hostparts[2].split('.').length > 2 || hostName.indexOf('localhost') !== -1)) {
          this.projectUrl = hostName;
          this.projectId = hostparts[2].split('.')[0];
        }
      }
      this.projectsUrl = this.projectsUrl || this.base + '/project';
    }

    // Configure Form urls and form ids.
    if (path.search(/(^|\/)(project|form)($|\/)/) !== -1) {
      registerItems(['form', ['submission', 'action']], this.projectUrl);
    } else {
      var subRegEx = new RegExp('\/(submission|action)($|\/.*)');
      var subs = path.match(subRegEx);
      this.pathType = subs && subs.length > 1 ? subs[1] : '';
      path = path.replace(subRegEx, '');
      path = path.replace(/\/$/, '');
      this.formsUrl = this.projectUrl + '/form';
      this.formUrl = this.projectUrl + path;
      this.formId = path.replace(/^\/+|\/+$/g, '');
      var items = ['submission', 'action'];
      for (var i in items) {
        if (items.hasOwnProperty(i)) {
          var item = items[i];
          this[item + 'sUrl'] = this.projectUrl + path + '/' + item;
          if (this.pathType === item && subs.length > 2 && subs[2]) {
            this[item + 'Id'] = subs[2].replace(/^\/+|\/+$/g, '');
            this[item + 'Url'] = this.projectUrl + path + subs[0];
          }
        }
      }
    }

    // Set the app url if it is not set.
    if (!Formio.projectUrlSet) {
      Formio.projectUrl = this.projectUrl;
    }
  }

  _createClass(Formio, [{
    key: 'delete',
    value: function _delete(type, opts) {
      var _id = type + 'Id';
      var _url = type + 'Url';
      if (!this[_id]) {
        Promise.reject('Nothing to delete');
      }
      Formio.cache = {};
      return this.makeRequest(type, this[_url], 'delete', null, opts);
    }
  }, {
    key: 'index',
    value: function index(type, query, opts) {
      var _url = type + 'Url';
      query = query || '';
      if (query && (typeof query === 'undefined' ? 'undefined' : _typeof(query)) === 'object') {
        query = '?' + Formio.serialize(query.params);
      }
      return this.makeRequest(type, this[_url] + query, 'get', null, opts);
    }
  }, {
    key: 'save',
    value: function save(type, data, opts) {
      var _id = type + 'Id';
      var _url = type + 'Url';
      var method = this[_id] || data._id ? 'put' : 'post';
      var reqUrl = this[_id] ? this[_url] : this[type + 'sUrl'];
      if (!this[_id] && data._id && method === 'put' && reqUrl.indexOf(data._id) === -1) {
        reqUrl += '/' + data._id;
      }
      Formio.cache = {};
      return this.makeRequest(type, reqUrl + this.query, method, data, opts);
    }
  }, {
    key: 'load',
    value: function load(type, query, opts) {
      var _id = type + 'Id';
      var _url = type + 'Url';
      if (query && (typeof query === 'undefined' ? 'undefined' : _typeof(query)) === 'object') {
        query = Formio.serialize(query.params);
      }
      if (query) {
        query = this.query ? this.query + '&' + query : '?' + query;
      } else {
        query = this.query;
      }
      if (!this[_id]) {
        return Promise.reject('Missing ' + _id);
      }
      return this.makeRequest(type, this[_url] + query, 'get', null, opts);
    }
  }, {
    key: 'makeRequest',
    value: function makeRequest(type, url, method, data, opts) {
      return Formio.makeRequest(this, type, url, method, data, opts);
    }
  }, {
    key: 'loadProject',
    value: function loadProject(query, opts) {
      return this.load('project', query, opts);
    }
  }, {
    key: 'saveProject',
    value: function saveProject(data, opts) {
      return this.save('project', data, opts);
    }
  }, {
    key: 'deleteProject',
    value: function deleteProject(opts) {
      return this.delete('project', opts);
    }
  }, {
    key: 'loadForm',
    value: function loadForm(query, opts) {
      return this.load('form', query, opts);
    }
  }, {
    key: 'saveForm',
    value: function saveForm(data, opts) {
      return this.save('form', data, opts);
    }
  }, {
    key: 'deleteForm',
    value: function deleteForm(opts) {
      return this.delete('form', opts);
    }
  }, {
    key: 'loadForms',
    value: function loadForms(query, opts) {
      return this.index('forms', query, opts);
    }
  }, {
    key: 'loadSubmission',
    value: function loadSubmission(query, opts) {
      return this.load('submission', query, opts);
    }
  }, {
    key: 'saveSubmission',
    value: function saveSubmission(data, opts) {
      return this.save('submission', data, opts);
    }
  }, {
    key: 'deleteSubmission',
    value: function deleteSubmission(opts) {
      return this.delete('submission', opts);
    }
  }, {
    key: 'loadSubmissions',
    value: function loadSubmissions(query, opts) {
      return this.index('submissions', query, opts);
    }
  }, {
    key: 'loadAction',
    value: function loadAction(query, opts) {
      return this.load('action', query, opts);
    }
  }, {
    key: 'saveAction',
    value: function saveAction(data, opts) {
      return this.save('action', data, opts);
    }
  }, {
    key: 'deleteAction',
    value: function deleteAction(opts) {
      return this.delete('action', opts);
    }
  }, {
    key: 'loadActions',
    value: function loadActions(query, opts) {
      return this.index('actions', query, opts);
    }
  }, {
    key: 'availableActions',
    value: function availableActions() {
      return this.makeRequest('availableActions', this.formUrl + '/actions');
    }
  }, {
    key: 'actionInfo',
    value: function actionInfo(name) {
      return this.makeRequest('actionInfo', this.formUrl + '/actions/' + name);
    }
  }, {
    key: 'isObjectId',
    value: function isObjectId(id) {
      var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
      return checkForHexRegExp.test(id);
    }
  }, {
    key: 'getProjectId',
    value: function getProjectId() {
      if (!this.projectId) {
        return Promise.resolve('');
      }
      if (this.isObjectId(this.projectId)) {
        return Promise.resolve(this.projectId);
      } else {
        return this.loadProject().then(function (project) {
          return project._id;
        });
      }
    }
  }, {
    key: 'getFormId',
    value: function getFormId() {
      if (!this.formId) {
        return Promise.resolve('');
      }
      if (this.isObjectId(this.formId)) {
        return Promise.resolve(this.formId);
      } else {
        return this.loadForm().then(function (form) {
          return form._id;
        });
      }
    }

    /**
     * Returns a temporary authentication token for single purpose token generation.
     */

  }, {
    key: 'getTempToken',
    value: function getTempToken(expire, allowed) {
      var token = Formio.getToken();
      if (!token) {
        return Promise.reject('You must be authenticated to generate a temporary auth token.');
      }
      return this.makeRequest('tempToken', this.projectUrl + '/token', 'GET', null, {
        header: new Headers({
          'x-expire': expire,
          'x-allow': allowed
        })
      });
    }

    /**
     * Get a download url for a submission PDF of this submission.
     *
     * @return {*}
     */

  }, {
    key: 'getDownloadUrl',
    value: function getDownloadUrl(form) {
      var _this2 = this;

      if (!this.submissionId) {
        return Promise.resolve('');
      }

      if (!form) {
        // Make sure to load the form first.
        return this.loadForm().then(function (_form) {
          if (!_form) {
            return '';
          }
          return _this2.getDownloadUrl(_form);
        });
      }

      var apiUrl = '/project/' + form.project;
      apiUrl += '/form/' + form._id;
      apiUrl += '/submission/' + this.submissionId;
      apiUrl += '/download';

      var download = Formio.baseUrl + apiUrl;
      return new Promise(function (resolve, reject) {
        _this2.getTempToken(3600, 'GET:' + apiUrl).then(function (tempToken) {
          download += '?token=' + tempToken.key;
          resolve(download);
        }, function () {
          resolve(download);
        }).catch(reject);
      });
    }
  }, {
    key: 'uploadFile',
    value: function uploadFile(storage, file, fileName, dir, progressCallback, url) {
      var requestArgs = {
        provider: storage,
        method: 'upload',
        file: file,
        fileName: fileName,
        dir: dir
      };
      var request = Formio.pluginWait('preRequest', requestArgs).then(function () {
        return Formio.pluginGet('fileRequest', requestArgs).then(function (result) {
          if (storage && (result === null || result === undefined)) {
            if (Formio.providers.storage.hasOwnProperty(storage)) {
              var provider = new Formio.providers.storage[storage](this);
              return provider.uploadFile(file, fileName, dir, progressCallback, url);
            } else {
              throw 'Storage provider not found';
            }
          }
          return result || { url: '' };
        }.bind(this));
      }.bind(this));

      return Formio.pluginAlter('wrapFileRequestPromise', request, requestArgs);
    }
  }, {
    key: 'downloadFile',
    value: function downloadFile(file) {
      var requestArgs = {
        method: 'download',
        file: file
      };

      var request = Formio.pluginWait('preRequest', requestArgs).then(function () {
        return Formio.pluginGet('fileRequest', requestArgs).then(function (result) {
          if (file.storage && (result === null || result === undefined)) {
            if (Formio.providers.storage.hasOwnProperty(file.storage)) {
              var provider = new Formio.providers.storage[file.storage](this);
              return provider.downloadFile(file);
            } else {
              throw 'Storage provider not found';
            }
          }
          return result || { url: '' };
        }.bind(this));
      }.bind(this));

      return Formio.pluginAlter('wrapFileRequestPromise', request, requestArgs);
    }

    // Determine if the user can submit the form.

  }, {
    key: 'canSubmit',
    value: function canSubmit() {
      return Promise.all([this.loadForm(), Formio.currentUser(), Formio.accessInfo()]).then(function (results) {
        var form = results.shift();
        var user = results.shift();
        var access = results.shift();

        // Get the anonymous and admin roles.
        var anonRole = {};
        var adminRole = {};
        for (var roleName in access.roles) {
          if (access.roles.hasOwnProperty(roleName)) {
            var role = access.roles[roleName];
            if (role.default) {
              anonRole = role;
            }
            if (role.admin) {
              adminRole = role;
            }
          }
        }

        var canSubmit = false;
        var canSubmitAnonymously = false;

        // If the user is an admin, then they can submit this form.
        if (user && user.roles.indexOf(adminRole._id) !== -1) {
          return true;
        }

        for (var i in form.submissionAccess) {
          if (form.submissionAccess.hasOwnProperty(i)) {
            var subRole = form.submissionAccess[i];
            if (subRole.type === 'create_all' || subRole.type === 'create_own') {
              for (var j in subRole.roles) {
                if (subRole.roles.hasOwnProperty(j)) {
                  // Check if anonymous is allowed.
                  if (anonRole._id === subRole.roles[j]) {
                    canSubmitAnonymously = true;
                  }
                  // Check if the logged in user has the appropriate role.
                  if (user && user.roles.indexOf(subRole.roles[j]) !== -1) {
                    canSubmit = true;
                    break;
                  }
                }
              }
              if (canSubmit) {
                break;
              }
            }
          }
        }
        // If their user cannot submit, but anonymous can, then delete token and allow submission.
        if (!canSubmit && canSubmitAnonymously) {
          canSubmit = true;
          Formio.setUser(null);
        }
        return canSubmit;
      });
    }
  }], [{
    key: 'loadProjects',
    value: function loadProjects(query, opts) {
      query = query || '';
      if ((typeof query === 'undefined' ? 'undefined' : _typeof(query)) === 'object') {
        query = '?' + serialize(query.params);
      }
      return Formio.makeStaticRequest(Formio.baseUrl + '/project' + query);
    }
  }, {
    key: 'getUrlParts',
    value: function getUrlParts(url) {
      var regex = '^(http[s]?:\\/\\/)';
      if (this.base && url.indexOf(this.base) === 0) {
        regex += '(' + this.base.replace(/^http[s]?:\/\//, '') + ')';
      } else {
        regex += '([^/]+)';
      }
      regex += '($|\\/.*)';
      return url.match(new RegExp(regex));
    }
  }, {
    key: 'serialize',
    value: function serialize(obj) {
      var str = [];
      for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
      }return str.join("&");
    }
  }, {
    key: 'makeStaticRequest',
    value: function makeStaticRequest(url, method, data, opts) {
      method = (method || 'GET').toUpperCase();
      if (!opts || (typeof opts === 'undefined' ? 'undefined' : _typeof(opts)) !== 'object') {
        opts = {};
      }
      var requestArgs = {
        url: url,
        method: method,
        data: data
      };

      var request = Formio.pluginWait('preRequest', requestArgs).then(function () {
        return Formio.pluginGet('staticRequest', requestArgs).then(function (result) {
          if (result === null || result === undefined) {
            return Formio.request(url, method, data, opts.header, opts);
          }
          return result;
        });
      });

      return Formio.pluginAlter('wrapStaticRequestPromise', request, requestArgs);
    }
  }, {
    key: 'makeRequest',
    value: function makeRequest(formio, type, url, method, data, opts) {
      method = (method || 'GET').toUpperCase();
      if (!opts || (typeof opts === 'undefined' ? 'undefined' : _typeof(opts)) !== 'object') {
        opts = {};
      }

      var requestArgs = {
        formio: formio,
        type: type,
        url: url,
        method: method,
        data: data,
        opts: opts
      };

      var request = Formio.pluginWait('preRequest', requestArgs).then(function () {
        return Formio.pluginGet('request', requestArgs).then(function (result) {
          if (result === null || result === undefined) {
            return Formio.request(url, method, data, opts.header, opts);
          }
          return result;
        });
      });

      return Formio.pluginAlter('wrapRequestPromise', request, requestArgs);
    }
  }, {
    key: 'request',
    value: function request(url, method, data, header, opts) {
      if (!url) {
        return Promise.reject('No url provided');
      }
      method = (method || 'GET').toUpperCase();

      // For reverse compatibility, if they provided the ignoreCache parameter,
      // then change it back to the options format where that is a parameter.
      if (typeof opts === 'boolean') {
        opts = { ignoreCache: opts };
      }
      if (!opts || (typeof opts === 'undefined' ? 'undefined' : _typeof(opts)) !== 'object') {
        opts = {};
      }

      // Generate a cachekey.
      var cacheKey = btoa(url);

      // Get the cached promise to save multiple loads.
      if (!opts.ignoreCache && method === 'GET' && Formio.cache.hasOwnProperty(cacheKey)) {
        return Formio.cache[cacheKey];
      }

      // Set up and fetch request
      var headers = header || new Headers({
        'Accept': 'application/json',
        'Content-type': 'application/json; charset=UTF-8'
      });
      var token = Formio.getToken();
      if (token && !opts.noToken) {
        headers.append('x-jwt-token', token);
      }

      var options = {
        method: method,
        headers: headers,
        mode: 'cors'
      };
      if (data) {
        options.body = JSON.stringify(data);
      }

      // Allow plugins to alter the options.
      options = Formio.pluginAlter('requestOptions', options, url);

      var requestToken = options.headers.get('x-jwt-token');

      var requestPromise = fetch(url, options).then(function (response) {
        // Allow plugins to respond.
        response = Formio.pluginAlter('requestResponse', response, Formio);

        if (!response.ok) {
          if (response.status === 440) {
            Formio.setToken(null);
            Formio.events.emit('formio.sessionExpired', response.body);
          } else if (response.status === 401) {
            Formio.events.emit('formio.unauthorized', response.body);
          }
          // Parse and return the error as a rejected promise to reject this promise
          return (response.headers.get('content-type').indexOf('application/json') !== -1 ? response.json() : response.text()).then(function (error) {
            throw error;
          });
        }

        // Handle fetch results
        var token = response.headers.get('x-jwt-token');

        // In some strange cases, the fetch library will return an x-jwt-token without sending
        // one to the server. This has even been debugged on the server to verify that no token
        // was introduced with the request, but the response contains a token. This is an Invalid
        // case where we do not send an x-jwt-token and get one in return for any GET request.
        var tokenIntroduced = false;
        if (method === 'GET' && !requestToken && token && url.indexOf('token=') === -1 && url.indexOf('x-jwt-token=' === -1)) {
          console.warn('Token was introduced in request.');
          tokenIntroduced = true;
        }

        if (response.status >= 200 && response.status < 300 && token && token !== '' && !tokenIntroduced) {
          Formio.setToken(token);
        }
        // 204 is no content. Don't try to .json() it.
        if (response.status === 204) {
          return {};
        }

        var getResult = response.headers.get('content-type').indexOf('application/json') !== -1 ? response.json() : response.text();
        return getResult.then(function (result) {
          // Add some content-range metadata to the result here
          var range = response.headers.get('content-range');
          if (range && (typeof result === 'undefined' ? 'undefined' : _typeof(result)) === 'object') {
            range = range.split('/');
            if (range[0] !== '*') {
              var skipLimit = range[0].split('-');
              result.skip = Number(skipLimit[0]);
              result.limit = skipLimit[1] - skipLimit[0] + 1;
            }
            result.serverCount = range[1] === '*' ? range[1] : Number(range[1]);
          }

          if (!opts.getHeaders) {
            return result;
          }

          var headers = {};
          response.headers.forEach(function (item, key) {
            headers[key] = item;
          });

          // Return the result with the headers.
          return {
            result: result,
            headers: headers
          };
        });
      }).then(function (result) {
        if (opts.getHeaders) {
          return result;
        }

        // Shallow copy result so modifications don't end up in cache
        if (Array.isArray(result)) {
          var resultCopy = result.map(copy);
          resultCopy.skip = result.skip;
          resultCopy.limit = result.limit;
          resultCopy.serverCount = result.serverCount;
          return resultCopy;
        }
        return copy(result);
      }).catch(function (err) {
        if (err === 'Bad Token') {
          Formio.setToken(null);
          Formio.events.emit('formio.badToken', err);
        }
        if (err.message) {
          err.message = 'Could not connect to API server (' + err.message + ')';
          err.networkError = true;
        }
        if (Formio.cache.hasOwnProperty(cacheKey)) {
          // Remove failed promises from cache
          delete Formio.cache[cacheKey];
        }
        // Propagate error so client can handle accordingly
        throw err;
      });

      // Cache the request promise.
      if (method === 'GET') {
        Formio.cache[cacheKey] = requestPromise;
      }

      // Return the request promise.
      return requestPromise;
    }
  }, {
    key: 'setToken',
    value: function setToken(token) {
      token = token || '';
      if (token === this.token) {
        return;
      }
      this.token = token;
      if (!token) {
        Formio.setUser(null);
        // iOS in private browse mode will throw an error but we can't detect ahead of time that we are in private mode.
        try {
          return localStorage.removeItem('formioToken');
        } catch (err) {
          return cookies.erase('formioToken');
        }
      }
      // iOS in private browse mode will throw an error but we can't detect ahead of time that we are in private mode.
      try {
        localStorage.setItem('formioToken', token);
      } catch (err) {
        cookies.set('formioToken', token);
      }
      return Formio.currentUser(); // Run this so user is updated if null
    }
  }, {
    key: 'getToken',
    value: function getToken() {
      if (this.token) {
        return this.token;
      }
      try {
        this.token = localStorage.getItem('formioToken') || '';
        return this.token;
      } catch (e) {
        this.token = cookies.get('formioToken');
      }
    }
  }, {
    key: 'setUser',
    value: function setUser(user) {
      if (!user) {
        this.setToken(null);
        // iOS in private browse mode will throw an error but we can't detect ahead of time that we are in private mode.
        try {
          return localStorage.removeItem('formioUser');
        } catch (err) {
          return cookies.erase('formioUser');
        }
      }
      // iOS in private browse mode will throw an error but we can't detect ahead of time that we are in private mode.
      try {
        localStorage.setItem('formioUser', JSON.stringify(user));
      } catch (err) {
        cookies.set('formioUser', JSON.stringify(user));
      }
    }
  }, {
    key: 'getUser',
    value: function getUser() {
      try {
        return JSON.parse(localStorage.getItem('formioUser') || null);
      } catch (e) {
        return JSON.parse(cookies.get('formioUser'));
      }
    }
  }, {
    key: 'setBaseUrl',
    value: function setBaseUrl(url) {
      Formio.baseUrl = url;
      if (!Formio.projectUrlSet) {
        Formio.projectUrl = url;
      }
    }
  }, {
    key: 'getBaseUrl',
    value: function getBaseUrl() {
      return Formio.baseUrl;
    }
  }, {
    key: 'setApiUrl',
    value: function setApiUrl(url) {
      return Formio.setBaseUrl(url);
    }
  }, {
    key: 'getApiUrl',
    value: function getApiUrl() {
      return Formio.getBaseUrl();
    }
  }, {
    key: 'setAppUrl',
    value: function setAppUrl(url) {
      console.warn('Formio.setAppUrl() is deprecated. Use Formio.setProjectUrl instead.');
      Formio.projectUrl = url;
      Formio.projectUrlSet = true;
    }
  }, {
    key: 'setProjectUrl',
    value: function setProjectUrl(url) {
      Formio.projectUrl = url;
      Formio.projectUrlSet = true;
    }
  }, {
    key: 'getAppUrl',
    value: function getAppUrl() {
      console.warn('Formio.getAppUrl() is deprecated. Use Formio.getProjectUrl instead.');
      return Formio.projectUrl;
    }
  }, {
    key: 'getProjectUrl',
    value: function getProjectUrl() {
      return Formio.projectUrl;
    }
  }, {
    key: 'clearCache',
    value: function clearCache() {
      Formio.cache = {};
    }
  }, {
    key: 'noop',
    value: function noop() {}
  }, {
    key: 'identity',
    value: function identity(value) {
      return value;
    }
  }, {
    key: 'deregisterPlugin',
    value: function deregisterPlugin(plugin) {
      var beforeLength = Formio.plugins.length;
      Formio.plugins = Formio.plugins.filter(function (p) {
        if (p !== plugin && p.__name !== plugin) return true;
        (p.deregister || Formio.noop).call(p, Formio);
        return false;
      });
      return beforeLength !== Formio.plugins.length;
    }
  }, {
    key: 'registerPlugin',
    value: function registerPlugin(plugin, name) {
      Formio.plugins.push(plugin);
      Formio.plugins.sort(function (a, b) {
        return (b.priority || 0) - (a.priority || 0);
      });
      plugin.__name = name;
      (plugin.init || Formio.noop).call(plugin, Formio);
    }
  }, {
    key: 'getPlugin',
    value: function getPlugin(name) {
      return Formio.plugins.reduce(function (result, plugin) {
        if (result) return result;
        if (plugin.__name === name) return plugin;
      }, null);
    }
  }, {
    key: 'pluginWait',
    value: function pluginWait(pluginFn) {
      var args = [].slice.call(arguments, 1);
      return Promise.all(Formio.plugins.map(function (plugin) {
        return (plugin[pluginFn] || Formio.noop).apply(plugin, args);
      }));
    }
  }, {
    key: 'pluginGet',
    value: function pluginGet(pluginFn) {
      var args = [].slice.call(arguments, 0);
      var callPlugin = function callPlugin(index, pluginFn) {
        var plugin = Formio.plugins[index];
        if (!plugin) return Promise.resolve(null);
        return Promise.resolve((plugin && plugin[pluginFn] || Formio.noop).apply(plugin, [].slice.call(arguments, 2))).then(function (result) {
          if (result !== null && result !== undefined) return result;
          return callPlugin.apply(null, [index + 1].concat(args));
        });
      };
      return callPlugin.apply(null, [0].concat(args));
    }
  }, {
    key: 'pluginAlter',
    value: function pluginAlter(pluginFn, value) {
      var args = [].slice.call(arguments, 2);
      return Formio.plugins.reduce(function (value, plugin) {
        return (plugin[pluginFn] || Formio.identity).apply(plugin, [value].concat(args));
      }, value);
    }
  }, {
    key: 'accessInfo',
    value: function accessInfo() {
      return Formio.makeStaticRequest(Formio.projectUrl + '/access');
    }
  }, {
    key: 'currentUser',
    value: function currentUser() {
      var url = Formio.baseUrl + '/current';
      var user = this.getUser();
      if (user) {
        return Formio.pluginAlter('wrapStaticRequestPromise', Promise.resolve(user), {
          url: url,
          method: 'GET'
        });
      }
      var token = this.getToken();
      if (!token) {
        return Formio.pluginAlter('wrapStaticRequestPromise', Promise.resolve(null), {
          url: url,
          method: 'GET'
        });
      }
      return Formio.makeStaticRequest(url).then(function (response) {
        Formio.setUser(response);
        return response;
      });
    }
  }, {
    key: 'logout',
    value: function logout() {
      Formio.setToken(null);
      Formio.setUser(null);
      Formio.clearCache();
      return Formio.makeStaticRequest(Formio.baseUrl + '/logout');
    }

    /**
     * Attach an HTML form to Form.io.
     *
     * @param form
     * @param options
     * @param done
     */

  }, {
    key: 'form',
    value: function form(_form2, options, done) {
      // Fix the parameters.
      if (!done && typeof options === 'function') {
        done = options;
        options = {};
      }

      done = done || function () {
        console.log(arguments);
      };
      options = options || {};

      // IF they provide a jquery object, then select the element.
      if (_form2.jquery) {
        _form2 = _form2[0];
      }
      if (!_form2) {
        return done('Invalid Form');
      }

      var getAction = function getAction() {
        return options.form || _form2.getAttribute('action');
      };

      /**
       * Returns the current submission object.
       * @returns {{data: {}}}
       */
      var getSubmission = function getSubmission() {
        var submission = { data: {} };
        var setValue = function setValue(path, value) {
          var isArray = path.substr(-2) === '[]';
          if (isArray) {
            path = path.replace('[]', '');
          }
          var paths = path.replace(/\[|\]\[/g, '.').replace(/\]$/g, '').split('.');
          var current = submission;
          while (path = paths.shift()) {
            if (!paths.length) {
              if (isArray) {
                if (!current[path]) {
                  current[path] = [];
                }
                current[path].push(value);
              } else {
                current[path] = value;
              }
            } else {
              if (!current[path]) {
                current[path] = {};
              }
              current = current[path];
            }
          }
        };

        // Get the form data from this form.
        var formData = new FormData(_form2);
        var entries = formData.entries();
        var entry = null;
        while (entry = entries.next().value) {
          setValue(entry[0], entry[1]);
        }
        return submission;
      };

      // Submits the form.
      var submit = function submit(event) {
        if (event) {
          event.preventDefault();
        }
        var action = getAction();
        if (!action) {
          return;
        }
        new Formio(action).saveSubmission(getSubmission()).then(function (sub) {
          done(null, sub);
        }, done);
      };

      // Attach formio to the provided form.
      if (_form2.attachEvent) {
        _form2.attachEvent('submit', submit);
      } else {
        _form2.addEventListener('submit', submit);
      }

      return {
        submit: submit,
        getAction: getAction,
        getSubmission: getSubmission
      };
    }
  }, {
    key: 'fieldData',
    value: function fieldData(data, component) {
      if (!data) {
        return '';
      }
      if (!component || !component.key) {
        return data;
      }
      if (component.key.indexOf('.') !== -1) {
        var value = data;
        var parts = component.key.split('.');
        var key = '';
        for (var i = 0; i < parts.length; i++) {
          key = parts[i];

          // Handle nested resources
          if (value.hasOwnProperty('_id')) {
            value = value.data;
          }

          // Return if the key is not found on the value.
          if (!value.hasOwnProperty(key)) {
            return;
          }

          // Convert old single field data in submissions to multiple
          if (key === parts[parts.length - 1] && component.multiple && !Array.isArray(value[key])) {
            value[key] = [value[key]];
          }

          // Set the value of this key.
          value = value[key];
        }
        return value;
      } else {
        // Convert old single field data in submissions to multiple
        if (component.multiple && !Array.isArray(data[component.key])) {
          data[component.key] = [data[component.key]];
        }
        return data[component.key];
      }
    }
  }]);

  return Formio;
}();

// Define all the static properties.


exports.Formio = Formio;
Formio.baseUrl = 'https://api.form.io';
Formio.projectUrl = Formio.baseUrl;
Formio.projectUrlSet = false;
Formio.plugins = [];
Formio.cache = {};
Formio.providers = require('./providers');
Formio.events = new EventEmitter({
  wildcard: false,
  maxListeners: 0
});

module.exports = global.Formio = Formio;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./providers":2,"browser-cookies":8,"eventemitter2":9,"native-promise-only":10,"shallow-copy":11,"whatwg-fetch":12}],2:[function(require,module,exports){
'use strict';

module.exports = {
  storage: require('./storage')
};

},{"./storage":5}],3:[function(require,module,exports){
'use strict';

var Promise = require('native-promise-only');
var base64 = function base64() {
  return {
    title: 'Base64',
    name: 'base64',
    uploadFile: function uploadFile(file, fileName) {
      var _this = this;

      var reader = new FileReader();

      return new Promise(function (resolve, reject) {
        reader.onload = function (event) {
          var url = event.target.result;
          resolve({
            storage: 'base64',
            name: fileName,
            url: url,
            size: file.size,
            type: file.type,
            data: url.replace('data:' + file.type + ';base64,', '')
          });
        };

        reader.onerror = function () {
          return reject(_this);
        };

        reader.readAsDataURL(file);
      });
    },
    downloadFile: function downloadFile(file) {
      // Return the original as there is nothing to do.
      return Promise.resolve(file);
    }
  };
};

base64.title = 'Base64';
module.exports = base64;

},{"native-promise-only":10}],4:[function(require,module,exports){
'use strict';

var Promise = require("native-promise-only");
var dropbox = function dropbox(formio) {
  return {
    uploadFile: function uploadFile(file, fileName, dir, progressCallback) {
      return new Promise(function (resolve, reject) {
        // Send the file with data.
        var xhr = new XMLHttpRequest();

        if (typeof progressCallback === 'function') {
          xhr.upload.onprogress = progressCallback;
        }

        var fd = new FormData();
        fd.append('name', fileName);
        fd.append('dir', dir);
        fd.append('file', file);

        // Fire on network error.
        xhr.onerror = function (err) {
          err.networkError = true;
          reject(err);
        };

        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            var response = JSON.parse(xhr.response);
            response.storage = 'dropbox';
            response.size = file.size;
            response.type = file.type;
            response.url = response.path_lower;
            resolve(response);
          } else {
            reject(xhr.response || 'Unable to upload file');
          }
        };

        xhr.onabort = function (err) {
          reject(err);
        };

        xhr.open('POST', formio.formUrl + '/storage/dropbox');
        var token = false;
        try {
          token = localStorage.getItem('formioToken');
        } catch (e) {
          // Swallow error.
        }
        if (token) {
          xhr.setRequestHeader('x-jwt-token', token);
        }
        xhr.send(fd);
      });
    },
    downloadFile: function downloadFile(file) {
      var token = false;
      try {
        token = localStorage.getItem('formioToken');
      } catch (e) {
        token = cookies.get('formioToken');
      }
      file.url = formio.formUrl + '/storage/dropbox?path_lower=' + file.path_lower + (token ? '&x-jwt-token=' + token : '');
      return Promise.resolve(file);
    }
  };
};

dropbox.title = 'Dropbox';
module.exports = dropbox;

},{"native-promise-only":10}],5:[function(require,module,exports){
'use strict';

module.exports = {
  base64: require('./base64'),
  dropbox: require('./dropbox.js'),
  s3: require('./s3.js'),
  url: require('./url.js')
};

},{"./base64":3,"./dropbox.js":4,"./s3.js":6,"./url.js":7}],6:[function(require,module,exports){
'use strict';

var Promise = require("native-promise-only");
var s3 = function s3(formio) {
  return {
    uploadFile: function uploadFile(file, fileName, dir, progressCallback) {
      return new Promise(function (resolve, reject) {
        // Send the pre response to sign the upload.
        var pre = new XMLHttpRequest();

        var prefd = new FormData();
        prefd.append('name', fileName);
        prefd.append('size', file.size);
        prefd.append('type', file.type);

        // This only fires on a network error.
        pre.onerror = function (err) {
          err.networkError = true;
          reject(err);
        };

        pre.onabort = function (err) {
          reject(err);
        };

        pre.onload = function () {
          if (pre.status >= 200 && pre.status < 300) {
            var response = JSON.parse(pre.response);

            // Send the file with data.
            var xhr = new XMLHttpRequest();

            if (typeof progressCallback === 'function') {
              xhr.upload.onprogress = progressCallback;
            }

            response.data.fileName = fileName;
            response.data.key += dir + fileName;

            var fd = new FormData();
            for (var key in response.data) {
              fd.append(key, response.data[key]);
            }
            fd.append('file', file);

            // Fire on network error.
            xhr.onerror = function (err) {
              err.networkError = true;
              reject(err);
            };

            xhr.onload = function () {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve({
                  storage: 's3',
                  name: fileName,
                  bucket: response.bucket,
                  key: response.data.key,
                  url: response.url + response.data.key,
                  acl: response.data.acl,
                  size: file.size,
                  type: file.type
                });
              } else {
                reject(xhr.response || 'Unable to upload file');
              }
            };

            xhr.onabort = function (err) {
              reject(err);
            };

            xhr.open('POST', response.url);

            xhr.send(fd);
          } else {
            reject(pre.response || 'Unable to sign file');
          }
        };

        pre.open('POST', formio.formUrl + '/storage/s3');

        pre.setRequestHeader('Accept', 'application/json');
        pre.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        var token = false;
        try {
          token = localStorage.getItem('formioToken');
        } catch (e) {
          token = cookies.get('formioToken');
        }
        if (token) {
          pre.setRequestHeader('x-jwt-token', token);
        }

        pre.send(JSON.stringify({
          name: fileName,
          size: file.size,
          type: file.type
        }));
      });
    },
    downloadFile: function downloadFile(file) {
      if (file.acl !== 'public-read') {
        return formio.makeRequest('file', formio.formUrl + '/storage/s3?bucket=' + file.bucket + '&key=' + file.key, 'GET');
      } else {
        return Promise.resolve(file);
      }
    }
  };
};

s3.title = 'S3';
module.exports = s3;

},{"native-promise-only":10}],7:[function(require,module,exports){
'use strict';

var Promise = require("native-promise-only");
var url = function url(formio) {
  return {
    title: 'Url',
    name: 'url',
    uploadFile: function uploadFile(file, fileName, dir, progressCallback, url) {
      return new Promise(function (resolve, reject) {
        var data = {
          dir: dir,
          name: fileName,
          file: file
        };

        // Send the file with data.
        var xhr = new XMLHttpRequest();

        if (typeof progressCallback === 'function') {
          xhr.upload.onprogress = progressCallback;
        }

        var fd = new FormData();
        for (var key in data) {
          fd.append(key, data[key]);
        }

        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Need to test if xhr.response is decoded or not.
            var respData = {};
            try {
              respData = typeof xhr.response === 'string' ? JSON.parse(xhr.response) : {};
              respData = respData && respData.data ? respData.data : {};
            } catch (err) {
              respData = {};
            }

            resolve({
              storage: 'url',
              name: fileName,
              url: xhr.responseURL + '/' + fileName,
              size: file.size,
              type: file.type,
              data: respData
            });
          } else {
            reject(xhr.response || 'Unable to upload file');
          }
        };

        // Fire on network error.
        xhr.onerror = function () {
          reject(xhr);
        };

        xhr.onabort = function () {
          reject(xhr);
        };

        xhr.open('POST', url);
        var token = false;
        try {
          token = localStorage.getItem('formioToken');
        } catch (err) {
          token = cookies.get('formioToken');
        }

        if (token) {
          xhr.setRequestHeader('x-jwt-token', token);
        }
        xhr.send(fd);
      });
    },
    downloadFile: function downloadFile(file) {
      // Return the original as there is nothing to do.
      return Promise.resolve(file);
    }
  };
};

url.title = 'Url';
module.exports = url;

},{"native-promise-only":10}],8:[function(require,module,exports){
exports.defaults = {};

exports.set = function(name, value, options) {
  // Retrieve options and defaults
  var opts = options || {};
  var defaults = exports.defaults;

  // Apply default value for unspecified options
  var expires  = opts.expires  || defaults.expires;
  var domain   = opts.domain   || defaults.domain;
  var path     = opts.path     !== undefined ? opts.path     : (defaults.path !== undefined ? defaults.path : '/');
  var secure   = opts.secure   !== undefined ? opts.secure   : defaults.secure;
  var httponly = opts.httponly !== undefined ? opts.httponly : defaults.httponly;

  // Determine cookie expiration date
  // If succesful the result will be a valid Date, otherwise it will be an invalid Date or false(ish)
  var expDate = expires ? new Date(
      // in case expires is an integer, it should specify the number of days till the cookie expires
      typeof expires === 'number' ? new Date().getTime() + (expires * 864e5) :
      // else expires should be either a Date object or in a format recognized by Date.parse()
      expires
  ) : '';

  // Set cookie
  document.cookie = name.replace(/[^+#$&^`|]/g, encodeURIComponent)                // Encode cookie name
  .replace('(', '%28')
  .replace(')', '%29') +
  '=' + value.replace(/[^+#$&/:<-\[\]-}]/g, encodeURIComponent) +                  // Encode cookie value (RFC6265)
  (expDate && expDate.getTime() >= 0 ? ';expires=' + expDate.toUTCString() : '') + // Add expiration date
  (domain   ? ';domain=' + domain : '') +                                          // Add domain
  (path     ? ';path='   + path   : '') +                                          // Add path
  (secure   ? ';secure'           : '') +                                          // Add secure option
  (httponly ? ';httponly'         : '');                                           // Add httponly option
};

exports.get = function(name) {
  var cookies = document.cookie.split(';');

  // Iterate all cookies
  for(var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    var cookieLength = cookie.length;

    // Determine separator index ("name=value")
    var separatorIndex = cookie.indexOf('=');

    // IE<11 emits the equal sign when the cookie value is empty
    separatorIndex = separatorIndex < 0 ? cookieLength : separatorIndex;

    var cookie_name = decodeURIComponent(cookie.substring(0, separatorIndex).replace(/^\s+/, ''));

    // Return cookie value if the name matches
    if (cookie_name === name) {
      return decodeURIComponent(cookie.substring(separatorIndex + 1, cookieLength));
    }
  }

  // Return `null` as the cookie was not found
  return null;
};

exports.erase = function(name, options) {
  exports.set(name, '', {
    expires:  -1,
    domain:   options && options.domain,
    path:     options && options.path,
    secure:   0,
    httponly: 0}
  );
};

exports.all = function() {
  var all = {};
  var cookies = document.cookie.split(';');

  // Iterate all cookies
  for(var i = 0; i < cookies.length; i++) {
	  var cookie = cookies[i];
    var cookieLength = cookie.length;

	  // Determine separator index ("name=value")
	  var separatorIndex = cookie.indexOf('=');

	  // IE<11 emits the equal sign when the cookie value is empty
	  separatorIndex = separatorIndex < 0 ? cookieLength : separatorIndex;

    // add the cookie name and value to the `all` object
	  var cookie_name = decodeURIComponent(cookie.substring(0, separatorIndex).replace(/^\s+/, ''));
	  all[cookie_name] = decodeURIComponent(cookie.substring(separatorIndex + 1, cookieLength));
	}

  return all;
};

},{}],9:[function(require,module,exports){
/*!
 * EventEmitter2
 * https://github.com/hij1nx/EventEmitter2
 *
 * Copyright (c) 2013 hij1nx
 * Licensed under the MIT license.
 */
;!function(undefined) {

  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };
  var defaultMaxListeners = 10;

  function init() {
    this._events = {};
    if (this._conf) {
      configure.call(this, this._conf);
    }
  }

  function configure(conf) {
    if (conf) {
      this._conf = conf;

      conf.delimiter && (this.delimiter = conf.delimiter);
      this._events.maxListeners = conf.maxListeners !== undefined ? conf.maxListeners : defaultMaxListeners;
      conf.wildcard && (this.wildcard = conf.wildcard);
      conf.newListener && (this.newListener = conf.newListener);
      conf.verboseMemoryLeak && (this.verboseMemoryLeak = conf.verboseMemoryLeak);

      if (this.wildcard) {
        this.listenerTree = {};
      }
    } else {
      this._events.maxListeners = defaultMaxListeners;
    }
  }

  function logPossibleMemoryLeak(count, eventName) {
    var errorMsg = '(node) warning: possible EventEmitter memory ' +
        'leak detected. %d listeners added. ' +
        'Use emitter.setMaxListeners() to increase limit.';

    if(this.verboseMemoryLeak){
      errorMsg += ' Event name: %s.';
      console.error(errorMsg, count, eventName);
    } else {
      console.error(errorMsg, count);
    }

    if (console.trace){
      console.trace();
    }
  }

  function EventEmitter(conf) {
    this._events = {};
    this.newListener = false;
    this.verboseMemoryLeak = false;
    configure.call(this, conf);
  }
  EventEmitter.EventEmitter2 = EventEmitter; // backwards compatibility for exporting EventEmitter property

  //
  // Attention, function return type now is array, always !
  // It has zero elements if no any matches found and one or more
  // elements (leafs) if there are matches
  //
  function searchListenerTree(handlers, type, tree, i) {
    if (!tree) {
      return [];
    }
    var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
        typeLength = type.length, currentType = type[i], nextType = type[i+1];
    if (i === typeLength && tree._listeners) {
      //
      // If at the end of the event(s) list and the tree has listeners
      // invoke those listeners.
      //
      if (typeof tree._listeners === 'function') {
        handlers && handlers.push(tree._listeners);
        return [tree];
      } else {
        for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
          handlers && handlers.push(tree._listeners[leaf]);
        }
        return [tree];
      }
    }

    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
      //
      // If the event emitted is '*' at this part
      // or there is a concrete match at this patch
      //
      if (currentType === '*') {
        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
          }
        }
        return listeners;
      } else if(currentType === '**') {
        endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
        if(endReached && tree._listeners) {
          // The next element has a _listeners, add it to the handlers.
          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
        }

        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            if(branch === '*' || branch === '**') {
              if(tree[branch]._listeners && !endReached) {
                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
              }
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            } else if(branch === nextType) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
            } else {
              // No match on this one, shift into the tree but not in the type array.
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            }
          }
        }
        return listeners;
      }

      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
    }

    xTree = tree['*'];
    if (xTree) {
      //
      // If the listener tree will allow any match for this part,
      // then recursively explore all branches of the tree
      //
      searchListenerTree(handlers, type, xTree, i+1);
    }

    xxTree = tree['**'];
    if(xxTree) {
      if(i < typeLength) {
        if(xxTree._listeners) {
          // If we have a listener on a '**', it will catch all, so add its handler.
          searchListenerTree(handlers, type, xxTree, typeLength);
        }

        // Build arrays of matching next branches and others.
        for(branch in xxTree) {
          if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
            if(branch === nextType) {
              // We know the next element will match, so jump twice.
              searchListenerTree(handlers, type, xxTree[branch], i+2);
            } else if(branch === currentType) {
              // Current node matches, move into the tree.
              searchListenerTree(handlers, type, xxTree[branch], i+1);
            } else {
              isolatedBranch = {};
              isolatedBranch[branch] = xxTree[branch];
              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
            }
          }
        }
      } else if(xxTree._listeners) {
        // We have reached the end and still on a '**'
        searchListenerTree(handlers, type, xxTree, typeLength);
      } else if(xxTree['*'] && xxTree['*']._listeners) {
        searchListenerTree(handlers, type, xxTree['*'], typeLength);
      }
    }

    return listeners;
  }

  function growListenerTree(type, listener) {

    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

    //
    // Looks for two consecutive '**', if so, don't add the event at all.
    //
    for(var i = 0, len = type.length; i+1 < len; i++) {
      if(type[i] === '**' && type[i+1] === '**') {
        return;
      }
    }

    var tree = this.listenerTree;
    var name = type.shift();

    while (name !== undefined) {

      if (!tree[name]) {
        tree[name] = {};
      }

      tree = tree[name];

      if (type.length === 0) {

        if (!tree._listeners) {
          tree._listeners = listener;
        }
        else {
          if (typeof tree._listeners === 'function') {
            tree._listeners = [tree._listeners];
          }

          tree._listeners.push(listener);

          if (
            !tree._listeners.warned &&
            this._events.maxListeners > 0 &&
            tree._listeners.length > this._events.maxListeners
          ) {
            tree._listeners.warned = true;
            logPossibleMemoryLeak.call(this, tree._listeners.length, name);
          }
        }
        return true;
      }
      name = type.shift();
    }
    return true;
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.

  EventEmitter.prototype.delimiter = '.';

  EventEmitter.prototype.setMaxListeners = function(n) {
    if (n !== undefined) {
      this._events || init.call(this);
      this._events.maxListeners = n;
      if (!this._conf) this._conf = {};
      this._conf.maxListeners = n;
    }
  };

  EventEmitter.prototype.event = '';

  EventEmitter.prototype.once = function(event, fn) {
    this.many(event, 1, fn);
    return this;
  };

  EventEmitter.prototype.many = function(event, ttl, fn) {
    var self = this;

    if (typeof fn !== 'function') {
      throw new Error('many only accepts instances of Function');
    }

    function listener() {
      if (--ttl === 0) {
        self.off(event, listener);
      }
      fn.apply(this, arguments);
    }

    listener._origin = fn;

    this.on(event, listener);

    return self;
  };

  EventEmitter.prototype.emit = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this.newListener) {
      if (!this._events.newListener) {
        return false;
      }
    }

    var al = arguments.length;
    var args,l,i,j;
    var handler;

    if (this._all && this._all.length) {
      handler = this._all.slice();
      if (al > 3) {
        args = new Array(al);
        for (j = 0; j < al; j++) args[j] = arguments[j];
      }

      for (i = 0, l = handler.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          handler[i].call(this, type);
          break;
        case 2:
          handler[i].call(this, type, arguments[1]);
          break;
        case 3:
          handler[i].call(this, type, arguments[1], arguments[2]);
          break;
        default:
          handler[i].apply(this, args);
        }
      }
    }

    if (this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    } else {
      handler = this._events[type];
      if (typeof handler === 'function') {
        this.event = type;
        switch (al) {
        case 1:
          handler.call(this);
          break;
        case 2:
          handler.call(this, arguments[1]);
          break;
        case 3:
          handler.call(this, arguments[1], arguments[2]);
          break;
        default:
          args = new Array(al - 1);
          for (j = 1; j < al; j++) args[j - 1] = arguments[j];
          handler.apply(this, args);
        }
        return true;
      } else if (handler) {
        // need to make copy of handlers because list can change in the middle
        // of emit call
        handler = handler.slice();
      }
    }

    if (handler && handler.length) {
      if (al > 3) {
        args = new Array(al - 1);
        for (j = 1; j < al; j++) args[j - 1] = arguments[j];
      }
      for (i = 0, l = handler.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          handler[i].call(this);
          break;
        case 2:
          handler[i].call(this, arguments[1]);
          break;
        case 3:
          handler[i].call(this, arguments[1], arguments[2]);
          break;
        default:
          handler[i].apply(this, args);
        }
      }
      return true;
    } else if (!this._all && type === 'error') {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }

    return !!this._all;
  };

  EventEmitter.prototype.emitAsync = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this.newListener) {
        if (!this._events.newListener) { return Promise.resolve([false]); }
    }

    var promises= [];

    var al = arguments.length;
    var args,l,i,j;
    var handler;

    if (this._all) {
      if (al > 3) {
        args = new Array(al);
        for (j = 1; j < al; j++) args[j] = arguments[j];
      }
      for (i = 0, l = this._all.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          promises.push(this._all[i].call(this, type));
          break;
        case 2:
          promises.push(this._all[i].call(this, type, arguments[1]));
          break;
        case 3:
          promises.push(this._all[i].call(this, type, arguments[1], arguments[2]));
          break;
        default:
          promises.push(this._all[i].apply(this, args));
        }
      }
    }

    if (this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    } else {
      handler = this._events[type];
    }

    if (typeof handler === 'function') {
      this.event = type;
      switch (al) {
      case 1:
        promises.push(handler.call(this));
        break;
      case 2:
        promises.push(handler.call(this, arguments[1]));
        break;
      case 3:
        promises.push(handler.call(this, arguments[1], arguments[2]));
        break;
      default:
        args = new Array(al - 1);
        for (j = 1; j < al; j++) args[j - 1] = arguments[j];
        promises.push(handler.apply(this, args));
      }
    } else if (handler && handler.length) {
      if (al > 3) {
        args = new Array(al - 1);
        for (j = 1; j < al; j++) args[j - 1] = arguments[j];
      }
      for (i = 0, l = handler.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          promises.push(handler[i].call(this));
          break;
        case 2:
          promises.push(handler[i].call(this, arguments[1]));
          break;
        case 3:
          promises.push(handler[i].call(this, arguments[1], arguments[2]));
          break;
        default:
          promises.push(handler[i].apply(this, args));
        }
      }
    } else if (!this._all && type === 'error') {
      if (arguments[1] instanceof Error) {
        return Promise.reject(arguments[1]); // Unhandled 'error' event
      } else {
        return Promise.reject("Uncaught, unspecified 'error' event.");
      }
    }

    return Promise.all(promises);
  };

  EventEmitter.prototype.on = function(type, listener) {
    if (typeof type === 'function') {
      this.onAny(type);
      return this;
    }

    if (typeof listener !== 'function') {
      throw new Error('on only accepts instances of Function');
    }
    this._events || init.call(this);

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, listener);

    if (this.wildcard) {
      growListenerTree.call(this, type, listener);
      return this;
    }

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    }
    else {
      if (typeof this._events[type] === 'function') {
        // Change to array.
        this._events[type] = [this._events[type]];
      }

      // If we've already got an array, just append.
      this._events[type].push(listener);

      // Check for listener leak
      if (
        !this._events[type].warned &&
        this._events.maxListeners > 0 &&
        this._events[type].length > this._events.maxListeners
      ) {
        this._events[type].warned = true;
        logPossibleMemoryLeak.call(this, this._events[type].length, type);
      }
    }

    return this;
  };

  EventEmitter.prototype.onAny = function(fn) {
    if (typeof fn !== 'function') {
      throw new Error('onAny only accepts instances of Function');
    }

    if (!this._all) {
      this._all = [];
    }

    // Add the function to the event listener collection.
    this._all.push(fn);
    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  EventEmitter.prototype.off = function(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function');
    }

    var handlers,leafs=[];

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
    }
    else {
      // does not use listeners(), so no side effect of creating _events[type]
      if (!this._events[type]) return this;
      handlers = this._events[type];
      leafs.push({_listeners:handlers});
    }

    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
      var leaf = leafs[iLeaf];
      handlers = leaf._listeners;
      if (isArray(handlers)) {

        var position = -1;

        for (var i = 0, length = handlers.length; i < length; i++) {
          if (handlers[i] === listener ||
            (handlers[i].listener && handlers[i].listener === listener) ||
            (handlers[i]._origin && handlers[i]._origin === listener)) {
            position = i;
            break;
          }
        }

        if (position < 0) {
          continue;
        }

        if(this.wildcard) {
          leaf._listeners.splice(position, 1);
        }
        else {
          this._events[type].splice(position, 1);
        }

        if (handlers.length === 0) {
          if(this.wildcard) {
            delete leaf._listeners;
          }
          else {
            delete this._events[type];
          }
        }

        this.emit("removeListener", type, listener);

        return this;
      }
      else if (handlers === listener ||
        (handlers.listener && handlers.listener === listener) ||
        (handlers._origin && handlers._origin === listener)) {
        if(this.wildcard) {
          delete leaf._listeners;
        }
        else {
          delete this._events[type];
        }

        this.emit("removeListener", type, listener);
      }
    }

    function recursivelyGarbageCollect(root) {
      if (root === undefined) {
        return;
      }
      var keys = Object.keys(root);
      for (var i in keys) {
        var key = keys[i];
        var obj = root[key];
        if ((obj instanceof Function) || (typeof obj !== "object") || (obj === null))
          continue;
        if (Object.keys(obj).length > 0) {
          recursivelyGarbageCollect(root[key]);
        }
        if (Object.keys(obj).length === 0) {
          delete root[key];
        }
      }
    }
    recursivelyGarbageCollect(this.listenerTree);

    return this;
  };

  EventEmitter.prototype.offAny = function(fn) {
    var i = 0, l = 0, fns;
    if (fn && this._all && this._all.length > 0) {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++) {
        if(fn === fns[i]) {
          fns.splice(i, 1);
          this.emit("removeListenerAny", fn);
          return this;
        }
      }
    } else {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++)
        this.emit("removeListenerAny", fns[i]);
      this._all = [];
    }
    return this;
  };

  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (arguments.length === 0) {
      !this._events || init.call(this);
      return this;
    }

    if (this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

      for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
        var leaf = leafs[iLeaf];
        leaf._listeners = null;
      }
    }
    else if (this._events) {
      this._events[type] = null;
    }
    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if (this.wildcard) {
      var handlers = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
      return handlers;
    }

    this._events || init.call(this);

    if (!this._events[type]) this._events[type] = [];
    if (!isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };

  EventEmitter.prototype.listenerCount = function(type) {
    return this.listeners(type).length;
  };

  EventEmitter.prototype.listenersAny = function() {

    if(this._all) {
      return this._all;
    }
    else {
      return [];
    }

  };

  if (typeof define === 'function' && define.amd) {
     // AMD. Register as an anonymous module.
    define(function() {
      return EventEmitter;
    });
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = EventEmitter;
  }
  else {
    // Browser global.
    window.EventEmitter2 = EventEmitter;
  }
}();

},{}],10:[function(require,module,exports){
(function (global){
/*! Native Promise Only
    v0.8.1 (c) Kyle Simpson
    MIT License: http://getify.mit-license.org
*/

(function UMD(name,context,definition){
	// special form of UMD for polyfilling across evironments
	context[name] = context[name] || definition();
	if (typeof module != "undefined" && module.exports) { module.exports = context[name]; }
	else if (typeof define == "function" && define.amd) { define(function $AMD$(){ return context[name]; }); }
})("Promise",typeof global != "undefined" ? global : this,function DEF(){
	/*jshint validthis:true */
	"use strict";

	var builtInProp, cycle, scheduling_queue,
		ToString = Object.prototype.toString,
		timer = (typeof setImmediate != "undefined") ?
			function timer(fn) { return setImmediate(fn); } :
			setTimeout
	;

	// dammit, IE8.
	try {
		Object.defineProperty({},"x",{});
		builtInProp = function builtInProp(obj,name,val,config) {
			return Object.defineProperty(obj,name,{
				value: val,
				writable: true,
				configurable: config !== false
			});
		};
	}
	catch (err) {
		builtInProp = function builtInProp(obj,name,val) {
			obj[name] = val;
			return obj;
		};
	}

	// Note: using a queue instead of array for efficiency
	scheduling_queue = (function Queue() {
		var first, last, item;

		function Item(fn,self) {
			this.fn = fn;
			this.self = self;
			this.next = void 0;
		}

		return {
			add: function add(fn,self) {
				item = new Item(fn,self);
				if (last) {
					last.next = item;
				}
				else {
					first = item;
				}
				last = item;
				item = void 0;
			},
			drain: function drain() {
				var f = first;
				first = last = cycle = void 0;

				while (f) {
					f.fn.call(f.self);
					f = f.next;
				}
			}
		};
	})();

	function schedule(fn,self) {
		scheduling_queue.add(fn,self);
		if (!cycle) {
			cycle = timer(scheduling_queue.drain);
		}
	}

	// promise duck typing
	function isThenable(o) {
		var _then, o_type = typeof o;

		if (o != null &&
			(
				o_type == "object" || o_type == "function"
			)
		) {
			_then = o.then;
		}
		return typeof _then == "function" ? _then : false;
	}

	function notify() {
		for (var i=0; i<this.chain.length; i++) {
			notifyIsolated(
				this,
				(this.state === 1) ? this.chain[i].success : this.chain[i].failure,
				this.chain[i]
			);
		}
		this.chain.length = 0;
	}

	// NOTE: This is a separate function to isolate
	// the `try..catch` so that other code can be
	// optimized better
	function notifyIsolated(self,cb,chain) {
		var ret, _then;
		try {
			if (cb === false) {
				chain.reject(self.msg);
			}
			else {
				if (cb === true) {
					ret = self.msg;
				}
				else {
					ret = cb.call(void 0,self.msg);
				}

				if (ret === chain.promise) {
					chain.reject(TypeError("Promise-chain cycle"));
				}
				else if (_then = isThenable(ret)) {
					_then.call(ret,chain.resolve,chain.reject);
				}
				else {
					chain.resolve(ret);
				}
			}
		}
		catch (err) {
			chain.reject(err);
		}
	}

	function resolve(msg) {
		var _then, self = this;

		// already triggered?
		if (self.triggered) { return; }

		self.triggered = true;

		// unwrap
		if (self.def) {
			self = self.def;
		}

		try {
			if (_then = isThenable(msg)) {
				schedule(function(){
					var def_wrapper = new MakeDefWrapper(self);
					try {
						_then.call(msg,
							function $resolve$(){ resolve.apply(def_wrapper,arguments); },
							function $reject$(){ reject.apply(def_wrapper,arguments); }
						);
					}
					catch (err) {
						reject.call(def_wrapper,err);
					}
				})
			}
			else {
				self.msg = msg;
				self.state = 1;
				if (self.chain.length > 0) {
					schedule(notify,self);
				}
			}
		}
		catch (err) {
			reject.call(new MakeDefWrapper(self),err);
		}
	}

	function reject(msg) {
		var self = this;

		// already triggered?
		if (self.triggered) { return; }

		self.triggered = true;

		// unwrap
		if (self.def) {
			self = self.def;
		}

		self.msg = msg;
		self.state = 2;
		if (self.chain.length > 0) {
			schedule(notify,self);
		}
	}

	function iteratePromises(Constructor,arr,resolver,rejecter) {
		for (var idx=0; idx<arr.length; idx++) {
			(function IIFE(idx){
				Constructor.resolve(arr[idx])
				.then(
					function $resolver$(msg){
						resolver(idx,msg);
					},
					rejecter
				);
			})(idx);
		}
	}

	function MakeDefWrapper(self) {
		this.def = self;
		this.triggered = false;
	}

	function MakeDef(self) {
		this.promise = self;
		this.state = 0;
		this.triggered = false;
		this.chain = [];
		this.msg = void 0;
	}

	function Promise(executor) {
		if (typeof executor != "function") {
			throw TypeError("Not a function");
		}

		if (this.__NPO__ !== 0) {
			throw TypeError("Not a promise");
		}

		// instance shadowing the inherited "brand"
		// to signal an already "initialized" promise
		this.__NPO__ = 1;

		var def = new MakeDef(this);

		this["then"] = function then(success,failure) {
			var o = {
				success: typeof success == "function" ? success : true,
				failure: typeof failure == "function" ? failure : false
			};
			// Note: `then(..)` itself can be borrowed to be used against
			// a different promise constructor for making the chained promise,
			// by substituting a different `this` binding.
			o.promise = new this.constructor(function extractChain(resolve,reject) {
				if (typeof resolve != "function" || typeof reject != "function") {
					throw TypeError("Not a function");
				}

				o.resolve = resolve;
				o.reject = reject;
			});
			def.chain.push(o);

			if (def.state !== 0) {
				schedule(notify,def);
			}

			return o.promise;
		};
		this["catch"] = function $catch$(failure) {
			return this.then(void 0,failure);
		};

		try {
			executor.call(
				void 0,
				function publicResolve(msg){
					resolve.call(def,msg);
				},
				function publicReject(msg) {
					reject.call(def,msg);
				}
			);
		}
		catch (err) {
			reject.call(def,err);
		}
	}

	var PromisePrototype = builtInProp({},"constructor",Promise,
		/*configurable=*/false
	);

	// Note: Android 4 cannot use `Object.defineProperty(..)` here
	Promise.prototype = PromisePrototype;

	// built-in "brand" to signal an "uninitialized" promise
	builtInProp(PromisePrototype,"__NPO__",0,
		/*configurable=*/false
	);

	builtInProp(Promise,"resolve",function Promise$resolve(msg) {
		var Constructor = this;

		// spec mandated checks
		// note: best "isPromise" check that's practical for now
		if (msg && typeof msg == "object" && msg.__NPO__ === 1) {
			return msg;
		}

		return new Constructor(function executor(resolve,reject){
			if (typeof resolve != "function" || typeof reject != "function") {
				throw TypeError("Not a function");
			}

			resolve(msg);
		});
	});

	builtInProp(Promise,"reject",function Promise$reject(msg) {
		return new this(function executor(resolve,reject){
			if (typeof resolve != "function" || typeof reject != "function") {
				throw TypeError("Not a function");
			}

			reject(msg);
		});
	});

	builtInProp(Promise,"all",function Promise$all(arr) {
		var Constructor = this;

		// spec mandated checks
		if (ToString.call(arr) != "[object Array]") {
			return Constructor.reject(TypeError("Not an array"));
		}
		if (arr.length === 0) {
			return Constructor.resolve([]);
		}

		return new Constructor(function executor(resolve,reject){
			if (typeof resolve != "function" || typeof reject != "function") {
				throw TypeError("Not a function");
			}

			var len = arr.length, msgs = Array(len), count = 0;

			iteratePromises(Constructor,arr,function resolver(idx,msg) {
				msgs[idx] = msg;
				if (++count === len) {
					resolve(msgs);
				}
			},reject);
		});
	});

	builtInProp(Promise,"race",function Promise$race(arr) {
		var Constructor = this;

		// spec mandated checks
		if (ToString.call(arr) != "[object Array]") {
			return Constructor.reject(TypeError("Not an array"));
		}

		return new Constructor(function executor(resolve,reject){
			if (typeof resolve != "function" || typeof reject != "function") {
				throw TypeError("Not a function");
			}

			iteratePromises(Constructor,arr,function resolver(idx,msg){
				resolve(msg);
			},reject);
		});
	});

	return Promise;
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
module.exports = function (obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    var copy;
    
    if (isArray(obj)) {
        var len = obj.length;
        copy = Array(len);
        for (var i = 0; i < len; i++) {
            copy[i] = obj[i];
        }
    }
    else {
        var keys = objectKeys(obj);
        copy = {};
        
        for (var i = 0, l = keys.length; i < l; i++) {
            var key = keys[i];
            copy[key] = obj[key];
        }
    }
    return copy;
};

var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) {
        if ({}.hasOwnProperty.call(obj, key)) keys.push(key);
    }
    return keys;
};

var isArray = Array.isArray || function (xs) {
    return {}.toString.call(xs) === '[object Array]';
};

},{}],12:[function(require,module,exports){
(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ]

    var isDataView = function(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj)
    }

    var isArrayBufferView = ArrayBuffer.isView || function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    }
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1])
      }, this)
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var oldValue = this.map[name]
    this.map[name] = oldValue ? oldValue+','+value : value
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    name = normalizeName(name)
    return this.has(name) ? this.map[name] : null
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value)
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this)
      }
    }
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsArrayBuffer(blob)
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsText(blob)
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf)
    var chars = new Array(view.length)

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i])
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength)
      view.set(new Uint8Array(buf))
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (!body) {
        this._bodyText = ''
      } else if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer)
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer])
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body)
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      }
    }

    this.text = function() {
      var rejected = consumed(this)
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body && input._bodyInit != null) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = String(input)
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this, { body: this._bodyInit })
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers()
    rawHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':')
      var key = parts.shift().trim()
      if (key) {
        var value = parts.join(':').trim()
        headers.append(key, value)
      }
    })
    return headers
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = 'status' in options ? options.status : 200
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = 'statusText' in options ? options.statusText : 'OK'
    this.headers = new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init)
      var xhr = new XMLHttpRequest()

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        }
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);

},{}]},{},[1]);
