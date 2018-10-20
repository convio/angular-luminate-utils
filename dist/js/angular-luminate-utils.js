(function() {
  angular.module('ngLuminateUtils', []).constant('APP_INFO', {
    version: '0.8.0'
  });

  angular.module('ngLuminateUtils').provider('$luminateUtilsConfig', function() {
    var _this;
    _this = this;
    _this.setPath = function(path) {
      var securePathIsValid;
      if (path == null) {
        path = {};
      }
      if (!angular.isString(path.secure)) {
        new Error('You must specify a secure path.');
      } else {
        path.secure = path.secure.toLowerCase();
        securePathIsValid = path.secure.indexOf('/site/') === path.secure.length - 6 || path.secure.indexOf('/admin/') === path.secure.length - 7;
        if (!securePathIsValid) {
          if (!securePathIsValid) {
            new Error('Invalid secure path.');
          }
        } else {
          _this.path = {
            secure: path.secure
          };
        }
      }
      return _this;
    };
    _this.setKey = function(apiKey) {
      if (!angular.isString(apiKey)) {
        new Error('API Key must be a string but was ' + typeof apiKey);
      } else {
        _this.apiKey = apiKey;
      }
      return _this;
    };
    _this.setLocale = function(locale) {
      if (!angular.isString(locale)) {
        new Error('Locale must be a string but was ' + typeof locale);
      } else {
        if (locale === 'en_US' || locale === 'es_US' || locale === 'en_CA' || locale === 'fr_CA' || locale === 'en_GB' || locale === 'en_AU') {
          _this.locale = locale;
        }
      }
      return _this;
    };
    _this.setDefaultRequestData = function(defaultRequestData) {
      if (!angular.isString(defaultRequestData)) {
        new Error('Request data must be a string but was ' + typeof defaultRequestData);
      } else {
        _this.defaultRequestData = defaultRequestData;
      }
      return _this;
    };
    _this.setDefaultRequestHandler = function(defaultRequestHandler) {
      if (!angular.isFunction(defaultRequestHandler)) {
        new Error('Request handler must be a function but was ' + typeof defaultRequestHandler);
      } else {
        _this.defaultRequestHandler = defaultRequestHandler;
      }
      return _this;
    };
    _this.$get = function() {
      return _this;
    };
  });

  angular.module('ngLuminateUtils').factory('$luminateMessageCatalog', [
    '$q', '$luminateUtilsConfig', '$luminateRequestHandler', '$luminateRest', function($q, $luminateUtilsConfig, $luminateRequestHandler, $luminateRest) {
      return {
        get: function(messageCatalogEntries) {
          var _this, bundles, currentLocale, deferred, numBundlesComplete, numValidBundles, requestedKeyMap;
          _this = this;
          currentLocale = $luminateUtilsConfig.locale || 'default';
          if (!angular.isString(messageCatalogEntries) && !angular.isArray(messageCatalogEntries)) {
            return $luminateRequestHandler.rejectInvalidRequest('Message Catalog entries must be a string or array but was ' + typeof messageCatalogEntries);
          } else {
            if (!angular.isArray(messageCatalogEntries)) {
              messageCatalogEntries = [messageCatalogEntries];
            }
            bundles = {};
            numValidBundles = 0;
            angular.forEach(messageCatalogEntries, function(messageCatalogEntry) {
              var entryBundle, entryKey, messageCatalogEntryParts;
              messageCatalogEntryParts = messageCatalogEntry.split(':');
              if (messageCatalogEntryParts.length !== 2) {
                return new Error('Invalid Message Catalog bundle/key pair ' + messageCatalogEntry);
              } else {
                entryBundle = $luminateRequestHandler.sanitizeString(messageCatalogEntryParts[0], true, true);
                entryKey = $luminateRequestHandler.sanitizeString(messageCatalogEntryParts[1], true, true);
                if (!bundles[entryBundle]) {
                  bundles[entryBundle] = {};
                  numValidBundles++;
                }
                if (!bundles[entryBundle].requestedKeys) {
                  bundles[entryBundle].requestedKeys = [];
                }
                bundles[entryBundle].requestedKeys.push(entryKey);
                if (!bundles[entryBundle].newKeys) {
                  bundles[entryBundle].newKeys = [];
                }
                if (!_this.messageCatalogCache) {
                  _this.messageCatalogCache = {};
                }
                if (!_this.messageCatalogCache[currentLocale]) {
                  _this.messageCatalogCache[currentLocale] = {};
                }
                if (!_this.messageCatalogCache[currentLocale][entryBundle]) {
                  _this.messageCatalogCache[currentLocale][entryBundle] = {};
                }
                if (!angular.isString(_this.messageCatalogCache[currentLocale][entryBundle][entryKey])) {
                  return bundles[entryBundle].newKeys.push(entryKey);
                }
              }
            });
            if (bundles.length === 0) {
              return $luminateRequestHandler.rejectInvalidRequest('No Message Catalog bundles defined.');
            } else {
              deferred = $q.defer();
              numBundlesComplete = 0;
              requestedKeyMap = {};
              angular.forEach(bundles, function(keys, bundle) {
                var numNewKeys;
                requestedKeyMap[bundle] = {};
                angular.forEach(keys.requestedKeys, function(requestedKey) {
                  if (_this.messageCatalogCache[currentLocale][bundle][requestedKey]) {
                    return requestedKeyMap[bundle][requestedKey] = _this.messageCatalogCache[currentLocale][bundle][requestedKey];
                  }
                });
                numNewKeys = keys.newKeys.length;
                if (numNewKeys === 0) {
                  numBundlesComplete++;
                  if (numBundlesComplete === numValidBundles) {
                    return deferred.resolve(requestedKeyMap);
                  }
                } else {
                  return $luminateRest.request({
                    api: 'content',
                    data: 'method=getMessageBundle&bundle=' + bundle + '&keys=' + keys.newKeys.join(','),
                    requiresAuth: true
                  }).then(function(response) {
                    var keyValues, ref;
                    keyValues = (ref = response.data.getMessageBundleResponse) != null ? ref.values : void 0;
                    if (!keyValues) {
                      angular.forEach(keys.newKeys, function(newKey) {
                        _this.messageCatalogCache[currentLocale][bundle][newKey] = '';
                        return requestedKeyMap[bundle][newKey] = '';
                      });
                    } else {
                      if (!angular.isArray(keyValues)) {
                        keyValues = [keyValues];
                      }
                      angular.forEach(keyValues, function(keyValue) {
                        var value;
                        value = keyValue.value;
                        if (value.indexOf('Message not found for key: ') === 0) {
                          value = '';
                        }
                        _this.messageCatalogCache[currentLocale][bundle][keyValue.key] = value;
                        return requestedKeyMap[bundle][keyValue.key] = value;
                      });
                    }
                    numBundlesComplete++;
                    if (numBundlesComplete === numValidBundles) {
                      return deferred.resolve(requestedKeyMap);
                    }
                  });
                }
              });
              return deferred.promise;
            }
          }
        },
        flushCache: function() {
          _this.messageCatalogCache = {};
          return _this;
        }
      };
    }
  ]);

  angular.module('ngLuminateUtils').factory('$luminateRequestHandler', [
    '$q', function($q) {
      return {
        sanitizeString: function(string, allowLuminateReservedChars, allowHtml) {
          var sanitizedString;
          sanitizedString = string;
          if (!allowHtml) {
            sanitizedString = angular.element('<div>' + sanitizedString + '</div>').text();
          }
          if (!allowLuminateReservedChars) {
            sanitizedString = sanitizedString.replace(/\[\[/g, '').replace(/\]\]/g, '').replace(/::/g, '');
          }
          return sanitizedString;
        },
        rejectInvalidRequest: function(errorMessage) {
          var deferred;
          if (errorMessage == null) {
            errorMessage = 'Invalid request.';
          }
          deferred = $q.defer();
          deferred.reject(errorMessage);
          return deferred.promise;
        }
      };
    }
  ]);

  angular.module('ngLuminateUtils').factory('$luminateRest', [
    '$http', '$q', '$timeout', 'APP_INFO', '$luminateUtilsConfig', '$luminateRequestHandler', function($http, $q, $timeout, APP_INFO, $luminateUtilsConfig, $luminateRequestHandler) {
      return {
        getAuthToken: function(forceNewToken) {
          var _this, requestData;
          _this = this;
          if (!_this.authToken || forceNewToken) {
            _this.authTokenPending = true;
            requestData = 'method=getLoginUrl';
            return _this.request({
              api: 'cons',
              data: requestData
            }).then(function(response) {
              var ref, ref1, ref2;
              _this.routingId = (ref = response.data.getLoginUrlResponse) != null ? ref.routing_id : void 0;
              _this.jsessionId = (ref1 = response.data.getLoginUrlResponse) != null ? ref1.JSESSIONID : void 0;
              _this.authToken = ((ref2 = response.data.getLoginUrlResponse) != null ? ref2.token : void 0) || '';
              _this.authTokenPending = false;
              return $q.resolve(_this.authToken);
            });
          } else {
            _this.authTokenPending = false;
            return $q.resolve(_this.authToken);
          }
        },
        request: function(options) {
          var _this, apiServlet, contentType, isAuthTokenRequest, isLoginRequest, isLogoutRequest, ref, requestData, requestFormData, requestProperties, requestUrl, requiresAuth, settings;
          if (options == null) {
            options = {};
          }
          _this = this;
          settings = options;
          apiServlet = settings.api;
          requestData = settings.data;
          requestFormData = settings.formData;
          requiresAuth = settings.requiresAuth;
          contentType = settings.contentType;
          if ((requestFormData && !contentType) || (contentType != null ? contentType.split(';')[0] : void 0) === 'multipart/form-data') {
            contentType = 'multipart/form-data';
          } else {
            contentType = 'application/x-www-form-urlencoded; charset=UTF-8';
          }
          if (!$luminateUtilsConfig.path.secure) {
            return $luminateRequestHandler.rejectInvalidRequest('You must specify a secure path.');
          } else if (!$luminateUtilsConfig.apiKey) {
            return $luminateRequestHandler.rejectInvalidRequest('You must specify both an API Key.');
          } else {
            if (!angular.isString(apiServlet)) {
              return $luminateRequestHandler.rejectInvalidRequest('API servlet must be a string but was ' + typeof apiServlet);
            } else {
              if ((ref = apiServlet.toLowerCase()) === 'addressbook' || ref === 'advocacy' || ref === 'cons' || ref === 'content' || ref === 'datasync' || ref === 'donation' || ref === 'group' || ref === 'orgevent' || ref === 'recurring' || ref === 'survey' || ref === 'teamraiser') {
                apiServlet = 'CR' + apiServlet.toLowerCase().charAt(0).toUpperCase() + apiServlet.toLowerCase().slice(1).toLowerCase() + 'API';
                apiServlet = apiServlet.replace('Addressbook', 'AddressBook').replace('Datasync', 'DataSync').replace('Orgevent', 'OrgEvent');
              }
              if (apiServlet !== 'CRAddressBookAPI' && apiServlet !== 'CRAdvocacyAPI' && apiServlet !== 'CRConsAPI' && apiServlet !== 'CRContentAPI' && apiServlet !== 'CRDataSyncAPI' && apiServlet !== 'CRDonationAPI' && apiServlet !== 'CRGroupAPI' && apiServlet !== 'CROrgEventAPI' && apiServlet !== 'CRRecurringAPI' && apiServlet !== 'CRSurveyAPI' && apiServlet !== 'CRTeamraiserAPI') {
                return $luminateRequestHandler.rejectInvalidRequest('Invalid API servlet ' + apiServlet);
              } else if (requestFormData && !angular.isObject(requestFormData)) {
                return $luminateRequestHandler.rejectInvalidRequest('Request formData must be an object but was ' + typeof requestFormData);
              } else if (!requestFormData && !angular.isString(requestData)) {
                return $luminateRequestHandler.rejectInvalidRequest('Request data must be a string but was ' + typeof requestData);
              } else {
                if (requestFormData && !requestData) {
                  requestData = '';
                }
                if (requestData !== '') {
                  requestData += '&';
                }
                requestData += 'v=1.0&response_format=json&suppress_response_codes=true&api_key=' + $luminateUtilsConfig.apiKey;
                isAuthTokenRequest = ('&' + requestData).indexOf('&method=getLoginUrl&') !== -1;
                isLoginRequest = ('&' + requestData).indexOf('&method=login&') !== -1;
                isLogoutRequest = ('&' + requestData).indexOf('&method=logout&') !== -1;
                if (!isAuthTokenRequest && !_this.authToken) {
                  if (!_this.authTokenPending) {
                    return _this.getAuthToken(false).then(function() {
                      return _this.request(options);
                    });
                  } else {
                    return $timeout(function() {
                      return _this.request(options);
                    }, 250);
                  }
                } else {
                  requestUrl = $luminateUtilsConfig.path.secure + apiServlet;
                  if (_this.routingId) {
                    requestUrl += ';jsessionid=' + _this.routingId;
                  }
                  if ($luminateUtilsConfig.locale) {
                    requestData += '&s_locale=' + $luminateUtilsConfig.locale;
                  }
                  if ($luminateUtilsConfig.defaultRequestData) {
                    requestData += '&' + $luminateUtilsConfig.defaultRequestData;
                  }
                  if (_this.jsessionId) {
                    requestData += '&JSESSIONID=' + _this.jsessionId;
                  }
                  if (requiresAuth) {
                    requestData += '&auth=' + _this.authToken;
                  }
                  if (APP_INFO != null ? APP_INFO.version : void 0) {
                    requestData += '&ng_luminate_utils=' + APP_INFO.version;
                  }
                  requestData += '&ts=' + new Date().getTime();
                  if (requestFormData) {
                    angular.forEach(requestData.split('&'), function(requestDataKeyVal) {
                      var requestDataKey, requestDataKeyValParts, requestDataVal;
                      requestDataKeyValParts = requestDataKeyVal.split('=');
                      requestDataKey = requestDataKeyValParts[0];
                      requestDataVal = requestDataKeyValParts[1] || '';
                      return requestFormData.append(requestDataKey, requestDataVal);
                    });
                  }
                  requestProperties = {
                    method: 'POST',
                    url: requestUrl,
                    data: requestFormData ? requestFormData : requestData,
                    headers: {
                      'Content-Type': contentType === 'multipart/form-data' ? void 0 : contentType
                    },
                    withCredentials: true
                  };
                  if (contentType === 'multipart/form-data') {
                    requestProperties.transformRequest = angular.identity;
                  }
                  return $http(requestProperties).then(function(response) {
                    var _response;
                    _response = response;
                    if (!isLoginRequest && !isLogoutRequest) {
                      if (isAuthTokenRequest || !$luminateUtilsConfig.defaultRequestHandler) {
                        return _response;
                      } else {
                        return $luminateUtilsConfig.defaultRequestHandler(_response);
                      }
                    } else {
                      return _this.getAuthToken(true).then(function() {
                        if (isAuthTokenRequest || !$luminateUtilsConfig.defaultRequestHandler) {
                          return _response;
                        } else {
                          return $luminateUtilsConfig.defaultRequestHandler(_response);
                        }
                      });
                    }
                  });
                }
              }
            }
          }
        }
      };
    }
  ]);

  angular.module('ngLuminateUtils').factory('$luminateSessionVar', [
    '$q', '$luminateRequestHandler', '$luminateTemplateTag', function($q, $luminateRequestHandler, $luminateTemplateTag) {
      return {
        get: function(sessionVar) {
          var templateTag;
          if (!angular.isString(sessionVar)) {
            return $luminateRequestHandler.rejectInvalidRequest('Session variable name must be a string but was ' + typeof sessionVar);
          } else {
            sessionVar = $luminateRequestHandler.sanitizeString(sessionVar, true);
            templateTag = '';
            if (sessionVar.indexOf('[[') === 0 && sessionVar.lastIndexOf(']]') === sessionVar.length - 2) {
              templateTag = '[[E80:' + sessionVar + ']]';
            } else {
              templateTag = '[[S80:' + sessionVar + ']]';
            }
            return $luminateTemplateTag.parse(templateTag).then(function(response) {
              return $luminateRequestHandler.sanitizeString(response, true);
            });
          }
        },
        set: function(sessionVar, value) {
          if (value == null) {
            value = '';
          }
          if (!angular.isString(sessionVar)) {
            return $luminateRequestHandler.rejectInvalidRequest('Session variable name must be a string but was ' + typeof sessionVar);
          } else {
            if (!angular.isString(value) && isNaN(value)) {
              return $luminateRequestHandler.rejectInvalidRequest('Session variable value must be a string or number but was ' + typeof value);
            } else {
              sessionVar = $luminateRequestHandler.sanitizeString(sessionVar, true, true);
              value = $luminateRequestHandler.sanitizeString(value, true);
              return $luminateTemplateTag.parse('[[U1:' + sessionVar + '=' + value + ']]');
            }
          }
        }
      };
    }
  ]);

  angular.module('ngLuminateUtils').factory('$luminateTemplateTag', [
    '$q', '$luminateRequestHandler', '$luminateRest', function($q, $luminateRequestHandler, $luminateRest) {
      return {
        parse: function(tag) {
          var deferred;
          if (tag == null) {
            tag = '';
          }
          if (!angular.isString(tag)) {
            return $luminateRequestHandler.rejectInvalidRequest('Template tag must be a string but was ' + typeof tag);
          } else if (tag === '') {
            deferred = $q.defer();
            deferred.resolve('');
            return deferred.promise;
          } else {
            tag = $luminateRequestHandler.sanitizeString(tag, true);
            return $luminateRest.request({
              api: 'content',
              data: 'method=getTagInfo&content=' + tag,
              requiresAuth: true
            }).then(function(response) {
              var parsedTag, ref;
              parsedTag = ((ref = response.data.getTagInfoResponse) != null ? ref.preview : void 0) || '';
              return $q.resolve(parsedTag);
            });
          }
        }
      };
    }
  ]);

  angular.module('ngLuminateUtils').directive('luminateInclude', function() {
    return {
      scope: {
        filename: '='
      },
      template: '<div ng-bind-html="includeContent" ng-cloak></div>',
      replace: true,
      controller: [
        '$scope', '$sce', '$luminateRequestHandler', '$luminateTemplateTag', function($scope, $sce, $luminateRequestHandler, $luminateTemplateTag) {
          var getIncludeContent;
          getIncludeContent = function() {
            var filename, templateTag;
            filename = $scope.filename;
            if (!angular.isString(filename)) {
              return $luminateRequestHandler.rejectInvalidRequest('Filename must be a string but was ' + typeof filename);
            } else {
              filename = $luminateRequestHandler.sanitizeString(filename, true);
              templateTag = '';
              if (filename.indexOf('[[') > -1 && filename.indexOf(']]') > filename.indexOf('[[')) {
                templateTag = '[[E84:' + filename + ']]';
              } else {
                filename = $luminateRequestHandler.sanitizeString(filename);
                templateTag = '[[S84:' + filename + ']]';
              }
              return $luminateTemplateTag.parse(templateTag).then(function(response) {
                return $scope.includeContent = $sce.trustAsHtml(response);
              });
            }
          };
          getIncludeContent();
          return $scope.$watch('filename', function(newValue, oldValue) {
            if (newValue !== oldValue) {
              return getIncludeContent();
            }
          });
        }
      ]
    };
  });

  angular.module('ngLuminateUtils').directive('luminateReusable', function() {
    return {
      scope: {
        pagename: '='
      },
      template: '<div ng-bind-html="reusableContent" ng-cloak></div>',
      replace: true,
      controller: [
        '$scope', '$sce', '$luminateRequestHandler', '$luminateTemplateTag', function($scope, $sce, $luminateRequestHandler, $luminateTemplateTag) {
          var getReusableContent;
          getReusableContent = function() {
            var pagename, templateTag;
            pagename = $scope.pagename;
            if (!angular.isString(pagename)) {
              return $luminateRequestHandler.rejectInvalidRequest('Pagename must be a string but was ' + typeof pagename);
            } else {
              pagename = $luminateRequestHandler.sanitizeString(pagename, true);
              templateTag = '';
              if (pagename.indexOf('[[') > -1 && pagename.indexOf(']]') > pagename.indexOf('[[')) {
                templateTag = '[[E51:' + pagename + ']]';
              } else {
                pagename = $luminateRequestHandler.sanitizeString(pagename);
                templateTag = '[[S51:' + pagename + ']]';
              }
              return $luminateTemplateTag.parse(templateTag).then(function(response) {
                return $scope.reusableContent = $sce.trustAsHtml(response);
              });
            }
          };
          getReusableContent();
          return $scope.$watch('pagename', function(newValue, oldValue) {
            if (newValue !== oldValue) {
              return getReusableContent();
            }
          });
        }
      ]
    };
  });

}).call(this);
