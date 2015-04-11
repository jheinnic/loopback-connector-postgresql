process.env.NODE_ENV = 'test';
// require('mocha');

var async = require('async'),
  chai    = require('chai'),
  expect  = chai.expect,
  should  = chai.should(),
  assert  = chai.assert;

var lbDs, knex, geomFixture, pointSchema, pointZSchema, polygonSchema;
require('loopback-datasource-juggler/test/init');
require('./init');

function curryOnPass(callback) {
  return function onPass(data) {
    console.log('onPass');
    callback(null, data);
  }
}

var curryOnDone = function curryOnDone(source, callback) {
  return function onDone(err, data) {
    //console.log('onDone called for ' + source + ' with error', err);
    //console.log('onDone called for ' + source + ' with data', data);
    //console.log('onDone called for ' + source + ' with callback', callback);
    console.log('onDone() called for ' + source);
    if (err) {
      callback(err);
    } else {
      callback(null, data);
    }
  };
};

function resetTestSchema(callback) {
  async.series(
    [
      curryDoRawQuery('DROP SCHEMA IF EXISTS wins_test CASCADE'),
      curryDoRawQuery('CREATE SCHEMA IF NOT EXISTS wins_test')
    ],
    callback
  );
}

function curryDoRawQuery(rawQuery) {
  console.log('Prep;',rawQuery);
  return function doRawQuery(callback) {
    console.log(rawQuery);
    return knex.raw(rawQuery).then(
      curryOnPass(callback), callback);
  }
}

function curryBuildModelAndSchema(schemaDef) {
  return function buildModelAndSchema(callback) {
    // console.log('Building:', schemaDef);

    var thisModel =
      // lbDs.modelBuilder.buildModels(schemaDef)[schemaDef.name];
      lbDs.define(schemaDef.name, schemaDef.properties, schemaDef.options)

    thisModel.attachTo(lbDs);
    lbDs.automigrate(schemaDef.name, callback);

    return thisModel;
  };
}

function curryCheckGeoColumn(schemaName, tableName, columnType) {
  return function checkGeoColumn(callback) {
    knex(schemaName + '.' + tableName)
      .columnInfo('location')
      .then(
        function evaluateColumnInfo(columnInfo) {
          console.log('ColumnInfo:', tableName, columnType, columnInfo);

          columnInfo.should.not.have.property('nullable', true);
          columnInfo.should.have.property('type', columnType);
        }
      ).done(curryOnPass(callback), callback);
  };
}

function curryInsertGeomRow(lbDs, modelName) {
  return function insertGeomRow(geomObj, callback) {
    console.log('Curried insert function for:', lbDs.modelBuilder.models[modelName]);
    lbDs.modelBuilder.models[modelName].save({
      name: 'ThisIsAName',
      quantity: 500,
      location: geomFixture.geoJSONWriter.write(geomObj)
    }, curryOnDone('insert geo row', callback));
  };
}


describe('PostGIS connector DDL features', function describePostgisConnectorDDLFeatures() {
  beforeEach(function beforeTesting(done) {
    lbDs = getDataSource();
    knex = getKnexPath();
    geomFixture = getGeomFixture();
    pointSchema = getPointSchema();
    pointZSchema = getPointZSchema();
    polygonSchema = getPolygonSchema();

    resetTestSchema(
      curryOnDone('before testing', done)
    );
  });

  describe('CREATE TABLE with geometry', function describeCreationUseCases() {
    it('Can build and auto-migrate Point Models', function itCanBuildAndAutoMigratePointModels(done) {
      async.series([
        // Define a table with a point column and create it
        curryBuildModelAndSchema(pointSchema),

        // Verify it was created correctly.
        curryCheckGeoColumn('wins_test', 'pointtest', 'geometry(point,4326)')
      ], curryOnDone('desc create point', done));
    });

    it('Can build and auto-migrate PointZ Models', function itCanBuildAndAutoMigratePointZModels(done) {
      async.series([
        // Define a table with a pointz column and create it
        curryBuildModelAndSchema(pointZSchema),

         // Verify it was created correctly.
        curryCheckGeoColumn('wins_test', 'pointztest', 'geometry(pointz,4326)')
      ], curryOnDone('desc create pointz', done));
    });

    it('Can build and auto-migrate Polygon Models', function itCanBuildAndAutoMigratePolygonModels(done) {
      async.series([
        // Define a table with a point column and create it
        curryBuildModelAndSchema(polygonSchema),

        // Verify it was created correctly.
        curryCheckGeoColumn('wins_test', 'polygontest', 'geometry(polygon,4326)')
      ], curryOnDone('desc create polygon', done)); // console.log('desc create polygon done'); process.exit(0); });  // curryOnDone(done));
    });
  });
});

