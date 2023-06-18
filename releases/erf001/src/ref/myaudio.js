var myAudio = function() {

	var waveData = []; //waveform - from 0 - 1 . no sound is 0.5. Array [binCount]
	var levelsData = []; //levels of each frequecy - from 0 - 1 . no sound is 0. Array [levelsCount]
	var level = 0; // averaged normalized level from 0 - 1
	var bpmTime = 0; // bpmTime ranges from 0 to 1. 0 = on beat. Based on tap bpm
	var ratedBPMTime = 550;//time between beats (msec) multiplied by BPMRate
	var levelHistory = []; //last 256 ave norm levels
	var bpmStart;

	var sampleAudioURL = "mp3/Lo2tha.mp3";
	var BEAT_HOLD_TIME = 40; //num of frames to hold a beat
	var BEAT_DECAY_RATE = 0.98;
	var BEAT_MIN = 0.15; //a volume less than this is no beat

	//BPM STUFF
	var count = 0;
	var msecsFirst = 0;
	var msecsPrevious = 0;
	var msecsAvg = 633; //time between beats (msec)

	var timer;
	var gotBeat = false;
	var beatCutOff = 0;
	var beatTime = 0;

	var debugCtx;
	var debugW = 330;
	var debugH = 250;
	var chartW = 300;
	var chartH = 250;
	var aveBarWidth = 30;
	var debugSpacing = 2;
	var gradient;

	var freqByteData; //bars - bar data is from 0 - 256 in 512 bins. no sound is 0;
	var timeByteData; //waveform - waveform data is from 0-256 for 512 bins. no sound is 128.
	var levelsCount = 16; //should be factor of 512

	var binCount; //512
	var levelBins;

	var isPlayingAudio = false;

	var source;
	var buffer;
	var audioBuffer;
	var audioContext;
	var processor;
	var analyser;

	function init() {

		audioContext = new window.webkitAudioContext();
		processor = audioContext.createJavaScriptNode(2048 , 1 , 1 );
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

		source = audioContext.createBufferSource();
		source.connect(analyser);

		var request = new XMLHttpRequest();
		request.open("GET", sampleAudioURL, true);
		request.responseType = "arraybuffer";

		request.onload = function() {
			audioBuffer = audioContext.createBuffer(request.response, false );
			startSound();
		};

		request.send();

	}

	function startSound() {
		source.buffer = audioBuffer;
		source.loop = true;
		source.noteOn(0.0);
		isPlayingAudio = true;

/* 		$("#preloader").hide(); */
	}

	function update(){

		if (!isPlayingAudio) {
			return;
		}

		console.log('update-audio');

	}

}();