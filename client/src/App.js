import React, { useState, useEffect } from "react";
import PropertiesComponent from "./PropertiesComponent";
import GaugeComponent from "./GaugeComponent";


function App() {
  const [response, setResponse] = useState("")

  return (
   <>
    <PropertiesComponent />
   </>
  );
}

export default App;