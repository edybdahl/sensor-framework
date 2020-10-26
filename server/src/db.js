const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

let dir = "./data";
if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
}

const db = new sqlite3.Database("./data/.readings.db");

const addData = ( type, value ) => {
	db.serialize( function () {
		db.run('CREATE TABLE IF NOT EXISTS ' + type + ' (createDate TEXT, value REAL)');
		db.run('INSERT INTO ' + type + ' VALUES ( datetime("now"),'  + value + ' )');
	});	
};

module.exports = {
	addData
};