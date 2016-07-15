'use strict';

// stage constructor
const Stage = function() {

  // selectors
  this.audio = 'audio/otherside.mp3';
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

  // camera, renderer and scene set up
  this.renderer = new THREE.WebGLRenderer();
  this.camera = new THREE.PerspectiveCamera(this.viewAngle, this.aspect, this.near, this.far);
  this.scene = new THREE.Scene();
  this.textureLoader = new THREE.TextureLoader()

  // create audio context call
  this.createAudio();

  // resize event listener
  window.addEventListener('resize', () => {

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

  });

};

// init scene and play song
Stage.prototype.init = function() {

  this.loadSong(this.audio);
  this.createScene();

};

// create audio context
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

// on audio error, display error
Stage.prototype._onError = function(err) {

  console.info('Audio Error: ' + err);

};

// return average volume
Stage.prototype.averageVolume = function(array) {

  var values = 0;
  var average;
  var length = array.length;

  array.forEach((value) => values += value);

  average = values / length;

  return average;

};

// create scene and objects
Stage.prototype.createScene = function() {

  this.scene.add(this.camera);

  this.camera.position.z = 2400;

  this.renderer.setSize(this.width, this.height);

  // add outer sphere
  let sphereGeo = new THREE.SphereGeometry(2500, 100, 100);
  let sphereMat = new THREE.MeshBasicMaterial({map: this.textureLoader.load('./images/pattern.jpg'),});

  this.sphere = new THREE.Mesh(sphereGeo, sphereMat);
  this.sphere.material.side = THREE.BackSide;

  this.scene.add(this.sphere);

  // add equalizer bars
  for (let i = 0; i < 32; i++) {

    let bars = new THREE.CylinderGeometry(2, 2, 10, 32);
    let material = new THREE.MeshBasicMaterial({
      color: Math.random() * 0xFFFFFF,
      opacity: 1,
      transparent: true
    });

    let bar = new THREE.Mesh(bars, material);

    this.bars.push(bar);
    this.scene.add(bar);

    bar.position.set(this.position, -125, 2000);

    this.position += 4.75;

  }

  // add disco ball
  this.discoCam = new THREE.CubeCamera(1, 100000, 128);
  this.scene.add(this.discoCam);
  this.discoCam.position.set(0, 0, 0);

  let discoGeo = new THREE.TorusKnotGeometry(250, 100, 50, 13, 13, 5);
  let discoMat = new THREE.MeshBasicMaterial({envMap: this.discoCam.renderTarget.texture});

  this.discoBall = new THREE.Mesh(discoGeo, discoMat);
  this.discoBall.position.set(0, 175, 0);
  this.scene.add(this.discoBall);

  this.equalizer.appendChild(this.renderer.domElement);

  this.render();

};

// update objects based off of beat detection
Stage.prototype.update = function() {

  let bufferLength = this.analyser.frequencyBinCount;
  let array = new Uint8Array(bufferLength);

  this.analyser.getByteFrequencyData(array);
  let average = this.averageVolume(array);

  array.forEach((threshold, index) => {

    let normLevel = (average / 64) * 1;
    let beat = normLevel * threshold;

    this.sphere.rotation.x += 0.00009;
    this.sphere.rotation.y -= 0.00001;

    this.discoBall.rotation.x += 0.0009;
    this.discoBall.rotation.y += 0.00001;

    // animate disco
    if(beat >= 250) {

      this.discoBall.scale.y = average / 64;
      this.discoBall.scale.x = average / 64;

      this.sphere.rotation.x += 0.009;
      this.sphere.rotation.y -= 0.001;

    }

    // animate bars
    if(beat >= 1 && beat <= 125) {

      this.bars[index].material.opacity = 1;
      this.bars[index].scale.y = Math.max(0.17, threshold / 64);

    } else if(beat >= 100 && beat <= 125) {

      this.bars[index].material.color.setHex(Math.random() * 0xFFFFFF);

    } else if(beat <= 0 || beat > 125) {

      this.bars[index].material.opacity = 0;

    }

  });

};

// render scene and camera, call update
Stage.prototype.render = function() {

  this.update();
  this.discoCam.updateCubeMap(this.renderer, this.scene);
  this.renderer.render(this.scene, this.camera);

  requestAnimationFrame(this.render.bind(this));

};

const stage = new Stage();
