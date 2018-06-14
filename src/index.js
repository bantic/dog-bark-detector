import './style.css';

function selectAudioInput() {
  const constraints = {
    audio: true
  };
  navigator.getUserMedia(constraints, gotStream, function (e) {
    console.log('hi there!');
    alert("Error getting audio");
    console.log(e);
  });
}

class Analyzer {
  constructor() {
    this.audioCtx = new AudioContext();
    this.analyzer = this.audioCtx.createAnalyser();
    this.analyzer.fftSize = 256;
    this.waveFormRenderer = new CanvasWaveFormRenderer(document.getElementById('waveform'));
    this.historyRenderer = new CanvasHistoryRenderer(document.getElementById('history'));
  }

  analyze(stream) {
    let source = this.audioCtx.createMediaStreamSource(stream);
    source.connect(this.analyzer);
    this.start();
  }

  start() {
    requestAnimationFrame(() => this.tick());
  }

  tick() {
    let dataArray = new Uint8Array(this.analyzer.fftSize);
    this.analyzer.getByteTimeDomainData(dataArray);
    this.waveFormRenderer.render(dataArray);
    this.historyRenderer.render(dataArray);
    requestAnimationFrame(() => this.tick());
  }
}

class WaveFormAnalyzer {
  constructor(dataArray) {
    this.dataArray = dataArray;
    this.analyzed = false;
  }

  analyze() {
    let max = -Infinity;
    let min = Infinity;
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      let val = this.dataArray[i];
      if (val > max) {
        max = val;
      }
      if (val < min) {
        min = val;
      }
      sum += val;
    }
    this.max = max;
    this.min = min;
    this.avg = sum / this.dataArray.length;
    this.analyzed = true;
  }

  get stats() {
    if (!this.analyzed) {
      this.analyze();
    }
    return {
      max: this.max,
      min: this.min,
      avg: this.avg
    };
  }
}

class CanvasWaveFormRenderer {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d');
    this._setCanvasDimensions(canvas);
    this.height = canvas.height;
    this.width = canvas.width;
    this.sliceCount = 100;
    this.sliceWidth = this.width / this.sliceCount;
    this.MAX_VAL = 128.0; // maximum value for a datum in a waveform data array
  }

  _setCanvasDimensions(canvas) {
    let style = getComputedStyle(canvas);
    canvas.width = parseInt(style.width, 10);
    canvas.height = parseInt(style.height, 10);
  }

  render(dataArray) {
    let {
      ctx
    } = this;

    ctx.clearRect(0, 0, this.width, this.height);
    ctx.beginPath();

    let x = 0;
    for (let i = 0; i < dataArray.length; i++) {
      let y = (dataArray[i] / this.MAX_VAL) * (this.height / 2);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += this.sliceWidth;
    }

    ctx.stroke();
  }
}

class CanvasHistoryRenderer {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d');
    this._setCanvasDimensions(canvas);
    this.height = canvas.height;
    this.width = canvas.width;
    this.sliceCount = 100;
    this.sliceWidth = this.width / this.sliceCount;
    this.MAX_VAL = 128.0; // maximum value for a datum in a waveform data array

    this.trailingAverageSize = 3;
    this.currentIndex = 0;
    this.buffer = [];
    this.history = [];
  }

  _setCanvasDimensions(canvas) {
    let style = getComputedStyle(canvas);
    canvas.width = parseInt(style.width, 10);
    canvas.height = parseInt(style.height, 10);
  }

  _processWaveForm(dataArray) {
    let stats = new WaveFormAnalyzer(dataArray).stats;
    console.log(stats);
    this.buffer.push(stats.max);
    if (this.buffer.length >= this.trailingAverageSize) {
      this._addHistory(this.buffer.reduce((sum, i) => sum + i, 0) / this.buffer.length);
    }
  }

  _addHistory(val) {
    this.buffer = [];
    this.history[this.currentIndex] = val;
    this.currentIndex += 1;
    if (this.currentIndex >= this.sliceCount) {
      this.currentIndex = 0;
    }
  }

  render(dataArray) {
    this._processWaveForm(dataArray);
    let {
      ctx
    } = this;

    ctx.beginPath();
    let x = 0;
    for (let i = 0; i < this.history.length; i++) {
      let y = (this.history[i] / this.MAX_VAL) * (this.height / 2);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += this.sliceWidth;
    }
    ctx.stroke();
  }
}

function gotStream(stream) {
  let analyzer = new Analyzer();
  analyzer.analyze(stream);
}


function init() {
  console.log('hi2!!!')
  document.getElementById("selectAudio").onclick = selectAudioInput;
}

init();