describe('PostGIS connector DML features', function describePostgisConnectorDMLFeatures() {
  beforeEach(function resetSchemaForDMLTests(done) {
    lbDs = getDataSource();
    knex = getKnexPath();
    geomFixture = getGeomFixture();
    pointSchema = getPointSchema();
    pointZSchema = getPointZSchema();
    polygonSchema = getPolygonSchema();

    async.series([
      resetTestSchema,
      curryBuildModelAndSchema(pointSchema),
      curryBuildModelAndSchema(pointZSchema),
      curryBuildModelAndSchema(polygonSchema)
    ], curryOnDone('before DML set', done));
  });

  // TODO: Add a post-insert validation curry step to each async array here!
  describe('INSERT geometry', function describeInsertionUseCases() {
    it('Can insert to a table column with point geometry', function (done) {
      async.eachSeries(
        [geomFixture.p2d1, geomFixture.p2d2, geomFixture.p2d3, geomFixture.p2d4, geomFixture.p2d5, geomFixture.p2d6],
        curryInsertGeomRow(lbDs, 'PointTest'),
        curryOnDone('INSERT point', done));
    });

    it('Can insert to a table column with pointZ geometry', function (done) {
      async.series(
        [geomFixture.p3d1, geomFixture.p3d2, geomFixture.p3d3, geomFixture.p3d4, geomFixture.p3d5, geomFixture.p3d6],
        curryInsertGeomRow(lbDs, 'PointZTest'),
        curryOnDone('INSERT pointz', done));
    });

    it('Can insert to a table column with polygon geometry', function (done) {
      async.series(
        [geomFixture.polygon1, geomFixture.polygon2, geomFixture.polygon3],
        curryInsertGeomRow(lbDs, 'PolygonTest'),
        curryOnDone('INSERT polygon', done));
    });
  });

  var populateGeomTables = function populateGeomTables(done) {
    async.eachSeries(
      [
        {
          data: [geomFixture.p2d1, geomFixture.p2d2, geomFixture.p2d3, geomFixture.p2d4, geomFixture.p2d5, geomFixture.p2d6],
          handler: curryInsertGeomRow(lbDs, 'PointTest')
        },
        {
          data: [geomFixture.p3d1, geomFixture.p3d2, geomFixture.p3d3, geomFixture.p3d4, geomFixture.p3d5, geomFixture.p3d6],
          handler: curryInsertGeomRow(lbDs, 'PointZTest')
        },
        {
          data: [geomFixture.polygon1, geomFixture.polygon2, geomFixture.polygon3],
          handler: curryInsertGeomRow(lbDs, 'PolygonTest')
        }
      ],
      function doPopulationGroup(groupModel, callback) {
        async.eachSeries(groupModel.data, groupModel.handler, callback);
      },
      curryOnDone('poulate tables', done)
    );
  };

  describe('UPDATE geometry', function describeModificationUseCases() {
    before(populateGeomTables);

    it('Can update a table column with point geometry', function (done) {
      assert(false, 'TODO');
      curryOnDone('TODO', done)('fail');
    });

    it('Can update a table column with pointZ geometry', function (done) {
      assert(false, 'TODO');
      curryOnDone('TODO', done)('fail');
    });

    it('Can update geometry in a table column with polygon geometry', function (done) {
      assert(true, 'TODO');
      curryOnDone('TODO', done)('fail');
    });
  });

  describe('SELECT geometry', function describeSelectionUseCases() {
    before(populateGeomTables);

    it('Can select geometry from a table column with point geometry', function (done) {
      assert(false, 'TODO');
      curryOnDone('TODO', done)('fail');
    });

    it('Can select geometry from a table column with pointZ geometry', function (done) {
      assert(false, 'TODO');
      curryOnDone('TODO', done)('fail');
    });

    it('Can select geometry from a table column with polygon geometry', function(done) {
      assert(false, 'TODO');
      curryOnDone('TODO', done)('fail');
    });
  });

  describe('WHERE clause with geometry', function describeComparisonUseCases() {
    beforeEach(populateGeomTables);

    describe('SELECT WHERE geometry', function describeSelectWhereUseCases() {
      it('Can select from a row chosen by point geometry', function (done) {
        assert(false, 'TODO');
        curryOnDone('TODO', done)('fail');
      });

      it('Can select from a row chosen by pointZ geometry', function (done) {
        assert(false, 'TODO');
        curryOnDone('TODO', done)('fail');
      });

      it('Can select from a row chosen by polygon geometry', function (done) {
        assert(false, 'TODO');
        curryOnDone('TODO', done)('fail');
      });
    });

    describe('DELETE WHERE geometry', function describeDeleteWhereUseCases() {
      it('Can delete from a row chosen by point geometry', function (done) {
        assert(false, 'TODO');
        curryOnDone('TODO', done)('fail');
      });

      it('Can delete from a row chosen by pointZ geometry', function (done) {
        assert(false, 'TODO');
        curryOnDone('TODO', done)('fail');
      });

      it('Can delete from a row chosen by polygon geometry', function (done) {
        assert(false, 'TODO');
        curryOnDone('TODO', done)('fail');
      });
    });

    describe('UPDATE WHERE geometry', function describeUpdateWhereUseCases() {
    });
  });
});

//var post;
//it('should create tables ', function (done) {
//  Post.create({title: 'T1', content: 'C1', approved: true}, function (err, p) {
//    should.not.exists(err);
//    post = p;
//    Post.findById(p.id, function (err, p) {
//      should.not.exists(err);
//      p.should.have.property('approved', true);
//      done();
//    });
//  });
//});
