//. ブラウザによる差異を吸収
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
 
//. バッファサイズ等
var audioContext = new AudioContext();
var bufferSize = 4096;
var cnt = 0;
var flag = 0;
var myArrayBuffer;

//. 音声処理
function onAudioProcess( e ){
  //. 取得した音声データ
  var input = e.inputBuffer.getChannelData(0);
  console.log(e.inputBuffer);

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
 
  //. 一度に取得した音声データの最大・最小値を求める（特に意味は無いが、データが取得できている確認）
  
  cnt ++;
  console.log( "[" + cnt + "] min = " + mn + ", max = " + mx );
  document.getElementById("test").innerHTML = "[" + cnt + "] min = " + mn + ", max = " + mx;
}


 
//. 音声処理開始
function Record(){
  navigator.getUserMedia(
    { audio: true },
    function( stream ){
      //. 音声処理

      var options = {mimeType: 'video/webm;codecs=vp9'};
      var recordedChunks = [];
      var mediaRecorder = new MediaRecorder(stream, options);
      setTimeout(function(){stream.getAudioTracks()[0].stop(); mediaRecorder.stop();}, 2000);
      mediaRecorder.addEventListener('dataavailable', function(e) {
	if (e.data.size > 0) {
	  recordedChunks.push(e.data);
	}
      });

      mediaRecorder.addEventListener('stop', function() {
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
