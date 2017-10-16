angular.module 'ngLuminateUtils'
  .factory '$luminateMessageCatalog', [
    '$q'
    '$luminateUtilsConfig'
    '$luminateRequestHandler'
    '$luminateRest'
    ($q, $luminateUtilsConfig, $luminateRequestHandler, $luminateRest) ->
      get: (messageCatalogEntries) ->
        _this = this
        currentLocale = $luminateUtilsConfig.locale or 'default'
        if not angular.isString(messageCatalogEntries) and not angular.isArray messageCatalogEntries
          $luminateRequestHandler.rejectInvalidRequest 'Message Catalog entries must be a string or array but was ' + typeof messageCatalogEntries
        else
          if not angular.isArray messageCatalogEntries
            messageCatalogEntries = [messageCatalogEntries]
          bundles = {}
          numValidBundles = 0
          angular.forEach messageCatalogEntries, (messageCatalogEntry) ->
            messageCatalogEntryParts = messageCatalogEntry.split ':'
            if messageCatalogEntryParts.length isnt 2
              new Error 'Invalid Message Catalog bundle/key pair ' + messageCatalogEntry
            else
              entryBundle = $luminateRequestHandler.sanitizeString messageCatalogEntryParts[0], true, true
              entryKey = $luminateRequestHandler.sanitizeString messageCatalogEntryParts[1], true, true
              if not bundles[entryBundle]
                bundles[entryBundle] = {}
                numValidBundles++
              if not bundles[entryBundle].requestedKeys
                bundles[entryBundle].requestedKeys = []
              bundles[entryBundle].requestedKeys.push entryKey
              if not bundles[entryBundle].newKeys
                bundles[entryBundle].newKeys = []
              if not _this.messageCatalogCache
                _this.messageCatalogCache = {}
              if not _this.messageCatalogCache[currentLocale]
                _this.messageCatalogCache[currentLocale] = {}
              if not _this.messageCatalogCache[currentLocale][entryBundle]
                _this.messageCatalogCache[currentLocale][entryBundle] = {}
              if not angular.isString _this.messageCatalogCache[currentLocale][entryBundle][entryKey]
                bundles[entryBundle].newKeys.push entryKey
          if bundles.length is 0
            $luminateRequestHandler.rejectInvalidRequest 'No Message Catalog bundles defined.'
          else
            deferred = $q.defer()
            numBundlesComplete = 0
            requestedKeyMap = {}
            angular.forEach bundles, (keys, bundle) ->
              requestedKeyMap[bundle] = {}
              angular.forEach keys.requestedKeys, (requestedKey) ->
                if _this.messageCatalogCache[currentLocale][bundle][requestedKey]
                  requestedKeyMap[bundle][requestedKey] = _this.messageCatalogCache[currentLocale][bundle][requestedKey]
              numNewKeys = keys.newKeys.length
              if numNewKeys is 0
                numBundlesComplete++
                if numBundlesComplete is numValidBundles
                  deferred.resolve requestedKeyMap
              else
                $luminateRest.request
                  api: 'content'
                  data: 'method=getMessageBundle&bundle=' + bundle + '&keys=' + keys.newKeys.join(',')
                  requiresAuth: true
                .then (response) ->
                  keyValues = response.data.getMessageBundleResponse?.values
                  if not keyValues
                    angular.forEach keys.newKeys, (newKey) ->
                      _this.messageCatalogCache[currentLocale][bundle][newKey] = ''
                      requestedKeyMap[bundle][newKey] = ''
                  else
                    if not angular.isArray keyValues
                      keyValues = [keyValues]
                    angular.forEach keyValues, (keyValue) ->
                      value = keyValue.value
                      if value.indexOf('Message not found for key: ') is 0
                        value = ''
                      _this.messageCatalogCache[currentLocale][bundle][keyValue.key] = value
                      requestedKeyMap[bundle][keyValue.key] = value
                  numBundlesComplete++
                  if numBundlesComplete is numValidBundles
                    deferred.resolve requestedKeyMap
            deferred.promise
      
      flushCache: ->
        _this.messageCatalogCache = {}
        _this
  ]