//Définition des variables nécessaires à la vidéo
var video = document.querySelector('video');
var snapshotTemp = [];

//Détection de la capabilité du navigateur a diffuser une vidéo
function canStream() 
{
	return (!(typeof window === 'undefined') &&  !(typeof navigator === 'undefined')  && video );
}

//fonction appelée par getUserMedia en cas de refus
function noStream()
{
	$("#videoPrompt").html("L’accès à la caméra a été refusé !");
}

//fonction appelée par getUserMedia en cas d'acceptation
function gotStream(stream)
{
	$("#videoPrompt").html("Flux vidéo reçu.");
	video.onerror = function ()
	{
		$("#videoPrompt").html(video.onerror);
	};
	stream.onended = noStream;
	
	//pour une compatibilité entre navigateurs
	if (video.mozSrcObject !== undefined) {
		video.mozSrcObject = stream;
    } else {
		video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
    }
    video.play();
}

//Pour envoyer un snapshot
function sendSnapshot(){
	//On commence par récupérer une capture du flux vidéo dans un canvas, qu'on encode en URI
	//console.log("Snap !");
	var snapshotCanvas = document.getElementById("snapshotCanvas");
	var snapCtx = snapshotCanvas.getContext("2d");

	snapCtx.drawImage(video, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
	var dataURI = snapshotCanvas.toDataURL();


	//On découpe l'URI en morceaux de 60000 caractères, pour pouvoir l'envoyer via WebSocket
	var cuttedDataURI = [];
	var currentSlice;
	var i = 0;

	while(dataURI != ""){
		currentSlice = dataURI.slice(0, 60000);
		dataURI = dataURI.slice(60000)

		cuttedDataURI.push({
			type : "Snapshot",
			place : i,
			data : currentSlice
		});

		i++;
	}

	var maxI = i;

	console.log(cuttedDataURI);

	//On envoie tous les morceaux
	for(i = 0 ; i < cuttedDataURI.length ; i++){
		cuttedDataURI[i].max = maxI;
		sendToServer(cuttedDataURI[i], true);
	}
}

//A la réception des morceaux de snapshot
function printSnapshot(snapshot){
	//On recompose la capture
	snapshotTemp[snapshot.place] = snapshot.data;
 
 	//Si la capture est complète, i.e. on a récupéré tous les morceaux
	if(snapshotTemp.length == snapshot.max){
		var completedSnapshot = "";

		//On recompose l'image encodée
		for(i = 0 ; i < snapshotTemp.length ; i++){
			completedSnapshot += snapshotTemp[i];
		}

		//Et on l'affiche
		document.getElementById("snapshotImg").src = completedSnapshot;

		//Puis on réinitialise le tableau de réception
		snapshotTemp = [ ];
	}
}

//Fonction d'initialisation de l'accès à la WebCam
function initVideo(){
	if (canStream() ){ 
	
		//pour une compatibilité entre navigateurs
		navigator.getUserMedia = navigator.getUserMedia || navigator.oGetUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;
		window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
 
		$("#videoPrompt").html("Demande d’accès au flux vidéo…");
		
		//prompt de l'utilisateur
		if (navigator.getUserMedia){
			navigator.getUserMedia({video:true}, gotStream, noStream); //ici, on ne récupère que la vidéo
		} else {
			$("#videoPrompt").html("getUserMedia() n’est pas disponible depuis votre navigateur !");
		}			
	}
}

