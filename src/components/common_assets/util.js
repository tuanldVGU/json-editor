'use strict';

var jsonlint = require('./jsonlint/jsonlint.js');
// var jsonMap = require('json-source-map');

// Parse JSON with more detail error throwback
exports.parse = function (jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    // try to throw a more detailed error message using validate
    exports.validate(jsonString);
    throw err; // then the original error
  }
};

/*
 Validate a string containing a JSON object
 This method uses JSONLint to validate the String. If JSONLint is not available, the built-in JSON parser of the browser is used.
*/
exports.validate = function (jsonString){
  if (typeof(jsonlint) != 'undefined') {
    jsonlint.parse(jsonString);
  }
  else {
    JSON.parse(jsonString);
  }
};

// Extend object a with the properties of object b
exports.extend = function (a, b) {
  for (var prop in b) {
    if (b.hasOwnProperty(prop)) {
      a[prop] = b[prop];
    }
  }
  return a;
};

// Remove all properties from object 
exports.clear = function (a){
  for (var prop in a) {
    if (a.hasOwnProperty(prop)) {
      delete a[prop];
    }
  }
  return a;
};

/**
 * Test whether a text contains a url (matches when a string starts
 * with 'http://*' or 'https://*' and has no whitespace characters)
 */
var isUrlRegex = /^https?:\/\/\S+$/;
exports.isUrl = function (text) {
  return (typeof text == 'string' || text instanceof String) &&
      isUrlRegex.test(text);
};

/**
 * Test whether a text contains a url (matches when a string starts
 * with 'http://*' or 'https://*' and has no whitespace characters)
 */
var isUrlRegex = /^https?:\/\/\S+$/;
exports.isUrl = function (text) {
  return (typeof text == 'string' || text instanceof String) &&
      isUrlRegex.test(text);
};

/**
 * Test whether a text contains a hexColor
 */
var isHexColorRegex = /^\#[0-9A-Fa-f]{6}$/;
exports.isHexColor = function (text) {
  return (typeof text == 'string' || text instanceof String) &&
      isHexColorRegex.test(text);
};

/**
 * Test whether is a Boolean
 */
exports.isBool = function (val) {
  return (typeof val == "boolean" || val instanceof Boolean);
};

/**
 * Test whether string is blank
 */
exports.str_isBlank = function(str){
  return (!str.replace(/\s/g, '').length) ? true : false;
}

/**
 * Get cursor location 
 */
exports.getCaretPosition = function() {
  if (window.getSelection && window.getSelection().getRangeAt && window.getSelection().rangeCount > 0) {
    var range = window.getSelection().getRangeAt(0);
    return range.startOffset;
  }
  return -1;
};

/**
 * Get cursor location with HTML tag 
 */
exports.getCaretPositionAll = function() {
  var saveElement = this.getCaretElement();
  if (saveElement && saveElement.parentNode.tagName =='SPAN') saveElement = saveElement.parentNode;
  if (saveElement && saveElement.parentNode.tagName =='FONT') saveElement = saveElement.parentNode;
  if (saveElement) {
    return {
      index: this.getRowIndex(saveElement),
      savePos: this.getCaretPosition(),
      saveParent: saveElement.parentNode,
      value: saveElement.nodeValue
    };
  }
  return {};
};

/**
 * Move caret to a specific point in a DOM element
 */
exports.setCaretPosition = function(el,dest, pos){
  if (el == undefined || dest == undefined || pos == undefined ) return;
  // Loop through all child nodes
  let i=0;
  for(var node of el.childNodes){
    if(i == dest){
      if (node.tagName == "SPAN") node = node.childNodes[0];
      if(node.length >= pos){
        // finally add our range
        var range = document.createRange(),
          sel = window.getSelection();
        range.setStart(node,pos);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return ; // we are done
      } else {break;}
    }
    i++;
  }
};

exports.getCaretElement = function() {
  if (window.getSelection && window.getSelection().getRangeAt && window.getSelection().rangeCount > 0)  {
    var range = window.getSelection().getRangeAt(0);
    return range.commonAncestorContainer;
  }
  return null;
};

/**
 * Get line level
 */
exports.getLevel = function(str){
  // let count = (str.includes('[') || str.includes('{')) ? 4 : 0;
  let count = 0;
	for (var i=0; i < str.length; i++){
    if (str.charAt(i) != ' ' && str.charAt(i) != '\t') return count;
    count += (str.charAt(i) == ' ')? 1 : 4; 
  }
  return count;
};

exports.isNewElement = function(checkElement,root,value) {
  let elementLength = checkElement.childNodes.length;
  let lastChild = checkElement.childNodes[ elementLength - 1];
  let rowIndex = this.getRowIndex(checkElement);
  let row = root.childNodes[rowIndex+1];
  let dest = -1;
  let pos = -1;
  if (lastChild.textContent == ",") {
    dest = (elementLength == 3 ? 1 : row.childNodes.length - 1);
    pos = 1;
  }
  else {
    dest = row.childNodes.length - 1;
    pos = lastChild.textContent[lastChild.textContent.length - 2] == "\"" ? 2 : 1;
    pos = (dest == 4 ? pos : row.childNodes[dest].innerText.length);
  }
  if (dest !=-1) {
    this.setCaretPosition(row,dest,pos);
    checkElement.innerHTML = value;	
    this.activeLine = this.setActiveLine();
  }
}

/**
 * Splice function for string
 */
exports.str_splice = function(str,start, delCount, newSubStr) {
	return str.slice(0, start) + newSubStr + str.slice(start + Math.abs(delCount));
};


/**
 * get Active Line 
 */
exports.getActiveLine = function(){
  return document.getElementsByClassName("textline-active")[0];
};

/**
 * set Active Line by the current caretPosition
 */
exports.setActiveLine = function() {
  let activeLines = document.getElementsByClassName('textline-active');
  if (activeLines.length>0) { activeLines[0].classList.remove('textline-active'); }
  let parent = this.getCaretElement().parentNode;
  if (parent.classList.contains('input-text-layer')) return 0;
  if (parent.tagName != 'PRE'){ parent = parent.parentNode; } //select line
  parent.classList.add('textline-active');
  return this.getRowIndex(parent);
};

/**
 * get child index
 */
exports.getRowIndex = function(node) {
  if (node == null) return;
  var i = 0;
  while (node = node.previousSibling) {
    ++i;
  }
  return i;
};

/**
 * Open Modal with id  = str
 */
exports.openModal = function(str){
  let modal = document.getElementById(str);
  let html = document.querySelector('html');
  modal.classList.add('is-active');
  html.classList.add('is-clipped');
}

/**
 * Close Modal with id  = str
 */
exports.closeModal = function(str){
  let modal = document.getElementById(str);
  let html = document.querySelector('html');
  modal.classList.remove('is-active');
  html.classList.remove('is-clipped');
}