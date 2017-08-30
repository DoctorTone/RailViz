/**
 * Created by DrTone on 22/02/2016.
 */

let ROT_INC = Math.PI/32;
let NUM_TRAINS_PER_TRACK = 4;
let NUM_TRACKS = 4;

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

    update() {
        let delta = this.clock.getDelta();

        if(this.running) {
            for(let i=0; i<this.trains.length; ++i) {
                let train = this.trains[i];
                if(train.update(delta)) {
                    //Update visuals
                    let tripTime = train.getTripTime();
                    this.tempPos = this.tubes[0].parameters.path.getPointAt( train.getCurrentTime() / tripTime);
                    this.tempPos.add(this.posOffset);
                    this.trainSprites[i].position.set(this.tempPos.x, this.tempPos.y, this.tempPos.z);

                    this.tempPos = this.tubes[0].parameters.path.getPointAt( train.getDelayTime() / tripTime );
                    this.tempPos.add(this.posOffset);
                    this.ghostSprites[i].position.set(this.tempPos.x, this.tempPos.y, this.tempPos.z);

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
                            if(++this.trainsStopped >= (NUM_TRAINS_PER_TRACK * 2)) {
                                //console.log("All trains stopped");
                                this.reset();
                            }
                        }
                    }
                }
            }
        }

        super.update();
    }

    createScene() {
        super.createScene();

        //Geometry parameters
        let sceneConfig = {
            groundWidth: 5000,
            groundDepth: 3000,
            groundSegments: 8,
            groundColour: 0x1d701d,
            labelScaleX: 92.5,
            labelScaleY: 57.5,
            pointerScale: 50,
            trainScaleX: 15,
            trainScaleY: 15,
            labelOffsetY: 67.5
        };

        let textureLoader = new THREE.TextureLoader();
        let pointTex = textureLoader.load("images/pin.png");
        let trainTex = textureLoader.load("images/engineWhite.png");

        //Ground plane
        let i;
        let planeGeom = new THREE.PlaneBufferGeometry(sceneConfig.groundWidth, sceneConfig.groundDepth,
            sceneConfig.groundSegments, sceneConfig.groundSegments);
        let planeMat = new THREE.MeshLambertMaterial( {color: sceneConfig.groundColour});
        let plane = new THREE.Mesh(planeGeom, planeMat);
        plane.rotation.x = -Math.PI/2;
        this.addToScene(plane);

        //Track
        let width = 200, depth = 275;
        let trackShapes = [];
        trackShapes.push(new THREE.CatmullRomCurve3([
            new THREE.Vector3(width*0.2, 0, depth*1.2),
            new THREE.Vector3(width*0.2, 0, depth*0.2),
            new THREE.Vector3(width*1.5, 0, depth*0.2),
            new THREE.Vector3(width*1.5, 0, -depth*0.2),
            new THREE.Vector3(-width*1.5, 0, -depth*0.2),
            new THREE.Vector3(-width*1.5, 0, depth*0.2),
            new THREE.Vector3(-width*0.2, 0, depth*0.2),
            new THREE.Vector3(-width*0.2, 0, depth*1.2)
        ]));
        trackShapes.push(new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, depth/2),
            new THREE.Vector3(width, 0, depth),
            new THREE.Vector3(width, 0, -depth/10),
            new THREE.Vector3(0, 0, -depth/2),
            new THREE.Vector3(-width, 0, -depth/10),
            new THREE.Vector3(-width, 0, depth/2),
            new THREE.Vector3(-width/1.5, 0, depth*1.3)
        ]));
        trackShapes.push(new THREE.CatmullRomCurve3([
            new THREE.Vector3(width, 0, depth),
            new THREE.Vector3(width, 0, -depth),
            new THREE.Vector3(-width*1.75, 0, -depth),
            new THREE.Vector3(-width*1.75, 0, 0),
            new THREE.Vector3(width*0.3, 0, 0),
            new THREE.Vector3(width*0.3, 0, depth)
        ]));
        trackShapes.push(new THREE.CatmullRomCurve3([
            new THREE.Vector3(width*0.2, 0, depth*1.1),
            new THREE.Vector3(width*0.2, 0, depth*0.1),
            new THREE.Vector3(width*1.5, 0, -depth*0.9),
            new THREE.Vector3(width, 0, -depth*1.1),
            new THREE.Vector3(0, 0, -depth*0.15),
            new THREE.Vector3(-width, 0, -depth*1.1),
            new THREE.Vector3(-width*1.5, 0, -depth*0.9),
            new THREE.Vector3(-width*0.2, 0, depth*0.1),
            new THREE.Vector3(-width*0.2, 0, depth*1.1)
        ]));

        for(let i=0, numTracks=trackShapes.length; i<numTracks; ++i) {
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
        for(i=0; i<NUM_TRACKS; ++i) {
            this.tubes.push(new THREE.TubeGeometry(trackShapes[i], segments, 2, radiusSegments, closed));
            this.tubeMeshes.push(new THREE.Mesh(this.tubes[i], tubeMat));
            this.trackGroups.push(new THREE.Object3D());
            this.trackGroups[i].add(this.tubeMeshes[i]);
            this.trackGroups[i].position.copy(trackPositions[i]);
            this.addToScene(this.trackGroups[i]);
        }
        this.trackGroups[1].rotation.y = Math.PI/2;

        this.pinHeight = 30;

        //this.railGroup = new THREE.Object3D();
        //this.railGroup.name = "railway";

        let pointMat = new THREE.SpriteMaterial( {map: pointTex} );
        let numPointers = trainRoute.routeData.length;

        this.pointerSprites = [];
        let labelPos = new THREE.Vector3(), labelScale = new THREE.Vector3(sceneConfig.labelScaleX, sceneConfig.labelScaleY, 1);
        let pos = new THREE.Vector3();
        let label;
        //Need to do for each track
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
        let length = this.tubes[0].parameters.path.getLength();

        //Train materials
        this.defaultTrainMat = new THREE.SpriteMaterial( {color: 0x000000, map: trainTex} );
        this.trainMatSelected = new THREE.SpriteMaterial( {color: 0xd9df18, map: trainTex} );
        this.defaultGhostMat = new THREE.SpriteMaterial( {color: 0x000000, map: trainTex, opacity: 0.5});
        this.ghostMatSelected = new THREE.SpriteMaterial( {color: 0xd9df18, map: trainTex, opacity: 0.5});
        this.trainSprites = [];
        this.ghostSprites = [];
        let currentTrain, trainSprite, ghostSprite;
        for(track=0; track<NUM_TRACKS; ++track) {
            for(i=0; i<NUM_TRAINS_PER_TRACK; ++i) {
                currentTrain = new Train();
                this.trains.push(currentTrain);
                currentTrain.init(length, i);

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
            this.setCamera(cameraViews[track]);
            this.trackView = trackNumber;
        }
    }

    resetView() {
        this.setCamera(cameraViews.all);
        this.trackView = -1;
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
    }

    startStopAnimation() {
        this.running = !this.running;
        $('#startStop').html(this.running ? "Stop" : "Start");
    }

    reset() {
        //Reset everything

        //Animations
        this.running = false;
        $('#startStop').html("Start");
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

    createGUI() {
        this.guiControls = new function () {
            this.ScaleX = 1.0;
            this.ScaleY = 10.0;
            this.ScaleZ = 1.0;
            this.LightX = 0.0;
            this.LightY = 200;
            this.LightZ = 0;
        };
    }
}

$(document).ready(function() {
    //Init
    let container = document.getElementById("WebGL-output");
    let app = new RailApp();
    app.init(container);
    app.createScene();
    app.createGUI();

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

    app.run();
});
