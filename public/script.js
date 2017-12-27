const addSocketListeners = () => {

	const socket = io();

	socket.on( 'Volts', data => {

		VoltsDisplay.innerHTML = data.value;

	});

	socket.on( 'Amps', data => {

		AmpsDisplay.innerHTML = data.value;

	});

}

addSocketListeners();