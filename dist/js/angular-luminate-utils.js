(function() {
  angular.module('ngLuminateUtils', []).constant('APP_INFO', {
    version: '0.2.0'
  });

  angular.module('ngLuminateUtils').provider('$luminateUtilsConfig', function() {
    var _this;
    _this = this;
    _this.setPath = function(path) {
      if (!path.nonsecure || !path.secure) {
        return new Error('You must specify both a nonsecure and secure path.');
      } else {
        _this.path = {
          nonsecure: path.nonsecure,
          secure: path.secure
        };
        return _this;
      }
    };
    _this.setDefaultRequestData = function(defaultRequestData) {
      _this.defaultRequestData = defaultRequestData;
      return _this;
    };
    _this.setKey = function(apiKey) {
      if (!apiKey) {
        return new Error('You must specify an API Key.');
      } else {
        _this.apiKey = apiKey;
        return _this;
      }
    };
    _this.$get = function() {
      return _this;
    };
  });

  angular.module('ngLuminateUtils').factory('$luminateRest', [
    '$http', '$q', '$timeout', 'APP_INFO', '$luminateUtilsConfig', function($http, $q, $timeout, APP_INFO, $luminateUtilsConfig) {
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
          if (!apiServlet) {
            return new Error('You must specify an API servlet.');
          } else {
            if ((ref = apiServlet.toLowerCase()) === 'addressbook' || ref === 'advocacy' || ref === 'cons' || ref === 'content' || ref === 'datasync' || ref === 'donation' || ref === 'group' || ref === 'orgevent' || ref === 'recurring' || ref === 'survey' || ref === 'teamraiser') {
              apiServlet = 'CR' + apiServlet.toLowerCase().charAt(0).toUpperCase() + apiServlet.toLowerCase().slice(1).toLowerCase() + 'API';
              apiServlet = apiServlet.replace('Addressbook', 'AddressBook').replace('Datasync', 'DataSync').replace('Orgevent', 'OrgEvent');
            }
            if (apiServlet !== 'CRAddressBookAPI' && apiServlet !== 'CRAdvocacyAPI' && apiServlet !== 'CRConsAPI' && apiServlet !== 'CRContentAPI' && apiServlet !== 'CRDataSyncAPI' && apiServlet !== 'CRDonationAPI' && apiServlet !== 'CRGroupAPI' && apiServlet !== 'CROrgEventAPI' && apiServlet !== 'CRRecurringAPI' && apiServlet !== 'CRSurveyAPI' && apiServlet !== 'CRTeamraiserAPI') {
              return new Error('Invalid API servlet.');
            } else if (!requestData) {
              return new Error('You must specify request data.');
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
      };
    }
  ]);

  angular.module('ngLuminateUtils').factory('$luminateSessionVar', [
    '$q', '$luminateTemplateTag', function($q, $luminateTemplateTag) {
      return {
        get: function(sessionVar) {
          return $luminateTemplateTag.parse('[[S80:' + sessionVar + ']]');
        },
        set: function(sessionVar, value) {
          return $luminateTemplateTag.parse('[[U1:' + sessionVar + '=' + value + ']]');
        }
      };
    }
  ]);

  angular.module('ngLuminateUtils').factory('$luminateTemplateTag', [
    '$q', '$luminateRest', function($q, $luminateRest) {
      return {
        parse: function(tag) {
          var deferred;
          if (!tag) {
            deferred = $q.defer();
            deferred.resolve('');
            return deferred.promise;
          } else {
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

}).call(this);
