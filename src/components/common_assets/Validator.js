'use strict';

var util = require('./util.js');
var Node = require('./Node.js');
var error = {
  format: {
    root_not_array: "The root must be array.",
    no_class_or_association: "There is no class or association in this child.",
    class_pair: "Class need to be pair with super or attributes.",
    association_pair: "Association need to be pair with super or attributes.",
    invalid_keyValue: "is preserve for key."
  }
};
var preserved_keywords = ['class', 'attributes', 'association', 'ends'];

exports.formatValidator = function (json_node){
  if (!(json_node instanceof Node)) return;
  if (json_node.field === "root" ) {
    let errors = [];
    if (json_node.type == "array") {
      json_node.childs.forEach( function(element,i){
        let fields= [];
        element.childs.forEach( function(child){
          fields.push(child.field);
        });
        if (!fields.includes('class') && !fields.includes('association') ) errors.push("Object "+ i +" has error: " + error.format.no_class_or_association);
        else if (fields.includes('class') && !(fields.includes('super') || fields.includes('attributes'))) errors.push("Object "+ i +" has error: " + error.format.class_pair);
        else if (fields.includes('association') && !(fields.includes('super') || fields.includes('attributes'))) errors.push("Object "+ i +" has error: " + error.format.association_pair);
      });
      let invalid_keyValue_errors = this.findInvalidValue(json_node,'root');
      errors = errors.concat(invalid_keyValue_errors);
      // console.log(this.findInvalidValue(json_node,'root'));
    }
    else {
      errors.push(error.format.root_not_array);
    }
    if (errors!=[]) throw errors;
  }
}

exports.findInvalidValue = function (node,location) {
  let me = this;
  if (node.type == "auto") {
    if (preserved_keywords.includes(node.value)) return (location + " : \"" + node.value + "\" " + error.format.invalid_keyValue);
    return [];
  } else {
    let error = [];
    node.childs.forEach(function (element){
      error = error.concat(me.findInvalidValue(element,location+'>'+element.field));
    });
    return error;
  }
}
