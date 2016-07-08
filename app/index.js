'use strict';

// stage constructor
const Stage = function() {

  // selectors
  this.audio = 'audio/dubfx.mp3';
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
  this.drop = false;

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

// average volume
Stage.prototype.averageVolume = function(array) {

  var values = 0;
  var average;
  var length = array.length;

  array.forEach((value) => values += value);

  average = values / length;

  return average;

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

    this.position += 4.75;

  }

  this.equalizer.appendChild(this.renderer.domElement);

  this.render();

};

// update equalizer based off of audio data
Stage.prototype.update = function() {

  let bufferLength = this.analyser.frequencyBinCount;
  let array = new Uint8Array(bufferLength);

  this.analyser.getByteFrequencyData(array);
  let average = this.averageVolume(array);

  array.forEach((threshold, index) => {

    let normLevel = (average / 64) * 1;
    let beat = normLevel * threshold;

    // add particles
    if(beat > 260 && !this.drop) {
      this.addParticles();
      this.drop = true;
    }

    // change camera
    if(beat >= 305 && this.drop) {

      let x = Math.random() * 50 - 25;
      let y = Math.random() * 100 - 50;
      let z = Math.random() * 300 - 100;

      this.changeCamera(x, y, z);

    }

    // change colors and rotation
    if(this.drop) {

      this.particleSystem.rotation.y += Math.random() * 0.0009;
      this.particleSystem.rotation.x += Math.random() * 0.0002;

      if(beat >= 120) {
        this.bars[index].material.color.setHex(Math.random() * 0xFFFFFF);
      }

    }

    // scale cylinders to threshold
    this.bars[index].scale.y = Math.max(0.17, threshold / 64);

  });

};

// change camera position
Stage.prototype.changeCamera = function(x, y, z) {

  this.camera.position.x = x;
  this.camera.position.y = y;
  this.camera.position.z = z;
  this.camera.lookAt(this.scene.position);

};

// add particles
Stage.prototype.addParticles = function() {

  this.camera.position.x = 25;
  this.camera.position.y = 150;
  this.camera.position.z = 100;
  this.camera.lookAt(this.scene.position);

  // create the particle variables
  let count = 1600;
  let particles = new THREE.Geometry();
  let textureLoader = new THREE.TextureLoader();
  let pMaterial = new THREE.PointsMaterial({
    color: 0x63B8FF,
    size: 4,
    map: textureLoader.load('images/dot.png'),
    transparent: true
  });

  window.material = pMaterial;

  // create the individual particles
  for (let i = 0; i < count; i++) {

    // create a particle with random
    // position values, -250 -> 250
    let pX = Math.random() * 100 - 50;
    let pY = Math.random() * 100 - 50;
    let pZ = Math.random() * 100 - 50;
    let particle = new THREE.Vector3(pX, pY, pZ);

    // add it to the geometry
    particles.vertices.push(particle);

  }

  // create the particle system
  this.particleSystem = new THREE.Points(particles, pMaterial);
  this.particleSystem.sortParticles = true;

  // add it to the scene
  this.scene.add(this.particleSystem);

};

// draw scene
Stage.prototype.render = function() {

  this.update();
  this.renderer.render(this.scene, this.camera);

  requestAnimationFrame(this.render.bind(this));

};

const stage = new Stage();
