"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 1099;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

var clients = [ ];
var targets = [ ];

var server = http.createServer(function(request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, "0.0.0.0", function() {
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

var HITBOX_WIDTH = (CAR_WIDTH+CAR_HEIGHT)/2;

wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
	
	var connection = request.accept(null, request.origin);
	
	
	
	var index = clients.push({
		posX : WIDTH/2,
		posY : HEIGHT/2,
		speed : 0,
		angle : 0,
		life : 100,
		snapshot : ""
	}) -1;

	targets.push(connection);

	clients.index = index;

	console.log((new Date()) + ' Connection accepted from user ' + index + '.');
	
    connection.on('message', function(message) {
		console.log(message);

    	if(message.utf8Data == "SNAPSHOT"){
			targets[index].sendUTF("REQUEST SNAPSHOT");
			console.log("REQUEST SNAPSHOT");
    	} else if(typeof message.utf8Data == "string" && message.utf8Data.startsWith("data:image/png;")){
			//console.log(message.utf8Data);
			clients[index].snapshot = message.utf8Data;

			targets[index].sendUTF(JSON.stringify(clients));
			console.log(JSON.stringify(clients));
    	} else {
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

			if(client.posX - HITBOX_WIDTH/2 < 0){
				clients[index].speed = 0;
				clients[index].posX = HITBOX_WIDTH/2;
			}

			if(client.posX + HITBOX_WIDTH/2 > WIDTH){
				clients[index].speed = 0;
				clients[index].posX = WIDTH - HITBOX_WIDTH/2;
			}

			if(client.posY - HITBOX_WIDTH/2 < 0){
				clients[index].speed = 0;
				clients[index].posY = HITBOX_WIDTH/2;
			}

			if(client.posY + HITBOX_WIDTH/2 > HEIGHT){
				clients[index].speed = 0;
				clients[index].posY = HEIGHT - HITBOX_WIDTH/2;
			}

			for (var i=0; i<clients.length; i++){

				if (i != index){
					var vectX1 = clients[i].posX - clients[index].posX;
					var vectY1 = clients[i].posY - clients[index].posY;

					var dist = Math.sqrt(vectX1*vectX1 + vectY1*vectY1);

						

					if (dist < HITBOX_WIDTH) {
						
						
						vectX1 = vectX1/dist;
						vectY1 = vectY1/dist;

						var vectX2 = Math.cos(clients[index].angle);
						var vectY2 = Math.sin(clients[index].angle);

						//console.log(vectX1*vectX2+vectY1*vectY2);


						if (Math.abs(vectX1*vectX2+vectY1*vectY2) < 0.5){

							clients[i].life = Math.max(clients[i].life - Math.abs(clients[index].speed/7.0*10.0), 0);
							clients[index].speed = 0;
							clients[i].posX = clients[index].posX+vectX1*(HITBOX_WIDTH+1);
							clients[i].posY = clients[index].posY+vectY1*(HITBOX_WIDTH+1);

							if(clients[i].life <= 0){
								targets[i].sendUTF("REQUEST SNAPSHOT");
							}

						}

					}
				}

			}

			clients[index].posX += client.speed * Math.sin(client.angle);
			clients[index].posY -= client.speed * Math.cos(client.angle);

			targets[index].sendUTF(JSON.stringify(clients));
			console.log(JSON.stringify(clients));
		}
    });

    // user disconnected
    connection.on('close', function(connection) {
		clients.splice(index, 1);

		console.log((new Date()) + ' Disconnection of client ' + index + '.');
    });

	

});

function sign(x){return x>0?1:x<0?-1:x;}

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}