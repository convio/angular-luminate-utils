angular.module 'ngLuminateUtils'
  .factory '$luminateRest', [
    '$http'
    '$q'
    '$timeout'
    'APP_INFO'
    '$luminateUtilsConfig'
    '$luminateRequestHandler'
    ($http, $q, $timeout, APP_INFO, $luminateUtilsConfig, $luminateRequestHandler) ->
      getAuthToken: (forceNewToken, useHTTP) ->
        _this = this
        if not _this.authToken or forceNewToken
          _this.authTokenPending = true
          requestData = 'method=getLoginUrl'
          _this.request
            api: 'cons'
            data: requestData
          .then (response) ->
            _this.routingId = response.data.getLoginUrlResponse?.routing_id
            _this.jsessionId = response.data.getLoginUrlResponse?.JSESSIONID
            _this.authToken = response.data.getLoginUrlResponse?.token or ''
            _this.authTokenPending = false
            $q.resolve _this.authToken
        else
          _this.authTokenPending = false
          $q.resolve _this.authToken
      
      request: (options = {}) ->
        _this = this
        settings = options
        apiServlet = settings.api
        requestData = settings.data
        requiresAuth = settings.requiresAuth
        useHTTP = settings.useHTTP
        contentType = settings.contentType
        if contentType?.split(';')[0] isnt 'multipart/form-data'
          contentType = 'application/x-www-form-urlencoded'
        contentType += '; charset=UTF-8'
        if not $luminateUtilsConfig.path.nonsecure or not $luminateUtilsConfig.path.secure
          $luminateRequestHandler.rejectInvalidRequest 'You must specify both a nonsecure and secure path.'
        else if not $luminateUtilsConfig.apiKey
          $luminateRequestHandler.rejectInvalidRequest 'You must specify both an API Key.'
        else
          if not angular.isString apiServlet
            $luminateRequestHandler.rejectInvalidRequest 'API servlet must be a string but was ' + typeof apiServlet
          else
            if apiServlet.toLowerCase() in ['addressbook', 'advocacy', 'cons', 'content', 'datasync', 'donation', 'group', 'orgevent', 'recurring', 'survey', 'teamraiser']
              apiServlet = 'CR' + apiServlet.toLowerCase().charAt(0).toUpperCase() + apiServlet.toLowerCase().slice(1).toLowerCase() + 'API'
              apiServlet = apiServlet.replace('Addressbook', 'AddressBook').replace('Datasync', 'DataSync').replace 'Orgevent', 'OrgEvent'
            if apiServlet not in ['CRAddressBookAPI', 'CRAdvocacyAPI', 'CRConsAPI', 'CRContentAPI', 'CRDataSyncAPI', 'CRDonationAPI', 'CRGroupAPI', 'CROrgEventAPI', 'CRRecurringAPI', 'CRSurveyAPI', 'CRTeamraiserAPI']
              $luminateRequestHandler.rejectInvalidRequest 'Invalid API servlet ' + apiServlet
            else if not angular.isString requestData
              $luminateRequestHandler.rejectInvalidRequest 'Request data must be a string but was ' + typeof requestData
            else
              requestData = 'v=1.0&response_format=json&suppress_response_codes=true&' + requestData + '&api_key=' + $luminateUtilsConfig.apiKey
              isAuthTokenRequest = requestData.indexOf('&method=getLoginUrl&') isnt -1
              isLoginRequest = requestData.indexOf('&method=login&') isnt -1
              isLogoutRequest = requestData.indexOf('&method=logout&') isnt -1  
              if not isAuthTokenRequest and not _this.authToken
                if not _this.authTokenPending
                  _this.getAuthToken false, useHTTP
                    .then ->
                      _this.request options
                else
                  $timeout ->
                    _this.request options
                  , 500
              else
                if apiServlet in ['CRDonation', 'CRTeamraiserAPI']
                  useHTTP = false
                if not useHTTP
                  requestUrl = $luminateUtilsConfig.path.secure
                else
                  requestUrl = $luminateUtilsConfig.path.nonsecure
                requestUrl += apiServlet
                if _this.routingId
                  requestUrl += ';jsessionid=' + _this.routingId
                if $luminateUtilsConfig.locale
                  requestData += '&s_locale=' + $luminateUtilsConfig.locale
                if $luminateUtilsConfig.defaultRequestData
                  requestData += '&' + $luminateUtilsConfig.defaultRequestData
                if _this.jsessionId
                  requestData += '&JSESSIONID=' + _this.jsessionId
                if requiresAuth
                  requestData += '&auth=' + _this.authToken
                if APP_INFO?.version
                  requestData += '&ng_luminate_utils=' + APP_INFO.version
                requestData += '&ts=' + new Date().getTime()
                $http
                  method: 'POST'
                  url: requestUrl
                  data: requestData
                  headers:
                    'Content-Type': contentType
                  withCredentials: true
                .then (response) ->
                  _response = response
                  if not isLoginRequest and not isLogoutRequest
                    _response
                  else
                    _this.getAuthToken true, useHTTP
                      .then ->
                        _response
  ]