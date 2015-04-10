process.env.NODE_ENV = 'test';
require('should');

var async = require('async');
var jsts = require('jsts');
var db;

before(function () {
  db = getSchema();
});

var geometryFactory = new jsts.geom.GeometryFactory();
var c1 = new jsts.geom.Coordinate(1,2);
var c2 = new jsts.geom.Coordinate(3,4);
var c3 = new jsts.geom.Coordinate(5,5);
var c4 = new jsts.geom.Coordinate(1,2);
var c5 = new jsts.geom.Coordinate(5,2);

var shell;

shell = geometryFactory.createLinearRing([c1,c2,c3,c4]);
var polygon01 = geometryFactory.createPolygon(shell, null);

shell = geometryFactory.createLinearRing([c1,c2,c5,c4]);
var polygon02 = geometryFactory.createPolygon(shell, null);

shell = geometryFactory.createLinearRing([c1,c1,c4,c5]);
var polygon03 = geometryFactory.createPolygon(shell, null);

//expect(polygon01).toBeDefined();
//expect(polygon02).toBeDefined();
//expect(polygon03).toBeDefined();

describe('Mapping models', function () {
  it('should honor the postgresql settings for table/column', function (done) {

    var schema =
    {
      "name": "TestInventory",
      "options": {
        "idInjection": false,
        "postgresql": {
          "schema": "public", "table": "inventorytest"
        }
      },
      "properties": {
        /*
         "id": {
         "type": "String", "required": true, "length": 20, "id": 1, "postgresql": {
         "columnName": "INVENTORY_ID", "dataType": "VARCHAR", "nullable": "N"
         }
         },
         */
        "productId": {
          "type": "String", "required": true, "length": 20, "id": 1, "postgresql": {
            "columnName": "product_id", "dataType": "VARCHAR", "nullable": "NO"
          }
        },
        "locationId": {
          "type": "String", "required": true, "length": 20, "id": 2, "postgresql": {
            "columnName": "location_id", "dataType": "VARCHAR", "nullable": "NO"
          }
        },
        "available": {
          "type": "Number", "required": false, "postgresql": {
            "columnName": "available", "dataType": "INTEGER", "nullable": "YES"
          }
        },
        "total": {
          "type": "Number", "required": false, "postgresql": {
            "columnName": "total", "dataType": "INTEGER", "nullable": "YES"
          }
        },
        "fooxyz": {
          "type": "PointZ", "required": false, "postgresql": {
            "columnName": "fooxyz", "dataType": "GEOMETRY(POINTZ,4326)", "nullable": "YES"
          }
        },
        "fooxy": {
          "type": "Point", "required": false, "postgresql": {
            "columnName": "fooxy", "dataType": "GEOMETRY(POINT,4326)", "nullable": "YES"
          }
        },
        "foopoly": {
          "type": "Polygon", "required": false, "postgresql": {
            "columnName": "foopolys", "dataType": "GEOMETRY(POLYGON,4326)", "nullable": "YES"
          }
        }
      }
    };
    var models = db.modelBuilder.buildModels(schema);
    // console.log(models);
    var Model = models['TestInventory'];
    Model.attachTo(db);

    db.automigrate(function (err, data) {
      async.series([
        function (callback) {
          Model.destroyAll(callback);
        },
        function (callback) {
          Model.create({productId: 'p001', locationId: 'l001', available: 10, total: 50, fooxyz: polygon01}, callback);
        },
        function (callback) {
          Model.create({productId: 'p001', locationId: 'l002', available: 30, total: 40, fooxyz: polygon02}, callback);
        },
        function (callback) {
          Model.create({productId: 'p002', locationId: 'l001', available: 15, total: 30, fooxyz: polygon03}, callback);
        },
        function forBaselineProps(callback) {
          Model.find({fields: ['productId', 'locationId', 'available']}, function (err, results) {
            // console.log(results);
            results.should.have.lengthOf(3);
            results.forEach(function (r) {
              r.should.have.property('productId');
              r.should.have.property('locationId');
              r.should.have.property('available');
              r.should.have.property('total', undefined);
              r.should.have.property('fooxyz', undefined);
            });
            callback(null, results);
          });
        },
        function forAnonymous(callback) {
          Model.find({fields: {'total': false}}, function (err, results) {
            // console.log(results);
            results.should.have.lengthOf(3);
            results.forEach(function (r) {
              r.should.have.property('productId');
              r.should.have.property('locationId');
              r.should.have.property('available');
              r.should.have.property('total', undefined);
              r.should.have.property('fooxyz');
            });
            callback(null, results);
          });
        },
        function forGeoGigTypes (callback) {
          Model.find({fields: ['productId', 'locationId','fooxyz', 'foopoly', 'fooxy']}, function (err, results) {
            // console.log(results);
            results.should.have.lengthOf(3);
            results.forEach(function (r) {
              r.should.have.property('productId');
              r.should.have.property('locationId');
              r.should.have.property('available',undefined);
              r.should.have.property('total', undefined);
              r.should.have.property('foopoly');
              r.should.have.property('fooxy');
              r.should.have.property('fooxyz');
            });
            callback(null, results);
          });
        }
      ], done);
    });



  });
});
