'use strict';

var util = require('./util.js');
var Node = require('./Node.js');
var error = {
  format: {
    root_not_array: "The root must be array.",
    no_class_or_association: "There is no class or association in this child.",
    class_pair: "Class need to be pair with super or attributes.",
    association_pair: "Association need to be pair with super or attributes.",
    invalid_keyValue: "is preserve for key.",
    attributes_not_array: "Attribute must be type array.",
    attributes_duplicate: "Attribute is duplicated ",
    existed_element: function(e) {
      return "The following class is already declared " + e;
    }
  }
};
var preserved_keywords = ['class', 'attributes', 'association', 'ends'];

function errorMes(index, error){
  if (index!="") index = "." + index;
  return {
    index: "0" + index,
    msg: error
  };
}

/*
 Validate a string containing a JSON object
*/
exports.validateSyntaxError = function(str){
  let err = {
    line: -1,
    msg: ""
  }
  let data = str.split('\n');
  err.line = parseInt(data[0].substring(20,data[0].length-1),10); 
  err.msg = data[3];
  return err;
};

exports.formatValidator = function (json_node){
  var me = this;
  if (!(json_node instanceof Node)) return;
  if (json_node.field === "root" ) {
    if (json_node.type == "array") {
      let className = [];
      let associationName = [];
      json_node.childs.forEach( function(element,i){
        let fields= [];
        element.childs.forEach( function(child,j){
          fields.push(child.field);
          className.push(me.UniqueIn(child,'class',className,i +"."+ j));
          associationName.push(me.UniqueIn(child,'association',associationName,i +"."+ j));
          if (child.field == "attributes") {
            if (child.type != "array") throw (errorMes(i + "." + j,error.format.attributes_not_array));
            let checkAttribute = me.UniqueAttribute(child.childs);
            if (checkAttribute) throw (errorMes(i + "." + j + checkAttribute.index,error.format.attributes_duplicate +"\"" + checkAttribute.msg +"\""));
          }
        });
        if (!fields.includes('class') && !fields.includes('association') ) throw (errorMes(i,error.format.no_class_or_association));
        else if (fields.includes('class') && !(fields.includes('super') || fields.includes('attributes'))) throw (errorMes(i,error.format.class_pair));
        else if (fields.includes('association') && !(fields.includes('super') || fields.includes('attributes'))) throw(errorMes(i,error.format.association_pair));
      });
      me.findInvalidValue(json_node,'root');
    }
    else {
      throw (errorMes("",error.format.root_not_array));
    }
  }
}

exports.findInvalidValue = function (node,location) {
  let me = this;
  if (node.type == "auto") {
    if (preserved_keywords.includes(node.value)) throw ({
      index: "0." + location,
      msg: location + " : \"" + node.value + "\" " + error.format.invalid_keyValue
    });
  } else {
    node.childs.forEach(function (element){
      me.findInvalidValue(element,location+'.'+element.field);
    });
  }
}

exports.UniqueIn = function(element,unqElement,list,obj){
  if (element.field == unqElement)  {
    if (element.value == "" && unqElement=="attributes") return element.childs;  
    if(!list.includes(element.value)) return element.value;
    else {
      let err = element.value == "" ? element.childs : element.value;
      throw (errorMes(obj,error.format.existed_element(unqElement) + "\""+ err +"\""));
    }
  }
}

exports.UniqueAttribute = function(arr){
  var checkArray = [];
  for (var i = 0; i< arr.length; i++){
    var checkObj = "";
    for (var j = 0; j< arr[i].childs.length; j++){
      if (arr[i].childs[j].field == 'name') {
        checkObj =arr[i].childs[j].value;
        break;
      }
    }
    if (checkArray.includes(checkObj)) return {
      index: "."+i+"."+j,
      msg: checkObj
    };
    else checkArray.push(checkObj);
  }
  return;
}
