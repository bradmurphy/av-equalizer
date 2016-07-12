!function e(t,i,r){function n(o,a){if(!i[o]){if(!t[o]){var h="function"==typeof require&&require;if(!a&&h)return h(o,!0);if(s)return s(o,!0);var c=new Error("Cannot find module '"+o+"'");throw c.code="MODULE_NOT_FOUND",c}var d=i[o]={exports:{}};t[o][0].call(d.exports,function(e){var i=t[o][1][e];return n(i?i:e)},d,d.exports,e,t,i,r)}return i[o].exports}for(var s="function"==typeof require&&require,o=0;o<r.length;o++)n(r[o]);return n}({1:[function(e,t,i){"use strict";var r=function(){var e=this;this.audio="audio/dubfx.mp3",this.equalizer=document.querySelector("#equalizer"),this.width=window.innerWidth,this.height=window.innerHeight,this.viewAngle=45,this.aspect=this.width/this.height,this.near=.1,this.far=1e5,this.timer=0,this.bars=[],this.position=-80,this.renderer=new THREE.WebGLRenderer,this.camera=new THREE.PerspectiveCamera(this.viewAngle,this.aspect,this.near,this.far),this.scene=new THREE.Scene,this.textureLoader=new THREE.TextureLoader,this.createAudio(),window.addEventListener("resize",function(){e.camera.aspect=window.innerWidth/window.innerHeight,e.camera.updateProjectionMatrix(),e.renderer.setSize(window.innerWidth,window.innerHeight)})};r.prototype.init=function(){this.loadSong(this.audio),this.createScene()},r.prototype.createAudio=function(){this.context=new AudioContext,this.analyser=this.context.createAnalyser(),this.analyser.smoothingTimeConstant=.4,this.analyser.minDecibels=-90,this.analyser.maxDecibels=-10,this.analyser.fftSize=64,this.sourceNode=this.context.createBufferSource();var e=this.context.createChannelSplitter();this.sourceNode.connect(e),e.connect(this.analyser,0),this.sourceNode.connect(this.context.destination),this.init()},r.prototype.loadSong=function(e){var t=this,i=new XMLHttpRequest;i.open("GET",e,!0),i.crossOrigin="anonymous",i.responseType="arraybuffer",i.onload=function(){t.context.decodeAudioData(i.response).then(function(e){t.songBuffer=e,t.playSong(e),e.loop=!0})["catch"](function(e){return t._onError(e)})},i.send()},r.prototype.playSong=function(e){e.duration;this.sourceNode.buffer=e,this.sourceNode.start(0)},r.prototype._onError=function(e){console.info("Audio Error: "+e)},r.prototype.averageVolume=function(e){var t,i=0,r=e.length;return e.forEach(function(e){return i+=e}),t=i/r},r.prototype.createScene=function(){this.scene.add(this.camera),this.camera.position.z=2400,this.renderer.setSize(this.width,this.height);var e=new THREE.SphereGeometry(2500,100,100),t=new THREE.MeshBasicMaterial({map:this.textureLoader.load("./images/background.jpg")});this.sphere=new THREE.Mesh(e,t),this.sphere.material.side=THREE.BackSide,this.scene.add(this.sphere);for(var i=32,r=0;r<i;r++){var n=new THREE.CylinderGeometry(2,2,10,32),s=new THREE.MeshBasicMaterial({color:16777215*Math.random()}),o=new THREE.Mesh(n,s);this.bars.push(o),this.scene.add(o),o.position.set(this.position,-100,2e3),this.position+=4.75}this.discoCam=new THREE.CubeCamera(1,1e5,128),this.scene.add(this.discoCam),this.discoCam.position.set(0,0,0);var a=new THREE.SphereGeometry(450,75,75),h=new THREE.MeshBasicMaterial({envMap:this.discoCam.renderTarget.texture});this.discoBall=new THREE.Mesh(a,h),this.discoBall.position.set(0,100,0),this.scene.add(this.discoBall),this.equalizer.appendChild(this.renderer.domElement),this.render()},r.prototype.update=function(){var e=this,t=this.analyser.frequencyBinCount,i=new Uint8Array(t);this.analyser.getByteFrequencyData(i);var r=this.averageVolume(i);i.forEach(function(t,i){var n=r/64*1,s=n*t;e.sphere.rotation.x+=9e-5,e.sphere.rotation.y-=1e-4,e.discoBall.rotation.x+=.001,e.discoBall.rotation.y+=.001,s>=160&&e.bars[i].material.color.setHex(16777215*Math.random()),s>=80&&(e.discoBall.scale.y=r/64,e.discoBall.scale.x=r/64),e.bars[i].scale.y=Math.max(.17,t/64)})},r.prototype.render=function(){this.update(),this.discoCam.updateCubeMap(this.renderer,this.scene),this.renderer.render(this.scene,this.camera),requestAnimationFrame(this.render.bind(this))};new r},{}]},{},[1]);
//# sourceMappingURL=main.build.js.map
