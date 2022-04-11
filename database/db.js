var __path = process.cwd(),
      monk = require('monk'),
     { color } = require(__path + '/lib/color.js')


var url = 'user:pass@localhost:port/api';
try {
if(url == 'localhost') throw console.log(color('Configurasi database, var url belum diisi','red'));
} catch (e) {
	return;
	}
var db = monk(url);

db.then(() => {
  console.log(color('Connected correctly to server, Zeeone','green'))
})
.catch ((e) => {
	console.log(color('Error : '+ e +'\n\nGagal connect ke database, \ncek configurasi database apakah Connection URL sudah benar','red'))
	})


module.exports = db
