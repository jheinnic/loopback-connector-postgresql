"use strict";

var DataSource = require('loopback-datasource-juggler').DataSource;

var config = require('rc')(
  'loopback',
  {
    test: {
      postgresql: {
        user: 'questiny',
        schema: 'wins_test',
        name: 'winsdb',
        host: 'localhost',
        port: 5432
      }
    }
  }).test.postgresql;

global.getDataSource = function initSUT() {
  var db = new DataSource(require('../'), config);
  db.log = function (msg) {
    console.log(msg);
  };
  return db;
};

global.getKnexPath = function initKnex() {
  return require('knex')({
    client: 'pg',
    connection: config
  });
};

global.getGeomFixture = function initGeomFixture() {
  var jsts = require('jsts');

  var geometryFactory = new jsts.geom.GeometryFactory();
  var crd1 = new jsts.geom.Coordinate(-1, 2);
  var crd2 = new jsts.geom.Coordinate(4, 4);
  var crd3 = new jsts.geom.Coordinate(-3, 5);
  var crd4 = new jsts.geom.Coordinate(5, 2);
  var crd5 = new jsts.geom.Coordinate(2, -3);
  var crd6 = new jsts.geom.Coordinate(-3, 2);

  var geoJSONWriter = new jsts.io.GeoJSONWriter(geometryFactory);

  return {
    geometryFactory: geometryFactory,
    wktReader: new jsts.io.WKTReader(geometryFactory),
    wktWriter: new jsts.io.WKTWriter(geometryFactory),
    geoJSONReader: new jsts.io.GeoJSONReader(geometryFactory),
    geoJSONWriter: geoJSONWriter,
    polygon1: geometryFactory.createPolygon(
      geometryFactory.createLinearRing([crd1, crd2, crd3, crd1]), null),
    polygon2: geometryFactory.createPolygon(
      geometryFactory.createLinearRing([crd1, crd2, crd4, crd1]), null),
    polygon3: geometryFactory.createPolygon(
      geometryFactory.createLinearRing([crd2, crd1, crd4, crd2]), null),
    p2d1: geoJSONWriter.write(
      geometryFactory.createPoint(crd1)),
    p2d2: geometryFactory.createPoint(crd2),
    p2d3: geometryFactory.createPoint(crd3),
    p2d4: geometryFactory.createPoint(crd4),
    p2d5: geometryFactory.createPoint(crd5),
    p2d6: geometryFactory.createPoint(crd6),
    p3d1: geometryFactory.createPoint(3, 4, 5),
    p3d2: geometryFactory.createPoint(2, 2, 7),
    p3d3: geometryFactory.createPoint(1, 1, 2),
    p3d4: geometryFactory.createPoint(0, 0, 7),
    p3d5: geometryFactory.createPoint(4, 0, 9),
    p3d6: geometryFactory.createPoint(-5, 10, 0)
  };
};

function getCommonSchema(modelName, schemaName, tableName, geoProperty) {
  return {
    "name": modelName,
    "idInjection": false,
    "options": {
      "name": modelName,
      "idInjection": false,
      // "base": "PersistedModel",
      "postgresql": {
        "schema": schemaName,
        "table": tableName
      }
    },
    "properties": {
      "uuid": {
        "type": "UUID", "required": false, "id": 1, "index": true, "postgresql": {
          "columnName": "uuid", "dataType": "uuid", "nullable": "NO"
        }
      },
      "name": {
        "type": "String", "required": true, "length": 255, "index": true, "sort": true,
        "postgresql": {
          "columnName": "name", "dataType": "VARCHAR", "dataSize": 255, "nullable": "NO"
        }
      },
      "quantity": {
        "type": "Number", "required": true, "postgresql": {
          "columnName": "quantity", "dataType": "INTEGER", "nullable": "NO"
        }
      },
      "reorderOn": {
        "type": "Date", "required": false, "postgresql": {
          "columnName": "recorder_on", "dataType": "TIMESTAMP", "nullable": "NO", default: "now()"
        }
      },
      "location": geoProperty
    }
  };
};

global.getPointSchema = function () {
  return getCommonSchema(
    "PointTest",
    "wins_test",
    "point_test",
    {
      "type": "Point", "required": true, "postgresql": {
        "columnName": "location", "dataType": "GEOMETRY(POINT,4326)", "nullable": "NO"
      }
    }
  );
};

global.getPointZSchema = function () {
  return getCommonSchema(
    "PointZTest",
    "wins_test",
    "pointz_test",
    {
      "type": "PointZ", "required": true, "postgresql": {
        "columnName": "location", "dataType": "GEOMETRY(POINTZ,4326)", "nullable": "NO"
      }
    }
  );
};

global.getPolygonSchema = function () {
  return getCommonSchema(
    "PolygonTest",
    "wins_test",
    "polygon_test",
    {
      "type": "Polygon", "required": true, "postgresql": {
        "columnName": "location", "dataType": "GEOMETRY(POLYGON,4326)", "index": true, "nullable": "NO"
      }
    }
  );
};

