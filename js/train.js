/**
 * Created by DrTone on 23/08/2016.
 */
//Holds attributes for each train

function Train() {
    this.enginePosition = new THREE.Vector3();
    this.ghostPosition = new THREE.Vector3();
    this.interStopDistance = 0;
    this.movementPerSecond = 0;
    this.interStopTime = 0;
    this.currentTime = 0;
    this.currentStop = 0;
    this.realTime = 0;
    this.timeToNextStop = 0;
    this.realTimeToNextStop = 0;
    this.realTimeInc = 0;
    this.delayTime = 0;
    this.delayTimeInc = 0;
    this.animating = false;
    this.engineSprite = undefined;
    this.ghostSprite = undefined;
    this.tripTime = 0;
    this.startTime = 0;
    this.trainRoute = trainRoute;
}

Train.prototype = {
    init: function(trackLength, id) {
        this.currentStop = 0;
        this.currentTime = 0;
        this.animating = false;

        this.numStops = this.trainRoute.routeData.length;
        this.startTime = id * 5;
        this.tripTime = this.trainRoute.routeData[this.numStops-1].time - this.trainRoute.routeData[0].time;
        
        this.interStopDistance = trackLength / this.numStops;
        this.movementPerSecond = trackLength / this.tripTime;
        this.interStopTime = this.interStopDistance / this.movementPerSecond;

        this.timeToNextStop = this.interStopTime;
        this.realTimeToNextStop = this.trainRoute.routeData[this.currentStop+1].time;
        this.realTimeInc = this.realTimeToNextStop / this.interStopTime;


        //Ghost engine
        var delay = this.trainRoute.routeData[this.currentStop+1].delay - this.trainRoute.routeData[this.currentStop].delay + this.interStopTime;
        this.delayTime = this.trainRoute.routeData[this.currentStop].delay;
        this.delayTimeInc = delay/this.interStopTime;
    },
    
    getTrainIcon: function() {
        return this.engineSprite;
    },
    
    getGhostIcon: function() {
        return this.ghostSprite;
    },

    setEnginePosition: function(pos) {
        this.engineSprite.position.set(pos.x, pos.y, pos.z);
    },
    
    setGhostPosition: function(pos) {
        this.ghostSprite.position.set(pos.x, pos.y, pos.z);
    },
    
    getDelayTime: function () {
        return this.delayTime;
    },

    getStartTime: function() {
        return this.startTime;
    },

    getCurrentTime: function() {
        return this.currentTime;
    },

    passedStop: function() {
        return this.currentTime >= this.timeToNextStop;
    },

    gotoNextStop: function() {
        this.currentTime = this.timeToNextStop;
        ++this.currentStop;
        
        if(this.currentStop >= (this.numStops-1)) {
            this.animating = false;
        } else {
            this.timeToNextStop += this.interStopTime;
            this.realTimeToNextStop = this.trainRoute.routeData[this.currentStop+1].time - this.trainRoute.routeData[this.currentStop].time;
            this.realTimeInc = this.realTimeToNextStop / this.interStopTime;
            var delay = this.trainRoute.routeData[this.currentStop+1].delay - this.trainRoute.routeData[this.currentStop].delay + this.interStopTime;
            this.delayTimeInc = delay/this.interStopTime;
        }

        return this.animating;
    },

    update: function(delta) {
        this.currentTime += delta;
        if(this.currentTime >= this.startTime && this.currentStop === 0) {
            //Get time from zero
            this.currentTime -= this.startTime;
            this.animating = true;
        }

        if(!this.animating) return false;


        this.realTime += (delta * this.realTimeInc);
        this.delayTime += (delta * this.delayTimeInc);

        return true;
    },
    
    getTripTime: function() {
        return this.tripTime;
    },

    getTripDelay: function() {
        return this.trainRoute.routeData[this.currentStop].delay;
    },

    getCurrentStop: function() {
        return this.currentStop;
    },

    running: function() {
        return this.animating;
    },

    reset: function() {
        this.animating = false;
        this.currentTime = 0;
        this.currentStop = 0;
        this.realTime = 0;
        this.timeToNextStop = this.interStopTime;
    }
};
