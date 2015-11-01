var video = document.querySelector('video');
var snapshotTemp = [];

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

function sendSnapshot(){
	console.log("Snap !");
	var snapshotCanvas = document.getElementById("snapshotCanvas");
	var snapCtx = snapshotCanvas.getContext("2d");

	snapCtx.drawImage(video, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
	var dataURI = snapshotCanvas.toDataURL();

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

	for(i = 0 ; i < cuttedDataURI.length ; i++){
		cuttedDataURI[i].max = maxI;
		sendToServer(cuttedDataURI[i], true);
	}
}

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

function printSnapshot(snapshot){
	snapshotTemp[snapshot.place] = snapshot.data;

	if(snapshotTemp.length == snapshot.max){
		var completedSnapshot = "";

		for(i = 0 ; i < snapshotTemp.length ; i++){
			completedSnapshot += snapshotTemp[i];
		}

		document.getElementById("snapshotImg").src = completedSnapshot;

		snapshotTemp = [ ];
	}
}