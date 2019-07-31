function hoverPreview(selector) {
  var element = document.querySelector(selector);
  
  window.onmousemove = function (e) {
    var x = e.clientX,
        y = e.clientY;
        element.style.top = (y + 20) + 'px';
        element.style.left = (x + 20) + 'px';
  }
}

hoverPreview('#tooltip-span');