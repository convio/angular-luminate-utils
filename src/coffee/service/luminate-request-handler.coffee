angular.module 'ngLuminateUtils'
  .factory '$luminateRequestHandler', [
    '$q'
    ($q) ->
      sanitizeString: (string, allowLuminateReservedChars, allowHtml) ->
        sanitizedString = string
        if not allowHtml
          sanitizedString = angular.element('<div>' + sanitizedString + '</div>').text()
        if not allowLuminateReservedChars
          sanitizedString = sanitizedString.replace(/\[\[/g, '').replace(/\]\]/g, '').replace /::/g, ''
        sanitizedString
      
      rejectInvalidRequest: (errorMessage = 'Invalid request.') ->
        deferred = $q.defer()
        deferred.reject errorMessage
        deferred.promise
  ]