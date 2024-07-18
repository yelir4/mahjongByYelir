console.log("index.js loaded");

var canvas = document.getElementById("gameCanvas");
/** get 2d context of the canvas */
var context = canvas.getContext("2d");

/** canvas properties */
context.fillStyle = "darkgreen";
context.strokeStyle = "#ffff00";
context.font = "20px Arial";

/** x, y, w, h */
context.fillRect(100,700,700,100);
context.strokeRect(100,700,700,100);

/** line */
context.beginPath();
context.moveTo(200, 200);
context.lineTo(300, 100);
context.stroke();

context.fillText("hello mahjong", 50.5, 50.5);


/** arc/circle (radians)
 * x, y, r, startangle, endangle, draw direction
 */
context.beginPath();
context.arc(300, 300, 30, 0, Math.PI*2, false);
context.stroke();
context.fill();