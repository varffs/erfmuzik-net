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

// THNX 2 https://github.com/tonylukasavage/jsstl for the loading and parsing of the STL. The only way I could get my dirty mesh to load properly :]

function trim (str) {
                str = str.replace(/^\s+/, '');
                for (var i = str.length - 1; i >= 0; i--) {
                    if (/\S/.test(str.charAt(i))) {
                        str = str.substring(0, i + 1);
                        break;
                    }
                }
                return str;
            }

            // Notes:
            // - STL file format: http://en.wikipedia.org/wiki/STL_(file_format)
            // - 80 byte unused header
            // - All binary STLs are assumed to be little endian, as per wiki doc
            var parseStlBinary = function(stl) {
                var geo = new THREE.Geometry();
                var dv = new DataView(stl, 80); // 80 == unused header
                var isLittleEndian = true;
                var triangles = dv.getUint32(0, isLittleEndian);

                // console.log('arraybuffer length:  ' + stl.byteLength);
                // console.log('number of triangles: ' + triangles);

                var offset = 4;
                for (var i = 0; i < triangles; i++) {
                    // Get the normal for this triangle
                    var normal = new THREE.Vector3(
                        dv.getFloat32(offset, isLittleEndian),
                        dv.getFloat32(offset+4, isLittleEndian),
                        dv.getFloat32(offset+8, isLittleEndian)
                    );
                    offset += 12;

                    // Get all 3 vertices for this triangle
                    for (var j = 0; j < 3; j++) {
                        geo.vertices.push(
                            new THREE.Vector3(
                                dv.getFloat32(offset, isLittleEndian),
                                dv.getFloat32(offset+4, isLittleEndian),
                                dv.getFloat32(offset+8, isLittleEndian)
                            )
                        );
                        offset += 12
                    }

                    // there's also a Uint16 "attribute byte count" that we
                    // don't need, it should always be zero.
                    offset += 2;

                    // Create a new face for from the vertices and the normal
                    geo.faces.push(new THREE.Face3(i*3, i*3+1, i*3+2, normal));
                }

                // The binary STL I'm testing with seems to have all
                // zeroes for the normals, unlike its ASCII counterpart.
                // We can use three.js to compute the normals for us, though,
                // once we've assembled our geometry. This is a relatively
                // expensive operation, but only needs to be done once.
                geo.computeFaceNormals();

                THREE.GeometryUtils.center(geo);

                mesh = new THREE.Mesh(
                    geo,
                    // new THREE.MeshNormalMaterial({
                    //     overdraw:true
                    // }
                    new THREE.MeshLambertMaterial({
                        overdraw:true,
                        color: '#b0b0b0',
                        shading: THREE.FlatShading
                    }
                ));
                mesh.castShadow = true;
				mesh.receiveShadow = true;
				mesh.position.x = 0;
				mesh.position.y = 0;
				mesh.position.z = 0;
                scene.add(mesh);

                stl = null;
            };

            var parseStl = function(stl) {
                var state = '';
                var lines = stl.split('\n');
                var geo = new THREE.Geometry();
                var name, parts, line, normal, done, vertices = [];
                var vCount = 0;
                stl = null;

                for (var len = lines.length, i = 0; i < len; i++) {
                    if (done) {
                        break;
                    }
                    line = trim(lines[i]);
                    parts = line.split(' ');
                    switch (state) {
                        case '':
                            if (parts[0] !== 'solid') {
                                console.error(line);
                                console.error('Invalid state "' + parts[0] + '", should be "solid"');
                                return;
                            } else {
                                name = parts[1];
                                state = 'solid';
                            }
                            break;
                        case 'solid':
                            if (parts[0] !== 'facet' || parts[1] !== 'normal') {
                                console.error(line);
                                console.error('Invalid state "' + parts[0] + '", should be "facet normal"');
                                return;
                            } else {
                                normal = [
                                    parseFloat(parts[2]),
                                    parseFloat(parts[3]),
                                    parseFloat(parts[4])
                                ];
                                state = 'facet normal';
                            }
                            break;
                        case 'facet normal':
                            if (parts[0] !== 'outer' || parts[1] !== 'loop') {
                                console.error(line);
                                console.error('Invalid state "' + parts[0] + '", should be "outer loop"');
                                return;
                            } else {
                                state = 'vertex';
                            }
                            break;
                        case 'vertex':
                            if (parts[0] === 'vertex') {
                                geo.vertices.push(new THREE.Vector3(
                                    parseFloat(parts[1]),
                                    parseFloat(parts[2]),
                                    parseFloat(parts[3])
                                ));
                            } else if (parts[0] === 'endloop') {
                                geo.faces.push( new THREE.Face3( vCount*3, vCount*3+1, vCount*3+2, new THREE.Vector3(normal[0], normal[1], normal[2]) ) );
                                vCount++;
                                state = 'endloop';
                            } else {
                                console.error(line);
                                console.error('Invalid state "' + parts[0] + '", should be "vertex" or "endloop"');
                                return;
                            }
                            break;
                        case 'endloop':
                            if (parts[0] !== 'endfacet') {
                                console.error(line);
                                console.error('Invalid state "' + parts[0] + '", should be "endfacet"');
                                return;
                            } else {
                                state = 'endfacet';
                            }
                            break;
                        case 'endfacet':
                            if (parts[0] === 'endsolid') {
                                //mesh = new THREE.Mesh( geo, new THREE.MeshNormalMaterial({overdraw:true}));
                                mesh = new THREE.Mesh(
                                    geo,
                                    new THREE.MeshLambertMaterial({
                                        overdraw:true,
                                        color: 0xaa0000,
                                        shading: THREE.FlatShading
                                    }
                                ));
                                scene.add(mesh);
                                done = true;
                            } else if (parts[0] === 'facet' && parts[1] === 'normal') {
                                normal = [
                                    parseFloat(parts[2]),
                                    parseFloat(parts[3]),
                                    parseFloat(parts[4])
                                ];
                                if (vCount % 1000 === 0) {
                                    console.log(normal);
                                }
                                state = 'facet normal';
                            } else {
                                console.error(line);
                                console.error('Invalid state "' + parts[0] + '", should be "endsolid" or "facet normal"');
                                return;
                            }
                            break;
                        default:
                            console.error('Invalid state "' + state + '"');
                            break;
                    }
                }
            };

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
/* 	scene.fog = new THREE.FogExp2( 0xefd1b5, 0.0025 ); */
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.shadowMapEnabled = true;
	renderer.setSize( window.innerWidth, window.innerHeight );
/* 	renderer.setClearColor('#d2d2d2'); */
	renderer.setClearColor('#000');

	controls = new THREE.OrbitControls(camera, renderer.domElement);

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

/*
	var fog = new THREE.FogExp2('white', 0.113);
	scene.add(fog);
*/

	camera.position.z = 7;

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

		}

		frames++;

	}
}


/* playAudio(); */
setup3d();
render();

/*
$(window).on({
	'mousewheel': function(e) {
		camera.position.z += e.originalEvent.wheelDeltaY/100;
	}
});
*/

