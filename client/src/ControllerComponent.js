import React, { useState, useEffect } from "react";
import Select from "react-select";
import Slider from 'react-input-slider';

export default function ControllerComponent(props) {
const [commands, setCommands] = useState([]);
const [checked, setChecked] = useState(props.info.subscribed); 

let newOptions = [];

for( let index=0; index < props.subscribedComponents.length; index++ ){
   if ( props.subscribedComponents[index].type == "Temperature" ){
        let value = props.subscribedComponents[index].symName;
        let label = props.subscribedComponents[index].property;
       newOptions.push({ value:value, label:label});
   }     
};

useEffect(() => {
    setChecked( checked => {
        return props.info.subscribed;
    });

    setCommands((commands) => {
        let commandsState = [];
        if ( props.info.commands != null ) {
        for ( let index = 0; index < props.info.commands.length; index++ ){
           let command = {};
           let commandExists = [];
           commandExists = commands.filter(element => 
               element.name == props.info.commands[index].Name
           )
           if ( props.info.commands[index].type == "dropDown" ) {
               let selectedExists = [];
               if ( commandExists.length == 1 && commandExists[0].value != null ) {
                   selectedExists = newOptions.filter(element => 
                        element.value == commandExists[0].value.value
                   );
               }
               let value = null;
               if(selectedExists.length != 0 ) {
                   value = commandExists[0].value;
               } 
                 else {
                   if (commandExists.length != 0 && commandExists[0].value != null) {
                       let event = {
                          "Command":commandExists[0].name,
                          "Value":{value:"",label:""},
                          "type":"probCommand"};
                       props.onCommandEvent(event);    
                   }             
               } 
               command.name = props.info.commands[index].Name;
               command.value = value;
               command.type = props.info.commands[index].type;
           } else {
               if ( commandExists.length != 0 ) {
                   if ( props.info.subscribed ) {
                       command = commandExists[0];
                   } else {
                       let value = null;
                       if (commandExists[0].type == "slider") {
                           value =  { x:0};
                       } else if (commandExists[0].type == "button") {
                           value = false;
                       }
                       let event = {
                          "Command":commandExists[0].name,
                          "Value":value.x,
                          "type":"probCommand"};
                       props.onCommandEvent(event);  
                       command.name = props.info.commands[index].Name;
                       command.value = value;
                       command.type = props.info.commands[index].type; 
                   }
               } else {
                   let value = null;
                   if (props.info.commands[index].type == "slider") {
                       value = { x:0};
                   } else if (props.info.commands[index].type == "button") {
                       value = false;
                   }
                   command.name = props.info.commands[index].Name;
                   command.value = value;
                   command.type = props.info.commands[index].type;
               }
           }
           commandsState.push( command )
      }
      }
      return commandsState; 
    });
},[props.info,props.info.commands]);

let runSet = (name,value) => {
    setCommands((commands) => {              
        let commandsState = [];
        for ( let index = 0; index < commands.length; index++ ){ 
            if (commands[index].name == name) {
                let command = {};
                command.name = commands[index].name;
                command.value = value;
                command.type = commands[index].type;
                commandsState.push(command);
            } else { 
                commandsState.push(commands[index]);
            }
        }     
        return commandsState;
    });
}

let handleCheckboxChange = (cb) => {
    props.onSubscribe(cb);
    setChecked(!checked);
};

let handleCommand = (name,e) => {
    let event = {
             "Command":name,
             "Value":parseFloat(e.target.value),
             "type":"probCommand"};
    props.onCommandEvent(event);
}

let handleChange = (name,value) => {
    runSet(name, value);
    let event = {
             "Command":name,
             "Value":value,
             "type":"probCommand"};
    props.onCommandEvent(event);
}

let handleSlider = (name,x) => {
     let value = { x: parseFloat(x.toFixed(2)) };
     runSet(name, value);
     let event = {
             "Command":name,
             "Value":x,
             "type":"probCommand"};
     props.onCommandEvent(event);  
}

let handlePIDchange = (name,value) => { 
       runSet(name, !value);
       let event = {
             "Command":name,
             "Value":!value,
             "type":"probCommand"};
       props.onCommandEvent(event);  
};

  return (
   <>
    {(commands && props.info.subscribed)?commands.map( (c) => 
     <>{(c.type=="dropDown")?
     <Select name={c.name}
             options={newOptions}
             onChange={(e) => handleChange(c.name,e)}
             value={c.value}
             isSearchable={false}
              />
     :(c.type=="slider")?
      <Slider
        axis="x"
        xstep={0.01}
        xmin={props.info.metaData.Min}
        xmax={props.info.metaData.Max}
        x={c.value.x}
        onChange={({ x }) => handleSlider(c.name,x)}
      />
      :(c.type=="button")?
      <div>
      <button type="button" 
             name={c.name}
             onClick={() => handlePIDchange(c.name, c.value)} >{c.value?"PID Off":"PID On"}</button>
      </div>
      :
      <div>
        <input type="text" 
             name={c.name}
             onChange={(e) => handleCommand(c.name,e)} />
     </div>}</>):""}
     <div>
    <input type="checkbox" name={props.info.property} id={props.info.property} checked={checked} onChange={handleCheckboxChange}/>
    <label for={props.info.property} >{props.info.property}</label>
    </div>
   </>
  );
}