const bcrypt = require('bcrypt-nodejs');

var hash = bcrypt.hashSync("bacon");

console.log(bcrypt.compareSync("bacon", hash));