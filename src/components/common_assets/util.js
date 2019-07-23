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
        // then the original error
        throw err;
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
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds.
 */
exports.debounce = function (func, wait, immediate){
  var timeout;
  return function() {
    var context = this, arg = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context,args);
    }
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context,args);
  };
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
  if (window.getSelection && window.getSelection().getRangeAt && window.getSelection.rangeCount > 0) {
    var range = window.getSelection().getRangeAt(0);
    var selectedObj = window.getSelection();
    var rangeCount = 0;
    var childNodes = selectedObj.anchorNode.parentNode.childNodes;
    for (var i = 0; i < childNodes.length; i++) {
      if (childNodes[i] == selectedObj.anchorNode) {
        break;
      }
      if (childNodes[i].outerHTML)
        rangeCount += childNodes[i].outerHTML.length;
      else if (childNodes[i].nodeType == 3) {
        rangeCount += childNodes[i].textContent.length;
      }
    }
    return range.startOffset + rangeCount;
  }
  return -1;
};

/**
 * Move caret to a specific point in a DOM element
 */
exports.setCaretPosition = function(el,dest, pos){
  // Loop through all child nodes
  let i=0;
  for(var node of el.childNodes){
    if(i == dest){ // we have a text node
      if(node.length >= pos){
        // finally add our range
        var range = document.createRange(),
          sel = window.getSelection();
        range.setStart(node,pos);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return -1; // we are done
      }else{
        break;
      }
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
  let count = (str.includes('[') || str.includes('{')) ? 4 : 0;
	for (var i=0; i < str.length; i++){
    if (str.charAt(i) != ' ' && str.charAt(i) != '\t') return count;
    count += (str.charAt(i) == ' ')? 1 : 4; 
  }
  return count;
};

/**
 * Splice function for string
 */
exports.str_splice = function(str,start, delCount, newSubStr) {
	return str.slice(0, start) + newSubStr + str.slice(start + Math.abs(delCount));
};

exports.str_isBlank = function(str){
  return (!str.replace(/\s/g, '').length) ? true : false;
}

exports.setActiveLine = function() {
  if (document.getElementsByClassName('textline-active').length > 0) { document.getElementsByClassName('textline-active')[0].classList.remove('textline-active'); }
  var el;
  if (this.getCaretElement().parentNode.tagName == 'PRE') { el = this.getCaretElement().parentNode; }
  else { el = this.getCaretElement().parentNode.parentNode; }
  el.classList.add('textline-active');
  var i = 0;
  while ( (el = el.previousSibling) != null){
    i++;
  } 
  return i;
};

exports.getRowIndex = function(node) {
  if (node == null) return;
  var i = 0;
  while (node = node.previousSibling) {
    ++i;
  }
  return i;
};

exports.openModal = function(str){
  let modal = document.getElementById(str);
  let html = document.querySelector('html');
  modal.classList.add('is-active');
  html.classList.add('is-clipped');
}

exports.closeModal = function(str){
  let modal = document.getElementById(str);
  let html = document.querySelector('html');
  modal.classList.remove('is-active');
  html.classList.remove('is-clipped');
}