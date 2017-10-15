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
            pagename = angular.element('<div>' + pagename + '</div>').text().replace(/\[\[/g, '').replace(/\]\]/g, '').replace /::/g, ''
            $luminateTemplateTag.parse '[[S51:' + pagename + ']]'
              .then (response) ->
                $scope.reusableContent =  $sce.trustAsHtml response
        getReusableContent()
        $scope.$watch 'pagename', (newValue, oldValue) ->
          if newValue isnt oldValue
            getReusableContent()
    ]