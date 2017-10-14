angular.module 'ngLuminateUtils'
  .factory '$luminateTemplateTag', [
    '$q'
    '$luminateRest'
    ($q, $luminateRest) ->
      parse: (tag) ->
        if not tag
          deferred = $q.defer()
          deferred.resolve ''
          deferred.promise
        else
          $luminateRest.request
            api: 'content'
            data: 'method=getTagInfo&content=' + tag
            requiresAuth: true
          .then (response) ->
            parsedTag = response.data.getTagInfoResponse?.preview or ''
            $q.resolve parsedTag
  ]