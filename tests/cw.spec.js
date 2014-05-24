"use strict";


/* global it,describe */

var assert = require("chai").assert;
var cw = require("../cw");


describe("cw", function () {
  describe("#configure", function () {
    it("should recreate a cloudwatch client at every update", function () {
      var initialCW = cw._internals;
      
      cw.configure({});

      assert.ok(initialCW !== cw._internals.cw);
    });

    it("should assign the default namespace", function () {
      var TEST_NAMESPACE = "JACK/app";
      
      cw.configure({ 
        namespace: TEST_NAMESPACE 
      });

      assert.strictEqual(cw._internals.defaultNamespace, TEST_NAMESPACE);
    });

    it("should accept a custom logger", function () {
      var myLogger = {
        warn: function () {}
      };

      cw.configure({ 
        log: myLogger
      });

      assert.strictEqual(cw._internals.log, myLogger);
    });

    it("should promisify the putMetricData function", function () {
      cw.configure({});

      assert.isFunction(cw._internals.putMetricData);
    });
  });

  describe("#watchify", function () {
    it("shouldn't accept bad parameters", function () {
      assert.throws(function () {
        cw.watchify(null, {});
      });
      
      assert.throws(function () {
        cw.watchify(function () {}, null);
      });

      
      var testAgainstNonStringValues = function (property) {
        var values = [null, 123, false, undefined];
        
        values.forEach(function (value) {
          assert.throws(function () {
            var options = {};
            options[property] = value;

            cw.watchify(function () {}, options);
          });
        });
      };

      ["metricName", "metricType", "namespace"].forEach(function (property) {
        testAgainstNonStringValues(property);
      });
    });

    it("should return a new function", function () {
      cw.configure();

      var SAMPLE_FUNC = function () {};
      var promisified = cw.watchify(SAMPLE_FUNC, {
        metricName: "coucou",
        metricType: "coucou",
        namespace: "hello"
      });

      assert.notEqual(SAMPLE_FUNC, promisified);
      assert.isFunction(promisified);
    });
  });
});
