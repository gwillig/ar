import * as THREE from "./build/three.module.js";
import {GLTFLoader} from "./jsm/loaders/GLTFLoader.js";
import {DRACOLoader} from "./jsm/loaders/DRACOLoader.js";


export class Reticle extends THREE.Object3D {
	/**
	 * The Reticle class creates an object that repeatedly calls
	 * `xrSession.requestHitTest()` to render a ring along a found
	 * horizontal surface.
	 */
  constructor() {
    super();

    this.loader = new GLTFLoader;

    this.loader.load("https://immersive-web.github.io/webxr-samples/media/gltf/reticle/reticle.gltf", (gltf) => {

      this.add(gltf.scene);
    })
	this.name = "Reticle"
    this.visible = false;
  }
}


export class GLTFObject extends THREE.Object3D {
	/**
	 * The GLTFObject class loads an object of the GLTF type
	 */
  constructor(path,scale,objectName,mixers) {
    super();

    this.loader = new GLTFLoader;
	this.dracoLoader = new DRACOLoader();
	this.dracoLoader.setDecoderPath( 'js/libs/draco/gltf/' );
	this.loader.setDRACOLoader(this.dracoLoader);
	this.name=objectName
	this.loader.load(path, (gltf) => {
	  const model = gltf.scene;
	  console.log("gltf",gltf)
	  model.scale.set( scale.x,scale.y,scale.z );
	  this.mixer = new THREE.AnimationMixer( model );
	  this.mixer.clipAction( gltf.animations[ 0 ] ).play();
	  mixers.push(this.mixer)
      this.add(model);
    },
	// called while loading is progressing
	function ( xhr ) {
		const spinner = document.querySelector("#spinnerLoader")
		const progress = xhr.loaded / xhr.total * 100

		if(progress<100){
			spinner.style.display="block"
		}
		else{
			spinner.style.display="none"
		}
		console.log( ( progress ) + '% loaded' );
	},
	// called when loading has errors
	function ( error ) {

		console.log( 'An error happened' );
		alert('An error happened')

	}
	)
  }
}

export function onMouseMove( event,mouse,current_object ) {

	/*
	@description:
		- Calculate mouse position in normalized device coordinates
		(-1 to +1) for both components: From Three.js  https://threejs.org/docs/index.html?q=Rayc#api/en/core/Raycaster
		- Moves object based on mouseMoment
	@args:
		- event
		- mouse (global variable)
		- current_object (global variable)
	 */

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	 if (current_object) {
        current_object.rotation.y += event.movementX * 0.005;
		current_object.rotation.x += event.movementY * 0.005;
    }
}