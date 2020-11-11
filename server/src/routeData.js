const sensorCashe = require("./sensorCash.js");
const serial = require("./serial.js");

const dataListeners = {};
const viewListeners = {};

sensorCashe.subscribe( function( type, value ) {
//	console.log( "type: " + type + " value: " + value );
	if ( dataListeners[type] != null ) {
                // This can be async. But if the socket stuff is sync then it does not matter.
                // however, there may be other types of liseners in the future.
	        dataListeners[type].forEach( listener => {
			listener( value, type );
		});
	}
})

const callLisener = ( event ) => {
   console.log( "router recieved" );
   console.log( event );
   //should this be async.
   serial.callLisener(sensorCashe.conversion( event ));
};

const subscribeData = (listener, type) => {
        if ( dataListeners[type] == null ) {
             dataListeners[type] = []; 
	}
	dataListeners[type].push(listener);
        if (sensorCashe.getCasheValue(type)){
                listener(sensorCashe.getCasheValue(type),type);
        }
};

const unsubscribeData = (removelistener,type) => {
	if ( dataListeners[type] != null ) {
		dataListeners[type]= dataListeners[type].filter( listener => 
       		       	listener !== removelistener);
	}
};

const isSubscribedData = (sublistener) => {
     let subscribed = [];
     let iterator = Object.keys(dataListeners)
     for( key in iterator ){
          if ( dataListeners[iterator[key]].filter( listener => listener === sublistener )[0] ) {
               subscribed.push(iterator[key]);
          }
     }
     console.log("subscribed " + subscribed);
     return subscribed;
}

module.exports = {
	subscribeData, 
        unsubscribeData,
        isSubscribedData,
        callLisener
};