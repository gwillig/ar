import * as THREE from './build/three.module.js';
import {ARButton} from './jsm/webxr/ARButton.js';
import {OrbitControls} from './jsm/controls/OrbitControls.js';
import { RoomEnvironment } from './jsm/environments/RoomEnvironment.js';
import {Reticle, GLTFObject, onMouseMove} from './util.js';


// Global variables
let camera, scene, renderer, controls,userAddedObjects;
let current_object = undefined;
let last_object = undefined;
let controller;
let reticle = undefined;
let stabilized = false;
let hitTestSource = null;
let hitTestSourceRequested = false;
let removedObjectNoneAR = false
let mixers = []
const clock = new THREE.Clock();
//// Variables for smartphone
var evCache = new Array();
var prevDiff = -1;
let touchDown, touchX, touchY, deltaX, deltaY;
////  initialize variable to detect click on object
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster()


// Calls the init function when the window is done loading.
window.onload = init;

function init() {
	//1.Step: Creates a new html elements which will contain the 3D elements from three.js
	const container = document.createElement('div');
	document.body.appendChild(container);
	//2.Step: create a scene, that will hold all our elements such as objects, cameras and lights.
	scene = new THREE.Scene();
	//2.1.Step: Create a group which contains all user added objects
	userAddedObjects = new THREE.Group()
	userAddedObjects.name = "userAddedObjects"
	scene.add(userAddedObjects);

	//3.Step: create a camera, which defines where we looking at.
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
	//4.Step: create lights
	const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.1);
	light.position.set(0.5, 1, 0.25);
	// const light = new THREE.AmbientLight(0xffffff);
	scene.add(light);
	// light.position.set(0.5, 1, 0.25);
	//5.Step: create a renderer, set the background color and size

	renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
	renderer.outputEncoding = THREE.sRGBEncoding;
	const pmremGenerator = new THREE.PMREMGenerator( renderer );
	scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.9 ).texture;
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.xr.enabled = true;
	//6.Step: Add created renderer to created dom element
	container.appendChild(renderer.domElement);

	//7.Step: Add a AR Button
	let options = {

		optionalFeatures: ['dom-overlay'],
		requiredFeatures: [ 'hit-test' ]
	}

	options.domOverlay = {root: document.getElementById('content')};
	document.body.appendChild(ARButton.createButton(renderer, options));
	//


	controller = renderer.xr.getController(0);
	scene.add(controller);

	//.Step: Add reticle for VR
	reticle = new Reticle();
	reticle.matrixAutoUpdate = false;

	scene.add(reticle);

	animate()
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

	requestAnimationFrame(animate);
	var delta = clock.getDelta();
	mixers.forEach(mixer=>mixer.update(delta))
	renderer.setAnimationLoop(render);
	render();

}
function resetMaterials(userAddedObjects){
	/*
	* @description: Reset the materials of the clicked objects
	*
	* */
	// Set current object to undefined
	current_object = undefined;
	//Reset color to original color
	if(userAddedObjects.children){
		for (let object of userAddedObjects.children) {

			if (object.type == "Mesh") {
				object.material.color.set(object.originalColor);
			}
			//
	}
	}

}

