import React, { useState, useEffect } from "react";

export default function ControllerComponent(props) {
const [checked, setChecked] = useState(props.info.subscribed); 

useEffect(() => {
    setChecked( checked => {
        return props.info.subscribed;
    });
},[props.info.subscribed]);

let handleCheckboxChange = (cb) => {
    props.onSubscribe(cb);
    setChecked(!checked);
  //  let event = {"Command":"hi","Value":"there","type":"probCommand"};
  //  props.onCommandEvent(event);
};

let handleCommand = (name) => {
    let event = {
             "Command":name,
             "Value":"there",
             "type":"probCommand"};
    props.onCommandEvent(event);
}

  return (
   <>
    {(props.info.commands && props.info.subscribed)?props.info.commands.map( (c) => 
     <div>
        <button type="button" 
             name={c.Name}
             onClick={() => handleCommand(c.Name)} >
            {c.Name}
        </button>
     </div>):""}
     <div>
    <input type="checkbox" name={props.info.property} id={props.info.property} checked={checked} onChange={handleCheckboxChange}/>
    <label for={props.info.property} >{props.info.property}</label>
    </div>
   </>
  );
}