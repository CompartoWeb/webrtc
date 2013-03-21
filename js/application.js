// --- gestione del prefisso sperimentale ---

window.RTCPeerConnection = window.webkitRTCPeerConnection;
navigator.getUserMedia = navigator.webkitGetUserMedia ;
window.URL = window.URL || window.webkitURL;


// -- polyfill for requestAnimationFrame --

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();


// -- chiamante o chiamato ? --

if(location.hash === ""){
  var stanza = Math.round(Math.random()*1000),
      chiamante = 0;
  location.hash = stanza;
}else{
  var stanza = location.hash.substr(1),
      chiamante = 1;
}


// -- imposto video locale e video remoto --

document.querySelector( chiamante ? '.second-user' : '.first-user' ).
  className += " video-locale";
document.querySelector( chiamante ? '.first-user' : '.second-user' ).
  className += " video-remoto";


// -- save DOM element for performance --

var tmp_canvas,

users = [
  { 
    video: document.querySelector('.first-user video'),
    canvas: tmp_canvas = document.querySelector('.first-user canvas[data-main]'),
    context: tmp_canvas ? tmp_canvas.getContext('2d') : undefined,
    back_canvas: tmp_canvas = document.querySelector('.first-user canvas[data-back]'),
    back_context: tmp_canvas ? tmp_canvas.getContext('2d') : undefined,
    image: document.querySelector('.first-user img'),
    image_coord: undefined
  },
  {
    video: document.querySelector('.second-user video'),
    canvas: tmp_canvas = document.querySelector('.second-user canvas[data-main]'),
    context: tmp_canvas ? tmp_canvas.getContext('2d') : undefined,
    back_canvas: tmp_canvas = document.querySelector('.second-user canvas[data-back]'),
    back_context: tmp_canvas ? tmp_canvas.getContext('2d') : undefined,
    image: document.querySelector('.second-user img'),
    image_coord: undefined
  }
];


// --- variabili iniziali ---

var video_locale = document.querySelector(".video-locale video"),
    video_remoto = document.querySelector(".video-remoto video"),
    ws = new WebSocket('ws://127.0.0.1:8080'),
    peer;

// --- muto il video locale ---

video_locale.setAttribute('muted','true');


// --- init dall'applicazione all'apertura del canale websocket ---

ws.addEventListener('open', function(){ 
  ws.send("c:" + stanza);
  inizializza_video();
}, false);


// --- configurazione --- 

var mediaConstraints = {'mandatory': {'OfferToReceiveAudio':true, 'OfferToReceiveVideo':true }};
var peer_config = {"iceServers": [{"url": "stun:stunserver.org"}]};


// --- richiesta accesso webcam e microfono e init della connessione P2P ---

function inizializza_video() {
  navigator.getUserMedia( {'audio':true, 'video':true}, 
    function(stream) {

      video_locale.src = URL.createObjectURL(stream);
      peer = new RTCPeerConnection(peer_config);
      peer.onicecandidate = onIceCandidate;
      peer.onaddstream = function(event){
        video_remoto.src = URL.createObjectURL(event.stream);
      };

      peer.addStream(stream);
      if (chiamante)
        peer.createOffer(sdpcreato, null, mediaConstraints);
    }
  );
}


// --- interpretazione dei messaggi ricevuti durante lo stabilimento della connessione P2P ---

function processa(messaggio) {
  var msg = JSON.parse(messaggio);
  if (msg.type === 'offer') {
    peer.setRemoteDescription(new RTCSessionDescription(msg));
    peer.createAnswer(sdpcreato, null, mediaConstraints);
  } else if (msg.type === 'answer') {
    peer.setRemoteDescription(new RTCSessionDescription(msg));
  } else {
    var candidate = new RTCIceCandidate(msg);
    peer.addIceCandidate(candidate);
  }
}


// --- invio l'SDP al peer ---

function sdpcreato(sdp) {
  peer.setLocalDescription(sdp);
  messaggio_da_inviare(sdp);
}


// --- invio il candidato ICE al peer ---

function onIceCandidate(event) {
  if (event.candidate) {
    messaggio_da_inviare(event.candidate);
  } 
}


// --- invio messaggi al websocket ---

function messaggio_da_inviare(msg) {
  var msgjson = JSON.stringify(msg);
  ws.send("m:"+ stanza + ":" + chiamante + ":" + msgjson);
}


// --- ricezione messaggi dal websocket ---

ws.addEventListener('message', function(evt){
  var msg = evt.data;
  if(parseInt(msg.substr(0,1),10) !== chiamante){
    processa(msg.substr(2));
  }
});


// -- check if some video needs to be enriched --

(function animationLoop(){
  requestAnimFrame(animationLoop);
  for( var x = 0; x < users.length; x++){
    if( users[x].video && users[x].context &&
        !users[x].video.ended && !users[x].video.paused ){

      // main render
      face(users[x]);
    }
  }
})();


// -- render video + mask over the canvas --

function face(user){

  user.context.drawImage(user.video, 0, 0,
    user.canvas.width, user.canvas.height);
  user.back_context.drawImage(user.video, 0, 0, 
    user.back_canvas.width, user.back_canvas.height);

  var objects = ccv.detect_objects({
    canvas: user.back_canvas,
    cascade: cascade,
    interval: 4,
    min_neighbors: 1
  });
  
  if(user.image_coord = objects.pop() || user.image_coord){
    user.image.style.opacity = "1";
    user.image.style.left = "" + ( user.image_coord.x * 8 ) + "px";
    user.image.style.top = "" + ( user.image_coord.y * 8 ) + "px";
    user.image.style.width = "" + ( user.image_coord.width * 8 ) + "px";
  }
}

// -- tweak audio --

