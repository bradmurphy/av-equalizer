'use strict';

// stage constructor
const Stage = function() {

  // selectors
  this.audio = 'audio/sublime.mp3';
  this.equalizer = document.querySelector('#equalizer');

  // scene variables
  this.width = window.innerWidth;
  this.height = window.innerHeight;

  this.viewAngle = 45;
  this.aspect = this.width / this.height;
  this.near = 0.1;
  this.far = 100000;
  this.timer = 0;
  this.bars = [];
  this.position = -80;

  this.renderer = new THREE.WebGLRenderer();
  this.camera = new THREE.PerspectiveCamera(this.viewAngle, this.aspect, this.near, this.far);
  this.scene = new THREE.Scene();

  this.createAudio();

};

// init scene and play song
Stage.prototype.init = function() {

  this.loadSong(this.audio);
  this.createScene();

};

// create audio
Stage.prototype.createAudio = function() {

  this.context = new AudioContext();
  this.analyser = this.context.createAnalyser();
  this.analyser.smoothingTimeConstant = 0.4;
  this.analyser.minDecibels = -90;
  this.analyser.maxDecibels = -10;
  this.analyser.fftSize = 64;

  this.sourceNode = this.context.createBufferSource();
  let splitter = this.context.createChannelSplitter();

  this.sourceNode.connect(splitter);

  splitter.connect(this.analyser, 0);

  this.sourceNode.connect(this.context.destination);

  this.init();

};

// load song
Stage.prototype.loadSong = function(song) {

  let request = new XMLHttpRequest();
  request.open('GET', song, true);
  request.crossOrigin = 'anonymous';
  request.responseType = 'arraybuffer';

  request.onload = () =>  {

    this.context.decodeAudioData(request.response).then((buffer) => {

      this.songBuffer = buffer;
      this.playSong(buffer);
      buffer.loop = true;

    }).catch((err) => this._onError(err));

  };

  request.send();

};

// play song
Stage.prototype.playSong = function(buffer) {

  let duration = buffer.duration;
  this.sourceNode.buffer = buffer;
  this.sourceNode.start(0);

};

// on error
Stage.prototype._onError = function(err) {

  console.info('Audio Error: ' + err);

};

// generate equalizer
Stage.prototype.createScene = function() {

  this.scene.add(this.camera);

  this.camera.position.z = 200;

  this.renderer.setSize(this.width, this.height);

  let count = 32;

  for (let i = 0; i < count; i++) {

    let bars = new THREE.CylinderGeometry(2, 2, 10, 32);

    let material = new THREE.MeshBasicMaterial({color: Math.random() * 0xFFFFFF});

    let bar = new THREE.Mesh(bars, material);

    this.bars.push(bar);
    this.scene.add(bar);

    bar.position.set(this.position, 0, 0);

    this.position += 6;

  }

  this.equalizer.appendChild(this.renderer.domElement);

  this.render();

};

// update equalizer based off of audio data
Stage.prototype.update = function() {

  let bufferLength = this.analyser.frequencyBinCount;
  let array = new Uint8Array(bufferLength);

  this.analyser.getByteFrequencyData(array);

  array.forEach((threshold, index) => {

    this.bars[index].scale.y = Math.max(0.17, threshold / 64);
    this.bars[index].rotation.x += 0.002;

  });

};

// draw scene
Stage.prototype.render = function() {

  this.update();
  this.renderer.render(this.scene, this.camera);

  requestAnimationFrame(this.render.bind(this));

};

const stage = new Stage();
