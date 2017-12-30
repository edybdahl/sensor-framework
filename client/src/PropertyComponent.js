import React from "react";
import ValueComponent from "./ValueComponent";
import ControllerComponent from "./ControllerComponent";

export default function ProperyComponent(props) {

  return (
  <>
     <div>
          <ValueComponent info={props.info} />
     </div>
     <div>
          <ControllerComponent info={props.info} onCommandEvent={props.onCommandEvent} onSubscribe={props.onSubscribe} />
     </div>
  </>      
  );
}