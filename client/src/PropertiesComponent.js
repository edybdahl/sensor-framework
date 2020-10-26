import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
import PropertyComponent from "./PropertyComponent";
import GridComponent from "./GridComponent"; 

const ENDPOINT = process.env.REACT_APP_URL || "http://192.168.4.37:4001";
var send = null;
var sendCommand;
var subscribed = [];

export default function PropertiesComponent() {
  const [resProp, setResProp] = useState([]);
  const [resSub, setResSub] = useState([]); 
 

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);
    socket.on("Properties", data => {
   //   data.value.sort();
      setResProp(resProp => {
                 let state = [];
                 for(let index=0;index<data.value.length;index++){
                    let value = 0;
                    if ( resProp.filter( element => element.property == data.value[index] )[0] ){
                        value = resProp.filter( element => element.property == data.value[index] )[0].value 
                    };
                    let property = { "property":data.value[index].Name,
                                     "value":value, 
                                     "subscribed":subscribed.includes(data.value[index].Name),
                                     "type":data.value[index].Type,
                                     "metaData":data.value[index].MetaData,
                                     "commands":data.value[index].Commands};
                    state.push(property);
                 }
                 return state.sort((a, b) => {if ( b.subscribed - a.subscribed == 0 ){
                                                  let nameA = a.property.toUpperCase();
                                                  let nameB = b.property.toUpperCase();
                                                  if ( nameA > nameB ) 
                                                       return 1;
                                                  else if ( nameA < nameB ) 
                                                       return -1;
                                                  else 
                                                       return 0; 
                                                  return a.property - b.property }
                                             else 
                                                  return b.subscribed - a.subscribed });
       });
    });

    socket.on("Values", data => {
      setResProp(resProp => {
                 let state = [];
                 for(let index=0;index<resProp.length;index++){
                     if (resProp[index].property == data.type) {
                         let property = { "property":data.type,
                                          "value":data.value,
                                          "subscribed":subscribed.includes(data.type),
                                          "type":resProp[index].type,
                                          "metaData":resProp[index].metaData,
                                          "commands":resProp[index].commands};
                         state.push(property);
                     } else {
                         state.push(resProp[index]);
                     }
                 }
                    
                return state.sort((a, b) => {if ( b.subscribed - a.subscribed == 0 ){
                                                  let nameA = a.property.toUpperCase();
                                                  let nameB = b.property.toUpperCase();
                                                  if ( nameA > nameB ) 
                                                       return 1;
                                                  else if ( nameA < nameB ) 
                                                       return -1;
                                                  else 
                                                       return 0; 
                                                  return a.property - b.property }
                                             else 
                                                  return b.subscribed - a.subscribed});
        });
    });

    socket.on("Subscribe", data => {
        socket.emit("Subscribed",{"subscribed":subscribed});
    });

    send = (mes) => {socket.emit("Property",mes)};

    sendCommand = (event) => {socket.emit("Command",event)}

    return () => socket.disconnect();
  }, []);

  let handeCommandEvent = (event) => {
      sendCommand(event);
  }

  let handleCheckboxChange = (cb) => {
      let checked = cb.target.checked;
      let name = cb.target.name;
      send({
          "checked":checked,
          "property":name
      });
      if ( checked ) {
          subscribed.push( name );
      } else {
          if ( subscribed.includes(name)) {
              subscribed = subscribed.filter( sub => sub != name );
          }
      }   
  };

  return (
     <GridComponent info={resProp} onCommandEvent={handeCommandEvent} onSubscribe={handleCheckboxChange} />
  );
}