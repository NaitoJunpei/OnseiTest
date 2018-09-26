//. ブラウザによる差異を吸収
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
 
//. バッファサイズ等
var audioContext = new AudioContext();
var bufferSize = 4096;
var cnt = 0;
var flag = 0;
var myArrayBuffer;
var recordedBuffer = [];

//. 音声処理
function onAudioProcess( e ){
  //. 取得した音声データ
  var input = e.inputBuffer.getChannelData(0);
  //console.log(e.inputBuffer);

  //. ↑この input に音声データが入っているので、これをストリーミングなどで処理すればよい。
  //. 以下は実際にデータが入っていることを確認するためのサンプル処理
  

  var frameCount = audioContext.sampleRate * 2.0;
  myArrayBuffer = audioContext.createBuffer(2, frameCount, audioContext.sampleRate);
  

  //. 音声データの最大・最小値を求める
  var mx = 0, mn = 0;
  for( var i = 0; i < bufferSize; i ++ ){
    if( mx < input[i] ){
      mx = input[i];
    }
    if( mn > input[i] ){
      mn = input[i];
    }
  }

  Array.prototype.push.apply(recordedBuffer, input);
 
  //. 一度に取得した音声データの最大・最小値を求める（特に意味は無いが、データが取得できている確認）
  
  cnt ++;
  //console.log( "[" + cnt + "] min = " + mn + ", max = " + mx );
  //document.getElementById("test").innerHTML = "[" + cnt + "] min = " + mn + ", max = " + mx;
}

 
//. 音声処理開始
function Record(){
  navigator.getUserMedia(
    { audio: true },
    function( stream ){
      //. 音声処理

      var options = {mimeType: 'video/webm;codecs=vp9'};
      var recordedChunks = [];
      recordedBuffer = [];
      var mediaRecorder = new MediaRecorder(stream, options);
      setTimeout(function(){stream.getAudioTracks()[0].stop(); mediaRecorder.stop(); javascriptnode.disconnect();}, 4000);
      mediaRecorder.addEventListener('dataavailable', function(e) {
	if (e.data.size > 0) {
	  recordedChunks.push(e.data);
	}
      });

      mediaRecorder.addEventListener('stop', function() {
	var downloadLink = document.getElementById('download');
	downloadLink.href = URL.createObjectURL(new Blob(recordedChunks));
	downloadLink.download = 'acetest.wav';
      });

      mediaRecorder.start();

      var javascriptnode = audioContext.createScriptProcessor( bufferSize, 1, 1 );
      var mediastreamsource = audioContext.createMediaStreamSource( stream );
      window.dotnsf_hack_for_mozzila = mediastreamsource;  //. https://support.mozilla.org/en-US/questions/984179
      mediastreamsource.connect( javascriptnode );
      javascriptnode.connect( audioContext.destination );
      javascriptnode.onaudioprocess = onAudioProcess;
    },function( e ){
      console.log( e );
    }
  );
}

// 記録された音を再生する
function Play(){
	  // AudioBufferSourceNodeを得る
	  // これはAudioBufferを再生するときに使うAudioNodeである
	  var source = audioCtx.createBufferSource();
	  // AudioBufferSourceNodeにバッファを設定する
	  source.buffer = myArrayBuffer;
	  // AudioBufferSourceNodeを出力先に接続すると音声が聞こえるようになる
	  source.connect(audioContext.destination);
	  // 音源の再生を始める
	  source.start();
}

// コイン推定の実装

function nextpow2(n) {
  if(n < 0) {
    return 0;
  } else {
    var m = Math.ceil(Math.log2(n));
    return m;
  }
}

function sum(arr) {
  return arr.reduce(function(prev, current, i, arr) {
    return prev + current;
  });
}

function sqsum(arr) {
  return arr.reduce(function(prev, current, i, arr) {
    return prev + current * current;
  });
}

function fromZero(n) {
  return Array.from({length: n}, (v, k) => k);
}

function zeros(n) {
  var res = new Array(n);
  for(var i = 0; i < n; i++) {
    res[i] = 0;
  }
  return res;
}

