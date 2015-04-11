process.env.NODE_ENV = 'test';

var async = require('async');
var db, geomFixture;

before(function () {
  lbDs = getDataSource();
  geomFixture = getGeomFixture();
});


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
    var models = lbDs.modelBuilder.buildModels(schema);
    console.log(models);
    var Model = models['TestInventory'];
    Model.attachTo(lbDs);

    db.automigrate(function (err, data) {
      async.series([
        function (callback) {
          Model.destroyAll(callback);
        },
        function (callback) {
          Model.create({productId: 'p001', locationId: 'l001', available: 10, total: 50, foopoly: geomFixture.polygon01}, callback);
        },
        function (callback) {
          Model.create({productId: 'p001', locationId: 'l002', available: 30, total: 40, foopoly: geomFixture.polygon02}, callback);
        },
        function (callback) {
          Model.create({productId: 'p002', locationId: 'l001', available: 15, total: 30, foopoly: geomFixture.polygon03}, callback);
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
