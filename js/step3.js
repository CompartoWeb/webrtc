navigator.getUserMedia = navigator.webkitGetUserMedia ;
window.URL = window.URL || window.webkitURL;

var context = new webkitAudioContext(),
	analyser = context.createAnalyser(),
	video = document.querySelector('video'),
	canvas = document.querySelector('canvas'),
	ccontext = canvas.getContext('2d');

navigator.getUserMedia( {'audio':true, 'video':true}, 
  function(stream) {
    video.src = URL.createObjectURL(stream);
	var source = context.createMediaStreamSource(stream);
	source.connect(analyser);
	analyser.connect(context.destination); 
	analyze();
  }
);

function analyze(){
  window.webkitRequestAnimationFrame(analyze);
  var freqByteData = 
  	new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(freqByteData);
  ccontext.clearRect(0,0,200,100);
  for(var x=0; x < 10; x++){
  	ccontext.fillRect(x *20, 100, 
		20, -freqByteData[x * 100]);
  }
}