'use strict';

// default number of child nodes to display 
var DEFAULT_MAX_VISIBLE_CHILDS = 100;

function Node(params) {
  this.expanded = false;
  this.level = 0;
  if (params.level) this.level = params.level;

  if (params && (params instanceof Object)){
    this.setField(params.field, params.fieldEditable);
    if ('value' in params){
      this.setValue(params.value, params.type);
    }
    if ('interalValue' in params){
      this.setInternalValue(params.internalValue);
    }
  } else {
    this.setField('');
    this.setValue(null);
  }

  // starting value for visible children
  this.visibleChilds = this.getMaxVisibleChilds();
}

Node.prototype.setField = function(field, fieldEditable){
  this.previousField = this.field;
  this.field = field;
  this.fieldEditable = (fieldEditable === true);
};

/**
 * Set value. Value is a JSON structure or 
 * an element String, Boolean, etc.
 */
Node.prototype.setValue = function(value) {
  var childValue, child, visible;
  var i;
  var previousChilds = this.childs;

  this.type = this._getType(value);

  if (this.type === 'array') {
    if (!this.childs) this.childs = [];

    for (i=0; i< value.length; i++){
      childValue = value[i];
      if (childValue !== undefined && !(childValue instanceof Function)) {
        // reuse existing child
        if (i < this.childs.length) {
          child = value[i];
          child.fieldEditable = false;
          child.index = i;
          child.setValue(childValue);
        } else { // leaf node
          var wow = i;
          if (typeof childValue == 'object') {
            if (childValue.hasOwnProperty('class')) wow = 'Class';
            if (childValue.hasOwnProperty('association')) wow = 'Association';
          }
          child = new Node({
            field: wow,
            value: childValue,
            fieldEditable: false,
            level: this.level + 1
          });
          visible = i < this.getMaxVisibleChilds();
          this.appendChild(child,visible);
        }
      }
    }

    // cleanup redundant childs
    for (i = this.childs.length; i >= value.length; i--) {
        this.removeChild(this.childs[i]);
    }

    this.value = value;
  } else if (this.type === 'object') {
    if (!this.childs) this.childs = [];

    // cleanup redundant childs
    for (i = this.childs.length - 1; i >= 0; i--) {
      if (!value.hasOwnProperty(this.childs[i].field)) {
        this.removeChild(this.childs[i]);
      }
    }

    i = 0;
    for (var childField in value){
      if (value.hasOwnProperty(childField)){
        childValue = value[childField];
        if (childValue !== undefined && !(childValue instanceof Function)){
          child = this.findChildByProperty(childField);

          // reuse existing child
          if (child){
            child.setField(childField, true);
            child.setValue(childValue);           
          } else { //create a new child
            child = new Node({
              field: childField,
              value: childValue,
              level: this.level + 1
            });
            visible = i < this.getMaxVisibleChilds();
            this.appendChild(child, visible);
          }
        }
        i++;
      }
    }
    this.value = '';

  } else {
    // value
    // this.hideChilds();
    this.value = value;
  }

  this.previousValue = this.value; // used only to check for changes in DOM vs JS model
};

/**
 * Get value. Value is a JSON structure
 */
Node.prototype.getValue = function() {
  if (this.type == 'array') {
    var arr = [];
    this.childs.forEach (function (child) {
      arr.push(child.getValue());
    });
    return arr;
  }
  else if (this.type == 'object') {
    var obj = {};
    this.childs.forEach (function (child) {
      obj[child.getField()] = child.getValue();
    });
    return obj;
  }
  else {
    if (this.value === undefined) {
      return "";
    }
    return this.value;
  }
};

/**
 * Get field
 * @return {String}
 */
Node.prototype.getField = function() {
  if (this.field === undefined) {
    return '';
  }

  return this.field;
};

/**
 * Get value type
 */
Node.prototype._getType = function(value) {
  if (value instanceof Array) return 'array';
  if (value instanceof Object) return 'object';
  if (typeof(value) == 'string' && typeof(this._stringCast(value)) != 'string') return 'string';
  return 'auto';
};

/**
 * cast contents of a string to the correct type. This can be a string,
 * a number, a boolean, etc
 * @param {String} str
 * @return {*} castedStr
 * @private
 */
Node.prototype._stringCast = function(str) {
  var lower = str.toLowerCase(),
      num = Number(str),          // will nicely fail with '123ab'
      numFloat = parseFloat(str); // will nicely fail with '  '

  if (str == '') {
    return '';
  }
  else if (lower == 'null') {
    return null;
  }
  else if (lower == 'true') {
    return true;
  }
  else if (lower == 'false') {
    return false;
  }
  else if (!isNaN(num) && !isNaN(numFloat)) {
    return num;
  }
  else {
    return str;
  }
};

