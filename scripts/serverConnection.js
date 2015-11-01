//Definition des variables pour la connection au serveur
var serverAdress = "ws://localhost";
var serverPort = "1099";

var connection;

//Permet de lancer la connection
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
	                    + "connection or the server is down.");
	};

	// most important part - incoming messages
	connection.onmessage = function (message) {
		console.log(message);

		//Si le message est une requête de webcam du serveur, on envoie la capture
	    if(message.data == "REQUEST SNAPSHOT"){}
	    	sendSnapshot();
	    } else {
	    	//Sinon, le serveur à normalement envoyé un état de jeu ou une capture
	        try {
	            var json = JSON.parse(message.data);
	        } catch (e) {
	            console.log('This doesn\'t look like a valid JSON: ', message.data);
	            return;
	        }

	        //Si le champ type existe, c'est qu'il s'agit d'une capture, on l'affiche donc
        	if(json.type){
    			printSnapshot(json);
        	} else { //Sinon, c'est un état de jeu, on réaffiche donc le canvas
	        	drawScene(json);   
	    	}
	    }
	}
}


//Permet d'envoyer un objet au serveur
function sendToServer(message, json = false){
	if(connection != null){
		if(json){
			console.log("Message sent : " + JSON.stringify(message));
			connection.send(JSON.stringify(message));
		} else {
			console.log("Message sent : " + message);
			var result = connection.send(message);
		}
	}
}