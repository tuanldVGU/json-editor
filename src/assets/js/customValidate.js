'use strict';

var util = require('../../components/common_assets/util');

var error = {
  format: {
    root_not_array: "The root must be array.",
    no_class_or_association: "There is no class or association in this child.",
    class_pair: "Class need to be pair with super, attributes.",
    association_pair: "Association need to be pair with ends.",
    invalid_key: "is an undefined key.",
    attributes_not_array: "Attribute must be type array.",
    attributes_duplicate: "Attribute is duplicated ",
    existed_element: function(e) {
      return "The following class is already declared " + e;
    },
    ends_is_array: "Ends must be an array.",
    ends_length: "Ends must has more than 1 value."
  }
};
var preserved_keywords = ['class','association','super','ends','attributes','name','type'];

function errorMes(pos, error, type){
  return {
    column: pos.column,
    row: pos.row,
    text: error,
    type: type
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
    try {
      validKeyword(map,[0],json);
    } catch(err){
      out.push(err);
      return out;
    }
    json.every(function(element,i){
      try {
        let fields = [];
        var j=0;
        let location;
        let pos;
        for (var key in element){
          location = [0,i,j];
          pos = getPos(map,location);
          let value = element[key];
          fields.push(key);
          className.push(UniqueIn(value,'class',className,pos));
          associationName.push(UniqueIn(value,'association',associationName,pos));
          if (key == 'attributes') {
            if (!json instanceof Array) throw (errorMes(pos,error.format.attributes_not_array,'error'));
            let checkAttribute = UniqueAttribute(value);
            if (checkAttribute) {
              location = location.concat(checkAttribute.index);
              pos = getPos(map,location);
              throw (errorMes(pos,error.format.attributes_duplicate +"\"" + checkAttribute.msg +"\"",'error'));
            }
          }
          j++;
        }
        location = [0,i];
        pos = getPos(map,location);
        if (!fields.includes('class') && !fields.includes('association') ) throw (errorMes(pos,error.format.no_class_or_association,'error'));
        else if (fields.includes('class') && !(fields.includes('super') || fields.includes('attributes'))) throw (errorMes(pos,error.format.class_pair,'warning'));
        else if (fields.includes('association') && !fields.includes('ends')) throw (errorMes(pos,error.format.association_pair,'warning'));
      } catch (err) {
        out.push(err);
      }
      return (out.length <1);
    });
  } else {
    let pos = getPos(map,[0]);
    out.push(errorMes(pos,error.format.root_not_array));
    return out;
  }
  return out;
}

function validKeyword(map,res,json){
  let location;
  if (json instanceof Array) {
    json.forEach(function(element,i){
      location = res.slice(0);
      location.push(i);
      validKeyword(map,location,element);
    });
  }
  if (json instanceof Object){
    let pos;
    let keys = Object.keys(json);
    let values = Object.values(json);
    for (var i = 0; i<keys.length; i++){
      location = res.slice(0);
      location.push(i);
      pos = getPos(map,location);
      if (!preserved_keywords.includes(keys[i]) && isNaN(keys[i])) {
        throw (errorMes(pos," \"" + keys[i] + "\" " + error.format.invalid_key,'error'));
      }
      if (keys[i] == 'ends'){
        if (values[i] instanceof Array)  {
          if (values[i].length <= 1) throw (errorMes(pos,error.format.ends_length,'error'));
        }else throw (errorMes(pos,error.format.ends_is_array,'error'));
      }

      if (values[i] instanceof Array){
        validKeyword(map,location,values[i]);
      }
    }
  }
}

function UniqueIn(val,unqElement,list,obj){
  if (val == "" && unqElement=="attributes") return val;
  if(!list.includes(val)) return val;
  else {
    throw (errorMes(obj,error.format.existed_element(unqElement) + " \""+ val +"\"",'error'));
  }
}

function UniqueAttribute(arr){
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
