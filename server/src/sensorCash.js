const serial = require("./serial.js");
const db = require("./db.js");
const conversionHook = require("./conversionHook"); 
const fs = require('fs');

let cashe = {};
const listeners = [];
let propertyMap = {};
let tuningParameters = [];
try {
  propertyMap = JSON.parse(fs.readFileSync('./propertyMap.json'));
 // console.log( propertyMap);
  tuningParameters = JSON.parse(fs.readFileSync('./tuningParameters.json'));
 // console.log( tuningParameters);
  for (let index=0;index<tuningParameters.length;index++) {
    let command = tuningParameters[index];
    serial.callLisener(command);
  }
} catch(e) {
  console.log( 'no file');
  console.log(e); 
}
conversionHook.init();
conversionHook.conFunc("HeatController",150);
conversionHook.invConFunc("Heat",1.25);
nextTime = Date.now();

serial.subscribe( function( data ) {
	//console.log( "subscribe data:" + data);
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
                        if (properties[index].Commands) {
                             for (jndex = 0; jndex < properties[index].Commands.length; jndex++) {
                                  properties[index].Commands[jndex].value = conversionHook.conFunc(     
                                       properties[index].Commands[jndex].Name,
                                       properties[index].Commands[jndex].value);                            
                             }
                        }
                        if (properties[index].MetaData){
                            if ( cashe[ properties[index].Name + "TimeLimit" ] ) {
                                 properties[index].MetaData["timeLimit"] = cashe[ properties[index].Name + "TimeLimit" ];  
                            } else {
                                 db.getTimeLimit(properties[index].Name,limitCallback);
                                 db.getTypeData(properties[index].Name,hystoricDataCallBack);
                            }
                        }
                 }
                 if ( cashe[key] == null || cashe[key] != properties ) {
                        listeners.forEach(listener => {
                              listener(key,properties);
                        });
                 }
                 cashe[key]=properties;
             //    console.log( properties );
                 if ( properties.length == 0 ) {
                       cashe = {};
                 }
           } else if ( key == "ProbePropertiesUpdate" ){
                 let updateProperty = dataObject[key];
                 updateProperty[0].symName = updateProperty[0].Name;
                 if (propertyMap[updateProperty[0].Name]){
                      updateProperty[0].Name = propertyMap[updateProperty[0].Name];
                 }
             //    console.log(updateProperty[0]);
                 let probeProperties = cashe["ProbeProperties"];
                 let newProbeProperties =  probeProperties.filter( property => property.Name !== updateProperty[0].Name );
                 newProbeProperties.push(updateProperty[0]);
                 cashe["ProbeProperties"] = newProbeProperties;
            //     console.log(newProbeProperties);
                 listeners.forEach(listener => {
                      listener("ProbeProperties",newProbeProperties);
                 });
           } else if ( key != "" ){
          //       console.log("there");
                 value = conversionHook.conFunc(key,dataObject[key]);
                 if (propertyMap[key]){
                       key = propertyMap[key];
                 } 
                 //write to the database can be asyned
        	 if ( cashe[key] == null || cashe[key] != value || Date.now() >  cashe[key + "nextTime"] ) {
      			listeners.forEach(listener => {
					listener(key,value);
        	        });
                      db.addData( key, value );
                      if (!cashe[key + "data"]) {
                          cashe[key + "data"] = [];
                      }
                      cashe[key + "data"].push([parseInt(Date.now()/1000,10),value]);
                      cashe[key + "nextTime"] = Date.now() + 1000*30;
	       	 }            
		 cashe[key]=value;
	    }
        } catch(e) {console.log(e);};
});
 
const limitCallback = (type,value) => {
  //   console.log( 'hi there: ' + type + " " + value);
     cashe[ type + "TimeLimit" ] = value;           
};

const hystoricDataCallBack = (type,value) => {
     cashe[ type + "historic"] = value;
}

const callListener = (event, listener) => {
  // console.log( "sensorCash recieved" );
  // console.log( event );
   if ( event.type == "resetCommand" ) {
      tuningParameters = JSON.parse(fs.readFileSync('./tuningParameters.json'));
    //  console.log( tuningParameters);
      for (let index=0;index<tuningParameters.length;index++) {
          let command = tuningParameters[index];
          serial.callLisener(command);
      }
   } else if ( event.type == "dbCommand" ) {
       if (event.Command == "getData") {
         if ( cashe[event.Value + "data"] && cashe[event.Value + "historic"] ) {
           let values = cashe[event.Value + "historic"].concat(cashe[event.Value + "data"]);
           listener(values, event.Value);
         }
       }
   } 
}

const conversion = (event) => {
      event.Value = conversionHook.invConFunc(event.Command,event.Value);   
      return event; 
};

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
	subscribe, unsubscribe, getCasheValue, conversion, callListener
};