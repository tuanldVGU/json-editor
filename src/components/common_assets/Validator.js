'use strict';

var util = require('./util.js');
var Node = require('./Node.js');

exports.formatValidator = function (json_node){
  console.log(json_node instanceof Node);
}
