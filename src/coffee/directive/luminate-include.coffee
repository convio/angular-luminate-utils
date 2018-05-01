angular.module 'ngLuminateUtils'
  .directive 'luminateInclude', ->
    scope:
      filename: '='
    template: '<div ng-bind-html="includeContent" ng-cloak></div>'
    replace: true
    controller: [
      '$scope'
      '$sce'
      '$luminateRequestHandler'
      '$luminateTemplateTag'
      ($scope, $sce, $luminateRequestHandler, $luminateTemplateTag) ->
        getIncludeContent = ->
          filename = $scope.filename
          if not angular.isString filename
            $luminateRequestHandler.rejectInvalidRequest 'Filename must be a string but was ' + typeof filename
          else
            filename = $luminateRequestHandler.sanitizeString filename, true
            templateTag = ''
            if filename.indexOf('[[') > -1 and filename.indexOf(']]') > filename.indexOf('[[')
              templateTag = '[[E84:' + filename + ']]'
            else
              filename = $luminateRequestHandler.sanitizeString filename
              templateTag = '[[S84:' + filename + ']]'
            $luminateTemplateTag.parse templateTag
              .then (response) ->
                $scope.includeContent =  $sce.trustAsHtml response
        getIncludeContent()
        $scope.$watch 'filename', (newValue, oldValue) ->
          if newValue isnt oldValue
            getIncludeContent()
    ]