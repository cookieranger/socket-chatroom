'use strict';

/**
 * @ngdoc overview
 * @name ngchatApp
 * @description
 * # ngchatApp
 *
 * Main module of the application.
 */
var chat = angular
  .module('ngchatApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        // controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        // controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

var api = "http://localhost:8080";
api = "http://192.168.1.72:8080";

window.debo = {};
var root;


chat.run(function($rootScope, $http, $timeout){

  root = $rootScope;
  root.appName = "SocketIO Messenger";
  root.thread = [];
  root.participants = [];
  root.display = {
    time: true,
  };

  // For testing
  root.guestLogin = function(){
    root.login("guest", "guest");
  };

  /**
   * Generates a socket object attached to rootScope
   */
  root.socket = (function handleSocket () {
    var serverBaseUrl = "http://192.168.1.72:8080";
    var socket = io.connect(serverBaseUrl);
    var sessionId = "";

    socket.on("connect", function () {
      sessionId = socket.io.engine.id;
      console.log("Connected " + sessionId);
    });

    socket.on("newConnection", function (data) {
      root.participants = data.participants;
      console.log('participants', data.participants, root.participants);
      root.thread.push({
        content: data.newUser.user + " has joined this channel",
        time: data.newUser.time,
        user: "system",
        type: "connection"
      });
      root.$apply();
      $timeout(chatlogScroll, 200);
    });

    socket.on("userDisconnected", function (data) {
      root.participants = root.participants.filter(function (user) {
        return data.disconnectedUser.user !== user.user;
      });
      root.thread.push({
        content: data.disconnectedUser.user + " has left the chat",
        time: data.time,
        user: "system",
        type: "disconnection"
      });
      root.$apply();
      $timeout(chatlogScroll, 200);
    });

    socket.on("incomingMessage", function (data) {
      root.thread.push({
        content: data.content,
        user: data.user,
        time: data.time
      });
      root.$apply();
      $timeout(chatlogScroll, 200);
    });

    socket.on("error", function (reason) {
      console.error('Unable to connect to server', reason);
    });

    return socket;
  }(root.username));

  /**
   * Login the user 
   * @param  {[String]} username [optional else chosen from rootScope.loginPassword]
   * @param  {[String]} password [optional else chosen from rootScope.loginPassword]
   */
  root.login = function(username, password){
    username = username || root.loginUsername;
    password = password || root.loginPassword;
    console.log('login', username, password);
    $http.post(api + '/login', {
      user: username,
      pass: password,
      sessionId: root.socket.io.engine.id,
    }).then(function success(res){
      if (res.data.status === "success"){
        console.debug('success', res);
        root.username = res.data.user;
        root.logined = true;
        root.socket.emit("newUser", {
          id: root.socket.io.engine.id,
          user: res.data.user,
          time: Date.now(),
        });
      }
    }, function fail (res) {
      console.error('fail', res);
    });
  };

  /**
   * Scrolls chatlog to the right position
   */
  var chatlogScroll = (function(){
    var chatlog;
    return function(){
      if(!chatlog) {
        chatlog = document.getElementsByClassName("chatlog")[0];
      }
      chatlog.scrollTop = chatlog.scrollHeight;
    };
  }());


  /**
   * Send if keycode is [Enter]
   */
  root.checkSend = function (event) {
    // console.log(event);
    if(event.which === 13){
      root.sendMessage();
      root.chatContent = "";
    }
  };

  /**
   * Sends Message to the chat room
   */
  root.sendMessage = function () {

    $http.post(api + '/sendMessage', {
      msg: root.chatContent,
      ts: Date.now(),
      user: root.username,
    }).then(function success(res){
      console.debug('post success', res);
    }, function fail () {
      console.error('post fail', arguments);
    });

  };

  /**
   * Test by emitting chat action from the socket.io on node side
   */
  root.ghostWhisper = function () {
    $http.post(api + '/ghostWhipser', {})
    .then(function success(res){
      console.debug("ghostWhisper success", res);
    }, function fail () {
      console.error("ghostWhipser failed", arguments);
    });
  };


});



/**
 * ng-include without creating a new scope
 */
chat.directive("staticInclude", function ($http, $templateCache, $compile) {
  return function (scope, element, attrs) {
    var templatePath = attrs.staticInclude;
    $http.get(templatePath, {cache: $templateCache}).success(function (res) {
      var contents = element.html(res).contents();
      $compile(contents)(scope);
    });
  };
});