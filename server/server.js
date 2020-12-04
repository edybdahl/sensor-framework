const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const port = process.env.PORT || 4001;
const index = require("./routes/index");
const {subscribeData, unsubscribeData, isSubscribedData, callLisener, resetCommanding} = require("./src/routeData");

const app = express();
app.use(index);

const server = http.createServer(app);

const io = socketIo(server); // < Interesting!

io.on("connection", (socket) => {
  console.log( "user connected: " + socket.id );
 // console.log( socket.client );

        const pushProperties = (newValue, retype) => {
                console.log(newValue);
		socket.emit( 'Properties', { 
			value: newValue,
                        type: retype
		});
	};

	const pushValues = (newValue, retype) => {		
		socket.emit( 'Values', { 
			value: newValue,
                        type: retype
		});
	};

        socket.on("Property", data => {
           if ( data.type == "subscribe" ){
             if ( data.checked ){
                subscribeData( pushValues, data.property );
             } else {
                pushValues( 0, data.property );
                unsubscribeData( pushValues, data.property );
             }
           } else {
              if ( data.checked ) {
                  callLisener( {"Command":"getData",
                                "Value":data.property,
                                "type":"dbCommand"}, socket.id, pushValues );
              } else {
                  pushValues( [], data.property );
              }
           }
           console.log(data);
        });

        socket.on("Command", data => {
             console.log( "data recieved" );
             console.log( data );
             //should this be async.
             callLisener( data, socket.id, pushValues );
        });

	subscribeData( pushProperties, "ProbeProperties" );
        // may need to subsribe to the previous connection list
        // Ask the client which properties are subscrbed
        socket.emit("Subscribe",{});

        socket.on("Subscribed", data => {
             console.log( "*************" );    
             console.log( data.subscribed );
             for (let index=0; index < data.subscribed.length; index++) {
                 subscribeData( pushValues, data.subscribed[index] );
             }
        });    

  socket.on("disconnect", () => {
    console.log( "user diconnected: " + socket.id );
    unsubscribeData( pushProperties, "ProbeProperties" );
    // need to unsubsribe the value stuff 
    // get the property list and go through and unsubscribe  
      let subscribedValue = isSubscribedData(pushValues);
      if (subscribedValue) {
          for (let index=0; index < subscribedValue.length; index++) {
              unsubscribeData( pushValues, subscribedValue[index]);
          };
      };
      resetCommanding();
  });

});

server.listen(port, () => console.log(`Listening on port ${port}`));





