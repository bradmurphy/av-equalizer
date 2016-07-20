'use strict';

// stage constructor
// intial variables and event listeners
const Stage = function() {

  // selectors
  this.sceneContainer = document.querySelector('#equalizer');
  this.songs = document.querySelector('#songs');

  // scene variables
  this.width = window.innerWidth;
  this.height = window.innerHeight;

  this.viewAngle = 45;
  this.aspect = this.width / this.height;
  this.near = 0.1;
  this.far = 100000;
  this.timer = 0;
  this.bars = [];

  // create audio context and scene
  this.createAudio();
  this.createScene();

  // resize event listener
  // scales scene based on screen size
  window.addEventListener('resize', () => {

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

  });

  // drop down select event listener
  // select from menu of songs to play, resets scene and disconnects audio context, then loads the song.
  this.songs.addEventListener('change', (e) => {

    if(this.songBuffer) {
      this.reset();
    }

    switch(this.songs.value) {
      case 'dubfx':
        this.loadSong('audio/dubfx.mp3');
        break;
      case 'rhcp':
        this.loadSong('audio/otherside.mp3');
        break;
      case 'froggy':
        this.loadSong('audio/froggy.mp3');
        break;
      case 'three6':
        this.loadSong('audio/three6.mp3');
        break;
      case 'behappy':
        this.loadSong('audio/behappy.mp3');
        break;
      case 'rainbow':
        this.loadSong('audio/rainbow.mp3');
        break;
    }

  });

};

// reset scene
// Disconnect source, cancel animation frame, remove all objects from scene, remove the container.
// Set variables to null/reset and then create audio context and scene again.
Stage.prototype.reset = function() {

  this.sourceNode.disconnect();

  window.cancelAnimationFrame(this.animation);

  this.scene.children.forEach((obj) => {
    this.scene.remove(obj);
  });

  this.sceneContainer.removeChild(this.sceneContainer.children[0]);

  this.context = null;
  this.analyzer = null;
  this.renderer = null;
  this.camera = null;
  this.scene = null;
  this.textureLoader = null;

  this.bars = [];

  this.createAudio();
  this.createScene();

};

// create audio context
// establish audio context and connect the analyser.
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

};

// load song
// request the song, load and establish buffer.
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
// pull in buffer, set duration and begin playing song.
Stage.prototype.playSong = function(buffer) {

  this.duration = buffer.duration;
  this.sourceNode.buffer = buffer;
  this.sourceNode.start(0);

};

// on audio error, display error
Stage.prototype._onError = function(err) {

  console.info('Audio Error: ' + err);

};

// return average volume based on array of values
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

  // camera, renderer and scene set up
  this.renderer = new THREE.WebGLRenderer();
  this.camera = new THREE.PerspectiveCamera(this.viewAngle, this.aspect, this.near, this.far);
  this.scene = new THREE.Scene();
  this.textureLoader = new THREE.TextureLoader();

  // add camera to scene and set z position
  this.scene.add(this.camera);
  this.camera.position.z = 2400;

  // set renderer size
  this.renderer.setSize(this.width, this.height);

  // add outer sphere
  let sphereGeo = new THREE.SphereGeometry(2500, 100, 100);
  let sphereMat = new THREE.MeshBasicMaterial({map: this.textureLoader.load('./images/pattern.jpg')});

  this.sphere = new THREE.Mesh(sphereGeo, sphereMat);
  this.sphere.material.side = THREE.BackSide;

  this.scene.add(this.sphere);

  // add disco ball and camera
  this.discoCam = new THREE.CubeCamera(1, 100000, 128);
  this.scene.add(this.discoCam);
  this.discoCam.position.set(0, 0, 0);

  let discoGeo = new THREE.TorusKnotGeometry(30, 15, 40, 13, 13, 5);
  let discoMat = new THREE.MeshBasicMaterial({envMap: this.discoCam.renderTarget.texture});

  this.discoBall = new THREE.Mesh(discoGeo, discoMat);
  this.discoBall.position.set(0, 0, 2000);
  this.scene.add(this.discoBall);

  this.sceneContainer.appendChild(this.renderer.domElement);

  // add ring
  let ringGeo = new THREE.RingGeometry(85, 90, 20, 1, 8);
  let ringMat = new THREE.MeshBasicMaterial({
    envMap: this.discoCam.renderTarget.texture,
    side: THREE.DoubleSide
  });

  this.ring = new THREE.Mesh(ringGeo, ringMat);
  this.ring.position.set(0, 0, 1999);
  this.scene.add(this.ring);

  // call render
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

    if(beat >= 200) {

      TweenMax.to(this.sphere.rotation, 1, {x: -Math.PI, ease: Power4.easeOut});

    }

    // animate disco scale and sphere rotation
    if(beat >= 136) {

      this.discoBall.scale.y = average / 64;
      this.discoBall.scale.x = average / 64;

      this.sphere.rotation.x += 0.001;
      this.sphere.rotation.y -= 0.001;

      this.discoBall.rotation.x += 0.001;

    }

    // animate disco vertices
    if(beat >= 1 && beat <= 135) {

      this.ring.scale.y = average / 32;
      this.ring.scale.x = average / 32;

      this.ring.rotation.y += 0.001

    }

  });

};

// render scene and camera, call update
Stage.prototype.render = function() {

  this.update();
  this.discoCam.updateCubeMap(this.renderer, this.scene);
  this.renderer.render(this.scene, this.camera);

  this.animation = requestAnimationFrame(this.render.bind(this));

};

const stage = new Stage();
