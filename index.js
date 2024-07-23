console.log("index.js loaded");
// console.log(deck);

/** global variables */
let hand = [];
let completed = 0;

/**
 * grab canvas and 2d drawing context
 */
var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");

/** canvas properties */
context.font = "30px Arial";

/** @function bottomHand */
function bottomHand ()
{
    // canvas properties
    context.fillStyle = "brown";
    context.strokeStyle = "#ffff00";

    /** x,y,w,h */
    context.fillRect(100,700,1200,100);
    context.strokeRect(100,700,1200,100);
}
bottomHand();

/** next button */
context.fillStyle = "green";
context.fillRect(200,500,100,100);

/**
 * @EventListener mousedown
 * 
 * canvas listens for mouse down events
 */
canvas.addEventListener("mousemove", (e) => {
    let text = "x: " + e.offsetX + ", y: " + e.offsetY;
    context.clearRect(100, 70, 200, 50);
    context.fillText(text, 100, 100);

    // if (200 < e.offsetX && e.offsetX < 300 && 500 < e.offsetY && e.offsetY < 600)
    // {
    //     for (let i=0; i<16; ++i)
    //     {
    //         drawTile();
    //     }
    // }

    // console.log(e);
});


/**
 * @EventListener mousedown
 * 
 * canvas listens for mouse down events
 */
canvas.addEventListener("mousedown", (e) => {
    // initial tile draw
    if (200 < e.offsetX && e.offsetX < 300 && 500 < e.offsetY && e.offsetY < 600)
    {
        // draw 16 tiles
        for (let i=0; i<16; ++i)
        {
            drawTile();
        }

        // DISPLAY HAND
        for (let i=0; i<hand.length; ++i)
        {
            // DISPLAY ALL TILES
            let x = 110 + (i*60);
            context.fillStyle = "white";
            context.fillRect(x,720,50,50);
            context.fillStyle = "blue";
            context.fillText(hand[i],x,750);
            

        }

        // CHECK GROUPINGS
        let groups = hand.length / 3;
        for (let i=0; i<groups-1; ++i)
        {
            let x = 120 + (i*180);
            // convert numeral to int
            // suit is the second character in the substring "9c"
            let numbers = [];
            numbers.push(+hand[i].substring(0,1));
            numbers.push(+hand[i+1].substring(0,1));
            numbers.push(+hand[i+2].substring(0,1));
            // sort `numbers` in increasing order
            numbers.sort((a,b) => a-b);

            let suit2 = hand[i].substring(1);
            let suit0 = hand[i+1].substring(1);
            let suit1 = hand[i+2].substring(1);

            /**
             * 1: tiles must match suit (c,c,c)
             * 2: EITHER exact number match (2,2,2) OR subsequent run (1,2,3)
             */
            if (suit0 == suit1 && suit0 == suit2
                &&
                    ((numbers[0] == numbers[1] && numbers[0] == numbers[2])
                    || (numbers[1]-numbers[0] == 1 && numbers[2]-numbers[1] == 1)))
            {
                context.fillStyle = "lightgreen";
            }
            else
            {
                context.fillStyle = "red";
            }
            context.fillRect(x,780,150,10);
        }
    }

    console.log(e);
});

function drawTile ()
{
    // remove first tile from deck
    let tile = deck[0];
    deck.splice(0,1);

    // add tile to the hand
    hand.push(tile);

    // update hand
    bottomHand();

    console.log(tile, hand, deck.length);
}

/** line */
// context.beginPath();
// context.moveTo(200, 200);
// context.lineTo(300, 100);
// context.stroke();

/** arc/circle (radians)
 * x, y, r, startangle, endangle, draw direction
 */
// context.beginPath();
// context.arc(300, 300, 30, 0, Math.PI*2, false);
// context.stroke();
// context.fill();