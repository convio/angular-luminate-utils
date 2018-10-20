angular.module 'ngLuminateUtils'
  .provider '$luminateUtilsConfig', ->
    _this = this
    
    _this.setPath = (path = {}) ->
      if not angular.isString(path.secure)
        new Error 'You must specify a secure path.'
      else
        path.secure = path.secure.toLowerCase()
        securePathIsValid = path.secure.indexOf('/site/') is path.secure.length - 6 or path.secure.indexOf('/admin/') is path.secure.length - 7
        if not securePathIsValid
          if not securePathIsValid
            new Error 'Invalid secure path.'
        else
          _this.path =
            secure: path.secure
      _this
    
    _this.setKey = (apiKey) ->
      if not angular.isString apiKey
        new Error 'API Key must be a string but was ' + typeof apiKey
      else
        _this.apiKey = apiKey
      _this
    
    _this.setLocale = (locale) ->
      if not angular.isString locale
        new Error 'Locale must be a string but was ' + typeof locale
      else
        if locale in ['en_US', 'es_US', 'en_CA', 'fr_CA', 'en_GB', 'en_AU']
          _this.locale = locale
      _this
    
    _this.setDefaultRequestData = (defaultRequestData) ->
      if not angular.isString defaultRequestData
        new Error 'Request data must be a string but was ' + typeof defaultRequestData
      else
        _this.defaultRequestData = defaultRequestData
      _this
    
    _this.setDefaultRequestHandler = (defaultRequestHandler) ->
      if not angular.isFunction defaultRequestHandler
        new Error 'Request handler must be a function but was ' + typeof defaultRequestHandler
      else
        _this.defaultRequestHandler = defaultRequestHandler
      _this
    
    _this.$get = ->
      _this
    
    return