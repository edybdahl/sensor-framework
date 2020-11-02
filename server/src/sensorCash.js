const serial = require("./serial.js");
const db = require("./db.js");
const fs = require('fs');

let cashe = {};
const listeners = [];
let propertyMap = {};
try {
  propertyMap = JSON.parse(fs.readFileSync('./propertyMap.json'));
  console.log( propertyMap);
} catch(e) {
  console.log( 'no file');
  console.log(e); 
}

serial.subscribe( function( data ) {
	console.log( "subscribe data:" + data);
        try{
            let dataObject = JSON.parse(data);
            key = Object.keys(dataObject)[0];                
            if( key == "ProbeProperties"){   
                 properties  = dataObject[key];         
                 for (index = 0;index < properties.length;index++){
                        properties[index].symName = properties[index].Name;
                        if (propertyMap[properties[index].Name]){
                             properties[index].Name = propertyMap[properties[index].Name];
                        }
                 }
                 if ( cashe[key] == null || cashe[key].length != properties.length ) {
                        listeners.forEach(listener => {
                              listener(key,properties);
                        });
                 }
                 cashe[key]=properties;
                 console.log( properties );
                 if ( properties.length == 0 ) {
                       cashe = {};
                 }
           } else if ( key != "" ){
                 value = dataObject[key];
                 if (propertyMap[key]){
                       key = propertyMap[key];
                 }
                 //write to the database can be asyned
                 db.addData( key, value );
        	 if ( cashe[key] == null || cashe[key] != value ) {
      			listeners.forEach(listener => {
					listener(key,value);
        	        });
	       	 }
		 cashe[key]=value;
//		 console.log( cashe );
	    }
        } catch(e) {};
});

const subscribe = (listener) => {
	listeners.push(listener);
};

const unsubscribe = (removelistener) => {
	listeners = listeners.filter( listener => 
              	listener !== removelistener);
};

const getCasheValue = (key) => {
       return cashe[key]; 
};

module.exports = {
	subscribe, unsubscribe, getCasheValue
};