const sensorCashe = require("./sensorCash.js");

const listeners = {};

sensorCashe.subscribe( function( type, value ) {
	console.log( "type: " + type + " value: " + value );
	if ( listeners[type] != null ) {
		listeners[type].forEach( listener => {
			listener( value );
		});
	}
});

const subscribe = (listener, type) => {
        if ( listeners[type] == null ) {
		listeners[type] = []; 
	}
	listeners[type].push(listener);
};

const unsubscribe = (removelistener,type) => {
	if ( listeners[type] != null ) {
		listeners[type]= listeners[type].filter( listener => 
       		       	listener !== removelistener);
	}
};

module.exports = {
	subscribe, unsubscribe
};