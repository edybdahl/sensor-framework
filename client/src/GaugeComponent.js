import React from "react";
import {arc} from "d3-shape";
import NumberFormat from "react-number-format";

export default function GaugeComponent(props) {

let sectionSize=10;
let scale = props.max - props.min;
let percentage = (props.value - props.min)/scale;
let numberOfTicks = scale/sectionSize + 1;
let sliceSize = Math.PI*(3/2)/(numberOfTicks - 1);
const offset = Math.PI*(1/4);

const backgroundArc = arc() 
 .innerRadius(0.95)
 .outerRadius(1)
 .startAngle(-Math.PI* 3 / 4)
 .endAngle(Math.PI *3 / 4)
 .cornerRadius(1)
 ()
const dataArc = arc()
 .innerRadius(0.85)
 .outerRadius(0.90)
 .startAngle(-Math.PI* 3 / 4)
 .endAngle(Math.PI*3/2*percentage - Math.PI*3/4)
 .cornerRadius(1)
 ()

let backBone =  (props.type=="linear")?
                   <><line x1={-0.9} x2={0.9} y1={0.5} y2={0.5} stroke="black" strokeWidth="0.012" />
                     <line y1={0.25} y2={0.75} 
                           x1={0} x2={0}
                           stroke="black" strokeWidth="0.012" />
                     <line y1={0} y2={1} 
                           x1={percentage*1.8 - 0.9} x2={percentage*1.8 - 0.9}
                           stroke="red" strokeWidth="0.012" /></>                      
                :
                   <><path d={backgroundArc} fill="#dbdbe7" />
                   <path d={dataArc} fill="blue" /></>

const ticks = [];

if (props.type == "linear") {
for(let index=0; index < scale + 1; index++ ) {
     ticks.push(<><line y1={0.5-0.125}
                    x1={1.8/scale*index - 0.9} 
                    y2={0.5+0.125} 
                    x2={1.8/scale*index - 0.9} 
                    stroke="black" strokeWidth="0.012" />
              <text x={1.8/scale*index - 0.92}
                    y={0.5-0.30}         
                    style={{font: "0.05px sans-serif"}} >{(index + props.min)}</text></>
    );
}
for ( let index=0; index < scale*5 + 1; index++ ){            
    ticks.push(<line y1={0.5-0.0625}
                    x1={1.8/(scale*5)*index - 0.9} 
                    y2={0.5+0.0625} 
                    x2={1.8/(scale*5)*index - 0.9} 
                    stroke="black" strokeWidth="0.012" />
    );
}
} else {
for(let index=0; index < numberOfTicks; index++ ) {
   ticks.push(<><line y1={-0.75*Math.sin(sliceSize * index - offset)}
                    x1={-0.75*Math.cos(sliceSize * index - offset)} 
                    y2={-1*Math.sin(sliceSize * index - offset)} 
                    x2={-1*Math.cos(sliceSize * index - offset)} 
                    stroke="black" strokeWidth="0.012" />
              <text x={-0.60*Math.cos(sliceSize * index - offset) - 0.02}
                    y={-0.60*Math.sin(sliceSize * index - offset) + 0.02}         
                    style={{font: "0.05px sans-serif"}} >{(index + props.min/sectionSize)*10}</text></>
    );
}

for ( let index=0; index < (numberOfTicks - 1)*sectionSize + 1; index++ ){            
    ticks.push(<line y1={-0.90*Math.sin(sliceSize/sectionSize * index - offset)}
                    x1={-0.90*Math.cos(sliceSize/sectionSize * index - offset)} 
                    y2={-1*Math.sin(sliceSize/sectionSize * index - offset)} 
                    x2={-1*Math.cos(sliceSize/sectionSize * index - offset)} 
                    stroke="black" strokeWidth="0.012" />
    );
}
}

let digitalValue =  (props.type=="linear")?
                    <text x={-0.5}
                    y={-.3}
                    style={{font: "0.3px sans-serif"}} textLength={1}>
                         <NumberFormat displayType="text" 
                                decimalScale="2"   
                                suffix={props.unit}
                                fixedDecimalScale="true" 
                                value={props.value} 
                                renderText={value => <>{value}</>}/>
                    </text>
                    :
                    <><text x={-0.35}
                    y={0.1}
                    style={{font: "0.3px sans-serif"}} textLength={0.70}>
                         <NumberFormat displayType="text" 
                                decimalScale="2"   
                                fixedDecimalScale="true" 
                                value={props.value} 
                                renderText={value => <>{value}</>}/>
                   </text>
.                  <text x={-0.15}
                    y={0.4}
                    style={{font: "0.15px sans-serif"}} textLength={0.30}>
                        <NumberFormat displayType="text" 
                                suffix={props.unit}
                                value="1"
                                renderText={value => <>{value}</>}/>
                    </text></>

  return (
      <>  
          <svg width="9em" viewBox={[-1,-1,2,2].join(" ")} >            
              {backBone} 
              {ticks}
              {digitalValue}
           </svg>
      </>
  );
}

GaugeComponent.defaultProps = {
min:-55 ,max:125,value:99.99,type:"linear"
};