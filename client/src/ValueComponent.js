import React, {useState} from "react";
import GaugeComponent from "./GaugeComponent";
import DigitalComponent from "./DigitalComponent";

export default function ValueComponent(props) {
  const [ADstate, setADState] = useState(true);
  const [SHstate, setSHState] = useState(false);

  let handleADchange = () => {
       setADState(!ADstate);
  };

  let handleSHchange = () => { 
       props.onCharted({"name":props.info.property,
                        "charted":!SHstate});
       setSHState(!SHstate);
  };

  const units = {
                   "Temperature": String.fromCharCode(8451),
                   "Thermalcouple": String.fromCharCode(8451),
                   "pH":" pH",
                   "TempController":"A"+String.fromCharCode(9190),
                   "Amps":"A"+String.fromCharCode(9170),
                   "Volts":"V"+String.fromCharCode(9170),
                   "Watts":"W"
                };
  const types= {
                   "Temperature": "arc",
                   "Thermalcouple": "arc",
                   "pH":"linear",
                   "TempController":"arc",
                   "Amps":"arc",
                   "Volts":"arc",
                   "Watts":"arc"
                };
  const sectionSizes= {     
                   "Temperature": 10,
                   "Thermalcouple": 100,
                   "pH":1,
                   "TempController":1, 
                   "Amps":1,
                   "Volts":1,
                   "Watts":10
                }
  const angles= {
                   "Temperature": { "startAngle":-Math.PI*(3/4), "endAngle":Math.PI*(3/4) },
                   "Thermalcouple": { "startAngle":-Math.PI*(3/4), "endAngle":Math.PI*(3/4) },
                   "pH":{ "startAngle":-Math.PI*(3/4), "endAngle":Math.PI*(3/4) },
                   "TempController":{ "startAngle":-Math.PI*(1/4), "endAngle":Math.PI*(1/4) },  
                   "Amps":{ "startAngle":-Math.PI*(1/4), "endAngle":Math.PI*(1/4) } ,
                   "Volts":{ "startAngle":-Math.PI*(3/4), "endAngle":Math.PI*(3/4) } ,
                   "Watts":{ "startAngle":-Math.PI*(3/4), "endAngle":Math.PI*(3/4) } 
                }
  return (
     <>
     {props.info.subscribed?
     <div>
     <button type="button" 
             name="switchDigital" 
             onClick={handleADchange} >{ADstate?"A":"D"}</button>
     <button type="button" 
             name="showChart" 
             onClick={handleSHchange} >{SHstate?"H":"S"}</button>
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
         <DigitalComponent value={props.info.value} 
                           tempSet={props.info.metaData.PIDTemp} 
                           unit={units[props.info.type]} />
     </div>:""}
     </>
  );
}
