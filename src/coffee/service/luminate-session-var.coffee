angular.module 'ngLuminateUtils'
  .factory '$luminateSessionVar', [
    '$q'
    '$luminateTemplateTag'
    ($q, $luminateTemplateTag) ->
      get: (sessionVar) ->
        $luminateTemplateTag.parse '[[S80:' + sessionVar + ']]'
      
      set: (sessionVar, value) ->
        $luminateTemplateTag.parse '[[U1:' + sessionVar + '=' + value + ']]'
  ]