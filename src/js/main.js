function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// audio variables
window.AudioContext = window.AudioContext || window.webkitAudioContext;

var source;
var buffer;
var audioBuffer;
var dropArea;
var audioContext;
var processor;
var analyser;

var sampleAudioURL = "dist/assets/mp3/ERFMUZIK-VOL1-SOUNDSCAPE.mp3";
var isPlayingAudio = false;

// analysis variables
var waveData = []; //waveform - from 0 - 1 . no sound is 0.5. Array [binCount]

var levelsCount = 4; //should be factor of 512
var levelHistory = []; //last 256 ave norm levels
var volSens = 1;

/*
var levelsData = []; //levels of each frequecy - from 0 - 1 . no sound is 0. Array [levelsCount]
var level = 0; // averaged normalized level from 0 - 1
var bpmTime = 0; // bpmTime ranges from 0 to 1. 0 = on beat. Based on tap bpm
var ratedBPMTime = 550;//time between beats (msec) multiplied by BPMRate
var bpmStart;

var freqByteData; //bars - bar data is from 0 - 256 in 512 bins. no sound is 0;
var timeByteData; //waveform - waveform data is from 0-256 for 512 bins. no sound is 128.

*/

//three.js variables
var scene;
var camera;
var renderer;

var mesh;

// THNX 2 https://github.com/tonylukasavage/jsstl for the loading and parsing of the STL. The only way I could get my dirty mesh to load properly :]

function playAudio() {

	    audioContext = new AudioContext();

		analyser = audioContext.createAnalyser();
		analyser.smoothingTimeConstant = 0.8; //0<->1. 0 is no time smoothing
		analyser.fftSize = 1024;
		analyser.connect(audioContext.destination);
		binCount = analyser.frequencyBinCount; // = 512

		levelBins = Math.floor(binCount / levelsCount); //number of bins in each level

		freqByteData = new Uint8Array(binCount);
		timeByteData = new Uint8Array(binCount);

		// init sound
		source = audioContext.createBufferSource();
		source.connect(analyser);

		// Load asynchronously
		var request = new XMLHttpRequest();
		request.open("GET", sampleAudioURL, true);
		request.responseType = "arraybuffer";

		request.onload = function() {
			audioContext.decodeAudioData(request.response, function(buffer) {
		      source.buffer = buffer;
/* 			  source.loop = true; */
			  source.start(0);
			  isPlayingAudio = true;
		    }, function(e) {
			    console.log(e);
		    });
		};

		request.send();
}

function analysis() {

	analyser.getByteTimeDomainData(timeByteData);

	for(var i = 0; i < binCount; i++) {
		waveData[i] = ((timeByteData[i] - 128) /128 )* volSens;
	}
}

function setup3d() {

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	camera.position.z = 8;

	renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
	renderer.shadowMapEnabled = true;
	renderer.setSize( window.innerWidth, window.innerHeight );
/* 	renderer.setClearColor('#CCCCCC'); */
	renderer.setClearColor( 0x000000, 0 );

	window.addEventListener('resize', function() {
		var WIDTH = window.innerWidth,
            HEIGHT = window.innerHeight;
        renderer.setSize(WIDTH, HEIGHT);
        camera.aspect = WIDTH / HEIGHT;
        camera.updateProjectionMatrix();
      });

	document.body.appendChild( renderer.domElement );

	var hemilight = new THREE.HemisphereLight('#FFFFFF', '#000000', 0.8);
	scene.add(hemilight);

	var spotlight = new THREE.SpotLight( 0xffffff );
	spotlight.position.set( 1000, 100, 100 );

	spotlight.castShadow = true;

	spotlight.shadowMapWidth = 1024;
	spotlight.shadowMapHeight = 1024;

	spotlight.shadowCameraNear = 500;
	spotlight.shadowCameraFar = 4000;
	spotlight.shadowCameraFov = 30;

	scene.add( spotlight );

	var spotlight2 = new THREE.SpotLight( 0xffffff );
	spotlight2.position.set( -1000, 100, -100 );
	scene.add( spotlight2 );

	var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
	if ( xhr.readyState == 4 ) {
		if ( xhr.status == 200 || xhr.status == 0 ) {
			var rep = xhr.response; // || xhr.mozResponseArrayBuffer;
				parseStlBinary(rep);
				mesh.rotation.x = 5;
                mesh.rotation.z = .25;
			}
		}
    }
    xhr.onerror = function(e) {
		console.log(e);
	}
	xhr.open( "GET", 'dist/assets/3d/girder-cube.stl', true );
	xhr.responseType = "arraybuffer";
    xhr.send( null );

    render();

}

function render() {

	requestAnimationFrame(render);
	renderer.render(scene, camera);

	if (isPlayingAudio) {

		analysis();

		var shiftx = waveData[getRandomInt (50, 60)]/6;
		var shifty = waveData[getRandomInt (410, 470)]/6;

		var zoom = waveData[getRandomInt (150, 250)]/15;

		if (mesh) {

			if (shiftx > 0.005) {
				mesh.rotation.x += shiftx;
			} else {
				mesh.rotation.x += 0.005;
			}

			if (shifty > 0.005) {
				mesh.rotation.y += shifty;
			} else {
				mesh.rotation.y += 0.005;
			}

			if ( camera.position.z < 3.6) {
				camera.position.z = (camera.position.z*(zoom+1.75));
			}

			camera.position.z = (camera.position.z*(zoom+1));

		}

	} else {

		if (mesh) {

			mesh.rotation.x += 0.005;
			mesh.rotation.y += 0.005;

		}

	}
}

if (Detector.webgl) {
	if ('AudioContext' in window) {
		playAudio();
	} else {
		$('.nosupportalert').show();
	}
	setup3d();
} else {
	$('html').css('background-image', 'url(dist/assets/img/background.png)');
	$('.nosupportalert').show();
}
