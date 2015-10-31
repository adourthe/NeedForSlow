var serverAdress = "ws://localhost";
var serverPort = "1099";

var connection;

function launchConnection(){
	// if user is running mozilla then use it's built-in WebSocket
	window.WebSocket = window.WebSocket || window.MozWebSocket;

	// if browser doesn't support WebSocket, just show some notification and exit
	if (!window.WebSocket) {
		$("#generalPrompt").html('Sorry, but your browser doesn\'t '
	                    + 'support WebSockets.');
	    return;
	}

	// open connection
	connection = new WebSocket(serverAdress + ":" + serverPort);

	connection.onopen = function () {
	    $("#generalPrompt").html("Connected to the server");
	    console.log("Connected to the server " + serverAdress + ":" + serverPort);
	};

	connection.onerror = function (error) {
	    $("#generalPrompt").html("Sorry, but there\'s some problem with your "
	                    + "connection or the server is down.\n\nRetrying...");

    	connection = new WebSocket(serverAdress + ":" + serverPort);
	};

	// most important part - incoming messages
	connection.onmessage = function (message) {
		console.log(message);
	    // try to parse JSON message. Because we know that the server always returns
	    // JSON this should work without any problem but we should make sure that
	    // the massage is not chunked or otherwise damaged.
	    if(message.data == "REQUEST SNAPSHOT"){
	    	sendSnapshot();
	    } else {
	        try {
	            var json = JSON.parse(message.data);
	        } catch (e) {
	            console.log('This doesn\'t look like a valid JSON: ', message.data);
	            return;
	        }

	        drawScene(json);   
	    }
	}
}

function sendToServer(message, json = false){
	if(connection != null){
		if(json){
			console.log("Message sent : " + JSON.stringify(message));
			connection.send(JSON.stringify(message));
		} else {
			console.log("Message sent : " + message);
			connection.send(message);
		}
	}
}