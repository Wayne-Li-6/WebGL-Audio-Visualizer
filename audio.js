// An object contatining all of the used Audio Nodes in the graph
var AUDIO_NODES = {
    audio_ctx: null,
    media_source: null,
    stream_source: null,
    analyzer: null,
    filter: null
};

/**
 * Initializes all of the audio nodes node to prepare for reading in and
 * performing a real time FFT on the audio. [smoothing_constant] specifies the 
 * averaging constant between frames. Updates the global AUDIO_NODES object. 
 */
function initializeAudioNodes(smoothing_constant) {
    AUDIO_NODES.audio_ctx = new(window.AudioContext || window.webkitAudioContext)();

    AUDIO_NODES.analyzer = AUDIO_NODES.audio_ctx.createAnalyser();               
    AUDIO_NODES.analyzer.smoothingTimeConstant = smoothing_constant;

    AUDIO_NODES.filter = AUDIO_NODES.audio_ctx.createBiquadFilter();
    AUDIO_NODES.filter.type = "lowshelf";

    AUDIO_NODES.analyzer.connect(AUDIO_NODES.filter);
    AUDIO_NODES.filter.connect(AUDIO_NODES.audio_ctx.destination);
    AUDIO_NODES.valid = true;
}

/**
 * Creates a new MediaElementSource node using [audio] (if it did not exist 
 * before) and connects it to the existing Audio Node graph through the 
 * Analyzer node. It disconnects any previous stream connections if they exist.
 */
function switchAudioFile(audio) {
    if (AUDIO_NODES.media_source == null) {
        AUDIO_NODES.media_source = AUDIO_NODES.audio_ctx.createMediaElementSource(audio);
    }
    if (AUDIO_NODES.stream_source != null) {
        AUDIO_NODES.stream_source.disconnect(AUDIO_NODES.analyzer);
    }
    AUDIO_NODES.media_source.connect(AUDIO_NODES.analyzer);
    return AUDIO_NODES.analyzer;
}

/**
 * Creates a new MediaStreamSource node using the browser's getUserMedia 
 * function (if it did not exist before) and connects it to the existing Audio 
 * Node graph through the Analyzer node. It disconnects any previous media 
 * connections if they exist.
 */
async function switchUserAudio() {
    var constriants = { audio: true, video: false };
    var stream = await (navigator.mediaDevices.getUserMedia(constriants));

    if (AUDIO_NODES.stream_source == null){
        AUDIO_NODES.stream_source = AUDIO_NODES.audio_ctx.createMediaStreamSource(stream);
    }
    if (AUDIO_NODES.media_source != null) {
        AUDIO_NODES.media_source.disconnect(AUDIO_NODES.analyzer);
    }
    AUDIO_NODES.stream_source.connect(AUDIO_NODES.analyzer);
    return Promise.resolve(AUDIO_NODES.analyzer);
}

/**
 * Returns the normalized frequency data of the current FFT analysis frame. All
 * values should be in the range from [0...1].
 */
function getNormalizedFFT(analyzer) {
    var scale = 1.0 / (analyzer.maxDecibels - analyzer.minDecibels);
    var offset = analyzer.minDecibels;
    var FFT = new Float32Array(analyzer.frequencyBinCount);
    analyzer.getFloatFrequencyData(FFT);

    for (var i = 0; i < FFT.length; i++){
        FFT[i] = scale * (FFT[i] - offset);
    }
    return FFT;
}
