angular.module 'ngLuminateUtils'
  .factory '$luminateRest', [
    '$http'
    '$q'
    '$timeout'
    'APP_INFO'
    '$luminateUtilsConfig'
    '$luminateRequestHandler'
    ($http, $q, $timeout, APP_INFO, $luminateUtilsConfig, $luminateRequestHandler) ->
      getAuthToken: (forceNewToken) ->
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
        requestFormData = settings.formData
        requiresAuth = settings.requiresAuth
        contentType = settings.contentType
        if (requestFormData and not contentType) or contentType?.split(';')[0] is 'multipart/form-data'
          contentType = 'multipart/form-data'
        else
          contentType = 'application/x-www-form-urlencoded; charset=UTF-8'
        if not $luminateUtilsConfig.path.secure
          $luminateRequestHandler.rejectInvalidRequest 'You must specify a secure path.'
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
            else if requestFormData and not angular.isObject requestFormData
              $luminateRequestHandler.rejectInvalidRequest 'Request formData must be an object but was ' + typeof requestFormData
            else if not requestFormData and not angular.isString requestData
              $luminateRequestHandler.rejectInvalidRequest 'Request data must be a string but was ' + typeof requestData
            else
              if requestFormData and not requestData
                requestData = ''
              if requestData isnt ''
                requestData += '&'
              requestData += 'v=1.0&response_format=json&suppress_response_codes=true&api_key=' + $luminateUtilsConfig.apiKey
              isAuthTokenRequest = ('&' + requestData).indexOf('&method=getLoginUrl&') isnt -1
              isLoginRequest = ('&' + requestData).indexOf('&method=login&') isnt -1
              isLogoutRequest = ('&' + requestData).indexOf('&method=logout&') isnt -1  
              if not isAuthTokenRequest and not _this.authToken
                if not _this.authTokenPending
                  _this.getAuthToken false
                    .then ->
                      _this.request options
                else
                  $timeout ->
                    _this.request options
                  , 250
              else
                requestUrl = $luminateUtilsConfig.path.secure + apiServlet
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
                if requestFormData
                  angular.forEach requestData.split('&'), (requestDataKeyVal) ->
                    requestDataKeyValParts = requestDataKeyVal.split('=')
                    requestDataKey = requestDataKeyValParts[0]
                    requestDataVal = requestDataKeyValParts[1] or ''
                    requestFormData.append requestDataKey, requestDataVal
                requestProperties = 
                  method: 'POST'
                  url: requestUrl
                  data: if requestFormData then requestFormData else requestData
                  headers:
                    'Content-Type': if contentType is 'multipart/form-data' then undefined else contentType
                  withCredentials: true
                if contentType is 'multipart/form-data'
                  requestProperties.transformRequest = angular.identity
                $http requestProperties
                  .then (response) ->
                    _response = response
                    if not isLoginRequest and not isLogoutRequest
                      if isAuthTokenRequest or not $luminateUtilsConfig.defaultRequestHandler
                        _response
                      else
                        $luminateUtilsConfig.defaultRequestHandler _response
                    else
                      _this.getAuthToken true
                        .then ->
                          if isAuthTokenRequest or not $luminateUtilsConfig.defaultRequestHandler
                            _response
                          else
                            $luminateUtilsConfig.defaultRequestHandler _response
  ]