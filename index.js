console.log("index.js loaded");
// console.log(deck);

/** global variables */
let hand = [];
let completed = 0;

let tileSelected = 0;
let dragging = false;
let dragTile = 0;

/**
 * grab canvas and 2d drawing context
 */
var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");

/** canvas properties */
context.font = "30px Arial";

/** next button */
context.fillStyle = "green";
context.fillRect(200,500,100,100);

/**
 * @function paintBar
 * paint the bottom bar of the player's tiles
 */
function paintBar ()
{
    // canvas properties
    context.fillStyle = "brown";
    context.strokeStyle = "#ffff00";

    /** x,y,w,h */
    context.fillRect(100,650,1200,150);
    context.strokeRect(100,650,1200,150);
}
paintBar();

/**
 * @function paintTiles
 * paint player tiles
 */
function paintTiles ()
{
    for (let i=0; i<hand.length; ++i)
    {
        // DISPLAY ALL TILES (60x76)
        let x = 110 + (i*70);
        context.fillStyle = "white";
        context.fillRect(x,690,60,76);
        context.fillStyle = "blue";
        context.fillText(hand[i],x,750);
    }
}
// paintTiles();

/**
 * @function paintGroups
 * paint player groups
 */
function paintGroups ()
{
    /**
     * CHECK GROUPINGS
     * groupings will have lightgreen underline if valid
     * otherwise red underline
     */
    let groups = hand.length / 3;
    for (let i=0; i<groups-1; ++i)
    {
        let x = 120 + (i*210);
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
        context.fillRect(x,775,180,10);
    }
}
// paintGroups();

/**
 * @EventListener mousemove
 * 
 * capture mouse movement as event
 * display xOffset, yOffset on screen
 * 1: continuing tile drag
 */
canvas.addEventListener("mousemove", (e) => {
    // display offset
    let text = "x: " + e.offsetX + ", y: " + e.offsetY;
    context.clearRect(100, 70, 400, 50);
    context.fillText(text, 100, 100);
    
    /** currently moving mahjong tile */
    if (dragging)
    {
        let tileX = Math.floor((e.offsetX - 110)/70);

        // keep us in boundsc
        if (tileX < 0) tileX = 0;
        if (tileX > hand.length-1) tileX = hand.length-1;

        /** indicate where the tile is being placed */
        context.fillStyle = "brown";
        context.fillRect(110,670,1120,10);
        context.fillStyle = "yellow";
        context.fillRect(120+(70*tileX),670,40,10);
    }

    // console.log(e);
});


/**
 * @EventListener mousedown
 * 
 * capture mouse down event
 * 1: initial tile draw
 * 2: drag tile
 */
canvas.addEventListener("mousedown", (e) => {
    // condition: initial tile draw
    if (200 < e.offsetX && e.offsetX < 300 && 500 < e.offsetY && e.offsetY < 600)
    {
        // initial draw (16 tiles) or first
        if (!hand.length)
            for (let i=0; i<16; ++i)
                drawTile();
        else
            drawTile();

        // paint tiles and groups in hand after draw
        paintTiles();
        paintGroups();
    }
    // condition: mahjong tile is pressed
    else if(690 < e.offsetY && e.offsetY < 766
            && 110 < e.offsetX && e.offsetX < 110+hand.length*70)
    {
        // set global variable: which tile are we grabbing
        tileSelected = Math.floor((e.offsetX - 110)/70);

        // @debug show tile
        context.clearRect(0, 0, 100, 100);
        context.fillText(tileSelected + " " + hand[tileSelected],50,50);

        // indicate which tile we are dragging
        context.fillStyle = "yellow";
        context.fillRect(120+(70*tileSelected),670,40,10);

        // blank out selected tile
        context.fillStyle = "gray";
        context.fillRect(110+(tileSelected*70),690,60,76);

        console.log(e.offsetX, tileSelected, hand[tileSelected]);

        // set global variable
        dragging = true;
    }

    // console.log(e);
});


/**
 * @EventListener mouseup
 * 
 * canvas listens for mouse up events
 */
canvas.addEventListener("mouseup", (e) => {
    // remove the tile placing indicator
    context.fillStyle = "brown";
    context.fillRect(110,670,1120,10);


    if (dragging)
    {
        let tileReplaced = Math.floor((e.offsetX - 110)/70); 

        /**
         * if it was the same tile don't change hand
         * otherwise remove and replace tile
         */
        if (tileSelected != tileReplaced)
        {
            // swap method
            [hand[tileSelected], hand[tileReplaced]] = [hand[tileReplaced], hand[tileSelected]];

            /** SPLICE METHOD
                // array destructuring to get `tile` that we remove from hand
                let [tile] = hand.splice(tileSelected,1);
                // add tile back to hand at specified index
                hand.splice(tileReplaced, 0, tile);
            */
        }

        paintTiles();
        paintGroups();
    }
    dragging = false;

    console.log("lifted");
});

function drawTile ()
{
    // remove first tile from deck
    let [tile] = deck.splice(0,1);

    // add tile to the hand
    hand.push(tile);

    // update hand
    paintBar();

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