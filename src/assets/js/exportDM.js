'use strict';

exports.toSQL = function (json){
  let sqlFile = "";
  json.forEach(element => {
    if (sqlFile != "") sqlFile += "\n";
    if ('class' in element) {sqlFile += classTable(element);}
    if ('association' in element) {sqlFile += associationTable(element);}
  });
  return sqlFile;
}

function classTable (obj){
  let output = "CREATE TABLE " + obj['class'] + " (\n" + obj['class'] + "_id int(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY";
  let fk = [];
  obj['attributes'].forEach(element => {
    let type = "";
    switch (element['type']){
      case 'String':
          type = "varchar(255)";
        break;
      case 'Integer':
          type = "int(11)";
        break;
      default:
          type = "int(11)";
          fk.push("FOREIGN KEY (" + element['type'] + "_id) REFERENCES " + element['type'] +"("+ element['type'] +"_id)");
        break;
    }
    output += ",\n"+element['name'] + " " + type + " DEFAULT NULL";
  });
  fk.forEach(element => {
    output += ",\n"+element;
  });
  output += "\n);";
  return output;
}

function addClassAttribute(class_name,name,type){
  let end = ";";
  switch (type){
    case 'String':
        end = "varchar(255);";
      break;
    case 'Integer':
        end = "int(11);";
      break;
    default:
        end = "int(11);\n ALTER TABLE " + class_name + "ADD FOREIGN KEY fk_" + class_name +"_";
      break;
  }
  return "ALTER TABLE " +  class_name + " ADD COLUMN at " + end;
}

function associationTable(obj){
  return "CREATE TABLE " + obj['association'] + " (\n" + obj['ends'][0] + " int,\n "+ obj['ends'][1] + " int, \n"+
        " FOREIGN KEY fk_"+ obj['classes'][0] + "_" + obj['ends'][0] + "(" +  obj['ends'][0] + ")\n"+
        " REFERENCES "+ obj['classes'][0] +"("+  obj['classes'][0] +"_id), \n" +
        " FOREIGN KEY fk_"+ obj['classes'][1] + "_" + obj['ends'][1] + "(" +  obj['ends'][1] + ")\n"+
        " REFERENCES "+ obj['classes'][1] +"("+  obj['classes'][1] +"_id));";
}