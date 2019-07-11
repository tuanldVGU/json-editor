/**
 * Set up key-press for editor
 */

document.addEventListener('keydown',this.keyHandler,false);


function keyHandler(e) {
  if (e.keyCode == 9){ // tab prevent default
    e.preventDefault();
  }
}