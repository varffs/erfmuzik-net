function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var limitFrames = 5000;
var frames = 0;

// audio variables
var source;
var buffer;
var audioBuffer;
var dropArea;
var audioContext;
var processor;
var analyser;

var sampleAudioURL = "dist/assets/mp3/Lo2tha.mp3";

var isPlayingAudio = false;

// analysis variables
var waveData = []; //waveform - from 0 - 1 . no sound is 0.5. Array [binCount]
var levelsData = []; //levels of each frequecy - from 0 - 1 . no sound is 0. Array [levelsCount]
var level = 0; // averaged normalized level from 0 - 1
var bpmTime = 0; // bpmTime ranges from 0 to 1. 0 = on beat. Based on tap bpm
var ratedBPMTime = 550;//time between beats (msec) multiplied by BPMRate
var levelHistory = []; //last 256 ave norm levels
var bpmStart;

var freqByteData; //bars - bar data is from 0 - 256 in 512 bins. no sound is 0;
var timeByteData; //waveform - waveform data is from 0-256 for 512 bins. no sound is 128.
var levelsCount = 4; //should be factor of 512

var volSens = 1;

//three.js variables
var scene;
var camera;
var renderer;

var mesh;
var mesh2;

function playAudio() {

		window.AudioContext = window.AudioContext || window.webkitAudioContext;

        if ('AudioContext' in window) {
        	audioContext = new AudioContext();
        } else {
        	alert('Your browser does not yet support the Web Audio API');
            return;
        }

/* 		processor = audioContext.createJavaScriptNode(2048 , 1 , 1 ); */
		processor = audioContext.createScriptProcessor(2048 , 1 , 1 );

		analyser = audioContext.createAnalyser();
		analyser.smoothingTimeConstant = 0.8; //0<->1. 0 is no time smoothing
		analyser.fftSize = 1024;
		analyser.connect(audioContext.destination);
		binCount = analyser.frequencyBinCount; // = 512

		levelBins = Math.floor(binCount / levelsCount); //number of bins in each level

		freqByteData = new Uint8Array(binCount);
		timeByteData = new Uint8Array(binCount);

		var length = 256;
		for(var i = 0; i < length; i++) {
		    levelHistory.push(0);
		}

		// init sound
		source = audioContext.createBufferSource();
		source.connect(analyser);

		// Load asynchronously
		var request = new XMLHttpRequest();
		request.open("GET", sampleAudioURL, true);
		request.responseType = "arraybuffer";

		request.onload = function() {
			audioBuffer = audioContext.createBuffer(request.response, false );
			source.buffer = audioBuffer;
			source.loop = true;
			source.noteOn(0.0);
			isPlayingAudio = true;
		};

		request.send();
}

function analysis() {

		//GET DATA
		analyser.getByteFrequencyData(freqByteData); //<-- bar chart
		analyser.getByteTimeDomainData(timeByteData); // <-- waveform

/* 		console.log(timeByteData); */

		//normalize waveform data
		for(var i = 0; i < binCount; i++) {
			waveData[i] = ((timeByteData[i] - 128) /128 )* volSens;
		}
		//TODO - cap levels at 1 and -1 ?

/* 		console.log(waveData); */

		//normalize levelsData from freqByteData
		for(var i = 0; i < levelsCount; i++) {
			var sum = 0;
			for(var j = 0; j < levelBins; j++) {
				sum += freqByteData[(i * levelBins) + j];
			}
			levelsData[i] = sum / levelBins/256 * volSens; //freqData maxs at 256

			//adjust for the fact that lower levels are percieved more quietly
			//make lower levels smaller
			//levelsData[i] *=  1 + (i/levelsCount)/2;
		}
		//TODO - cap levels at 1?

		//GET AVG LEVEL
		var sum = 0;
		for(var j = 0; j < levelsCount; j++) {
			sum += levelsData[j];
		}

		level = sum / levelsCount;

/* 		console.log(level); */

		levelHistory.push(level);
		levelHistory.shift(1);

}

function setup3d() {

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	renderer = new THREE.WebGLRenderer();

	renderer.setSize( window.innerWidth, window.innerHeight );

	document.body.appendChild( renderer.domElement );

	var hemilight = new THREE.HemisphereLight('#FFFFFF', '#000000', 0.8);
	scene.add(hemilight);

	var spotlight = new THREE.SpotLight( 0xffffff );
	spotlight.position.set( 100, 1000, 100 );

	spotlight.castShadow = true;

	spotlight.shadowMapWidth = 1024;
	spotlight.shadowMapHeight = 1024;

	spotlight.shadowCameraNear = 500;
	spotlight.shadowCameraFar = 4000;
	spotlight.shadowCameraFov = 30;

	scene.add( spotlight );

/* 	var geometry = new THREE.CubeGeometry(1,1,1); */
/* 	var material = new THREE.MeshLambertMaterial( { color: 'gray' } ); */
/* 	cube = new THREE.Mesh( geometry, material ); */
/* 	scene.add( cube ); */

/* 	var material = new THREE.MeshLambertMaterial( { color: 'gray' } ); */
	var material = new THREE.MeshPhongMaterial( { color: 'gray' } );

	var loader = new THREE.STLLoader();
	loader.addEventListener( 'load', function ( event ) {

		var geometry = event.content;
		mesh = new THREE.Mesh( geometry, material );

/*
		mesh.position.set( 0.136, - 0.37, - 0.6 );
		mesh.rotation.set( - Math.PI / 2, 0.3, 0 );
		mesh.scale.set( 2, 2, 2 );
*/

		mesh.castShadow = false;
		mesh.receiveShadow = false;

		console.log(mesh);

		scene.add( mesh );

		console.log(scene);

	} );
	loader.load( 'dist/assets/stl/girder-cube.stl' );

	var geometry2 = new THREE.CubeGeometry( 2, 2, 2 );
	var material2 = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
	mesh2 = new THREE.Mesh( geometry2, material );
	scene.add( mesh2 );

/*
	var fog = new THREE.FogExp2('white', 0.113);
	scene.add(fog);
*/

	camera.position.z = 10;

}

function render() {

	if (frames < limitFrames) {

		requestAnimationFrame(render);
		renderer.render(scene, camera);

		if (isPlayingAudio) {

			analysis();

			var shiftx = waveData[getRandomInt (50, 60)]/5;
			var shifty = waveData[getRandomInt (430, 460)]/5;

			if (mesh) {

				mesh.rotation.x += shiftx;
				mesh.rotation.y += shifty;

			}

		} else {

			if (mesh) {

				mesh.rotation.x += 0.01;
				mesh.rotation.y += 0.01;

			}

			if (mesh2) {

				mesh2.rotation.x += 0.005;
				mesh2.rotation.y += 0.005;

			}

		}

		frames++;

	}
}


/* playAudio(); */
setup3d();
render();

/*
$(window).scroll(function(e) {
	console.log(e);
});
*/

$(window).on({
	'mousewheel': function(e) {
/* 		console.log(e.originalEvent.wheelDeltaY); */
		camera.position.z += e.originalEvent.wheelDeltaY/100;
	}
});

