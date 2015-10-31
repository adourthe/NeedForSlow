var hasGP = false; //est ce que le gamePad est connecté?
var repGP;
var hasKeyboard = false;

var multipl = 1;
var multiplGrow = true;
var angleGrow = true;
var angle = 0;

var upTemp = false;
var downTemp = false;
var dirTemp = 0;

//Le navigateur reconnait il cette propriété?
function canGame() {
    return "getGamepads" in navigator;
}


function reportOnGamepad() {
    var gp = navigator.getGamepads()[0];//on peut connecter plus d'un gamepad mais on ne teste que le premier ici.
    var html = "";
    html += "id: "+gp.id+"<br/>"; //l'objet gamePad a un identifiant de vendeur

    for(var i=0;i<gp.buttons.length;i++) { //Il a aussi une collection de boutons (un tableau)
        html+= "Button "+(i+1)+": ";
        if(gp.buttons[i].pressed) html+= " pressed"; //chaque bouton a un état
        html+= "<br/>";
    }

    for(var i=0;i<gp.axes.length; i+=2) {//gestion de l'information du joystic (ou du pavé gauche: seulement 2 axes pour Vertical ou horizontal)
        html+= "Stick "+(Math.ceil(i/2)+1)+": "+gp.axes[i]+","+gp.axes[i+1]+"<br/>";  //conversion en (x,y)
    }

    $("#gamepadDisplay").html(html); //Affichage
}// voyez que cette fonction n'est pas rattachée à un événement: elle sera appelée régulièrement par un setInterval (cf plus bas).

function initGame(){
	if(canGame()) { //on vérifie si le navigateur est suffisament récent.
        var prompt = "Pour commencer, branchez votre gamePad et appuyez sur un bouton";
        $("#gamepadPrompt").text(prompt);

        $(window).on("gamepadconnected", function() { //rattachement  de l'événement (cf plus bas) à une callback
            if(!hasKeyboard){
                hasGP = true; //on garde en mémoire qu'il existe un gamePad
                $("#gamepadPrompt").html("Gamepad connected!");
                console.log("connection event");

                launchConnection();

                //Ceci est une boucle de jeu
                repGP = window.setInterval(reportOnGamepad,100); //On interroge régulièrement le gamePad pour connaître ses variations d'état
                //Dans l'idéal, on utilise pas setInterval mais requestAnimationFrame (cf http://creativejs.com/resources/requestanimationframe/)
			}
        });

        $(window).on("gamepaddisconnected", function() {//récupération de l'événement (cf plus bas)
            console.log("disconnection event");
            $("#gamepadPrompt").text(prompt);
            window.clearInterval(repGP);
        });

        $(window).on("keyboardconnected", function() {//récupération de l'événement (cf plus bas)
            if(!hasGP){
                hasKeyboard = true; //on garde en mémoire qu'il existe un gamePad
                $("#gamepadPrompt").html("Keyboard connected!");
                console.log("connection event");

                launchConnection();

                //Ceci est une boucle de jeu
                //repGP = window.setInterval(reportOnGamepad,100); //On interroge régulièrement le gamePad pour connaître ses variations d'état
                //Dans l'idéal, on utilise pas setInterval mais requestAnimationFrame (cf http://creativejs.com/resources/requestanimationframe/)
			}
        });

        //Chrome nécessite un petit interval, Firefox, non, mais cela ne dérange pas.
        var checkGP = window.setInterval(function() {
            console.log('checkGP');
            if(navigator.getGamepads()[0]) {
                if(!hasGP && !hasKeyboard) {
                	$(window).trigger("gamepadconnected"); //déclenchement de l'événement
            	}
                window.clearInterval(checkGP);
            }
        }, 500);

        $(window).on("keydown", function(e){
    		var event = window.event ? window.event : e;
        	if(!hasGP && !hasKeyboard){
        			$(window).trigger("keyboardconnected"); //déclenchement de l'événement	
        	} else if(hasKeyboard){
        		switch(event.keyCode){
        			case 37:
        				dirTemp = -1;
        				break;
        			case 38:
    					upTemp = true;
        				break;
        			case 39:
        				dirTemp = 1;
        				break;
        			case 40:
        				downTemp = true;
        				break;
    				case 81:
        				dirTemp = -1;
        				break;
        			case 90:
    					upTemp = true;
        				break;
        			case 68:
        				dirTemp = 1;
        				break;
        			case 83:
        				downTemp = true;
        				break;
        			case 72:
        				sendToServer("SNAPSHOT");
        				break;
        			default:
        				break;
        		}
        	}
            window.clearInterval(checkGP);
        })

        $(window).on("keyup", function(e){
    		var event = window.event ? window.event : e;
        	if(hasKeyboard){
        		switch(event.keyCode){
        			case 37:
        				dirTemp = 0;
        				break;
        			case 38:
    					upTemp = false;
        				break;
        			case 39:
        				dirTemp = 0;
        				break;
        			case 40:
        				downTemp = false;
        				break;
        			case 81:
        				dirTemp = 0;
        				break;
        			case 90:
    					upTemp = false;
        				break;
        			case 68:
        				dirTemp = 0;
        				break;
        			case 83:
        				downTemp = false;
        				break;
        			default:
        				break;
        		}
        	}
        })

		setInterval(gameLoop, 15); 
    }
}

