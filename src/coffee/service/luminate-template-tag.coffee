angular.module 'ngLuminateUtils'
  .factory '$luminateTemplateTag', [
    '$q'
    '$luminateRequestHandler'
    '$luminateRest'
    ($q, $luminateRequestHandler, $luminateRest) ->
      parse: (tag = '') ->
        if not angular.isString tag
          $luminateRequestHandler.rejectInvalidRequest 'Template tag must be a string but was ' + typeof tag
        else if tag is ''
          deferred = $q.defer()
          deferred.resolve ''
          deferred.promise
        else
          tag = $luminateRequestHandler.sanitizeString tag, true
          $luminateRest.request
            api: 'content'
            data: 'method=getTagInfo&content=' + tag
            requiresAuth: true
          .then (response) ->
            parsedTag = response.data.getTagInfoResponse?.preview or ''
            $q.resolve parsedTag
  ]