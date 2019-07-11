'use strict';

var util = require('../../common_assets/util.js');

/**
 * Keycode 9
 */
exports.customonTab = function() {
  // add tab
  let pos= util.getCaretPosition();
  let selected_child = util.getCaretElement();
  let index = util.getRowIndex(selected_child);
  selected_child.textContent = util.str_splice(selected_child.textContent,pos,0,' '.repeat(4));
  util.setCaretPosition(selected_child.parentNode,index, pos+4);
};

/**
 * Keycode 32
 */
exports.customonEnter = function(){
  let activeLine = document.getElementsByClassName('textline-active');
  let level = util.getLevel(activeLine[0].innerText);
  let index = util.getRowIndex(activeLine[0]);

  let newLine = document.createElement('pre');
  newLine.classList.add('input-line','line-text','textline-active');
  var textNode = document.createTextNode(' '.repeat(level));
  newLine.appendChild(textNode);

  let caretPos = util.getCaretPosition();
  let selected_child = util.getCaretElement();
  let isEndofChild = (selected_child.length == caretPos);
  let isLastChild = util.getRowIndex(selected_child) == (selected_child.parentNode.childNodes.length - 1);
  
  if (isEndofChild && isLastChild){
  } else if (selected_child.parentNode.tagName == 'PRE') {
    let childIndex = util.getRowIndex(selected_child);
    if (!isEndofChild) {
      textNode = document.createTextNode(selected_child.textContent.slice(caretPos));
      newLine.appendChild(textNode);
      selected_child.textContent = selected_child.textContent.slice(0,caretPos);
    }
    childIndex++;
    let parentNode = selected_child.parentNode;
    while ( parentNode.childNodes[childIndex] != null) {
      newLine.appendChild(parentNode.childNodes[childIndex]);
    }
  } else if (selected_child.parentNode.tagName == 'SPAN') {
    let childIndex = util.getRowIndex(selected_child.parentNode);
    if (isEndofChild) { childIndex++; }
    let parentNode = selected_child.parentNode.parentNode;
    while ( parentNode.childNodes[childIndex] != null) {
      newLine.appendChild(parentNode.childNodes[childIndex]);
    }
  }
  return {
    index: index+1,
    content: newLine.innerHTML,
    level: level
  };
};