var canvas = document.getElementById('gameScene');
var ctx = canvas.getContext("2d");

var angleInDegrees = 0;



var posX = canvas.width/2, posY = canvas.height/2;
var carWidth = 52, carHeight = 94;

var image = document.createElement("img");
image.onload = function(){
	angle = 0;
};
image.src = "start.png";

var getCar = [];

for(i = 0; i < 6 ; i++){
	getCar[i] = document.createElement("img");
	getCar[i].src = "car" + i + ".png";
}


var upTemp = false;
var downTemp = false;
var dirTemp = 0;

function sendState(){
	var gp = navigator.getGamepads()[0];
	var state;

	if(hasGP){
		state = {
			type : "state",
			up : gp.buttons[7].pressed,
			down : gp.buttons[6].pressed,
			dir : gp.axes[0]
		}

		sendToServer(state, true);
		//connection.send(JSON.stringify(state));
	} else if(hasKeyboard){
		state = {
			type : "state",
			up : upTemp,
			down : downTemp,
			dir : dirTemp
		}

		sendToServer(state, true);
		//connection.send(JSON.stringify(state));
	}
}

function drawScene(allPlayers){
	ctx.clearRect(0,0,canvas.width,canvas.height);

	for(i = 0 ; i < allPlayers.length ; i++){
		drawCar(i, allPlayers[i].posX, allPlayers[i].posY, carWidth, carHeight, allPlayers[i].angle, allPlayers[i].life, allPlayers[i].snapshot);
	}
	//document.getElementById("speedPrompt").innerHTML="Speed : " + speed;
}

function drawCar(nCar, posX, posY, larg, haut, angle, life, snapshot){
	ctx.save();
	ctx.translate(posX,posY);
	ctx.rotate(angle);

	var carX = nCar / 2;
	var carY = nCar % 2;

	if(snapshot == ""){
		ctx.drawImage(getCar[nCar%6],0,0,getCar[nCar%6].width, getCar[nCar%6].height, -larg/2, -haut/2,larg,haut);
		ctx.restore();
	} else {
		var snapshotDraw = document.createElement("img");
		snapshotDraw.src = snapshot;

		ctx.restore();
		ctx.drawImage(snapshotDraw,0,0,getCar[nCar%6].width, getCar[nCar%6].height, -larg/2, -haut/2,larg,haut);
	}


	ctx.beginPath();
  	ctx.arc(posX, posY, haut/1.5, 0, 2 * Math.PI, false);
  	ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

	ctx.beginPath();
  	ctx.arc(posX, posY, haut/1.5, 0, 2 * Math.PI*life/100.0, false);
  	ctx.lineWidth = 5;
    ctx.strokeStyle = '#00AA00';
    ctx.stroke();
}

function gameLoop(){
	if(hasGP || hasKeyboard){
		//updateState();
		sendState();
		//drawScene();
	} else {
		if(angle > Math.PI/4){
			angleGrow = false;
		} else if (angle < 0) {
			angleGrow = true;
		}

		if(multipl > 1.5){
			multiplGrow = false;
		} else if (multipl < 0.75) {
			multiplGrow = true;
		}

		if(angleGrow){
			angle += 0.01;
		} else {
			angle -= 0.01;
		}

		if(multiplGrow){
			multipl += 0.01;
		} else {
			multipl -= 0.01;
		}

		ctx.clearRect(0,0,canvas.width,canvas.height);
		ctx.save();
		ctx.translate(canvas.width/2,canvas.height/2);
		ctx.rotate(angle);
		ctx.drawImage(image,0,0,image.width, image.height, -(image.width*multipl)/2, -(image.height*multipl)/2,image.width * multipl,image.height * multipl);
		ctx.restore();

	}
}