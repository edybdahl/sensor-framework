import React from "react";
import NumberFormat from "react-number-format";

export default function ValueComponent(props) {

  return (
      <>
      <div>
      <NumberFormat displayType="text" 
                    decimalScale="2" 
                    suffix={props.unit} 
                    fixedDecimalScale="true" 
                    value={props.value} />
      </div>
      {( props.tempSet )? 
          <div  style={{color:"red"}}>
          <NumberFormat displayType="text" 
                        decimalScale="2" 
                        suffix={props.unit} 
                        fixedDecimalScale="true"
                        value={props.tempSet} />
          </div>:""}
      </>
  );
}