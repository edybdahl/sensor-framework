const SerialPort = require('serialport');

SerialPort.list().then (ports => {
  ports.forEach(function(port) {
    console.log("com name " + port.comName);
    console.log("prod id " + port.pnpId);
    console.log("manufacturer " + port.manufacturer);
    console.log( port );
  });
  open();
});

var timeout = null

const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('/dev/ttyUSB0', {autoOpen:false, baudRate:115200});

port.on('open', function() {
   // 
    console.log('open'); 
    timeout = setTimeout(isTimedOut, 20000); 
});

port.on('error', function(err) {
    console.error('Error: ', err.message);
    setTimeout(open,30000);
});

function open () {  
    port.open();
}

const parser = new Readline({ delimiter: '\r\n' });

port.setEncoding("UTF8");
port.pipe(parser);
parser.on('data', function(data) {
//	console.log("data: " + data);
        // this can be asyncd. 
        listeners.forEach(listener => {
		listener(data);
        });
        clearTimeout(timeout);
        timeout = setTimeout(isTimedOut, 20000);
});

const pushCommand = function( event ) {
      console.log( "Command recieved" );

      port.write( JSON.stringify(event) + '\r\n' , (err) => {
          if (err) {
                // could this be sent back the the source of the command. 
                return console.error('Error: ', err.message);
          }
          // This maybe set back as well. Command return. 
          console.log('message written');
    })  
};

const isTimedOut = function () {
      console.log("not getting data"); 
      listeners.forEach(listener => {
		listener("{\"ProbeProperties\":\"[]\"}");
      });
      open();
};

const callLisener = (event) => {
   console.log( "serial recieved" );
   console.log( event );
   if ( event.type == "probCommand" ) {
       pushCommand( event );
   } 
}

const listeners = [];

const subscribe = (listener) => {
	listeners.push(listener);
};

const unsubscribe = (removelistener) => {
	listeners = listeners.filter( listener => 
              	listener !== removelistener);
};

module.exports = {
	subscribe, unsubscribe, callLisener
};

