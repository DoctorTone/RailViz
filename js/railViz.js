/**
 * Created by DrTone on 22/02/2016.
 */

let ROT_INC = Math.PI/32;
let NUM_TRAINS_PER_TRACK = 4;
let NUM_TRACKS = 4;
const MOBILE_WIDTH = 768;
const NEAR = 0;
const FAR = 1;

//Camera views
let VIEWS = {
    MAIN: 0,
    TRACK0: 1,
    TRACK1: 2,
    TRACK2: 3,
    TRACK3: 4
};

let cameraViews = {
        all: [new THREE.Vector3(0, 560, 1740), new THREE.Vector3(0, -95, 0)],
        track0: [ new THREE.Vector3(0, 260, 1360), new THREE.Vector3(0, -250, 0)],
        track1: [ new THREE.Vector3(820, 290, 630), new THREE.Vector3(820, 50, 0)],
        track2: [ new THREE.Vector3(0, 270, 50), new THREE.Vector3(0, 255, -5)],
        track3: [ new THREE.Vector3(-830, 235, 645), new THREE.Vector3(-800, -15, -5)]
    };

let viewOrder = ['front', 'right', 'back', 'left'];

class RailApp extends BaseApp {
    constructor() {
        super();

        //Do any initialisation
        this.trackView = -1;
        this.running = false;
        this.trainHeight = 7;
        this.tempPos = new THREE.Vector3();
        this.posOffset = new THREE.Vector3(0, this.trainHeight, 0);
        this.currentTrain = 0;
        this.trains = [];
        this.trainsStopped = 0;
    }

    init(container) {
        super.init(container);

        this.setCamera(cameraViews.all);
    }

