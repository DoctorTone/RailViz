/**
 * Created by atg on 14/05/2014.
 */
//Common baseline for visualisation app
const CAM_LANDSCAPE_X = 0;
const CAM_LANDSCAPE_Y = 555;
const CAM_LANDSCAPE_Z = 1725;
const LANDSCAPE = 0;
const PORTRAIT = 1;

class BaseApp {
    constructor() {
        this.renderer = null;
        this.scenes = [];
        this.currentScene = 0;
        this.camera = null;
        this.controls = null;
        this.stats = null;
        this.container = null;
        this.objectList = [];
        this.root = null;
        this.mouse = new THREE.Vector2();
        this.pickedObjects = [];
        this.selectedObject = null;
        this.hoverObjects = [];
        this.startTime = 0;
        this.elapsedTime = 0;
        this.clock = new THREE.Clock();
        this.clock.start();
        this.raycaster = new THREE.Raycaster();
        this.objectsPicked = false;
        this.cameraMode = 0;
        this.orientation;
    }

    init(container) {
        this.container = container;
        this.createRenderer();
        this.createCamera();
        this.createControls();
        //this.stats = initStats();
        this.statsShowing = false;
        //$("#Stats-output").hide()
    }

    setOrientation(orientation) {
        this.orientation = orientation;
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer( {antialias : true, alpha: true});
        this.renderer.setClearColor(0x7d818c, 1.0);
        this.renderer.shadowMap.enabled = true;

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild( this.renderer.domElement );

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;

        window.addEventListener('keydown', event => {
            this.keyDown(event);
        }, false);

        window.addEventListener('resize', event => {
            this.windowResize(event);
        }, false);
    }

    keyDown(event) {
        //Key press functionality
        switch(event.keyCode) {
            case 83: //'S'
                if (this.stats) {
                    if (this.statsShowing) {
                        $("#Stats-output").hide();
                        this.statsShowing = false;
                    } else {
                        $("#Stats-output").show();
                        this.statsShowing = true;
                    }
                }
                break;
            case 80: //'P'
                console.log('Cam =', this.camera.position);
                console.log('Look =', this.controls.getLookAt());
        }
    }

    mouseClicked(event) {
        //Update mouse state
        event.preventDefault();
        this.pickedObjects.length = 0;

        if(event.type === 'mouseup') {
            this.mouse.endX = event.clientX;
            this.mouse.endY = event.clientY;
            this.mouse.down = false;
            this.objectsPicked = false;
            return;
        }
        this.mouse.set((event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1);
        this.mouse.down = true;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        let intersects = this.raycaster.intersectObjects( this.scenes[this.currentScene].children, true );
        if(intersects.length > 0) {
            this.selectedObject = intersects[0].object;
            //DEBUG
            console.log("Picked = ", this.selectedObject);
        }
    }

    mouseMoved(event) {
        //Update mouse state
        this.mouse.endX = event.clientX;
        this.mouse.endY = event.clientY;
    }

    windowResize(event) {
        //Handle window resize
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( window.innerWidth, window.innerHeight);
        this.fitToScreen();
    }

    createScene() {
        let scene = new THREE.Scene();
        this.scenes.push(scene);

        let ambientLight = new THREE.AmbientLight(0x383838);
        scene.add(ambientLight);

         let directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
         directionalLight.position.set( 100, 100, 100 );
         directionalLight.name = "sunlight";
         scene.add( directionalLight );

         /*
        let pointLight = new THREE.PointLight(0xffffff);
        pointLight.position.set(0,100,100);
        pointLight.name = 'PointLight';
        scene.add(pointLight);
        */

        return this.scenes.length-1;
    }

    addToScene(object) {
        this.scenes[this.currentScene].add(object);
    }

    getObjectByName(name) {
        return this.scenes[this.currentScene].getObjectByName(name);
    }

    createCamera() {
        const CAM_PORTRAIT_X = 0, CAM_PORTRAIT_Y = 710, CAM_PORTRAIT_Z = 2150;
        let camPortrait = new THREE.Vector3(CAM_PORTRAIT_X, CAM_PORTRAIT_Y, CAM_PORTRAIT_Z);
        let camLandscape = new THREE.Vector3(CAM_LANDSCAPE_X, CAM_LANDSCAPE_Y, CAM_LANDSCAPE_Z);
        const NEAR_PLANE = 0.1, FAR_PLANE = 10000;
        this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / window.innerHeight, NEAR_PLANE, FAR_PLANE );
        this.camera.position.copy(this.orientation === PORTRAIT ? camPortrait : camLandscape);
        this.camPosPortrait = camPortrait;
        this.camPosLandscape = camLandscape;
    }

    createControls() {
        this.controls = new THREE.TrackballControls(this.camera, this.container);
        this.controls.rotateSpeed = 1.0;
        this.controls.zoomSpeed = 1.0;
        this.controls.panSpeed = 1.0;

        this.controls.noRotate = true;
        this.controls.noPan = true;
        this.controls.noRoll = true;

        this.controls.staticMoving = true;
        this.controls.dynamicDampingFactor = 0.3;

        this.controls.keys = [ 65, 83, 68 ];

        const LOOK_X = 0, LOOK_Y = -95, LOOK_Z = 0;
        let lookAt = new THREE.Vector3(LOOK_X, LOOK_Y, LOOK_Z);
        this.controls.setLookAt(lookAt);
        this.defaultLookAt = new THREE.Vector3();
        this.defaultLookAt.copy(lookAt);
    }

    setCamera(cameraProp, mode) {
        if(mode !== undefined) {
            let camPos = mode === PORTRAIT ? this.camPosPortrait : this.camPosLandscape;
            this.camera.position.copy(camPos);
            this.cameraMode = mode;
            return;
        }
        this.camera.position.set(cameraProp[0].x, cameraProp[0].y, cameraProp[0].z);
        this.controls.setLookAt(cameraProp[1]);
    }

    resetCamera() {
        let camPos = this.cameraMode === PORTRAIT ? this.camPosPortrait : this.camPosLandscape;
        this.camera.position.copy(camPos);
        this.controls.setLookAt(this.defaultLookAt);
    }

    update() {
        //Do any updates
        this.controls.update();
    }

    run() {
        this.renderer.render( this.scenes[this.currentScene], this.camera );
        this.update();
        if(this.stats) this.stats.update();
        requestAnimationFrame(() => {
            this.run();
        });
    }

    initStats() {
        let stats = new Stats();

        stats.setMode(0); // 0: fps, 1: ms

        // Align top-left
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';

        $("#Stats-output").append( stats.domElement );

        return stats;
    }
}