function render(timestamp,frame) {

	// update the picking ray with the camera and mouse position
	raycaster.setFromCamera( mouse, camera );

	// calculate objects intersecting the picking ray
	//Get all the the group of object which were added by the user
	const intersects = raycaster.intersectObjects( userAddedObjects.children, );

	resetMaterials(userAddedObjects)

	intersects.forEach(intersectSingle => {
	      const object = intersectSingle.object
		 object.traverseAncestors( a => {
        if (a.name == "RootNode") {
			current_object = a
			last_object = a

			// a.material.color.set( "green");
		}
    })

	})

	//
	if (frame) {
		//.Step: Remove all object which where created before AR
		if(removedObjectNoneAR==false){
			//See explation https://stackoverflow.com/questions/29417374/threejs-remove-all-together-object-from-scene
			while (userAddedObjects.children.length){
				let child = userAddedObjects.children[0]

				//See https://stackoverflow.com/questions/40694372/what-is-the-right-way-to-remove-a-mesh-completely-from-the-scene-in-three-js/40730686
				scene.remove(child)
				// child.geometry.dispose();
				// child.material.dispose();
				userAddedObjects.remove(child)
			}


			//Set removedObjectNoneAR
			console.log("removedObjectNoneAR removed")
			removedObjectNoneAR=true
		}
		if(stabilized==false){
			document.querySelector("#stabilization").style.display="block"
		}
		const referenceSpace = renderer.xr.getReferenceSpace();
		const session = renderer.xr.getSession();

		if ( hitTestSourceRequested === false ) {
			// Setup an XRReferenceSpace
			session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
				// Perform hit testing using the viewer as origin.
				session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

					hitTestSource = source;

				} );

			} );

			session.addEventListener( 'end', function () {

				hitTestSourceRequested = false;
				hitTestSource = null;

			} );
			hitTestSourceRequested = true;

		}

		if ( hitTestSource ) {
			// Conduct hit test.
			const hitTestResults = frame.getHitTestResults( hitTestSource );

			if (!stabilized && hitTestResults.length > 0) {
				stabilized = true;
				document.querySelector("#stabilization").style.display="none"
			}
			if ( hitTestResults.length ) {

				const hit = hitTestResults[ 0 ];

				reticle.visible = true;
				reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );

			} else {

				reticle.visible = false;

			}

		}

	}

	renderer.render( scene, camera );

}
function scaleObject3D(){
		debugger
		const scaleFactor = parseFloat(document.querySelector("#scaleObject").value)
		// var scaleFactor = deltaX*deltaX+deltaY*deltaY
		// console.log("scaleFactor: ",scaleFactor)
		last_object.scale.x *= scaleFactor
		last_object.scale.y *= scaleFactor
		last_object.scale.z *= scaleFactor
}
export async function addObject() {
	/*
	@description
		Adds an object to the scene
	 */
	//1.Step: Get parameter to load object from html-select element
	const selectMenu = document.querySelector("#selectObject")
	const object_path = selectMenu.options[selectMenu.selectedIndex].getAttribute("data-path")
	const object_scaleString = selectMenu.options[selectMenu.selectedIndex].getAttribute("data-scale")
	const object_scale = JSON.parse(object_scaleString)
	const object_name = selectMenu.name
	//2.Step: Create a object

	const mesh = new GLTFObject(object_path,object_scale,object_name,mixers)
	console.log("mesh",mesh)
	console.log("THREE",THREE)
	//3.Step: Check if AR is activated then the object should be placed at the reticle position
	if (reticle != undefined) {
		if (reticle.visible) {
			mesh.position.setFromMatrixPosition(reticle.matrix);
		} else {
			mesh.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
			mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);
		}
	} else {
		mesh.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
		mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);
	}
	mesh.name = object_name
	//4.Step: Add object to userAddedObjects
	userAddedObjects.add(mesh);

	//5.Step: Make the range visible for scaling
	document.getElementById("scaleObjectDiv").style.display = "block";
}



//Add events listener=================

document.querySelector("#scaleObject").addEventListener('change', scaleObject3D);

window.addEventListener('resize', onWindowResize);
//// Event listener for object movement
window.addEventListener( 'mousemove', function(){onMouseMove(event,mouse,current_object)}, false );
window.addEventListener('touchstart', function (event) {

	mouse.x = +(event.targetTouches[0].pageX / window.innerWidth) * 2 +-1;

	mouse.y = -(event.targetTouches[0].pageY / window.innerHeight) * 2 + 1;

	touchX = event.touches[0].pageX;
	touchY = event.touches[0].pageY;

}, false);

window.addEventListener('touchmove', function (e) {

	deltaX = e.touches[0].pageX - touchX;
	deltaY = e.touches[0].pageY - touchY;
	touchX = e.touches[0].pageX;
	touchY = e.touches[0].pageY;
	var fingers = e.touches.length

	//Distinct between pinch and touch
	debugger
	if (typeof current_object!= 'undefined') {
		current_object.rotation.y += deltaX / 100;
		current_object.rotation.x += deltaY / 100;

	}

}, false);

//// General event listener
document.querySelector('#place-button').addEventListener('click', addObject);



