angular.module 'ngLuminateUtils'
  .factory '$luminateRest', [
    '$http'
    '$q'
    '$timeout'
    'APP_INFO'
    '$luminateUtilsConfig'
    ($http, $q, $timeout, APP_INFO, $luminateUtilsConfig) ->
      getAuthToken: (forceNewToken) ->
        _this = this
        if not _this.authToken or forceNewToken
          _this.authTokenPending = true
          requestData = 'method=getLoginUrl'
          if _this.nonce
            requestData += '&NONCE_TOKEN=' + _this.nonce
            _this.nonce = null
          _this.request 'cons', requestData
            .then (response) ->
              _this.routingId = response.data.getLoginUrlResponse?.routing_id
              _this.jsessionId = response.data.getLoginUrlResponse?.JSESSIONID
              _this.authToken = response.data.getLoginUrlResponse?.token or ''
              _this.authTokenPending = false
              $q.resolve _this.authToken
        else
          _this.authTokenPending = false
          $q.resolve _this.authToken
      
      request: (apiServlet, requestData, requiresAuth, useHTTPS = true) ->
        _this = this
        if not apiServlet
          new Error 'You must specify an API servlet.'
        else
          if apiServlet.toLowerCase() in ['addressbook', 'advocacy', 'cons', 'content', 'datasync', 'donation', 'group', 'orgevent', 'recurring', 'survey', 'teamraiser']
            apiServlet = 'CR' + apiServlet.toLowerCase().charAt(0).toUpperCase() + apiServlet.toLowerCase().slice(1).toLowerCase() + 'API'
            apiServlet = apiServlet.replace('Addressbook', 'AddressBook').replace('Datasync', 'DataSync').replace 'Orgevent', 'OrgEvent'
          if apiServlet not in ['CRAddressBookAPI', 'CRAdvocacyAPI', 'CRConsAPI', 'CRContentAPI', 'CRDataSyncAPI', 'CRDonationAPI', 'CRGroupAPI', 'CROrgEventAPI', 'CRRecurringAPI', 'CRSurveyAPI', 'CRTeamraiserAPI']
            new Error 'Invalid API servlet.'
          else if not requestData
            new Error 'You must specify request data.'
          else
            _requestData = 'v=1.0&response_format=json&suppress_response_codes=true&' + requestData + '&api_key=' + $luminateUtilsConfig.apiKey
            isAuthTokenRequest = _requestData.indexOf('&method=getLoginUrl&') isnt -1
            isLoginRequest = _requestData.indexOf('&method=login&') isnt -1
            isLogoutRequest = _requestData.indexOf('&method=logout&') isnt -1  
            if not isAuthTokenRequest and not _this.authToken
              if not _this.authTokenPending
                _this.getAuthToken()
                  .then ->
                    _this.request apiServlet, requestData, requiresAuth
              else
                $timeout ->
                  _this.request apiServlet, requestData, requiresAuth
                , 500
            else
              if apiServlet in ['CRDonation', 'CRTeamraiserAPI']
                useHTTPS = true
              if not useHTTPS
                requestUrl = $luminateUtilsConfig.path.nonsecure
              else
                requestUrl = $luminateUtilsConfig.path.secure
              requestUrl += apiServlet
              if _this.routingId
                requestUrl += ';' + _this.routingId
              if requiresAuth
                _requestData += '&auth=' + _this.authToken
              if _this.jsessionId
                _requestData += '&JSESSIONID=' + _this.jsessionId
              if $luminateUtilsConfig.defaultRequestData
                _requestData += '&' + $luminateUtilsConfig.defaultRequestData
              if APP_INFO?.version
                _requestData += '&ng_luminate_utils=' + APP_INFO.version
              $http
                method: 'POST'
                url: requestUrl
                data: _requestData
                headers:
                  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' # TODO: allow content-type to be specified
                withCredentials: true
              .then (response) ->
                _response = response
                if not isLoginRequest and not isLogoutRequest
                  _response
                else
                  if isLoginRequest
                    _this.nonce = _response.loginResponse?.nonce
                  _this.getAuthToken true
                    .then ->
                      _response
  ]