import React, { useState, useEffect} from "react";
import {scaleLinear, scaleTime} from "d3-scale";
import {timeFormat, line} from "d3";
import SVGBrush from 'react-svg-brush';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

let touchTime = 0;
let touchTimeCount = 0;
let firstTime = true;
let initialized = false;

export default function ChartComponent(props) {
const [state, setState] = useState({
      brushSelection: null,
      valueSelection: null,
      shadowGridSelection: [[Date.now(),0],[Date.now(),1]],
      useBase: true
    });

const WIDTH = 900;
const HEIGHT = 900/10;
const MARGIN = {TOP: 10, RIGHT: 40, BOTTOM: 20, LEFT: 40};

let svg = null;

let formatTime = timeFormat("%B %d, %Y %X");
let milliTime = timeFormat("%s");

// This needs to be the largest of the time scales from each data set
const xScale = scaleTime()
  .domain([(state.shadowGridSelection[0][0]==0)?Date.now():state.shadowGridSelection[0][0],state.shadowGridSelection[1][0]])  
  .range([MARGIN.LEFT, WIDTH - MARGIN.LEFT]);
 
const yScaleM = [];

for( let index=0; index<props.info.length; index++ ) {
     let yScale = scaleLinear()
  .domain([state.shadowGridSelection[1][index+1], state.shadowGridSelection[0][index+1]])
  .range([HEIGHT - MARGIN.BOTTOM, MARGIN.TOP]);
  yScaleM.push(yScale);
}
if ( yScaleM.length == 0 ) {
   yScaleM[0] = scaleLinear()
  .domain([0, 0])
  .range([HEIGHT - MARGIN.BOTTOM, MARGIN.TOP]);
}

useEffect(() => {
  setState((state) => {
     let newShadowGridSelection = state.shadowGridSelection;
     if (state.useBase) {
         newShadowGridSelection = selectionMatrix();
     }
     if ((props.info.length > 0) && props.info[0].metaData.timeLimit && firstTime) {
        newShadowGridSelection[1][0] = props.info[0].metaData.timeLimit?props.info[0].metaData.timeLimit*1000:Date.now();
        firstTime = false; 
     }     
     let newBrushSelection = state.valueSelection?state.valueSelection.map(([x, y]) => [
          (x==0)?MARGIN.LEFT:Math.round(xScale(x)),
          yScaleM[0](y)
        ]):null; 
     return { brushSelection: newBrushSelection,
              valueSelection: state.valueSelection,
              shadowGridSelection:newShadowGridSelection,
              useBase: state.useBase }
     })
},[props.info]);

let selectionMatrix = () => {
   let matrix = [];
   let upperRight = [];
   let lowerLeft = [];
   upperRight.push( Date.now() );
   let limit = Date.now();
   for ( let index=0; index < props.info.length; index++ ) {
       if (props.info[index].metaData.timeLimit) {
            limit = Math.min( limit, props.info[index].metaData.timeLimit*1000 )
       }
   }
   lowerLeft.push( limit );
   if ( props.info.length == 0 ) {
       lowerLeft.push(0); 
       upperRight.push(0);       
   } else {
	   for ( let index=0; index < props.info.length; index++ ) {
	       lowerLeft.push( props.info[index].metaData.Min);
	       upperRight.push( props.info[index].metaData.Max);
	   }
   }
   matrix.push(upperRight);
   matrix.push(lowerLeft);
   return matrix;
}

let renderBrush = () => {
    return (
    <SVGBrush
      // Defines the boundary of the brush.
      // Strictly uses the format [[x0, y0], [x1, y1]] for both 1d and 2d brush.
      // Note: d3 allows the format [x, y] for 1d brush.
     extent={[
          [MARGIN.LEFT, MARGIN.TOP],
          [WIDTH - MARGIN.RIGHT, HEIGHT - MARGIN.BOTTOM]
        ]}
      // Obtain mouse positions relative to the current svg during mouse events.
      // By default, getEventMouse returns [event.clientX, event.clientY]
      getEventMouse={event => {
          const {clientX, clientY} = event;
          const {left,top,width,height} = svg.getBoundingClientRect();
          return [clientX - left,clientY - top];
        }}
      brushType="2d" // "x"
      selection={state.brushSelection}
      onBrushStart={({target, selection}) => {
         if ( touchTime < Date.now() - 1000 ) {
             touchTime = Date.now();
             touchTimeCount = 0;
         } else {
             touchTimeCount++;
         }
      }}
      onBrushEnd={({target, selection, sourceEvent}) => {
         if ( touchTime < Date.now() - 1000 ) {
         } else {
             touchTimeCount++;
             if ( touchTimeCount >= 3 ) {
                 if ( selection == null ) {
                     setState({brushSelection: null,
                     valueSelection: null,
                     shadowGridSelection: selectionMatrix(),
                     useBase: true
                     });         
                 } else {
                     const {clientX, clientY} = sourceEvent;
                     const {left,top,width,height} = svg.getBoundingClientRect();
                     const [Ax, Ay] = [clientX - left,clientY - top];
                     const [[X0,Y1],[X1,Y0]] = selection; 
                     console.log( Ax );
                     console.log( selection );
                     if ( (Ax > X0) && Ax < ((X1 - X0)*(0.25) + X0)) { 
                             console.log( "in right quarter" );
                             let newShadowGridSelection=state.shadowGridSelection; 
                             newShadowGridSelection[0][1] = state.valueSelection[0][1];
                             newShadowGridSelection[1][1] = state.valueSelection[1][1];
                             if ( state.useBase ) {
                                 newShadowGridSelection[0][0] = 0;
                             }
               	             setState({brushSelection: null,
				     valueSelection: null,
				     shadowGridSelection: newShadowGridSelection,
		                     useBase: false
                             });            
                     } else if ((Ax < X1) && Ax > ((X1 - X0)*(0.75) + X0) ) {
                             console.log( "in left quarter" );
                             let newShadowGridSelection=state.shadowGridSelection; 
                             newShadowGridSelection[0][2] = state.valueSelection[0][2];
                             newShadowGridSelection[1][2] = state.valueSelection[1][2];
                             if ( state.useBase ) {
                                 newShadowGridSelection[0][0] = 0;
                             }
 	                     setState({brushSelection: null,
				     valueSelection: null,
				     shadowGridSelection: newShadowGridSelection,  
		                     useBase: false
                             });    
                     } else {   
		          setState({brushSelection: null,
		             valueSelection: null,
		             shadowGridSelection: state.valueSelection,
                             useBase: false
                          });      
                     }                         
                 }
                 touchTime = 0;
                 touchTimeCount = 0;
             }
         }
      }}
      onBrush={({selection}) => {
        let value = selection?selection.map(([x, y]) => getBrush(x,y)):null;
        setState({brushSelection: selection,
                  valueSelection: value,
                  shadowGridSelection: state.shadowGridSelection,
                  useBase: state.useBase
        });
      }}
    /> 
    );
}

let getBrush = (x,y) => {
   let valueM = [];
   let xValue = (x==MARGIN.LEFT)?0:parseInt(milliTime(xScale.invert(x)),10)*1000;
   valueM.push( xValue );
   for ( let index = 0; index < yScaleM.length; index++ ) {
       valueM.push(yScaleM[index].invert(y));
   }
   console.log(valueM);
   return valueM;
}

const _renderAxises = () => {
    return (
      <React.Fragment>
        <line
          x1={MARGIN.LEFT}
          y1={HEIGHT - MARGIN.BOTTOM}
          x2={WIDTH - MARGIN.RIGHT}
          y2={HEIGHT - MARGIN.BOTTOM}
          stroke="black"
          strokeWidth={1}
        />
        <line
          x1={MARGIN.LEFT}
          y1={HEIGHT - MARGIN.BOTTOM}
          x2={MARGIN.LEFT}
          y2={MARGIN.TOP}
          stroke="blue"
          strokeWidth={1}
        />
       {props.info[0]? 
       <text
          textAnchor="middle"
          transform="rotate(-90 10 45)"
          x={10}
          y={45}
          stroke="blue"
          fontSize={5} >
            {props.info[0].property}
       </text>:""}
       {yScaleM[1]?
        <line
          x1={WIDTH - MARGIN.LEFT}
          y1={HEIGHT - MARGIN.BOTTOM}
          x2={WIDTH - MARGIN.LEFT}
          y2={MARGIN.TOP}
          stroke="red"
          strokeWidth={1}
        />:""}
      {props.info[1]? 
       <text
          textAnchor="middle"
          transform="rotate(-90 890 45)"
          x={890}
          y={45}
          stroke="red"
          fontSize={5} >
            {props.info[1].property}
       </text>:""}
      {xScale.ticks(5).map(t => {
          const x = xScale(t);
          return (
            <React.Fragment key={t.toString()}>
              <line
                x1={x}
                y1={HEIGHT - MARGIN.BOTTOM}
                x2={x}
                y2={HEIGHT - MARGIN.BOTTOM + 4}
                stroke="black"
                strokeWidth={1}
              />
              <text
                x={x}
                y={HEIGHT - MARGIN.BOTTOM + 6}
                dominantBaseline="hanging"
            //    transform="rotate(-3)"
                textAnchor="middle"
                fontSize={5}
              >
                {formatTime(t)}
              </text>
            </React.Fragment>
          );
        })}
        {yScaleM[0]?yScaleM[0].ticks(3).map(t => {
          const y = yScaleM[0](t);
          return (
            <React.Fragment key={t.toString()}>
              <line
                x1={MARGIN.LEFT}
                y1={y}
                x2={MARGIN.LEFT - 4}
                y2={y}
                stroke="blue"
                strokeWidth={1}
              />
              <text
                x={MARGIN.LEFT - 6}
                y={y}
                dominantBaseline="middle"
                textAnchor="end"
                stroke="blue"
                fontSize={10}
              >
                {Math.round(t)}
              </text>
            </React.Fragment>
          );
        }):""}
        {yScaleM[1]?yScaleM[1].ticks(3).map(t => {
          const y = yScaleM[1](t);
          return (
            <React.Fragment key={t.toString()}>
              <line
                x1={WIDTH - MARGIN.LEFT}
                y1={y}
                x2={WIDTH - MARGIN.LEFT + 4}
                y2={y}
                stroke="red"
                strokeWidth={1}
              />
              <text
                x={WIDTH - MARGIN.LEFT + 6}
                y={y}
                dominantBaseline="middle"
                textAnchor="start"
                stroke="red"
                fontSize={10}
              >
                {Math.round(t)}
              </text>
            </React.Fragment>
          );
        }):""}
    </React.Fragment >  )};

const myLine = [];

for ( let index = 0; index < yScaleM.length; index++ ) {
    myLine.push( line()
    .x(([x, y]) => xScale(x))
    .y(([x, y]) => yScaleM[index](y)));
    
};

const _renderData = () => {
      const lines = [];
      const dataSize = [];
      for ( let index = 0; index < props.info.length; index++ ) {
          const value20 = [];
          let previoustime = 0;    
          for (let jndex=0;jndex<props.info[index].values.length;jndex++) {
	      if (props.info[index].values[jndex][0] <= ((state.shadowGridSelection[0][0]==0)?Date.now():state.shadowGridSelection[0][0]) && 
	          props.info[index].values[jndex][0] > state.shadowGridSelection[1][0] &&
	          props.info[index].values[jndex][0] > previoustime) {
   	          value20.push(props.info[index].values[jndex]);
	          previoustime = props.info[index].values[jndex][0] + 20*1000;
	      }
          } 
          if ( value20.length > 0 ) {
		  dataSize.push(Math.round(xScale(value20[0][0]) - xScale(Date.now())) + 40);
		  lines.push(myLine[index](value20));
          }
        }
      return( 
        <React.Fragment>
	  {lines[0]?<path
	    d={lines[0]+"V70H" + dataSize[0] + "Z"}
            fill="blue"
            fill-opacity="25%"
            strokeWidth=".5"
            stroke="blue"
	  />:""}
	  {lines[1]?<path
	    d={lines[1]+"V70H" + dataSize[1] + "Z"}
            fill="red"
            fill-opacity="25%"
            strokeWidth=".5"
            stroke="red"
	  />:""}
      </React.Fragment>
          );
  } 
 
const renderLineChart = () => {
let indata = [];
const {brushSelection,valueSelection,shadowGridSelection} = state;
const [x1,x2,y1,y2,z1,z2] = valueSelection?
         [(valueSelection[0][0]==0)?Date.now():valueSelection[0][0],
          valueSelection[1][0],
          valueSelection[1][1],
          valueSelection[0][1],
          valueSelection[1][2]?valueSelection[1][2]:0,
          valueSelection[0][2]?valueSelection[0][2]:0]:[Date.now(),Date.now(),0,0,0,0];
if (props.info.length > 0) { 
   for ( let index =  0; index  < props.info.length; index++ ) {
	   props.info[index].values.map(([x, y]) => {
		   if (x>=x2 && x<=x1) {
		       let point = {};
		       point["time"] = x;
		       point[props.info[index].property] = y;
		       if ( props.info[index].metaData.PIDTemp ) {
			    point["tempSet"] = props.info[index].metaData.PIDTemp;
		       }
		       indata.push(point);
		   };
	   });
   };
};

return (
  (x1!=0)?<LineChart style={{"margin":"0 auto"}} width={900} height={200} data={indata} margin={{ top: 5, right: 40, bottom: 5, left:40 }}>
    {props.info[0]?<Line yAxisId="left" type="monotone" dataKey={props.info[0].property} stroke="#8884d8" />:""}
    {props.info[1]?<Line yAxisId="right" type="monotone" dataKey={props.info[1].property} stroke="red" />:""}
    {(props.info[0] && props.info[0].metaData.PIDTemp)?<Line yAxisId="left" type="monotone" dataKey="tempSet" stroke="black" />:""} 
    {(props.info[1] && props.info[1].metaData.PIDTemp)?<Line yAxisId="right" type="monotone" dataKey="tempSet" stroke="black" />:""} 
    <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
    <XAxis dataKey="time" type="number" domain={[x1,x2]} tickFormatter={formatTime} reversed="true" />
    <YAxis yAxisId="left" label={props.info[0]?{value:props.info[0].property, angle:-90, position:"insideLeft"}:{}} type="number" domain={[y1,y2]} 
         tickFormatter={(number) => { return Math.round(number*100)/100; }} />
    {props.info[1]?<YAxis yAxisId="right" label={props.info[1]?{value:props.info[1].property, angle:-90, position:"outsideRight"}:{}}
        type="number" orientation="right" domain={[z1,z2]}  tickFormatter={(number) => { return Math.round(number*100)/100; }} />:""}   
   <Tooltip labelFormatter = {formatTime} formatter = {(value) => {return Math.round(value*100)/100;}} />
  </LineChart>:
  <svg width={900} height={200} >
	<path
		d={"M0,0H900V200H0Z"}
		fill="gray"
		strokeWidth=".5"
		stroke="blue"
	/>);    
  </svg>
  );
}

 return (
     <div style={{"textAlign":"center"}}>
	  <div>
	      <label>Chart</label>
	  </div>
          <div>
               {renderLineChart()}
          </div>
	  <div>
	      <svg width={WIDTH} height={HEIGHT} ref={input => (svg = input)}>
		  {_renderAxises()} 
                  {_renderData()}	
		  {renderBrush()}               
	      </svg>
	  </div>
     </div>
);

}