    createScene() {
        super.createScene();

        this.fitToScreen();
        //Skybox
        this.addToScene(this.makeSkyBox());

        //Geometry parameters
        let sceneConfig = {
            groundWidth: 5000,
            groundDepth: 3000,
            groundSegments: 8,
            groundColour: 0x1d701d,
            pinLabelScaleX: 92.5,
            pinLabelScaleY: 57.5,
            signLabelScaleX: 200,
            signLabelScaleY: 140,
            pointerScale: 50,
            trainScaleX: 15,
            trainScaleY: 15,
            labelOffsetY: 67.5,
            POST_RADIUS_TOP: 5,
            POST_HEIGHT: 175
        };

        let textureLoader = new THREE.TextureLoader();
        let pointTex = textureLoader.load("images/pin.png");
        let trainTex = textureLoader.load("images/engineWhite.png");
        textureLoader.load("images/terrain.jpg", groundTex => {
            let planeGeom = new THREE.PlaneBufferGeometry(sceneConfig.groundWidth, sceneConfig.groundDepth,
                sceneConfig.groundSegments, sceneConfig.groundSegments);
            let planeMat = new THREE.MeshLambertMaterial( {map: groundTex} );
            let plane = new THREE.Mesh(planeGeom, planeMat);
            plane.rotation.x = -Math.PI/2;
            this.addToScene(plane);
        });

        //Platform
        let mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath("./models/");
        mtlLoader.load("platform.mtl", materials => {
            materials.preload();

            let objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath("./models/");
            objLoader.load("platform.obj", platform => {
                const SCALE = 150;
                platform.scale.set(SCALE, SCALE, SCALE);
                platform.position.set(0, -42.5, 700);
                let platformPos = [new THREE.Vector3(775, -42.5, 0),
                            new THREE.Vector3(0, -42.5, -750),
                            new THREE.Vector3(-800, -42.5, -25)];
                let platformScale = [150, 175, 175];
                let nextPlatform;
                for(let i=0, numPlatforms=platformPos.length; i<numPlatforms; ++i) {
                    nextPlatform = platform.clone();
                    nextPlatform.position.copy(platformPos[i]);
                    nextPlatform.scale.set(platformScale[i], SCALE, platformScale[i]);
                    this.addToScene(nextPlatform);
                }
                this.addToScene(platform);
            })
        });

        //Ground plane
        let i;


        //Track
        let width = 200, depth = 275, height = 20;
        let trackShapes = [];
        trackShapes.push(new THREE.CatmullRomCurve3([
            new THREE.Vector3(width*0.2, height, depth*1.2),
            new THREE.Vector3(width*0.2, height, depth*0.2),
            new THREE.Vector3(width*1.5, height, depth*0.2),
            new THREE.Vector3(width*1.5, height, -depth*0.2),
            new THREE.Vector3(-width*1.5, height, -depth*0.2),
            new THREE.Vector3(-width*1.5, height, depth*0.2),
            new THREE.Vector3(-width*0.2, height, depth*0.2),
            new THREE.Vector3(-width*0.2, height, depth*1.2)
        ]));
        trackShapes.push(new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, height, depth/2),
            new THREE.Vector3(width, height, depth),
            new THREE.Vector3(width, height, -depth/10),
            new THREE.Vector3(0, height, -depth/2),
            new THREE.Vector3(-width, height, -depth/10),
            new THREE.Vector3(-width, height, depth/2),
            new THREE.Vector3(-width/1.5, height, depth*1.3)
        ]));
        trackShapes.push(new THREE.CatmullRomCurve3([
            new THREE.Vector3(width, height, depth),
            new THREE.Vector3(width, height, -depth),
            new THREE.Vector3(-width*1.75, height, -depth),
            new THREE.Vector3(-width*1.75, height, 0),
            new THREE.Vector3(width*0.3, height, 0),
            new THREE.Vector3(width*0.3, height, depth)
        ]));
        trackShapes.push(new THREE.CatmullRomCurve3([
            new THREE.Vector3(width*0.2, height, depth*1.1),
            new THREE.Vector3(width*0.2, height, depth*0.1),
            new THREE.Vector3(width*1.5, height, -depth*0.9),
            new THREE.Vector3(width, height, -depth*1.1),
            new THREE.Vector3(0, height, -depth*0.15),
            new THREE.Vector3(-width, height, -depth*1.1),
            new THREE.Vector3(-width*1.5, height, -depth*0.9),
            new THREE.Vector3(-width*0.2, height, depth*0.1),
            new THREE.Vector3(-width*0.2, height, depth*1.1)
        ]));

        let numTracks = trackShapes.length;
        for(let i=0; i<numTracks; ++i) {
            trackShapes[i].type = 'catmullrom';
            trackShapes[i].closed = true;
        }
        let segments = 100, radiusSegments = 3, closed = true;
        let tubeMat = new THREE.MeshLambertMaterial( {color:0x0000ff});

        //Tracks
        let trackOffset = 700;
        let trackPositions = [new THREE.Vector3(0, 0, trackOffset),
            new THREE.Vector3(trackOffset, 0, 0),
            new THREE.Vector3(0, 0, -trackOffset),
            new THREE.Vector3(-trackOffset*1.2, 0, 0)];
        this.trackGroups = [];
        this.tubeMeshes = [];
        this.tubes = [];
        //Signage
        let postGeom = new THREE.CylinderBufferGeometry(sceneConfig.POST_RADIUS_TOP, sceneConfig.POST_RADIUS_TOP, sceneConfig.POST_HEIGHT);
        let postMat = new THREE.MeshLambertMaterial( {color: 0xffffff} );
        let post, sign, signPostOffset=20;
        let labelScale = new THREE.Vector3(sceneConfig.signLabelScaleX, sceneConfig.signLabelScaleY, 1);
        let signPosts = ["Southern Line", "Eastern Line", "Northern Line", "Western Line"];
        for(i=0; i<NUM_TRACKS; ++i) {
            this.tubes.push(new THREE.TubeGeometry(trackShapes[i], segments, 2, radiusSegments, closed));
            this.tubeMeshes.push(new THREE.Mesh(this.tubes[i], tubeMat));
            this.trackGroups.push(new THREE.Object3D());
            this.trackGroups[i].add(this.tubeMeshes[i]);
            this.trackGroups[i].position.copy(trackPositions[i]);
            this.addToScene(this.trackGroups[i]);
            post = new THREE.Mesh(postGeom, postMat);
            post.position.copy(trackPositions[i]);
            post.position.y += sceneConfig.POST_HEIGHT/2;
            this.addToScene(post);
            trackPositions[i].y += (sceneConfig.POST_HEIGHT + signPostOffset);
            sign = spriteManager.create(signPosts[i], trackPositions[i], labelScale, 32, 1, true, true);
            this.addToScene(sign);
        }
        this.trackGroups[1].rotation.y = Math.PI/2;

        this.pinHeight = 30;

        //this.railGroup = new THREE.Object3D();
        //this.railGroup.name = "railway";

        let pointMat = new THREE.SpriteMaterial( {map: pointTex} );
        let numPointers = trainRoute.routeData.length;

        this.pointerSprites = [];
        let labelPos = new THREE.Vector3();
        let pos = new THREE.Vector3();
        let label;
        //Need to do for each track
        labelScale.x = sceneConfig.pinLabelScaleX;
        labelScale.y = sceneConfig.pinLabelScaleY;
        let pointerSprite, track;
        for(track=0; track<NUM_TRACKS; ++track) {
            for(i=0; i<numPointers; ++i) {
                pointerSprite = new THREE.Sprite(pointMat);
                this.pointerSprites.push(pointerSprite);
                this.trackGroups[track].add(pointerSprite);
                pointerSprite.scale.set(sceneConfig.pointerScale, sceneConfig.pointerScale, 1);
                pos = this.tubes[track].parameters.path.getPointAt( i/numPointers );
                pointerSprite.position.set(pos.x, pos.y+this.pinHeight, pos.z);
                labelPos.set(pointerSprite.position.x, sceneConfig.labelOffsetY, pointerSprite.position.z);
                label = spriteManager.create(trainRoute.routeData[i].stationName, labelPos, labelScale, 32, 1, true, false);
                this.trackGroups[track].add(label);
            }
        }

        //Set up trains
        let length;

        //Train materials
        this.defaultTrainMat = new THREE.SpriteMaterial( {color: 0x000000, map: trainTex} );
        this.trainMatSelected = new THREE.SpriteMaterial( {color: 0xd9df18, map: trainTex} );
        this.defaultGhostMat = new THREE.SpriteMaterial( {color: 0x000000, map: trainTex, opacity: 0.5});
        this.ghostMatSelected = new THREE.SpriteMaterial( {color: 0xd9df18, map: trainTex, opacity: 0.5});
        this.trainSprites = [];
        this.ghostSprites = [];
        let currentTrain, trainSprite, ghostSprite;
        for(track=0; track<NUM_TRACKS; ++track) {
            length = this.tubes[track].parameters.path.getLength();
            for(i=0; i<NUM_TRAINS_PER_TRACK; ++i) {
                currentTrain = new Train();
                this.trains.push(currentTrain);
                currentTrain.init(length, i);
                currentTrain.setTrack(track);

                trainSprite = new THREE.Sprite(i === 0 && track === 0 ?  this.trainMatSelected : this.defaultTrainMat);
                this.trainSprites.push(trainSprite);
                this.trackGroups[track].add(trainSprite);
                pos = this.tubes[track].parameters.path.getPointAt(0);
                trainSprite.position.set(pos.x, pos.y+this.trainHeight, pos.z);
                trainSprite.scale.set(sceneConfig.trainScaleX, sceneConfig.trainScaleY, 1);

                ghostSprite = new THREE.Sprite(i === 0 && track === 0 ? this.ghostMatSelected : this.defaultGhostMat);
                this.ghostSprites.push(ghostSprite);
                this.trackGroups[track].add(ghostSprite);
                ghostSprite.position.set(pos.x, pos.y+this.trainHeight, pos.z);
                ghostSprite.scale.set(sceneConfig.trainScaleX, sceneConfig.trainScaleY, 1);
            }
        }

        //Set up variables for later use
        this.numTracks = numTracks;
    }

    makeSkyBox() {
        let texturePath = "textures/skybox/";
        let skyTextures = ["skyRight", "skyLeft", "skyTop", "skyBottom", "skyBack", "skyFront"];
        let urls = [];
        for(let i=0, numTexs=skyTextures.length; i<numTexs; ++i) {
            urls.push(texturePath + skyTextures[i] + ".jpg");
        }
        let skyboxCubemap = new THREE.CubeTextureLoader().load( urls );
        skyboxCubemap.format = THREE.RGBFormat;

        let skyboxShader = THREE.ShaderLib['cube'];
        skyboxShader.uniforms['tCube'].value = skyboxCubemap;
        let size = 8000;

        return new THREE.Mesh(
            new THREE.BoxGeometry( size, size, size ),
            new THREE.ShaderMaterial({
                fragmentShader : skyboxShader.fragmentShader, vertexShader : skyboxShader.vertexShader,
                uniforms : skyboxShader.uniforms, depthWrite : false, side : THREE.BackSide
            })
        );
    }

    fitToScreen() {
        //If in portrait mode then move camera
        if(window.innerHeight > window.innerWidth) {
            this.setCamera(null, FAR);
        } else {
            this.setCamera(null, NEAR);
        }
    }

    update() {
        let delta = this.clock.getDelta();

        if(this.running) {
            for(let i=0; i<this.trains.length; ++i) {
                let train = this.trains[i];
                if(train.update(delta)) {
                    //Update visuals
                    let tripTime = train.getTripTime();
                    let track = train.getTrack();
                    this.tempPos = this.tubes[track].parameters.path.getPointAt( train.getCurrentTime() / tripTime);
                    this.tempPos.add(this.posOffset);
                    this.trainSprites[i].position.copy(this.tempPos);

                    this.tempPos = this.tubes[track].parameters.path.getPointAt( train.getDelayTime() / tripTime );
                    this.tempPos.add(this.posOffset);
                    this.ghostSprites[i].position.copy(this.tempPos);

                    //Update info
                    if(this.currentTrain === i) {
                        let minutes = Math.round(train.getCurrentTime() + train.getStartTime());
                        if(minutes < 10) {
                            minutes = "0" + minutes;
                        }
                        $('#minutes').html(minutes);
                        $('#delay').html(train.getTripDelay());
                    }

                    if(train.passedStop()) {
                        if(!train.gotoNextStop()) {
                            //Need to take ghosts into account too
                            //DEBUG
                            //console.log("Train stopped");
                            if(++this.trainsStopped >= (NUM_TRAINS_PER_TRACK * 2 * 2)) {
                                console.log("All trains stopped");
                                this.reset();
                            }
                        }
                    }
                }
            }
        }

        super.update();
    }

    changeTrack(track) {
        if(track === undefined) {
            console.log("No track selected!");
            return;
        }

        //Get track number
        let trackNumber = track.match(/\d/g);
        trackNumber = trackNumber.join("");
        if(isNaN(trackNumber)) {
            console.log("Invalid track number selected!");
            return;
        }

        if(trackNumber != this.trackView) {
            $('#track' + trackNumber).addClass('active');
            $('#track' + this.trackView).removeClass('active');
            $('#mainView').removeClass("active");
            this.setCamera(cameraViews[track]);
            this.trackView = trackNumber;
        }
    }

    resetView() {
        this.setCamera(cameraViews.all);
        this.trackView = -1;
        $('#mainView').addClass("active");
        this.deselectTracks();
    }

    deselectTracks() {
        for(let i=0; i<this.numTracks; ++i) {
            $('#track' + i).removeClass("active");
        }
    }

    selectTrain(train) {
        if(train === undefined) {
            console.log("No train specified!");
            return;
        }
        let trainNumber = train.match(/\d/g);
        trainNumber = trainNumber.join("");
        if(isNaN(trainNumber)) {
            console.log("Invalid train number");
            return;
        }
        $('#trainID').html(trainNumber);
        this.trainSprites[--trainNumber].material = this.trainMatSelected;
        this.trainSprites[this.currentTrain].material = this.defaultTrainMat;
        this.ghostSprites[trainNumber].material = this.ghostMatSelected;
        this.ghostSprites[this.currentTrain].material = this.defaultGhostMat;
        this.currentTrain = trainNumber;
        if(!this.trains[trainNumber].running()) {
            $('#minutes').html("00");
        }
        //Change camera view to reflect change
        let track = Math.floor(trainNumber/this.numTracks);
        this.changeTrack("track" + track);
    }

    startStopAnimation() {
        this.running = !this.running;
        let elem = $('#startStop');
        elem.attr("src", this.running ? "images/pause-button.png" : "images/play-button.png");
    }

    reset() {
        //Reset everything
        //Animations
        this.running = false;
        $('#startStop').attr("src", "images/play-button.png");
        $('#minutes').html("00");
        $('#delay').html(0);
        this.trainsStopped = 0;

        //Output
        //$('#hours').html("00");
        //$('#minutes').html("00");

        //Train positions
        let track, i, trainNumber = 0;
        let pos = new THREE.Vector3();
        //Set up trains
        let length = this.tubes[0].parameters.path.getLength();
        for(track=0; track<NUM_TRACKS; ++track) {
            for (i = 0; i < NUM_TRAINS_PER_TRACK; ++i) {
                pos = this.tubes[track].parameters.path.getPointAt(0);
                this.trainSprites[trainNumber].position.set(pos.x, pos.y+this.trainHeight, pos.z);
                this.ghostSprites[trainNumber].position.set(pos.x, pos.y+this.trainHeight, pos.z);
                this.trains[trainNumber].init(length, i);
                ++trainNumber;
            }
        }
    }

    stopNotifications(elemList) {
        for(let i=0, numElems=elemList.length; i<numElems; ++i) {
            $('#' + elemList[i]).contextmenu(() => {
                return false;
            });
        }
    }
}

$(document).ready(function() {
    //Ensure webgl supported
    if(!Detector.webgl) {
        $('#notSupported').show();
        return;
    }

    if(window.innerWidth < MOBILE_WIDTH) {
        $('#mainModal').modal();
    }

    //Init
    let container = document.getElementById("WebGL-output");
    let app = new RailApp();
    app.init(container);
    app.createScene();

    $('#startStop').on("click", function() {
        app.startStopAnimation();
    });

    $('#reset').on("click", function() {
        app.reset();
    });

    $('[id^="track"]').on("click", function() {
        app.changeTrack(this.id);
    });

    $('#mainView').on("click", function() {
        app.resetView();
    });

    $('#nextView').on("click", function() {
        app.changeView('next');
    });

    $('#previousView').on("click", function() {
        app.changeView('previous');
    });

    $('.dropdown-menu li a').on('click', function () {
        // do something…
        app.selectTrain($(this).text());
    });

    $('#instructions').on("click", () => {
        $('#myModal').modal();
    });

    let elemList = ["simControls", "camControls", "timeDateOutput", "instructions", "copyright"];
    app.stopNotifications(elemList);

    app.run();
});
