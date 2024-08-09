console.log("index.js loaded");
// console.log(deck);

/** global variables */
let hand = [];
let completed = 0;

let tileReplaced = 0;
let tileSelected = 0;
let dragging = false;
let dragTile = 0;

/** wait, draw, throw */
let turn = "draw";
/** eyes, triples, 7 pairs */
let handType = "eyes";

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

/** initial hand type paint */
context.fillStyle = "white";
context.fillRect(1320,650,100,40);
context.fillRect(1320,700,100,40);
context.fillRect(1320,750,100,40);

/**
 * @function between
 * basically: is `val` between `lo` and `hi` inclusive
 * @returns true/false
 */
function between (val, lo, hi)
{
    return lo <= val && val <= hi;
}

/**
 * @function paintHandType
 * paint the hand type
 */
function paintHandType (y)
{
    if (between(y,650,690))
    {
        handType = "eyes";
        y = 680;
    }
    else if (between(y,700,740))
    {
        handType = "triples";
        y = 730;
    }
    else if (between(y,750,790))
    {
        handType = "7 pairs";
        y = 780;
    }
    else // not in our expected y range so we leave this function
    {
        return;
    }

    /** reset choices */
    context.fillStyle = "black";
    context.fillText("eyes",1320,680);
    context.fillText("triples",1320,730);
    context.fillText("7 pairs",1320,780);

    /** mark our new hand type */
    context.fillStyle = "red";
    context.fillText(handType,1320,y);
    
    // repaint groupsc
    paintGroups();
}
paintHandType(670);

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
 * groupings will have lightgreen underline if valid
 * otherwise red underline
 */
function paintGroups ()
{

    context.fillStyle = "brown";
    context.fillRect(110,770,1110,20);

    // eyes: groups = 5
    let groups = Math.floor(hand.length / 3);
    let eyes = 1;

    // tripes hand type: one more pair of eyes
    if (handType == "triples")
    {
        --groups;
        ++eyes;
    }
    else if (handType == "7 pairs")
    {
        groups = 0;
        eyes = Math.floor(hand.length/2)-1;
    }

    console.log(groups + " groups " + eyes + " eyes");
    for (let i=0; i<groups; ++i)
    {
        // j for tiles
        let j = i*3;

        let x = 120 + (i*210);
        // read tile numbers, suits in `hand`
        let numbers = [];
        numbers.push(+hand[j].substring(0,1));
        numbers.push(+hand[j+1].substring(0,1));
        numbers.push(+hand[j+2].substring(0,1));
        // sort `numbers` in increasing order
        numbers.sort((a,b) => a-b);

        let suit0 = hand[j].substring(1);
        let suit1 = hand[j+1].substring(1);
        let suit2 = hand[j+2].substring(1);

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

    if (hand[hand.length-3] == hand[hand.length-4])
    {
        // something to do with hand length
        context.fillStyle = "yellow";
        console.log("busdown");
    }

    // two pairs
    if (hand[hand.length-1] == hand[hand.length-2])
    {
        // something to do with hand length
        context.fillStyle = "yellow";
        console.log("busdown");
    }
    else
    {
        context.fillStyle = "red";
    }
    // context.fillRect(x,775,180,10);
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
    let text = "x: " + e.offsetX + ", y: " + e.offsetY + " " + tileReplaced;
    context.clearRect(100, 70, 400, 50);
    context.fillText(text, 100, 100);
    
    /** currently moving mahjong tile */
    if (dragging)
    {
        tileReplaced = Math.floor((e.offsetX - 110)/70);

        // keep us in bounds
        if (tileReplaced < 0) tileReplaced = 0;
        if (tileReplaced > hand.length-1) tileReplaced = hand.length-1;

        /** indicate where the tile is being placed */
        context.fillStyle = "brown";
        context.fillRect(110,670,1120,10);
        context.fillStyle = "yellow";
        context.fillRect(120+(70*tileReplaced),670,40,10);
    }

    // console.log(e);
});


/**
 * @EventListener mousedown
 * 
 * capture mouse down event
 * 1: initial tile draw
 * 2: condition discard
 * 2: drag tile
 */
canvas.addEventListener("mousedown", (e) => {
    // condition: initial tile draw
    if (between(e.offsetX, 200, 300) && between(e.offsetY, 500, 600))
    {
        if (turn == "draw")
        {
            // initial draw (16 tiles) or first
            if (!hand.length)
                for (let i=0; i<16; ++i)
                    drawTile();
            else
                drawTile();

            turn = "throw";
            // paint tiles and groups in hand after draw
            paintTiles();
            paintGroups();
        }
        else if (turn == "throw")
        {
            turn = "draw";
        }

    }
    // condition: mahjong tile is pressed
    else if(690 < e.offsetY && e.offsetY < 766
            && 110 < e.offsetX && e.offsetX < 110+hand.length*70)
    {
        // set global variable: which tile are we grabbing
        tileSelected = Math.floor((e.offsetX - 110)/70);

        // @debug show tile
        context.clearRect(0,0,200,50);
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
    // condition: changing hand type
    else if(between(e.offsetX, 1320, 1420))
    {
        paintHandType(e.offsetY);
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
        // let tileReplaced = Math.floor((e.offsetX - 110)/70); 

        /**
         * if it was the same tile don't change hand
         * otherwise remove and replace tile
         */
        if (tileSelected != tileReplaced)
        {
            // swap method
            [hand[tileSelected], hand[tileReplaced]] = [hand[tileReplaced], hand[tileSelected]];
        }

        paintTiles();
        paintGroups();
    }
    dragging = false;

    console.log(hand + " lifted");
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