const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("/home/pi/.readings.db");

const addData = ( type, value ) => {
	db.serialize( function () {
		db.run('CREATE TABLE IF NOT EXISTS ' + type + ' (createDate TEXT, value REAL)');
		db.run('INSERT INTO ' + type + ' VALUES ( datetime("now"),'  + value + ' )');
	});	
};

module.exports = {
	addData
};