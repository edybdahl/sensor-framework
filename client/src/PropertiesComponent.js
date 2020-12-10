import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
import GridComponent from "./GridComponent";
console.log(process.env.REACT_APP_EXTURL);
const ENDPOINT = process.env.REACT_APP_EXTURL;
console.log(process.env.REACT_APP_URL);
const LOCALENDPOINT = process.env.REACT_APP_URL;
var send = null;
var sendCommand;
var subscribed = [];
var charted = []; 

export default function PropertiesComponent() {
  const [resProp, setResProp] = useState([]);

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);
    const socketlocal = socketIOClient(LOCALENDPOINT,{
       autoConnect: false 
    });

    socket.on("error", (error) => {
       console.log("error");
       console.log(error); 
    });

    socket.on("connect", () => {
       console.log("connect");
       console.log(socket.id); 
    });

    socket.on("connect_error", (error) => {
       console.log("connection error");
       console.log(error);
       socket.close(); 
       socketlocal.open();
     //  socket = socketlocal;
       console.log("hi");
    });

    socket.on("Properties", data => {
        setPropertyState(data);
    });

    socket.on("Values", data => {
        setValuesState(data);
    });

    socket.on("Subscribe", data => {
        socket.emit("Subscribed",{"subscribed":subscribed});
    });

    socket.on("Chart", data => {
        socket.emit("Chart",{"charted": charted});
    });

    socketlocal.on("Properties", data => {
        setPropertyState(data);
    });

    socketlocal.on("Values", data => {
        setValuesState(data);
    });

    socketlocal.on("Subscribe", data => {
        socketlocal.emit("Subscribed",{"subscribed":subscribed});
    });

    socketlocal.on("Chart", data => {
        socketlocal.emit("Chart",{"charted": charted});
    });

    send = (mes) => {
         if (socket.connected) { 
            socket.emit("Property",mes);
         } else if (socketlocal.connected) {
            socketlocal.emit("Property",mes);
         } 
    };

    sendCommand = (event) => {
         if (socket.connected) { 
            socket.emit("Command",event);
         } else if (socketlocal.connected) {
            socketlocal.emit("Command",event);
         } 
    };

    return () => { socket.disconnect(); socketlocal.disconnect(); };
  }, []);

  let setPropertyState = (data) => {
        //   data.value.sort();
      setResProp(resProp => {
                 let state = [];
                 for(let index=0;index<data.value.length;index++){
                    let value = 0;
                    let values = [];
                    if ( resProp.filter( element => element.property === data.value[index].Name )[0] ){
                        value = resProp.filter( element => element.property === data.value[index].Name )[0].value 
                        values = resProp.filter( element => element.property === data.value[index].Name )[0].values 
                    };
                    let property = { "property":data.value[index].Name,
                                     "symName":data.value[index].symName,
                                     "value":value, 
                                     "values":values,
                                     "subscribed":subscribed.includes(data.value[index].Name),
                                     "charted":charted.includes(data.value[index].Name),
                                     "type":data.value[index].Type,
                                     "metaData":data.value[index].MetaData,
                                     "commands":data.value[index].Commands};
                    state.push(property);
                 }
                 return state.sort((a, b) => {if ( b.subscribed - a.subscribed === 0 ){
                                                  let nameA = a.property.toUpperCase();
                                                  let nameB = b.property.toUpperCase();
                                                  if ( nameA > nameB ) 
                                                       return 1;
                                                  else if ( nameA < nameB ) 
                                                       return -1;
                                                  else 
                                                       return 0; 
                                             }
                                             else 
                                                  return b.subscribed - a.subscribed });
       });
  }

  let setValuesState = (data) => {
    setResProp(resProp => {
                 let state = [];
                 for(let index=0;index<resProp.length;index++){
                     if (resProp[index].property === data.type) {
                         let value = data.value; 
                         let values = data.value; 
                         if ( Array.isArray(data.value) ){
                             values.forEach( element => element[0] = element[0]*1000 );
                             value = resProp[index].value;
                         } else {
                             values = resProp[index].values;
                             if (values.length > 0) {
                                 values.push([Date.now(),value]);
                             } 
                         }                      
                         let property = { "property":data.type,
                                          "symName":resProp[index].symName,
                                          "value":value,
                                          "values":values,
                                          "subscribed":subscribed.includes(data.type),
                                          "charted":charted.includes(data.type),
                                          "type":resProp[index].type,
                                          "metaData":resProp[index].metaData,
                                          "commands":resProp[index].commands};
                         state.push(property);
                     } else {
                         state.push(resProp[index]);
                     }
                 }
                    
                return state.sort((a, b) => {if ( b.subscribed - a.subscribed === 0 ){
                                                  let nameA = a.property.toUpperCase();
                                                  let nameB = b.property.toUpperCase();
                                                  if ( nameA > nameB ) 
                                                       return 1;
                                                  else if ( nameA < nameB ) 
                                                       return -1;
                                                  else 
                                                       return 0; 
                                                  }
                                             else 
                                                  return b.subscribed - a.subscribed});
        });
  }

  let handeCommandEvent = (event) => {
      sendCommand(event);
  }

  let handleCheckboxChange = (cb) => {
      let checked = cb.target.checked;
      let name = cb.target.name;
      send({
          "type":"subscribe",
          "checked":checked,
          "property":name
      });
      if ( checked ) {
          subscribed.push( name );
      } else {
          if ( subscribed.includes(name)) {
              subscribed = subscribed.filter( sub => sub !== name );
          }
      }   
  };

  let handleSHButton = (cb) => {
      let checked = cb.charted;
      let name = cb.name;
      send({
          "type":"charted",
          "checked":checked,
          "property":name
      });
      if ( checked ) {
          charted.push( name );
      } else {
          if ( charted.includes(name)) {
              charted = charted.filter( sub => sub !== name );
          }
      } 
  };

  return (
     <GridComponent info={resProp} onCommandEvent={handeCommandEvent} onCharted={handleSHButton} onSubscribe={handleCheckboxChange} />
  );
}