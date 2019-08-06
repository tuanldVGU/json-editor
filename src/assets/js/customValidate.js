'use strict';

var util = require('../../components/common_assets/util');

var error = {
  format: {
    root_not_array: "The root must be array.",
    no_class_or_association: "There is no class or association in this child.",
    class_pair: "Class need to be pair with super, attributes or methods.",
    association_pair: "Association need to be pair with ends.",
    invalid_keyValue: "is preserve for key.",
    attributes_not_array: "Attribute must be type array.",
    attributes_duplicate: "Attribute is duplicated ",
    existed_element: function(e) {
      return "The following class is already declared " + e;
    }
  }
};
var preserved_keywords = ['class', 'attributes', 'association', 'ends'];

function errorMes(pos, error){
  return {
    column: pos.column,
    row: pos.row,
    text: error,
    type: 'error'
  };
}

exports.formatValidate = function (json_string){
  var me = this;
  let map = strtoLocation(json_string);
  var json = util.parse(json_string);
  let out = [];
  if (json instanceof Array) {
    let className = [];
    let associationName = [];
    json.every( function(element,i){
      let fields= [];
      try {
        var j=0;
        let location;
        let pos;
        for (var key in element){
          location = [0,i,j];
          pos = getPos(map,location);
          let value = element[key];
          if (!value instanceof Array) {
            if (preserved_keywords.includes(value)) 
              throw (errorMes(pos," \"" + node.value + "\" " + error.format.invalid_keyValue));
          }
          fields.push(key);
          className.push(me.UniqueIn(value,'class',className,pos));
          associationName.push(me.UniqueIn(value,'association',associationName,pos));
          if (key == 'attributes') {
            if (!json instanceof Array) throw (errorMes(pos,error.format.attributes_not_array));
            let checkAttribute = me.UniqueAttribute(value);
            if (checkAttribute) {
              location = location.concat(checkAttribute.index);
              pos = getPos(map,location);
              throw (errorMes(pos,error.format.attributes_duplicate +"\"" + checkAttribute.msg +"\""));
            }
          }
          j++;
        }
        location = [0,i];
        pos = getPos(map,location);
        if (!fields.includes('class') && !fields.includes('association') ) throw (errorMes(pos,error.format.no_class_or_association));
        else if (fields.includes('class') && !(fields.includes('super') || fields.includes('attributes')|| fields.includes('methodss'))) throw (errorMes(pos,error.format.class_pair));
        else if (fields.includes('association') && !fields.includes('ends')) throw(errorMes(pos,error.format.association_pair));
      } catch (err) {
        out.push(err);
        return;
      }
    });
  } else {
    let pos = getPos(map,[0]);
    out.push(errorMes(pos,error.format.root_not_array))
    return out;
  }
  return out;
}

exports.UniqueIn = function(val,unqElement,list,obj){
  if (val == "" && unqElement=="attributes") return val;
  if(!list.includes(val)) return val;
  else {
    throw (errorMes(obj,error.format.existed_element(unqElement) + " \""+ val +"\""));
  }
}

exports.UniqueAttribute = function(arr){
  var checkArray = [];
  for (var i = 0; i< arr.length; i++){
    var checkObj = "";
    var j = 0;
    for (var key in arr[i]){
      if (key == 'name') {
        checkObj = arr[i][key];
        break;
      }
      j++;
    }
    if (checkArray.includes(checkObj)) return {
      index: [i,j],
      msg: checkObj
    };
    else checkArray.push(checkObj);
  }
  return;
}

function strtoLocation(str){
  let rows = str.split('\n');
  let location = [0];
  let structure = [];
  rows.forEach(function(row,i){
    let isOpen = false;
    for (var j = 0; j < row.length; j++){
      switch (row.charAt(j)){
        case '[':
        case '{':
          if (!isOpen){
            let element = {
              index: location.join('.'),
              row: i,
              column: j 
            };
            structure.push(element);
          }
          location.push(0);
          break;
        case '\"':
          if (!isOpen) {
            isOpen = true;
            let element = {
              index: location.join('.'),
              row: i,
              column: j 
            };
            structure.push(element);
          }
          break;
        case ',':
          location[location.length-1] +=1;
          isOpen=false;
          break;
        case ']':
        case '}':
          location.pop();
          break;
      }
    }
  });
  return structure;
}

function getPos(map,index){
  for (var i=0 ; i<map.length; i++){
    if (map[i]['index'] == index.join('.')) {
      return {
        row: map[i]['row'],
        column: map[i]['column']
      }
    }
  }
}
