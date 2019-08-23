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
  let output = "CREATE TABLE " + obj['class'] + " (\n\t" + obj['class'] + "_id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY";
  let fk = [];
  obj['attributes'].forEach(element => {
    let type = "";
    switch (element['type']){
      case 'String':
          type = "VARCHAR(255)";
        break;
      case 'Integer':
          type = "INT(11)";
        break;
      default:
          type = "INT(11)";
          fk.push("FOREIGN KEY (" + element['type'] + "_id) REFERENCES " + element['type'] +"("+ element['type'] +"_id)");
        break;
    }
    output += ",\n\t"+element['name'] + " " + type + " DEFAULT NULL";
  });
  fk.forEach(element => {
    output += ",\n"+element;
  });
  output += "\n) ENGINE=InnoDB;";
  return output;
}

function addClassAttribute(class_name,name,type){
  let end = ";";
  switch (type){
    case 'String':
        end = "VARCHAR(255);";
      break;
    case 'Integer':
        end = "INT(11);";
      break;
    default:
        end = "INT(11);\n ALTER TABLE " + class_name + "ADD FOREIGN KEY fk_" + class_name +"_";
      break;
  }
  return "ALTER TABLE " +  class_name + " ADD COLUMN at " + end;
}

function associationTable(obj){
  return "CREATE TABLE " + obj['association'] + 
        " (\n\t" + obj['ends'][0] + " INT(11),\n\t"
        + obj['ends'][1] + " INT(11), \n"+
        "\tCONSTRAINT fk_"+ obj['classes'][1] + "_" + obj['ends'][0] + " FOREIGN KEY (" +  obj['ends'][0] + ")\n"+
        "\tREFERENCES "+ obj['classes'][1] +"("+  obj['classes'][1] +"_id), \n" +
        "\tCONSTRAINT fk_"+ obj['classes'][0] + "_" + obj['ends'][1] + " FOREIGN KEY (" +  obj['ends'][1] + ")\n"+
        "\tREFERENCES "+ obj['classes'][0] +"("+  obj['classes'][0] +"_id)\n) ENGINE=InnoDB;";
}