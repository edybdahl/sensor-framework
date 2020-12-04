const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

let dir = "./data";
if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
}

const db = new sqlite3.Database("./data/.readings.db");

const addData = ( type, value ) => {
	db.serialize( function () {
		db.run('CREATE TABLE IF NOT EXISTS ' + type + ' (createDate int, value REAL)');
		db.run('INSERT INTO ' + type + ' VALUES ( strftime("%s","now"),'  + value + ' )');
	});	
};

const getTimeLimit = ( type, callback ) => {
     console.log( "type: " + type );
     db.get('SELECT MIN(createDate) FROM ' + type,[],(err, row) => {
         if (err) {
              return console.error(err.message);
         }
         console.log(row);
         if (row) {
              callback( type, row["MIN(createDate)"] );
         }
     });
}

const getTypeData = ( type, callback ) => {
     console.log( "type: " + type );
     db.all('SELECT * FROM ' + type + ' ORDER BY createDate ASC',[],(err, rows) => {
         if (err) {
              return console.error(err.message);
         }
         let out = [];
         let previousValue = null;
         let previousDate = 0;
         for (index = 0; index < rows.length; index++){
             if (previousValue == null || previousValue != rows[index].value || previousDate <  rows[index].createDate) {
                 out.push([rows[index].createDate,rows[index].value]);
                 previousValue = rows[index].value;
                 previousData = rows[index].createDate + 30;
             }
         }
         if (rows) {
              callback( type, out );
         }
     });
}

module.exports = {
	addData,getTimeLimit,getTypeData
};