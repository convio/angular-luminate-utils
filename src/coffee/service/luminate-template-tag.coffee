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
          $luminateRest.request 'content', 'method=getTagInfo&content=' + tag, true
            .then (response) ->
              parsedTag = response.data.getTagInfoResponse?.preview or ''
              $q.resolve parsedTag
  ]