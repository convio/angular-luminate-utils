angular.module 'ngLuminateUtils'
  .provider '$luminateUtilsConfig', ->
    _this = this
    
    _this.setPath = (path) ->
      if not path.nonsecure or not path.secure
        new Error 'You must specify both a nonsecure and secure path.'
      else
        _this.path =
          nonsecure: path.nonsecure
          secure: path.secure
        _this
    
    _this.setDefaultRequestData = (defaultRequestData) ->
      _this.defaultRequestData = defaultRequestData
      _this
    
    _this.setKey = (apiKey) ->
      if not apiKey
        new Error 'You must specify an API Key.'
      else
        _this.apiKey = apiKey
        _this
    
    _this.$get = ->
      _this
    
    return