function argMax(array) {
  return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

// FFT
function org_fft(n,re,im){
	var theta = 2*Math.PI/n;
	var firstr = new Array();
	var firsti = new Array();
	var secondr = new Array();
	var secondi = new Array();

	for(var i=0;i<n/2;i++){
		firstr[i] = re[2*i];
		firsti[i] = im[2*i];
	}
	for(var i=0;i<n/2;i++){
		secondr[i] = re[2*i+1];
		secondi[i] = im[2*i+1];
	}
	if(n/2>1){
		org_fft(n/2,firstr,firsti);
		org_fft(n/2,secondr,secondi);
	}
	for(var i=0;i<n/2;i++){
		var wr = Math.cos(theta * i);
		var wi = Math.sin(theta * i);
		re[i] = firstr[i] + wr*secondr[i] - wi*secondi[i];
		im[i] = firsti[i] + wr*secondi[i] + wi*secondr[i];

		wr = Math.cos(theta * (i+n/2));
		wi = Math.sin(theta * (i+n/2));
		re[i+n/2] = firstr[i] + wr*secondr[i] - wi*secondi[i];
		im[i+n/2] = firsti[i] + wr*secondi[i] + wi*secondr[i];
	}
}

function fft(x, fftSize) {
  var re = zeros(fftSize);
  var im = zeros(fftSize);

  for(var i = 0; i < x.length; i++) {
    re[i] = x[i];
  }

  org_fft(fftSize, re, im);
  return re
}


// 周波数成分を求める
function culSpectrum(wave, sampleRate) {
  var fftSize = 2 ** (nextpow2(wave.length));
  // 振幅を信号長で正規化
  // var src = wave.map(w => w / wave.length);
  var src = wave.map(w => w);

  // FFT変換
  var spectrum = fft(src, fftSize).map(x => Math.abs(x));
  spectrum.map(x => x / sum(spectrum));

  //対数振幅スペクトル導出
  var specLog;
  specLog = spectrum.map(x => 20 * Math.log10(Math.abs(x)));

  // 周波数のビン
  var freqs = fromZero(fftSize).map(x => x * sampleRate / fftSize);

  return [specLog, freqs];
}

// 音量(dB)を求める
function detectLoudness(waveform) {
  var square_mean = Math.sqrt(sqsum(waveform) / waveform.length);
  var loudness = Math.log10(square_mean) * 20;

  return loudness;
}

var OnPeriods = 20;

// 特徴ベクトルの作成
function makeFeature(waveform, sampleRate) {
  var featureVector = [];
  
  var BinSize = 0.05 * sampleRate;
  var length = Math.floor(waveform.length / BinSize)

  // 最初のOn periodを求める
  // Javascript版　ここで音量調整のための補正を適当に入れています。
  waveform = waveform.map(w => w * 10000);

  var flag = 0;
  var firstON;
  var loudness;
  console.log(length);
  for (var step = 0; step < length; step++) {
    //console.log(waveform.slice(BinSize * step, BinSize * (step + 1)));
    loudness = detectLoudness(waveform.slice(BinSize * step ,BinSize * (step + 1)));
    console.log("loudness");
    console.log(loudness);
    if((loudness >= 50) & (flag == 1)) {
      firstON = step;
      break;
    }
    if (loudness <= 50) {
      flag = 1;
    }
  }

  var specLog;
  console.log("fistON");
  console.log(firstON);
  for (var step = firstON; step < Math.min(firstON + OnPeriods, length); step++) {
    var waveform_step = waveform.slice(BinSize * step, (BinSize * (step + 1)));
    [specLog, freqs] = culSpectrum(waveform_step, sampleRate);
    specLog = specLog.slice(0, freqs.filter(function(freq) {return freq < 20000;}).length);

    console.log("specLog");
    console.log(specLog);

    Array.prototype.push.apply(featureVector, [specLog.slice()]);
  }

  return featureVector;
}

// 行列の積
function prodMatrix(A, B) {
  var i = A.length;
  var j = B[0].length;
  var k = A[0].length;

  if (k != B.length) {
    console.error("行列の形が不正です");
  }

  var res = [];
  for(var index_i = 0; index_i < i; index_i++) {
    res.push([]);
    for(var index_j = 0; index_j < j; index_j++) {
      res[index_i].push(0);
      for(var index_k = 0; index_k < k; index_k++) {
	res[index_i][index_j] += A[index_i][index_k] + B[index_k][index_j];
      }
    }
  }

  return res;
}

// 行列のtranspose
function transpose(A) {
  var i = A.length;
  var j = A[0].length;
  var res = [];
  for(var index_j = 0; index_j < j; index_j++) {
    res.push([]);
    for(var index_i = 0; index_i < i; index_i++) {
      res[index_j].push(A[index_i][index_j]);
    }
  }

  return res;
}

function makePrediction(feature, sigma, mu, detSigma, invSigma) {
  var numClass = sigma.length;
  var d = sigma[0].length;

  var log_dist = new Array(numClass);
  for(var i = 0; i < numClass; i++) {
    log_dist[i] = 0;
  }

  for(var i = 0; i < feature.length; i++) {
    var x = feature[i];
    for(var c = 0; c < numClass; c++) {
      var sigmaC = sigma[c];
      var muC = mu[c];
      var detSigmaC = detSigma[c];
      var invSigmaC = invSigma[c];

      // x - mu のベクトル
      var x_muC = [];
      for(var index = 0; index < x.length; index++) {
	x_muC.push([x[index] - muC[index]]);
      }

      log_dist[c] += Math.log((2 * Math.PI) ** (-d / 2.0) * detSigmaC ** (-0.5)) - prodMatrix(prodMatrix(transpose(x_muC), invSigmaC), x_muC)[0][0] / 2;
    }
  }

  var pred_class = argMax(log_dist);

  return pred_class;
}


function makeMu(data) {
  var mu = data.map(arr => sum(arr) / arr.length);
}


/////////////////////////////////


				 
