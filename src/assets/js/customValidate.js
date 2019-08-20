'use strict';

var util = require('../../components/common_assets/util');

var error = {
  general: {
    invalid_root: "Input JSON must be array.",
    invalid_element: "Element must be a class or association.",
    class_pair: "Class should includes attributes or super.",
    association_pair: "Association should includes ends and classes.",
    invalid_key: "is an undefined key."
  },
  properties: {
    invalid_attributes: {
      type: "Attributes must be an array."
    },
    invalid_ends: {
      type:  "Ends must be an array.",
      length: "Please declared 2 ends."
    },
    invalid_classes: {
      type:  "Classes must be an array.",
      length: "Please declared 2 classes.",
      content: function(str){
        return "Class \""+str +"\" is not declared.";
      }
    },
    invalid_super: {
      name: function(str){
        return "Class \""+str +"\" is not declared.";
      },
      content: function(str){
        return "\""+str +"\" is an invalid super class.";
      }
    },
    invalid_attributes_type: "Attributes type is not defined."
  },
  duplicated: {
    existed_element: function(e) {
      return e + " is already exist.";
    }
  }
};
var preserved_keywords = ['class','association','super','ends','attributes','name','type','classes'];

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
  let map = strtoLocation(json_string); // map of object pos in the editor
  var json = util.parse(json_string);
  let out = [];
  // check if input json is an array
  if (json instanceof Array) { 
    // check if all of the keyword are valid
    try {
      validKeyword(map,[0],json);
    } catch(err){
      out.push(err);
      return out;
    }
    //check for uniqueness
    out = checkUniqueness(map,json);
    if (out.length > 0) return out;
    // check for general error
    json.every(function(element,i){
      try {
        let fields = [];
        let location,pos;
        for (var key in element){ fields.push(key);}
        location = [0,i];
        pos = getPos(map,location);
        if (!fields.includes('class') && !fields.includes('association') ) throw (errorMes(pos,error.general.invalid_element,'error'));
        else if (fields.includes('class') && !(fields.includes('super') || fields.includes('attributes'))) throw (errorMes(pos,error.general.class_pair,'error'));
        else if (fields.includes('association') && !(fields.includes('ends') || fields.includes('classes'))) throw (errorMes(pos,error.general.association_pair,'error'));
      } catch (err) {
        out.push(err);
      }
      return (out.length <1);
    });
  } else {
    let pos = {row: 0, column: 0};
    out.push(errorMes(pos,error.general.invalid_root,'error'));
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
        throw (errorMes(pos," \"" + keys[i] + "\" " + error.general.invalid_key,'error')); // invalid key
      }
      if (values[i] instanceof Array){
        validKeyword(map,location,values[i]);
      }
    }
  }
}

function checkUniqueness(map,json){
  let out = []
  let className = [];
  let associationName = [];
  let class_association_name = {};
  json.every(function(element,i){
    try {
      let fields = [];
      var j=0;
      let location,pos;
      for (var key in element){
        location = [0,i,j];
        pos = getPos(map,location);
        let value = element[key];
        fields.push(key);
        switch (key){
          case 'class':
            className.push(UniqueIn(value,'class',className,pos)); // unique class
            class_association_name[value] = [];
            break;
          case 'association':
            associationName.push(UniqueIn(value,'association',associationName,pos)); // unique association
            break;
          case 'super':
            if ('class' in element) {
              if (!(className.includes(value))) throw (errorMes(pos,error.properties.invalid_super.name(value),'error'));
              if (value.includes(element['class'])) throw (errorMes(pos,error.properties.invalid_super.content(element['class']),'error')); //invalid content
            }
            break;
          case 'attributes':
            if (!(value instanceof Array)) throw (errorMes(pos,error.properties.invalid_attributes.type,'error')); //invalid attribute type
            let checkAttribute = UniqueAttribute(value);
            if (checkAttribute) {
              location = location.concat(checkAttribute.index);
              pos = getPos(map,location);
              throw (errorMes(pos,error.duplicated.existed_element('attributes'),'error')); //duplicated attributes
            }
            break;
          case 'ends':
            if (value instanceof Array)  {
              if (value.length != 2) throw (errorMes(pos,error.properties.invalid_ends.length,'error'));
              if (element['classes']){
                let x = 0;
                for (var item of element['classes']){
                  // class is not declared
                    location.push(x);
                    pos = getPos(map,location);
                    // unique ends
                    class_association_name[item].push(UniqueIn(element['ends'][x],'ends',class_association_name[item],pos));
                  x++;
                }
              }
            } else throw (errorMes(pos,error.properties.invalid_ends.type,'error'));
            break;
          case 'classes':
            if (value instanceof Array)  {
              if (value.length != 2) throw (errorMes(pos,error.properties.invalid_classes.length,'error'));
              for (var item of value ){
                // class is not declared
                if (!className.includes(item)) throw (errorMes(pos,error.properties.invalid_classes.content(item),'error'));
              }
            } else throw (errorMes(pos,error.properties.invalid_classes.type,'error'));
            break;
        }
        j++;
      }
    } catch (err) {
      out.push(err);
    }
    return (out.length <1);
  });
  return out;
}

/**
 * Check if val is unique in a list
 * @param {*} val 
 * @param {*} unqElement 
 * @param {*} list 
 * @param {*} obj 
 */
function UniqueIn(val,unqElement,list,obj){
  if (val == "" && unqElement=="attributes") return val;
  if(!list.includes(val)) return val;
  else {
    throw (errorMes(obj,error.duplicated.existed_element(unqElement),'error'));
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
