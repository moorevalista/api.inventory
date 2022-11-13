const mysql = require('mysql');

const connection = mysql.createConnection({
	host: '149.129.219.109',
	user: 'moorevalista',
	password: '@Moore060785',
	database: 'toge.db',
	multipleStatements: true
});

connection.connect((error) => {
	if(error) throw error;
	console.log('MySQL Connected...');
});

module.exports = connection;