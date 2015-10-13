"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 1099;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

var clients = [ ];

var server = http.createServer(function(request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
* WebSocket server
*/
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

var WIDTH = 1000;
var HEIGHT = 600;

var CAR_WIDTH = 52;
var CAR_HEIGHT = 94;

wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
	
	var connection = request.accept(null, request.origin);
	
	console.log((new Date()) + ' Connection accepted.');
	
	var index = clients.push({
		posX : WIDTH/2,
		posY : HEIGHT/2,
		speed : 0,
		angle : 0	
	}) -1;
	clients.index = index;
	
    connection.on('message', function(message) {
        
		//console.log(message);
		//decoder JSON
		var state = JSON.parse(message.utf8Data);
		//update

		var client = clients[index];
		
		if (state.dir < -0.4) {
			clients[index].angle += sign(client.speed)*-0.05;		
		} else if (state.dir > 0.4) {
			clients[index].angle += sign(client.speed)*0.05;		
		}

		if (state.up) {			
			clients[index].speed = Math.min(client.speed + 0.1, 7);
		} else if (state.down) {
			clients[index].speed = Math.max(client.speed - 0.1, -5);
		} else {
			if(client.speed > 0){
				clients[index].speed = Math.max(client.speed - 0.05, 0);
			} else {
				clients[index].speed = Math.min(client.speed + 0.05, 0);
			}
		}

		if(client.posX - CAR_WIDTH/2 < 0){
			clients[index].speed = 0;
			clients[index].posX = CAR_WIDTH/2;
		}

		if(client.posX + CAR_WIDTH/2 > WIDTH){
			clients[index].speed = 0;
			clients[index].posX = WIDTH - CAR_WIDTH/2;
		}

		if(client.posY - CAR_WIDTH/2 < 0){
			clients[index].speed = 0;
			clients[index].posY = CAR_WIDTH/2;
		}

		if(client.posY + CAR_WIDTH/2 > HEIGHT){
			clients[index].speed = 0;
			clients[index].posY = HEIGHT - CAR_WIDTH/2;
		}

		clients[index].posX += client.speed * Math.sin(client.angle);
		clients[index].posY -= client.speed * Math.cos(client.angle);

		connection.sendUTF(JSON.stringify(clients));
    });

    // user disconnected
    connection.on('close', function(connection) {
		clients.splice(index, 1);
    });

	

});

function sign(x){return x>0?1:x<0?-1:x;}

