import React, { useState, useEffect } from "react";
import Select from "react-select";

export default function ControllerComponent(props) {
const [checked, setChecked] = useState(props.info.subscribed); 
const [selected, setSelected] = useState(null); 

let options = [];

useEffect(() => {
    setChecked( checked => {
        return props.info.subscribed;
    });

for( let index=0; index < props.subscribedComponents.length; index++ ){
if ( props.subscribedComponents[index].type == "Temperature" ){
      let value = props.subscribedComponents[index].property;
      let label = props.subscribedComponents[index].property;
      options.push( { value:value, label:label});
}
};

});

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

let handleChange = (name,selected) => {
    setSelected(selected);
    let event = {
             "Command":name,
             "Value":selected,
             "type":"probCommand"};
    props.onCommandEvent(event);
}

  return (
   <>
    {(props.info.commands && props.info.subscribed)?props.info.commands.map( (c) => 
     <>{(c.type=="dropDown")?
     <Select options={options}
             onChange={(e) => handleChange(c.Name,e)}
             value={selected}
              />
     :<div>
        <input type="text" 
             name={c.Name}
             onChange={(e) => handleCommand(c.Name,e)} />
     </div>}</>):""}
     <div>
    <input type="checkbox" name={props.info.property} id={props.info.property} checked={checked} onChange={handleCheckboxChange}/>
    <label for={props.info.property} >{props.info.property}</label>
    </div>
   </>
  );
}