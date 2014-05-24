node-callwatch
==============

Monitor your application by tracking function calls


### How to use


```javascript
"use strict";

var callwatch = require("callwatch");

callwatch.configure({
  aws: {
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-1"
  },
  namespace: "CATEGORY/MyApp"
});


// Define a pair of simple functions
function sum(a, b)
{
  return a + b;
}

function diff(a, b)
{
  return a - b;
}


// Create tracked clones of the functions
var trackedSum  = callwatch.watchify(sum, {
  metricName: "computations", 
  metricType: "sum"
});

var trackedDiff = callwatch.watchify(diff, {
  metricName: "computations", 
  metricType: "difference"
});


// Call functions every 1 sec
setInterval(function () {
  trackedSum(1, 2);

  for (var times = 0; times < 5; times += 1) {
    trackedDiff(2, 1);
  } 
}, 1000);
```
