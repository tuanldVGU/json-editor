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
}

TreePath.prototype.setMainPath = function(root){
  let path = [];
  path = path.concat(tracking(root,"0","",0));
  path = lineTracking(path);
  this.path = path; 
}

function tracking(node,index,parent){
  let path = [{
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

function lineTracking(path){
  let line = 0;
  let indexLength = 1;
  path[0].line = 0;
  for (var i = 1; i<path.length; i++){
    if (path[i].index.length < indexLength) {line += 1 + (indexLength - path[i].index.length)/2;} else line++;
    indexLength = path[i].index.length;
    path[i].line = line;
  }
  return path;
}

TreePath.prototype.reset = function (){
  this.path = [];
  this.selectedPath = DEFAULT_PATH;
}; 

TreePath.prototype.getLine = function(index){
    for (var i= 0; i< this.path.length; i++){
      if (this.path[i].index == index) {
        return this.path[i].line+1;
      }
    }
}
TreePath.prototype.getPath = function(line){
    for (var i= 0; i< this.path.length; i++){
      if (this.path[i].line == line) {
        return this.path[i];
      }
    }
}


module.exports = TreePath;