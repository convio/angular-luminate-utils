(function() {
  angular.module('ngLuminateUtils', []).constant('APP_INFO', {
    version: '0.1.0'
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
        getAuthToken: function(forceNewToken) {
          var _this, requestData;
          _this = this;
          if (!_this.authToken || forceNewToken) {
            _this.authTokenPending = true;
            requestData = 'method=getLoginUrl';
            if (_this.nonce) {
              requestData += '&NONCE_TOKEN=' + _this.nonce;
              _this.nonce = null;
            }
            return _this.request('cons', requestData).then(function(response) {
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
        request: function(apiServlet, requestData, requiresAuth, useHTTPS) {
          var _requestData, _this, isAuthTokenRequest, isLoginRequest, isLogoutRequest, ref, requestUrl;
          if (useHTTPS == null) {
            useHTTPS = true;
          }
          _this = this;
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
              _requestData = 'v=1.0&response_format=json&suppress_response_codes=true&' + requestData + '&api_key=' + $luminateUtilsConfig.apiKey;
              isAuthTokenRequest = _requestData.indexOf('&method=getLoginUrl&') !== -1;
              isLoginRequest = _requestData.indexOf('&method=login&') !== -1;
              isLogoutRequest = _requestData.indexOf('&method=logout&') !== -1;
              if (!isAuthTokenRequest && !_this.authToken) {
                if (!_this.authTokenPending) {
                  return _this.getAuthToken().then(function() {
                    return _this.request(apiServlet, requestData, requiresAuth);
                  });
                } else {
                  return $timeout(function() {
                    return _this.request(apiServlet, requestData, requiresAuth);
                  }, 500);
                }
              } else {
                if (apiServlet === 'CRDonation' || apiServlet === 'CRTeamraiserAPI') {
                  useHTTPS = true;
                }
                if (!useHTTPS) {
                  requestUrl = $luminateUtilsConfig.path.nonsecure;
                } else {
                  requestUrl = $luminateUtilsConfig.path.secure;
                }
                requestUrl += apiServlet;
                if (_this.routingId && _this.routingId !== '') {
                  requestUrl += ';' + _this.routingId;
                }
                if (requiresAuth) {
                  _requestData += '&auth=' + _this.authToken;
                }
                if (_this.jsessionId) {
                  _requestData += '&JSESSIONID=' + _this.jsessionId;
                }
                if ($luminateUtilsConfig.defaultRequestData) {
                  _requestData += '&' + $luminateUtilsConfig.defaultRequestData;
                }
                if (APP_INFO != null ? APP_INFO.version : void 0) {
                  _requestData += '&ng_luminate_utils=' + APP_INFO.version;
                }
                return $http({
                  method: 'POST',
                  url: requestUrl,
                  data: _requestData,
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                  },
                  withCredentials: true
                }).then(function(response) {
                  var _response, ref1;
                  _response = response;
                  if (!isLoginRequest && !isLogoutRequest) {
                    return _response;
                  } else {
                    if (isLoginRequest) {
                      _this.nonce = (ref1 = _response.loginResponse) != null ? ref1.nonce : void 0;
                    }
                    return _this.getAuthToken(true).then(function() {
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
            return $luminateRest.request('content', 'method=getTagInfo&content=' + tag, true).then(function(response) {
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
