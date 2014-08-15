'use strict';

/**
 * @ngdoc function
 * @name ngchatApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the ngchatApp
 */
angular.module('ngchatApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
