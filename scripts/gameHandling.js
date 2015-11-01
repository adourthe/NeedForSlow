var hasGP = false; //est ce que le gamePad est connecté?
var repGP;
var hasKeyboard = false; //Est ce qu'un clavier sert de gamepad ?

//Variables pour l'affichage du logo start
var multipl = 1;
var multiplGrow = true;
var angleGrow = true;
var angle = 0;

//Varibales de gestion du clavier
var upTemp = false;
var downTemp = false;
var dirTemp = 0;

//Le navigateur reconnait il cette propriété?
function canGame() {
    return "getGamepads" in navigator;
}

//Initialisation du jeu
function initGame(){
	if(canGame()) { //on vérifie si le navigateur est suffisament récent.
        var prompt = "Pour commencer, branchez votre gamePad et appuyez sur un bouton";
        $("#gamepadPrompt").text(prompt);

        $(window).on("gamepadconnected", function() { //rattachement  de l'événement (cf plus bas) à une callback
            if(!hasKeyboard){
                hasGP = true; //on garde en mémoire qu'il existe un gamePad
                $("#gamepadPrompt").html("Gamepad connected!");
                console.log("connection event");

                //On lance la connection au serveur
                launchConnection();
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

                //On lance la connection au serveur
                launchConnection();
			}
        });

        //Chrome nécessite un petit interval, Firefox, non, mais cela ne dérange pas.
        var checkGP = window.setInterval(function() {
            console.log('checkGP');
            if(navigator.getGamepads()[0]) {
                if(!hasGP && !hasKeyboard) { //Si ni gamepad ni clavier n'ont été connectés
                	$(window).trigger("gamepadconnected"); //déclenchement de l'événement
            	}
                window.clearInterval(checkGP);
            }
        }, 500);

        //On récupère les appuis clavier pour la gestion du clavier comme contrôleur
        $(window).on("keydown", function(e){
    		var event = window.event ? window.event : e;
        	if(!hasGP && !hasKeyboard){ //Si ni gamepad ni clavier n'est connecté, on connecte le clavier au jeu
        			$(window).trigger("keyboardconnected"); //déclenchement de l'événement	
        	} else if(hasKeyboard){ //Si le clavier est connecté, on récupère les entrées (Si un gamepad est connecté, le clavier est inactif)
        		switch(event.keyCode){
        			case 37: //Fleche gauche
        				dirTemp = -1;
        				break;
        			case 38://Fleche haut
    					upTemp = true;
        				break;
        			case 39://Fleche droite
        				dirTemp = 1;
        				break;
        			case 40://Fleche bas
        				downTemp = true;
        				break;
    				case 81://Touche Q
        				dirTemp = -1;
        				break;
        			case 90://Touche Z
    					upTemp = true;
        				break;
        			case 68://Touche D
        				dirTemp = 1;
        				break;
        			case 83://Touche S
        				downTemp = true;
        				break;
        			default:
        				break;
        		}
        	}
            window.clearInterval(checkGP); //Lors de la connection du clavier, on empêche le jeu de détecter un gamepad en plus
        })
        
        //Permet de relacher les commandes lorsque les touches sont relâchées
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

        //On lance la boucle de jeu
		setInterval(gameLoop, 15); 
    }
}

//Définition des variables pour l'affichage du jeu
var canvas = document.getElementById('gameScene');
var ctx = canvas.getContext("2d");
var carWidth = 52, carHeight = 94;

//Affichage du logo Start
var image = document.createElement("img");
image.onload = function(){
	angle = 0;
};
image.src = "start.png";

//Récupération des images de voiture
var getCar = [];
for(i = 0; i < 6 ; i++){
	getCar[i] = document.createElement("img");
	getCar[i].src = "car" + i + ".png";
}

//Fonction d'envoi de l'état du contrôleur au serveur
function sendState(){
	var gp = navigator.getGamepads()[0];
	var state;

    //Etat du gamepad
	if(hasGP){
		state = {
			type : "state",
			up : gp.buttons[7].pressed,
			down : gp.buttons[6].pressed,
			dir : gp.axes[0]
		}

		sendToServer(state, true);
		//connection.send(JSON.stringify(state));
    //On se sert des variable temporaires pour l'état du clavier
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

//Permet d'effacer le canvas et de redessiner les voitures dessus
function drawScene(allPlayers){
	ctx.clearRect(0,0,canvas.width,canvas.height);

	for(i = 0 ; i < allPlayers.length ; i++){
        if(allPlayers[i].display){
		  drawCar(i, allPlayers[i].posX, allPlayers[i].posY, carWidth, carHeight, allPlayers[i].angle, allPlayers[i].life);
        }
	}
	//document.getElementById("speedPrompt").innerHTML="Speed : " + speed;
}

//Dessine une voiture sur le canvas
function drawCar(nCar, posX, posY, larg, haut, angle, life){
	ctx.save();
	ctx.translate(posX,posY);
	ctx.rotate(angle);

	var carX = nCar / 2;
	var carY = nCar % 2;

	ctx.drawImage(getCar[nCar%6],0,0,getCar[nCar%6].width, getCar[nCar%6].height, -larg/2, -haut/2,larg,haut);
	ctx.restore();

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

//Bouclke principale
function gameLoop(){
    //Si on a un contrôleur, on envoie son état
	if(hasGP || hasKeyboard){
		sendState();
    //Sinon, on affiche une petite animation pour le logo START
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