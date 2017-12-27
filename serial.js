const SerialPort = require('serialport');

SerialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log("com name " + port.comName);
    console.log("prod id " + port.pnpId);
    console.log("manufacturer " + port.manufacturer);
    console.log( port );
  });
});

const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('/dev/ttyUSB0', function(err){
if (err) {
    return console.log('Error: ', err.message);
  }    
  console.log('open');
});
const parser = new Readline({ delimiter: '\r\n' });


port.setEncoding("UTF8");
port.pipe(parser);
parser.on('data', function(data) {
	//console.log("data: " + data);
        listeners.forEach(listener => {
		listener(data);
        });
});

const listeners = [];

const subscribe = (listener) => {
	listeners.push(listener);
};

const unsubscribe = (removelistener) => {
	listeners = listeners.filter( listener => 
              	listener !== removelistener);
};

module.exports = {
	subscribe, unsubscribe
};
