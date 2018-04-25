/**
 * Initializes the Analyzer node for [audio] to prepare for performing a real
 * time FFT. [sample_number] specifies the number of frequency samples and 
 * [smoothing_constant] specifies the averaging constant between frames. 
 * Returns the newly created Analyzer Node. 
 */
function initializeAnalyzer(audio, sample_number, smoothing_constant) {
    var audio_ctx = new(window.AudioContext || window.webkitAudioContext)();
    var source = audio_ctx.createMediaElementSource(audio);
    var analyser = audio_ctx.createAnalyser();

    analyser.fftSize = sample_number;
    analyser.smoothingTimeConstant = smoothing_constant;

    source.connect(analyser);
    source.connect(audio_ctx.destination);
    return analyser;
}

/**
 * Returns the normalized frequency data of the current FFT analysis frame. All
 * values should be in the range from [0...1].
 */
function getNormalizedFFT(analyser) {
    var scale = 1.0 / (analyser.maxDecibels - analyser.minDecibels);
    var offset = analyser.minDecibels;
    var FFT = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(FFT);

    for (var i = 0; i < FFT.length; i++){
        FFT[i] = scale * (FFT[i] - offset);
    }
    return FFT;
}
