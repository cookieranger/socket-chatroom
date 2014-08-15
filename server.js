"use strict";

var express = require("express")
  , app = express()
  , http = require("http").createServer(app)
  , bodyParser = require("body-parser")
  , io = require("socket.io").listen(http)
  , _ = require("underscore");

//Server's port number
app.set("port", 8080);
//Server's IP address
// app.set("ipaddr", "127.0.0.1");
app.set("ipaddr", "0.0.0.0");


//Specify the views folder
app.set("views", __dirname + "/views");

// app.engine('html', require("jade").renderFile);

app.use(express.static("views", __dirname + "/views"));
app.use(express.static("public", __dirname + "/public"));
app.use(express.static("bower_components", __dirname + "/bower_components"));


var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
	};
app.use(allowCrossDomain);


app.use(bodyParser.json());

app.get("/", function (req, res) {
	res.sendfile("index.html");
});


http.listen(app.get("port"), app.get("ipaddr"), function(){
	console.log("Server up and running. Go to http://" + app.get("ipaddr") + ":" + app.get("port"));
});


var userDB = {
	"mark": {
		password: "markluk"
	},
	"joseph": {
		password: "josequito"
	}
};
var thread = [
];
var participants = [];
/**
 * Generate a new guest user to store to participants 
 * @return {[String]}  - a guest user in format guest_1, guest_2 ...
 */
var newGuestUser = (function() {
	var userCount = 0;
	return function(){
		return "guest_" + (++userCount);
	};
}());

app.post("/login", function(req, res){
	console.log('trying to login', req.body);
	if(!req.body.user || !req.body.pass || !req.body.sessionId){
		throw new Error("wrong params for login");
	}

	// Authenticate
	var user = userDB[req.body.user];
	var username = "UNKNOWN_USER_NAME";

	if (user && user.password === req.body.pass){
		username = req.body.user;
		res.json({
			status: "success",
			user: username,
		});
	}
	// if guest user
	else if (req.body.user === "guest"){
		username = newGuestUser();
	}

	if (username === 'UNKNOWN_USER_NAME'){
		res.json({
			status: "failed",
			user: username,
		});
	}
	else {
		res.json({
			status: "success",
			user: username,
		});
	}
	

	/**
	 * Does nothing, needs to trigger "newUser" event on server side
	 */
	/*
	debo.socket.trigger("newUser", {
		id: req.body.sessionId,
		user: username,
		time: Date.now(),
	});
	*/

});



app.post("/sendMessage", function(req, res){
	console.log('trying to send message', req.body);
	
	if(!req.body.msg && req.body.ts){

	}
	else if(!req.body.msg || !req.body.ts){
		throw new Error("wrong params for sendMessage");
	}
	else {
		// post message
		var msg = {
			user: req.body.user,
			content: req.body.msg,
			time: req.body.ts
		};
		thread.push(msg);
		io.sockets.emit("incomingMessage", msg);
	}
	res.json({stataus: 'thank you'});
});

// Generate random number
function random(min,max)
{
  return Math.floor(Math.random()*(max-min+1)+min);
}


// setsup for testing
var mockTime = (function(){
	var baseTime = Date.now();
	var zeroTime = 0;
	return {
		get: function(){
			return random(3,5) * 1000;
		},
		reset: function(){ baseTime = Date.now();},
		baseTime: baseTime,
	};
}());

var User = function(name, id){
	this.name = name;
	this.id = id;
};
User.prototype.time = Date.now();
User.prototype.names = "";

