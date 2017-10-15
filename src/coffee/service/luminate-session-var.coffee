angular.module 'ngLuminateUtils'
  .factory '$luminateSessionVar', [
    '$q'
    '$luminateRequestHandler'
    '$luminateTemplateTag'
    ($q, $luminateRequestHandler, $luminateTemplateTag) ->
      get: (sessionVar) ->
        if not angular.isString sessionVar
          $luminateRequestHandler.rejectInvalidRequest 'Session variable name must be a string but was ' + typeof sessionVar
        else
          sessionVar = $luminateRequestHandler.sanitizeString sessionVar, true, true
          $luminateTemplateTag.parse '[[S80:' + sessionVar + ']]'
            .then (response) ->
              $luminateRequestHandler.sanitizeString response, true
      
      set: (sessionVar, value = '') ->
        if not angular.isString sessionVar
          $luminateRequestHandler.rejectInvalidRequest 'Session variable name must be a string but was ' + typeof sessionVar
        else
          if not angular.isString(value) and isNaN value
            $luminateRequestHandler.rejectInvalidRequest 'Session variable value must be a string or number but was ' + typeof value
          else
            sessionVar = $luminateRequestHandler.sanitizeString sessionVar, true, true
            value = $luminateRequestHandler.sanitizeString value, true
            $luminateTemplateTag.parse '[[U1:' + sessionVar + '=' + value + ']]'
  ]