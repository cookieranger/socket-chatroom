'use strict';

/**
 * @ngdoc function
 * @name ngchatApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the ngchatApp
 */
angular.module('ngchatApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
