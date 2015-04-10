var DataSource = require('loopback-datasource-juggler').DataSource;

var config = require('rc')('loopback', {test: {postgresql: {user: 'strongloop', name: 'johny'}}}).test.postgresql;

global.getDataSource = global.getSchema = function () {
  var db = new DataSource(require('../'), config);
  db.log = function (a) {
    // console.log(a);
  };
  return db;
};