User.prototype.sendMsg = function(msg, time){
	console.log('Check time: ', mockTime.baseTime, time);
	// console.log("Check names: ", this.names);
	mockTime.baseTime = mockTime.baseTime + time;
	io.sockets.emit("incomingMessage", {
		user: this.name,
		content: msg,
		time: mockTime.baseTime,
	});
};
var mockParticipants = [];
User.prototype.connect = function (und, time) {
	mockTime.baseTime = mockTime.baseTime + time;
	mockParticipants.push({id: this.id, user: this.name});
	io.sockets.emit("newConnection", {
		participants: mockParticipants,
		newUser: {
			user: this.name,
			id: this.id,
		},
		time: mockTime.baseTime,
	});
};
User.prototype.disconnect = function (und, time) {
	mockTime.baseTime = mockTime.baseTime + time;
	var name = this.name;
	mockParticipants = mockParticipants.filter(function(user){
		return user.user !== name;
	});
	io.sockets.emit("userDisconnected", {
		id: this.id,
		disconnectedUser: {
			user: this.name,
			id: this.id,
		},
		time: mockTime.baseTime,
	});
};

var users = {
	bob : new User("Bob", 1),
	maria : new User("Maria", 2),
	jimmy : new User("Jimmy", 3),
	system : new User("System", 100),
};

// Performs test actions emit through socket.io multiple users
app.post("/ghostWhipser", function (req, res) {

	

	var actions = [
		["bob", "connect"],
		["bob", "sendMsg", "hello? is anyone here?"],
		["maria", "connect"],
		["maria", "sendMsg", "hello? is anyone here?"],
		["maria", "sendMsg", "Bob, is that you?"],
		["maria", "sendMsg", "..."],
		["bob", "sendMsg", "hey maria, I grabbed some food"],
		["jimmy", "connect"],
		["jimmy", "sendMsg", "hello? is anyone here?"],
		["bob", "sendMsg", "whoa... this is nuts, but we all just sent the same exact first message"],
		["jimmy", "sendMsg", "what do you mean?"],
		["maria", "sendMsg", "I think that means we are thinking on the same pattern"],
		["bob", "sendMsg", "Or we are programs, har har!"],
		["jimmy", "sendMsg", "Wha... I am a prog-r-a-m-?"],
		["jimmy", "disconnect"],
		["bob", "sendMsg", "Oh no!, we lost jummy!"],
		["maria", "sendMsg", "no!!! where is jimmy"],
		["bob", "sendMsg", "I think - "],
		["maria", "disconnect"],
		["bob", "sendMsg", "-- It's a stack, last in - first out"],
		["system", "connect"],
		["system", "sendMsg", "..Sure"],
		["bob", "disconnect"],
		["system", "sendMsg", "Have a Wonderful Day"],
		["system", "disconnect"]
	];

	/**
	 * Actions
	 */
	console.log("ghost whispering!");
	var actionTicker = function(){
		mockTime.reset();
		var actionIndex = 0;
		var sentinel = false;

		// Perform Action
		var perform = function(action, time){
			console.log("performing action", action[0], action[1], action[2]);
			var user = action[0],
				method = action[1],
				param = action[2];

			users[user][method](param, time);
		};

		var actionFunction = function(){
			if (sentinel){
				return;
			}
			if (actionIndex >= actions.length){
				sentinel = true;
				return;
			}

			var time = mockTime.get();
			setTimeout(function(){
				console.log('perform action', time, sentinel);
				if(sentinel){
					return;
				}
				perform(actions[actionIndex++], time);
				actionFunction();
			}, time);
		};

		return actionFunction;
	};
	actionTicker()();
	res.json({status: "haha"});




}); /* End Mock Test*/

var debo = {};
io.on("connection", function (socket) {
	
	debo.socket = socket;
	socket.on("newUser", function (user) {
		console.log("new User", user);
		console.log("new User", user.user);
		participants.push({id: user.id, user: user.user});
		io.sockets.emit("newConnection", {
			participants: participants, 
			newUser: user
		});
	});

	socket.on("disconnect", function () {

		console.log("disconnecting User", socket.id, participants);
		var user = participants.filter(function(p){ return p.id === socket.id })[0];
		console.log(user);
		participants = _.without(participants, _.findWhere(participants, {id: socket.id}));
		io.sockets.emit("userDisconnected", {
			id: socket.id,
			sender:"system",
			disconnectedUser: user,
			time: Date.now(),
		});
		
	});


});



