import React, { useState, useEffect } from "react";
import Select from "react-select";
import Slider from 'react-input-slider';

export default function ControllerComponent(props) {
const [commands, setCommands] = useState([]);
const [checked, setChecked] = useState(props.info.subscribed); 

let newOptions = [];

newOptions.push({ value:"", label:"Nothing Selected"});

for( let index=0; index < props.subscribedComponents.length; index++ ){
   if ( props.subscribedComponents[index].type === "Temperature" ){
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
               element.name === props.info.commands[index].Name
           )
           if ( commandExists.length !== 0 ) {
               command = commandExists[0]; 
           } else {
               let value = props.info.commands[index].value;
               if (props.info.commands[index].type === "slider") {
                   value = { x:value};
               }
               command.name = props.info.commands[index].Name;
               command.value = value;
               command.type = props.info.commands[index].type;
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
            if (commands[index].name === name) {
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
     <div key={c.name} >{(c.type==="dropDown")?
     <Select name={c.name}
             options={newOptions}
             onChange={(e) => handleChange(c.name,e)}
             value={c.value}
             isSearchable={false}
              />
     :(c.type==="slider")?
      <Slider
        axis="x"
        xstep={0.01}
        xmin={props.info.metaData.Min}
        xmax={props.info.metaData.Max}
        x={c.value.x}
        onChange={({ x }) => handleSlider(c.name,x)}
      />
      :(c.type==="button")?
      <div>
      <button type="button" 
             name={c.name}
             onClick={() => handlePIDchange(c.name, c.value)} >{c.value?c.name + " Off":c.name + " On"}</button>
      </div>
      :
      <div>
        <input type="text" 
             name={c.name}
             onChange={(e) => handleCommand(c.name,e)} />
     </div>}</div>):""}
     <div>
    <input type="checkbox" name={props.info.property} id={props.info.property} checked={checked} onChange={handleCheckboxChange}/>
    <label htmlFor={props.info.property} >{props.info.property}</label>
    </div>
   </>
  );
}