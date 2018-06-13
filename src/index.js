function selectAudioInput() {
  var constraints = {
    audio: {
      optional: [
        {
          echoCancellation: false
        }
      ]
    }
  };
  navigator.getUserMedia(constraints, gotStream, function(e) {
    alert("Error getting audio");
    console.log(e);
  });
}

function gotStream() {
  debugger;
}

function init() {
  document.getElementById("selectAudio").onchange = selectAudioInput;
}
