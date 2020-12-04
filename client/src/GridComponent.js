import React, {useState} from "react"
import PropertyComponent from "./PropertyComponent";
import ChartComponent from "./ChartComponent";

export default function Gridomponent(props) {
const [chartState, setChartState] = useState(false);

let handleChartchange = () => {
   setChartState(!chartState);
};

let handleReset = () => {
    let event = {
             "Command":"resetTuning",
             "Value":true,
             "type":"resetCommand"};
    props.onCommandEvent(event);
}
 
let subscribeContainer =
       <div style={{"border":"5px solid #e0e0e0",
                        "boxSizing":"borderBox",
                        "padding":"16px",
                        "textAlign":"left"}}>
           <div style={{"textAlign":"center"}}>
             <button type="button" 
             name="reset" 
             onClick={handleReset} >Reset Tuning</button>
           </div>
           <div style={{"textAlign":"center"}}>
             <button type="button" 
             name="reset" 
             onClick={handleChartchange} >{chartState?"Hide Line Chart":"Show Line Chart"}</button>
           </div>
           {(props.info && props.info.filter( element => !element.subscribed ).length !== 0)?
           <>
           <div style={{"textAlign":"center"}}>
               <label>Subscribe</label>
           </div> 
           {(props.info)?props.info.filter( element => !element.subscribed ).map( c =>
              <div>
                <PropertyComponent info={c} 
                        onCommandEvent={props.onCommandEvent}
                        onSubscribe={props.onSubscribe}
                        onCharted={props.onCharted}
                        subscribedComponents={props.info.filter( element => element.subscribed )} />
              </div>)
           :""}</>:""}
       </div>;

let subscribedContainers = (props.info)?props.info.filter( element => element.subscribed ).map( c =>
           <div style={{"border":"5px solid #e0e0e0",
                        "boxSizing":"borderBox",
                        "padding":"16px",
                        "textAlign":"center"}}>
              <PropertyComponent info={c} 
                                 onCommandEvent={props.onCommandEvent}
                                 onSubscribe={props.onSubscribe}
                                 onCharted={props.onCharted}
                                 subscribedComponents={props.info.filter( element => element.subscribed )} />
           </div>):"";
  
let chartContainer =   (props.info&&chartState)/*&&props.info.filter( element => element.charted ).length > 0*/?
          <div style={{"border":"5px solid #e0e0e0",
                        "boxSizing":"borderBox",
                        "padding":"16px",
                        "textAlign":"center"}}>        
               <ChartComponent onCommandEvent={props.onCommandEvent} 
                               info={props.info.filter( element => element.charted )} /> 
          </div>:"";

  return (
     <>
	     <div style={{"display":"grid",
		        "gridTemplateColumns":"repeat(4, [colStart]minmax(250px,1fr) [colEmd]",
		        "gridGap":"10px"}} >
	       {subscribeContainer}
	       {subscribedContainers}
	     </div>
	     <div style={{"display":"grid",
		        "gridGap":"10px"}} >
		{chartContainer}
	     </div>
     </>
  );
}