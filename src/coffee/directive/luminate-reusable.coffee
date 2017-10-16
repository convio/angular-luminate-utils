angular.module 'ngLuminateUtils'
  .directive 'luminateReusable', ->
    scope:
      pagename: '='
    template: '<div ng-bind-html="reusableContent"></div>'
    replace: true
    controller: [
      '$scope'
      '$sce'
      '$luminateRequestHandler'
      '$luminateTemplateTag'
      ($scope, $sce, $luminateRequestHandler, $luminateTemplateTag) ->
        getReusableContent = ->
          pagename = $scope.pagename
          if not angular.isString pagename
            $luminateRequestHandler.rejectInvalidRequest 'Pagename must be a string but was ' + typeof pagename
          else
            pagename = $luminateRequestHandler.sanitizeString pagename, true
            templateTag = ''
            if pagename.indexOf('[[') is 0 and pagename.lastIndexOf(']]') is pagename.length - 2
              templateTag = '[[E51:' + pagename + ']]'
            else
              templateTag = '[[S51:' + pagename + ']]'
            $luminateTemplateTag.parse templateTag
              .then (response) ->
                $scope.reusableContent =  $sce.trustAsHtml response
        getReusableContent()
        $scope.$watch 'pagename', (newValue, oldValue) ->
          if newValue isnt oldValue
            getReusableContent()
    ]