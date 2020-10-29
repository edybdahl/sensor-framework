import React from "react";
import PropertyComponent from "./PropertyComponent";

export default function Gridomponent(props) {

let subscribeContainer = (props.info && props.info.filter( element => !element.subscribed ).length !== 0)?
       <div style={{"border":"5px solid #e0e0e0",
                        "boxSizing":"borderBox",
                        "padding":"16px",
                        "textAlign":"left"}}>
           <div style={{"textAlign":"center"}}>
               <label>Subscribe</label>
           </div> 
           {(props.info)?props.info.filter( element => !element.subscribed ).map( c =>
              <div>
                <PropertyComponent info={c} onCommandEvent={props.onCommandEvent} onSubscribe={props.onSubscribe} />
              </div>)
           :""}
       </div>:"";

let subscribedContainers = (props.info)?props.info.filter( element => element.subscribed ).map( c =>
           <div style={{"border":"5px solid #e0e0e0",
                        "boxSizing":"borderBox",
                        "padding":"16px",
                        "textAlign":"center"}}>
              <PropertyComponent info={c} onCommandEvent={props.onCommandEvent} onSubscribe={props.onSubscribe} />
           </div>)
       :"";

  return (
     <div style={{"display":"grid",
                "gridTemplateColumns":"repeat(4, [colStart]minmax(250px,1fr) [colEmd]",
                "gridGap":"10px"}} >
       {subscribeContainer}
       {subscribedContainers}
     </div>
  );
}