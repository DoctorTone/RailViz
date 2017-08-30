/**
 * Created by DrTone on 23/08/2016.
 */
//Holds attributes for each train

class Train {
    constructor() {
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

    init(trackLength, id) {
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
        let delay = this.trainRoute.routeData[this.currentStop+1].delay - this.trainRoute.routeData[this.currentStop].delay + this.interStopTime;
        this.delayTime = this.trainRoute.routeData[this.currentStop].delay;
        this.delayTimeInc = delay/this.interStopTime;
    }
    
    getTrainIcon() {
        return this.engineSprite;
    }
    
    getGhostIcon() {
        return this.ghostSprite;
    }

    setEnginePosition(pos) {
        this.engineSprite.position.set(pos.x, pos.y, pos.z);
    }
    
    setGhostPosition(pos) {
        this.ghostSprite.position.set(pos.x, pos.y, pos.z);
    }
    
    getDelayTime() {
        return this.delayTime;
    }

    getStartTime() {
        return this.startTime;
    }

    getCurrentTime() {
        return this.currentTime;
    }

    passedStop() {
        return this.currentTime >= this.timeToNextStop;
    }

    gotoNextStop() {
        this.currentTime = this.timeToNextStop;
        ++this.currentStop;
        
        if(this.currentStop >= (this.numStops-1)) {
            this.animating = false;
        } else {
            this.timeToNextStop += this.interStopTime;
            this.realTimeToNextStop = this.trainRoute.routeData[this.currentStop+1].time - this.trainRoute.routeData[this.currentStop].time;
            this.realTimeInc = this.realTimeToNextStop / this.interStopTime;
            let delay = this.trainRoute.routeData[this.currentStop+1].delay - this.trainRoute.routeData[this.currentStop].delay + this.interStopTime;
            this.delayTimeInc = delay/this.interStopTime;
        }

        return this.animating;
    }

    update(delta) {
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
    }
    
    getTripTime() {
        return this.tripTime;
    }

    getTripDelay() {
        return this.trainRoute.routeData[this.currentStop].delay;
    }

    getCurrentStop() {
        return this.currentStop;
    }

    running() {
        return this.animating;
    }

    reset() {
        this.animating = false;
        this.currentTime = 0;
        this.currentStop = 0;
        this.realTime = 0;
        this.timeToNextStop = this.interStopTime;
    }
}
