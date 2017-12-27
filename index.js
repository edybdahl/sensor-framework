const express = require("express");
const path = require("path");
const app = express();

app.use('/public',express.static( path.join( __dirname, 'public' )));

const http = require("http");
const socketIo = require("socket.io");
const {subscribe, unsubscribe} = require("./routeData");

const httpServer = http.Server(app);

const io = socketIo(httpServer);

io.on( 'connection', socket => {
	console.log( "user connected: " + socket.id );

	const pushVolts = newVolts => {
		socket.emit( 'Volts', { 
			value: newVolts
		});
	};

	const pushAmps = newAmps => {		
		socket.emit( 'Amps', { 
			value: newAmps
		});
	};

	subscribe( pushVolts, "Volts" );
        subscribe( pushAmps, "Amps" );

	socket.on( 'disconnect', () => {	
		unsubscribe( pushVolts, "Volts" );
        	unsubscribe( pushAmps, "Amps" );
	});
});

httpServer.listen( 3000, function() {
	console.log('Server listening on port 3000');
});

