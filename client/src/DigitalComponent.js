import React from "react";
import NumberFormat from "react-number-format";

export default function ValueComponent(props) {

  return (
      <NumberFormat displayType="text" decimalScale="2" suffix={props.unit} fixedDecimalScale="true" value={props.value} />
  );
}