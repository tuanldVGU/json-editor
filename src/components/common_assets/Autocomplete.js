'use strict';
import {eventBus} from '../../main.js';

var arr = ['class','association','super','ends','attributes','name','type','interface','operation','return','multiplicity'];

function outOultine(node_index,change){
  let msg = {
    target: 'field',
    index: node_index,
    change: change
  };
  eventBus.$emit('onChangeValue',msg);
}

function outInput(element,change){
  let msg = {
    element: element,
    change: "\"" + change + "\": \"Enter value\""
  }
  eventBus.$emit('onChangeInput',msg);
}

export function autocomplete (inp, out, node_index) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  var currentFocus = -1;
  var val = inp.innerText.replace(/\s/g,'');
  closeAllLists();
  /*create a DIV element that will contain the items (values):*/
  let result = document.createElement("DIV");
  result.setAttribute("class", "autocomplete-items");
  if (out == 0) result.setAttribute("style","top:"+(inp.offsetTop+26)+"px; left:"+(inp.innerText.length*10)+"px;");
  result.style.display = "none";
  inp.parentNode.appendChild(result);
  /*for each item in the array...*/
  for (var i = 0; i < arr.length; i++) {
    /*check if the item starts with the same letters as the text field value:*/
    if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase() && val != "") {
      /*create a DIV element for each matching element:*/
      let result_item = document.createElement("DIV");
      /*make the matching letters bold:*/
      result_item.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
      result_item.innerHTML += arr[i].substr(val.length);
      /*execute a function when someone clicks on the item value (DIV element):*/
      result_item.addEventListener("click", function(e) {
        let outText = this.innerText;
        /*insert the value for the autocomplete text field:*/
        if (out == 1) {
          inp.innerText = outText;
          outOultine(node_index,inp.innerText);
        }
        else outInput(inp,outText);
        /*close the list of autocompleted values,
        (or any other open lists of autocompleted values:*/
        closeAllLists();
      });
      result.appendChild(result_item);
    }
  }

  if (result && result.childNodes.length > 0) result.style.display = "block";

  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function(e) {
    var x = document.getElementsByClassName("autocomplete-items")[0];
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      e.preventDefault();
      /*If the arrow DOWN key is pressed, increase the currentFocus variable:*/
      currentFocus++;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 38) { //up
      e.preventDefault();
      /*If the arrow UP key is pressed, decrease the currentFocus variable:*/
      currentFocus--;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 13) { //enter
      e.preventDefault();
      /*and simulate a click on the "active" item:*/
      if (x) {x[currentFocus].click();}
    }
  });

  function addActive(x) {
    if (!x) return;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
}