Node.prototype.findChildByProperty = function() {
  if (this.type !== 'object') return undefined;

  return this.childs.find(function (child){
    return child.field === prompt;
  });
};

Node.prototype.getMaxVisibleChilds = function (){
  return DEFAULT_MAX_VISIBLE_CHILDS;
 };

/************************************
 * Node child handling
 ************************************/
/**
 * Test if this node has childs. This is the case when the node is an object
 * or array.
 */
Node.prototype._hasChilds = function() {
  return this.type === 'array' || this.type === 'object';
};

/**
 * Set parent for node
 */
Node.prototype.setParent = function(parent) {
  this.parent = parent;
};

Node.prototype.appendChild = function(node, visible, index) {
  if (this._hasChilds()){
    node.setParent(this);
    node.fieldEditable = (this.type == "object");
    if (this.type == 'array') {
      node.index = this.childs.length;
    }
    if (this.type == 'object' && node.field == undefined) {
      node.setField('');
    }
    if (index == undefined) { this.childs.push(node); }
    else { this.childs.splice(index,0,node); }

    if (this.expanded && visible !== false) { this.visibleChilds++;}
  }
};

/**
 * Remove a child from the node.
 * Only applicable when Node value is of type array or object
 */
Node.prototype.removeChild = function(node){
  if (this.childs) {
    var index = this.childs.indexOf(node);

    if (index !== -1){
      if (index < this.visibleChilds && this.expanded){
        this.visibleChilds--;
      }

      // delete old search results
      // delete node.searchField;
      // delete node.searchValue;

      var removedNode = this.childs.splice(index, 1)[0];

      removedNode.parent = null;

      return removedNode;
    }
  }
  return undefined;
};

/**
 * Path interaction
 */
Node.prototype.setNodebyIndex = function(pathIndex,dest,val){
  var index = pathIndex.split('.');
  var child = this;
  for (var i= this.level+1; i < index.length; i++){
    if (child) child = child.childs[parseInt(index[i],10)];
  }
  if (dest == 'val') { child.value = val; } 
  else if (dest == 'field') { child.field = val; }
  else if (dest == 'delete') {
    child.parent.removeChild(child);
  }
  else if (dest == 'new'){
    if (child.type == "auto") child = child.parent;
    switch (val){
      case 'child-bool':
      case 'child-str':
        let childNode = new Node({
          field: (child.type == 'array') ? child.childs.length : "newNode",
          value: (val == 'child-bool') ? true :'please enter your value',
          fieldEditable: true,
          level: child.level + 1
        });
        let visible = i < this.getMaxVisibleChilds();
        child.appendChild(childNode,visible);
        break;
      case 'class':
      case 'association':
          childNode = new Node({
            field: (val == 'class')? "Class" : "Association",
            value: {},
            fieldEditable: true,
            level: child.level + 1
          });
          child.appendChild(childNode,true);
          let childchild = new Node({
            field: val,
            value: "",
            fieldEditable: true,
            level: childNode.level + 1
          });
          childNode.appendChild(childchild,true);
        break;
      case 'type_name':
          let childPGK = new Node({
            field:  child.childs.length,
            value: {},
            fieldEditable: true,
            level: child.level + 1
          });
          child.appendChild(childPGK,true);
          childNode = new Node({
            field: "type",
            value: "",
            fieldEditable: true,
            level: childPGK.level + 1
          });
          childPGK.appendChild(childNode,true);
          childNode = new Node({
            field: "name",
            value: "",
            fieldEditable: true,
            level: childPGK.level + 2
          });
          childPGK.appendChild(childNode,true);
        break;
      default: 
        childNode = new Node({
          field: val,
          value: (val == "attributes" || val == "ends" || val == "classes") ? [] : "",
          fieldEditable: true,
          level: child.level + 1
        });
        child.appendChild(childNode,true);
    }
    // if (val == 'up' || val == 'down') {
    //   child = child.parent;
    //   let childNode = new Node({
    //     field: (child.type == 'array') ? child.childs.length : dest,
    //     value: (val == 'child-bool') ? true :'please enter your value',
    //     fieldEditable: true,
    //     level: child.level + 1
    //   });
    //   let visible = i < this.getMaxVisibleChilds();
    //   let childIndex = parseInt(index[index.length-1],10) + ( val == 'down' ? 1 : 0);
    //   child.appendChild(childNode,visible,childIndex);
    // }
  }
}

module.exports = Node;