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
                   "pH":" pH",
                   "TempController":"A"+String.fromCharCode(9190)
                };
  const types= {
                   "Temperature": "arc",
                   "pH":"linear",
                   "TempController":"arc"
                };
  const sectionSizes= {
                   "Temperature": 10,
                   "pH":10,
                   "TempController":1                
                }
  const angles= {
                   "Temperature": { "startAngle":-Math.PI*(3/4), "endAngle":Math.PI*(3/4) },
                   "pH":{ "startAngle":-Math.PI*(3/4), "endAngle":Math.PI*(3/4) },
                   "TempController":{ "startAngle":-Math.PI*(1/4), "endAngle":Math.PI*(1/4) }               
                }
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
                        type={types[props.info.type]} 
                        sectionSize={sectionSizes[props.info.type]}
                        angle={angles[props.info.type]}
                        tempSet={props.info.metaData.PIDTemp} />
     </div>:""}
     {(props.info.subscribed && ADstate)?
     <div>
         <DigitalComponent value={props.info.value} unit={units[props.info.type]} />
     </div>:""}
     </>
  );
}