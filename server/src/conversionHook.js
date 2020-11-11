const conversion = {};

const initOutputToAmps = () => {
  for ( let index = 0; index < 256; index ++ ) {
    equation = 0.01; 
    if ( index>=30) {
       corrected = index -15*(index/255) + 15;
       xvalue = (Math.PI * corrected)/255;
       equation = 3.688*Math.sqrt( xvalue/(2*Math.PI) - Math.sin(2*xvalue)/(4*Math.PI) );
    }
    conversion[index]=equation;
  }
  console.log(conversion);
};


const init = () => {
   initOutputToAmps();
};

const conFunc = ( property, input ) => {
   let output = input;
   if ( property == "HeatController" ) {
      output = conversion[ input ];
   }
   console.log(output);
   return output;
}

const invConFunc = ( command, input ) => {
   let output = input; 
   if ( command == "heat" ) {
       let index = 0; 
       if ( input >= 0.30 ) {
	   while( input > conversion[index]){
	       index++;
	   }
	   output = (Math.abs(input - conversion[index-1]) > Math.abs(input - conversion[index]))?index:index-1;
       } else {
           output = 29;
       }
    }
   console.log(output);
   return output;
}

module.exports = {
	init,conFunc,invConFunc
};