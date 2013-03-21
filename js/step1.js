navigator.getUserMedia = navigator.webkitGetUserMedia ;
window.URL = window.URL || window.webkitURL;

navigator.getUserMedia( {'audio':true, 'video':true}, 
  function(stream) {
    document.querySelector('video').src = 
    	URL.createObjectURL(stream);
  }
);
