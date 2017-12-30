import React, {useState} from "react";
import GaugeComponent from "./GaugeComponent";
import DigitalComponent from "./DigitalComponent";

export default function ValueComponent(props) {
  const [ADstate, setADState] = useState(true);

  let handleADchange = () => { 
       setADState(!ADstate);
  };

  const units = {
                   "Temperature": String.fromCharCode(8451),
                   "pH":" pH"
                };
  const types= {
                   "Temperature": "arc",
                   "pH":"linear"
                };
  return (
     <>
     {props.info.subscribed?
     <div>
     <button type="button" 
             name="switchDigital" 
             onClick={handleADchange} >{ADstate?"A":"D"}</button>
     </div>:""}
     {(props.info.subscribed && !ADstate)?
     <div>
        <GaugeComponent value={props.info.value} 
                        min={props.info.metaData.Min} 
                        max={props.info.metaData.Max} 
                        unit={units[props.info.type]}
                        type={types[props.info.type]} />
     </div>:""}
     {(props.info.subscribed && ADstate)?
     <div>
         <DigitalComponent value={props.info.value} unit={units[props.info.type]} />
     </div>:""}
     </>
  );
}