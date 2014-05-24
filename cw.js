"use strict";


var aws = require("aws-sdk");
var Promise = require("bluebird");
var _ = require("lodash");




// Module configuration
var defaultNamespace;
var log;
var cw;
var putMetricData;



function configure(config)
{
  config = config || {};

  if (_.isObject(config.aws)) {
    aws.config.update(config.aws);
  }
  if (_.isString(config.namespace)) {
    defaultNamespace = config.namespace;
  }

  // Support for bunyan logger
  if (config.log) {
    log = config.log;    
  } else {
    log = console;
  }

  cw = new aws.CloudWatch({
    apiVersion: "2010-08-01"
  });

  putMetricData = Promise.promisify(cw.putMetricData, cw);

  // For testing purposes
  module.exports._internals = {
    cw: cw,
    defaultNamespace: defaultNamespace,
    log: log,
    putMetricData: putMetricData
  };
}



function incrementMetric(metricName, metricType, namespace)
{
  if (!cw) {
    throw new Error("Not initialized");
  }

  return putMetricData({
    Namespace: namespace || defaultNamespace,
    MetricData: [{
      MetricName: metricName,
      Timestamp: new Date(),
      Value: 1,
      Unit: "Count",
      Dimensions: [{
        Name: "Type",
        Value: metricType
      }]
    }]
  }).then(function (result) {
    if (!result) {
      throw new Error("Couldn't put metric");
    }
  });
}



// Creates a clone of a function that pushes a metric to CW 
// at every call
function watchify(func, options, context)
{
  if (!_.isFunction(func)) {
    throw new Error("func must be a function");
  }
  if (!_.isObject(options)) {
    throw new Error("options must be an object");
  }
  if (!_.isString(options.metricName)) {
    throw new Error("options.metricName must be a string");
  }
  if (!_.isString(options.metricType)) {
    throw new Error("options.metricType must be a string");
  }
  if (options.namespace && !_.isString(options.namespace)) {
    throw new Error("options.namespace must be string");
  }
  if (!defaultNamespace && !options.namespace) {
    throw new Error("namespace is mandatory as no default namespace had been set");
  }

  // We create a copy of the standard 
  var incrementFunc = incrementMetric.bind(
    null, options.metricName, options.metricType, context
  );

  return function () {
    Promise.try(incrementFunc).catch(function (err) {
      var error = new Error("Couldn't put metric");
      
      error.metricName = options.metricName;
      error.metricType = options.metricType;
      error.error = err;

      log.warn(error);
    }).done();

    return func.apply(context, arguments); 
  };
}



module.exports = {
  configure: configure,
  watchify: watchify,

  // For testing purposes only
  _internals: {
    incrementMetric: incrementMetric,
    cw: cw,
    log: log,
    defaultNamespace: defaultNamespace,
    putMetricData: putMetricData
  }
};
