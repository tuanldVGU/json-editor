'use strict';

var util = require("../../common_assets/util.js");

var DEFAULT_PATH = "Select a node ...";

function TreePath(root){  
  if (!root){
    this.path = [];
    this.selectedPath = DEFAULT_PATH;
    return;
  }  
  this.path = [{
    level: 0,
    type: 'root',
    field: 'Root',
    value: '',
    showChild: true
  }];
  this.addNode(root,0);
}

TreePath.prototype.addNode = function(node, level){
  var nodeInfo = {};
  node.level = level;

  for (var i = 0; i < node.childs.length; i++){
    
  }
};

TreePath.prototype.setMainPath = function(root){
  var path = [];
  path = path.concat(tracking(root,"0",""));
  this.path = path; 
}

function tracking(node,index,parent){
  var path = [{
    index: index,
    nav: parent == "" ? node.field : parent + " &#8227; " + node.field
  }];
  if (node.childs && node.childs.length > 0){
    for (var i=0; i< node.childs.length; i++){
      path = path.concat(tracking(node.childs[i],index+"."+i,path[0].nav));
    }
  }
  return path;
}
TreePath.prototype.reset = function (){
  this.path = [];
  this.selectedPath = DEFAULT_PATH;
}; 

module.exports = TreePath;