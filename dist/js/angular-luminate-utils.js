(function() {
  angular.module('ngLuminateUtils', []).constant('APP_INFO', {
    version: '0.3.0'
  });

  angular.module('ngLuminateUtils').provider('$luminateUtilsConfig', function() {
    var _this;
    _this = this;
    _this.setPath = function(path) {
      if (path == null) {
        path = {};
      }
      if (!angular.isString(path.nonsecure || !angular.isString(path.secure))) {
        return new Error('You must specify both a nonsecure and secure path.');
      } else {
        _this.path = {
          nonsecure: path.nonsecure,
          secure: path.secure
        };
        return _this;
      }
    };
    _this.setKey = function(apiKey) {
      if (!angular.isString(apiKey)) {
        return new Error('API Key must be a string but was ' + typeof apiKey);
      } else {
        _this.apiKey = apiKey;
        return _this;
      }
    };
    _this.setDefaultRequestData = function(defaultRequestData) {
      if (!angular.isString(defaultRequestData)) {
        new Error('Request data must be a string but was ' + typeof defaultRequestData);
      } else {
        _this.defaultRequestData = defaultRequestData;
      }
      return _this;
    };
    _this.$get = function() {
      return _this;
    };
  });

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
        getAuthToken: function(forceNewToken, useHTTP) {
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
          var _this, apiServlet, contentType, isAuthTokenRequest, isLoginRequest, isLogoutRequest, ref, requestData, requestUrl, requiresAuth, settings, useHTTP;
          if (options == null) {
            options = {};
          }
          _this = this;
          settings = options;
          apiServlet = settings.api;
          requestData = settings.data;
          requiresAuth = settings.requiresAuth;
          useHTTP = settings.useHTTP;
          contentType = settings.contentType;
          if ((contentType != null ? contentType.split(';')[0] : void 0) !== 'multipart/form-data') {
            contentType = 'application/x-www-form-urlencoded';
          }
          contentType += '; charset=UTF-8';
          if (!$luminateUtilsConfig.path.nonsecure || !$luminateUtilsConfig.path.secure) {
            return $luminateRequestHandler.rejectInvalidRequest('You must specify both a nonsecure and secure path.');
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
              } else if (!angular.isString(requestData)) {
                return $luminateRequestHandler.rejectInvalidRequest('Request data must be a string but was ' + typeof requestData);
              } else {
                requestData = 'v=1.0&response_format=json&suppress_response_codes=true&' + requestData + '&api_key=' + $luminateUtilsConfig.apiKey;
                isAuthTokenRequest = requestData.indexOf('&method=getLoginUrl&') !== -1;
                isLoginRequest = requestData.indexOf('&method=login&') !== -1;
                isLogoutRequest = requestData.indexOf('&method=logout&') !== -1;
                if (!isAuthTokenRequest && !_this.authToken) {
                  if (!_this.authTokenPending) {
                    return _this.getAuthToken(false, useHTTP).then(function() {
                      return _this.request(options);
                    });
                  } else {
                    return $timeout(function() {
                      return _this.request(options);
                    }, 500);
                  }
                } else {
                  if (apiServlet === 'CRDonation' || apiServlet === 'CRTeamraiserAPI') {
                    useHTTP = false;
                  }
                  if (!useHTTP) {
                    requestUrl = $luminateUtilsConfig.path.secure;
                  } else {
                    requestUrl = $luminateUtilsConfig.path.nonsecure;
                  }
                  requestUrl += apiServlet;
                  if (_this.routingId) {
                    requestUrl += ';jsessionid=' + _this.routingId;
                  }
                  if (requiresAuth) {
                    requestData += '&auth=' + _this.authToken;
                  }
                  if (_this.jsessionId) {
                    requestData += '&JSESSIONID=' + _this.jsessionId;
                  }
                  if ($luminateUtilsConfig.defaultRequestData) {
                    requestData += '&' + $luminateUtilsConfig.defaultRequestData;
                  }
                  if (APP_INFO != null ? APP_INFO.version : void 0) {
                    requestData += '&ng_luminate_utils=' + APP_INFO.version;
                  }
                  requestData += '&ts=' + new Date().getTime();
                  return $http({
                    method: 'POST',
                    url: requestUrl,
                    data: requestData,
                    headers: {
                      'Content-Type': contentType
                    },
                    withCredentials: true
                  }).then(function(response) {
                    var _response;
                    _response = response;
                    if (!isLoginRequest && !isLogoutRequest) {
                      return _response;
                    } else {
                      return _this.getAuthToken(true, useHTTP).then(function() {
                        return _response;
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
          if (!angular.isString(sessionVar)) {
            return $luminateRequestHandler.rejectInvalidRequest('Session variable name must be a string but was ' + typeof sessionVar);
          } else {
            sessionVar = $luminateRequestHandler.sanitizeString(sessionVar, true, true);
            return $luminateTemplateTag.parse('[[S80:' + sessionVar + ']]').then(function(response) {
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

  angular.module('ngLuminateUtils').directive('luminateReusable', function() {
    return {
      scope: {
        pagename: '='
      },
      template: '<div ng-bind-html="reusableContent"></div>',
      replace: true,
      controller: [
        '$scope', '$sce', '$luminateRequestHandler', '$luminateTemplateTag', function($scope, $sce, $luminateRequestHandler, $luminateTemplateTag) {
          var getReusableContent;
          getReusableContent = function() {
            var pagename;
            pagename = $scope.pagename;
            if (!angular.isString(pagename)) {
              return $luminateRequestHandler.rejectInvalidRequest('Pagename must be a string but was ' + typeof pagename);
            } else {
              pagename = angular.element('<div>' + pagename + '</div>').text().replace(/\[\[/g, '').replace(/\]\]/g, '').replace(/::/g, '');
              return $luminateTemplateTag.parse('[[S51:' + pagename + ']]').then(function(response) {
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
