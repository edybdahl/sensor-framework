const serial = require("./serial.js");
const db = require("./db.js");

const cashe = {};
const listeners = [];

serial.subscribe( function( data ) {
//	console.log( "subscribe data:" + data);
        JSON.parse(data, ( key, value ) => {               
		if( key != "" ){
			db.addData( key, value );
			if ( cashe[key] == null || cashe[key] != value ) {
      				listeners.forEach(listener => {
					listener(key,value);
        			});
			}
			cashe[key]=value;
//			console.log( cashe );
		}
	});
});

const subscribe = (listener) => {
	listeners.push(listener);
};

const unsubscribe = (removelistener) => {
	listeners = listeners.filter( listener => 
              	listener !== removelistener);
};

module.exports = {
	subscribe, unsubscribe
};