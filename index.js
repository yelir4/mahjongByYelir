console.log('index.js loaded');

/** global variables */
let game, user;
/** global arrays */
let hand, melds, hold;
let discardPile;

/** global booleans */
let canChow, canPung, canKong, canWin;

/** debugging */
let debug = false;
let useTileImages = true;
let debugElt = document.createElement('p');
debugElt.id = 'debug';

/** adjustable colors */
let bgColor = '#363636';
let canvasColor = '#783678';
let darkenColor = '#593659';
let discardColor = darkenColor;
let white = 'white';

/** `arrange` tiles */
let tileSelected = -1;
let indexToPlace = -1;
let dragging = false;

/** `claim` tiles */
let claim = '';
let claimSent = false;
let eating = [];

/** eyes, triples, standard, 7 pairs */
let triples = 0;
let eyes = 0;
let total = -1;
let groups = [];
let handType = 'standard';
let eyesFirst = false;

/** tile images */
let tiles = {};

/** various document elements */
var loginForm = document.getElementById('loginForm');
/** canvas, 2d drawing context */
var canvas = document.getElementById('gameCanvas');
var context = canvas.getContext('2d');
context.lineWidth = 1.5;

/**
 * @function start
 * asynchronous function to fetch data from backend/start.php
 */
async function start ()
{
    event.preventDefault(); // prevent page reload on form submit

    /** get user input from text box */
    let username = document.getElementById('username').value;
    console.log('username selected: ' + username);

    // fetch session data
    try
    {
        let response;

        // on page load: load session if available
        if (username == '')
        {
            response = await fetch('backend/start.php');
        }
        // on form submit: username
        else
        {
            // POST request to start.php
            response = await fetch('backend/start.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: username })
            });
        }
        // check for OK HTTP response (200-299)
        if (!response.ok) throw new Error('network response not ok');

        // parse JSON response into `data` associative array
        data = await response.json();

        // print start.php message
        console.log(data.message);

        // `success` true/false, if start.php placed us in a game
        if (data.success)
        {
            // extract response
            game = data.gameData;
            user = data.userData;
            console.log(game);
            console.log(user);

            // extract to global arrays
            hand = user.hand;
            melds = user.melds;
            hold = user.hold;
            discardPile = game.discardPile;
            // booleans
            canChow = user.canChow;
            canPung = user.canPung;
            canKong = user.canKong;

            /** html changes */
            let welcomeElt = document.createElement('p');
            welcomeElt.innerHTML = 'Welcome, ' + user.name;
            loginForm.innerHTML = '';
            loginForm.appendChild(welcomeElt);
            debug ? loginForm.appendChild(debugElt) : null;
            loginForm.style.flexDirection = 'column';
            /** disable text selection */
            loginForm.style.userSelect = 'none';

            /** display canvas */
            canvas.style.display = 'flex';
            /** paint gameID */
            context.font = '18px Arial';
            context.fillStyle = 'black';
            context.fillText('gameID: ' + game.gameID,1500,18);
            
            // preload tile images
            preloadTiles();
            // setup player view, event listeners
            paintLobby();
            setupEventListeners();
            // start loop of querying database for session updates
            startLoopInterval();
        }
    }
    catch (error)
    {
        console.error('start failed: ' + error);
    }
}
// run on page load
window.onload = start;


/**
 * @function between
 * helper function for mouse coordinates on canvas
 * @returns true/false
 */
function between (val, lo, hi)
{
    return lo <= val && val <= hi;
}


/**
 * @function preloadTiles
 * 
 * preload `tiles` images after start.php successfully fetches game data
 * `tiles` array holds all HTMLElements (images)
 */
function preloadTiles ()
{
    // temp array of tile names
    let tileNames = ['1 bamboos', '2 bamboos', '3 bamboos', '4 bamboos', '5 bamboos', '6 bamboos', '7 bamboos', '8 bamboos', '9 bamboos', '1 dots', '2 dots', '3 dots', '4 dots', '5 dots', '6 dots', '7 dots', '8 dots', '9 dots', '1 characters', '2 characters', '3 characters', '4 characters', '5 characters', '6 characters', '7 characters', '8 characters', '9 characters', '1 flowers', '2 flowers', '3 flowers', '4 flowers', '5 flowers', '6 flowers', '7 flowers', '8 flowers', '0 winds', '1 winds', '2 winds', '3 winds', '0 dragons', '1 dragons', '2 dragons'];

    // create HTMLElement `image` for each tile, insert into `tiles`
    for (let tile of tileNames)
    {
        let img = new Image();
        img.src = 'assets/tiles/' + tile + '.png';
        tiles[tile] = img;
    }
}


/**
 * @function paintLobby
 * 
 * called: after start() success,
 * every second while game not full
 * 
 * paint middle section (discard pile)
 * player information, countdown if applicable
 */
function paintLobby ()
{
    // paint middle section
    context.fillStyle = discardColor;
    context.fillRect(280,200,1040,350);

    context.fillStyle = 'black';
    context.font = '22px Arial';
    /** paint players info */
    for (player of game.players)
    {
        // we are always on bottom, paint other players counter-clockwise
        let pos = (4 + player.seat - user.seat) % 4;
        let posx, posy;
        
        switch (pos)
        {
            case 0:
                [posx, posy] = [450,510];
                break;
            case 1:
                [posx, posy] = [1220,320];
                break;
            case 2:
                [posx, posy] = [930,230];
                break;
            case 3:
                [posx, posy] = [290,290];
                break;
        }
        context.fillText(player.name,posx,posy);
        context.fillText('seat ' + player.seat,posx,posy+20);
    }

    /** paint game status, timer */
    context.font = '30px Arial';
    context.fillText(game.status + '. . .',710,420);
    game.seconds == -1 ? null : context.fillText(game.seconds,740,390);
}

/**
 * @function paintPlayers
 * 
 * paint players' information
 * runs every second after game starts
 */
function paintPlayers ()
{
    context.font = '30px Arial';
    /** paint players info */
    for (player of game.players)
    {
        // we are always on the bottom, paint other players counter-clockwise
        let pos = (4 + player.seat - user.seat) % 4;
        let posx, posy;
        
        switch (pos)
        {
            case 0:
                [posx, posy] = [200,660];
                break;
            case 1:
                [posx, posy] = [1400,640];
                break;
            case 2:
                [posx, posy] = [1280,0];
                break;
            case 3:
                [posx, posy] = [0,10];
                break;
        }

        /** clear space for players & highlight game winner in green */
        context.fillStyle = (player.seat == game.turnCount && game.status == 'finished') ? 'lightgreen' : white;
        context.fillRect(posx, posy,200,90);

        /** orange text for the player whose turn it is */
        context.fillStyle = (player.seat == game.turnCount && game.status != 'finished') ? 'orange' : 'blue';

        /** paint player information */
        context.fillText(player.name,posx+5,posy+30);
        context.fillText('seat ' + player.seat,posx+5,posy+55);
        // add game status to player whose turn it is for context
        if (game.turnCount == player.seat)
            context.fillText('(' + player.handCount + ')' + game.status,posx+5,posy+80);
        else
            context.fillText('(' + player.handCount + ')',posx+5,posy+80);
    }

    // note
    paintGame();
}


/**
 * @function paintGame
 * 
 * paint game functionality on canvas
 * occurs every second after & game starts
 */
function paintGame ()
{
    paintDiscard();
    paintHand();

    // param -1: calls to painthandtype from here should not change hand type
    // unless player does not have enough tiles for 7 pairs
    paintHandType(-1); 
    paintGroups();
}


/**
 * @function paintDiscard
 * paint discard pile (middle section)
 * 
 * runs every second from paintGame()
 */
function paintDiscard ()
{
    // @NOTE delay updates while dragging tile
    if (dragging) return;

    // paint discard pile, text
    context.fillStyle = discardColor;
    context.fillRect(280,200,1040,350);
    context.fillStyle = white;
    context.fillText('discard pile',1160,540);

    // provide information on game status (discarded or game over)
    switch (game.status)
    {
        case 'discarded':
            context.fillText(game.players[game.turnCount].name + ' discarded ' + discardPile[0].value + ' ' + discardPile[0].suit,460,390);
            context.fillText(game.seconds,1210,520);
            break;
    }
    if (game.status == 'finished')
    {
        context.fillStyle = 'lightgreen';
        context.fillText(game.players[game.turnCount].name + ' won!',750,540);
    }

    // if there are tiles in discard pile to paint
    if (discardPile.length)
    {
        /** most recent discard 120x152 */
        let x = 290;

        /** show tile images or plain */
        if (useTileImages)
        {
            // select, paint tile image
            let tile = tiles[discardPile[0].value + ' ' + discardPile[0].suit];
            context.drawImage(tile,x,310,120,152);
        }
        else
        {
            context.fillStyle = white;
            context.fillRect(x,310,120,152);
            context.fillStyle = 'blue';
            context.font = '60px Arial';
            context.fillText(discardPile[0].value,x,360);
            context.font = '15px Arial';
            context.fillText(discardPile[0].suit.substring(0,7),x,375);
            context.font = '30px Arial';
        }
    }

    /** paint tiles CURRENTLY RECENT 14 */
    for (let i=1; i<discardPile.length; ++i)
    {
        // DISPLAY ALL TILES (60x76)
        let x = 220 + (i*70);

        /** paint tile with images or not */
        if (useTileImages)
        {
            // select, paint tile image
            let tile = tiles[discardPile[i].value + ' ' + discardPile[i].suit];
            context.drawImage(tile,x,210,60,76);
        }
        else
        {
            context.fillStyle = white;
            context.fillRect(x,210,60,76);
            context.fillStyle = 'blue';
            context.font = '30px Arial';
            context.fillText(discardPile[i].value,x,260);
            context.font = '15px Arial';
            context.fillText(discardPile[i].suit.substring(0,7),x,275);
            context.font = '30px Arial';
        }

        /** @TODO possible improvement: show more tiles (currently most recent 14) */
        if (i == 14) break;
    }

    /** paint eat indicators for users that can eat */
    // they didn't just discard, and haven't yet started/sent a claim
    if (game.status == 'discarded' && user.seat != game.turnCount && claim == '')
    {
        context.font = '30px Arial';
        if (canChow)
        {
            context.fillStyle = 'lightgray';
            context.fillRect(290,485,85,40);
            context.fillStyle = 'black';
            context.fillText('chow',295,515);
        }

        if (canPung)
        {
            context.fillStyle = 'lightgray';
            context.fillRect(385,485,85,40);
            context.fillStyle = 'black';
            context.fillText('pung',390,515);
        }

        if (canKong)
        {
            context.fillStyle = 'lightgray';
            context.fillRect(480,485,85,40);
            context.fillStyle = 'black';
            context.fillText('kong',485,515);
        }

        // NOTE player canWin if they are `waiting`
        // i.e. need one more tile to win
        // i.e. rightmost group is only non-valid group
        if (total == (triples+eyes-1))
        {
            canWin = true;

            context.fillStyle = 'lightgray';
            context.fillRect(575,485,85,40);
            context.fillStyle = 'black';
            context.fillText('win',580,515);
    }
    }

}


/**
 * @function paintHand
 * paint bottom bar and hand
 * 
 * runs every second from paintGame()
 */
function paintHand ()
{
    // @NOTE delay updates while dragging or if actively making claim
    if (dragging || claim != '') return;

    // canvas properties
    context.fillStyle = darkenColor;
    context.strokeStyle = white;
    /** bottom bar */
    context.fillRect(200,760,1200,130);
    context.strokeRect(200,760,1200,130);
    /** meld bar */
    context.fillRect(400,581,900,168);
    context.strokeRect(400,581,900,168);

    /** paint tiles */
    for (let i=0; i<hand.length; ++i)
    {
        // @NOTE tile size 60x76
        let x = 210 + (i*70);

        /** show tile images or plain text */
        if (useTileImages)
        {
            // select, paint tile image
            let tile = tiles[hand[i].value + ' ' + hand[i].suit];
            context.drawImage(tile,x,790,60,76);
        }
        else
        {
            context.fillStyle = white;
            context.fillRect(x,790,60,76);
            context.fillStyle = 'blue';
            context.font = '30px Arial';
            context.fillText(hand[i].value,x,750);
            context.font = '15px Arial';
            context.fillText(hand[i].suit.substring(0,7),x,765);
            context.font = '30px Arial';
        }
    }

    /** paint melds */
    for (let i=0; i<melds.length; ++i)
    {
        // @NOTE tile size 60x76
        let x = 410 + ((i%12) * 70);
        let y = 585 + (Math.floor(i/12) * 83);

        /** show tile images or plain */
        if (useTileImages)
        {
            // select, paint tile image
            let tile = tiles[melds[i].value + ' ' + melds[i].suit];
            context.drawImage(tile,x,y,60,76);
        }
        else
        {
            context.fillStyle = white;
            context.fillRect(x,665,60,76);
            context.fillStyle = 'blue';
            context.font = '30px Arial';
            context.fillText(melds[i].value,x,625);
            context.font = '15px Arial';
            context.fillText(melds[i].suit.substring(0,7),x,640);
            context.font = '30px Arial';
        }
    }

    /** paint hold to the right of melds */
    for (let i=1; i<hold.length; ++i)
    {
        // @NOTE tile size 60x76
        let x = 310 + ((i + melds.length) * 70);

        /** show tile images or plain */
        if (useTileImages)
        {
            // select, paint tile image
            let tile = tiles[hold[i].value + ' ' + hold[i].suit];
            context.drawImage(tile,x,665,60,76);
        }
        else
        {
            context.fillStyle = white;
            context.fillRect(x,665,60,76);
            context.fillStyle = 'blue';
            context.font = '30px Arial';
            context.fillText(hold[i].value,x,625);
            context.font = '15px Arial';
            context.fillText(hold[i].suit.substring(0,7),x,640);
            context.font = '30px Arial';
        }
    }

    /** paint melds of user to right */
    context.fillRect(1401,100,198,540);
    context.strokeRect(1401,100,198,540);
    let arr = game.players[(user.seat+1)%4].melds;
    for (let i=0; i<arr.length; ++i)
    {
        // @NOTE tile size 60x76
        let x = 1405 + (i%3 * 65);
        let y = 105 + (Math.floor(i/3) * 82);

        // select, paint tile image
        let tile = tiles[arr[i].value + ' ' + arr[i].suit];
        context.drawImage(tile,x,y,60,76);
    }


    /** paint melds of user across */
    context.fillRect(250,1,1030,168);
    context.strokeRect(250,1,1030,168);
    arr = game.players[(user.seat+2)%4].melds;
    for (let i=0; i<arr.length; ++i)
    {
        // @NOTE tile size 60x76
        let x = 255 + ((i%12) * 70);
        let y = 6 + (Math.floor(i/12) * 81);

        // select, paint tile image
        let tile = tiles[arr[i].value + ' ' + arr[i].suit];
        context.drawImage(tile,x,y,60,76);
    }

    /** paint melds of user to left */
    context.fillRect(1,100,198,550);
    context.strokeRect(1,100,198,550);
    arr = game.players[(user.seat+3)%4].melds;
    for (let i=0; i<arr.length; ++i)
    {
        // @NOTE tile size 60x76
        let x = 5 + ((i%3) * 65);
        let y = 105 + (Math.floor(i/3) * 81);

        // select, paint tile image
        let tile = tiles[arr[i].value + ' ' + arr[i].suit];
        context.drawImage(tile,x,y,60,76);
    }
}

/**
 * @function paintHandType
 * paint hand type
 * 
 * runs every second from paintGame()
 * also runs on user mousedown on handType panel
 */
function paintHandType (y)
{
    if (claim != '') return; /** do nothing during active claim */

    if (y == -1) {} // maintain handType for calls from paintGame() 
    else if (between(y,760,800))
    {
        handType = 'standard';
    }
    else if (between(y,805,845))
    {
        handType = '7 pairs';
    }
    else if (between(y,850,890))
    {
        /** eyes */
        eyesFirst = !eyesFirst;
    }
    else
        return; // not in expected y range, stop

    // align y
    switch (handType)
    {
        case 'standard':
            y=790;
            break;
        case '7 pairs':
            y=835;
            break;
    }

    // clear space
    context.fillStyle = 'black';
    context.font = '20px Arial';
    context.clearRect(1445,730,120,30);
    context.fillText('hand type',1450,755);

    /** draw hand types */
    context.font = '30px Arial';
    context.fillStyle = white;
    context.fillRect(1450,760,120,40);
    context.fillRect(1450,805,120,40);
    context.fillRect(1450,850,120,40);

    /** reset choices */
    context.fillStyle = 'black';
    context.fillText('standard',1450,790);
    context.fillText((eyesFirst ? 'eyes first' : 'eyes last'),1450,880);

    /** with insufficient tiles in hand you can't have 7 pairs */
    if (hand.length < 13)
    {
        handType = 'standard';
        y=790;
        context.fillStyle = 'gray';
    }
    context.fillText('7 pairs',1450,835);


    /** mark new hand type */
    context.fillStyle = 'red';
    context.fillText(handType,1450,y);
}


/**
 * @function paintGroups
 * valid groups have lightgreen underline, otherwise red
 * 
 * runs every second from paintGame()
 */
function paintGroups ()
{
    // do nothing with empty hand, or if swapping tiles, or if making claim
    if (!hand.length || dragging || claim != '') return;

    // j, x, w for placing indicators
    let j, w;
    let x = 220;

    // clear group indicators
    context.fillStyle = darkenColor;
    context.fillRect(210,875,1180,10);

    // set `groups`
    determineGroups();

    // paint any and all indicators
    for (let i=0; i<groups.length; ++i)
    {
        context.fillStyle = (groups[i][1] == true) ? 'lightgreen' : 'red';

        // eye indicator width is shorter than for a triple
        if (groups[i][0] == 2)
            w = 110;
        else
            w = 180;

        context.fillRect(x,875,w,10);

        // adjust the `x` for subsequent group indicators
        if (groups[i][0] == 2)
            x += 140;
        else
            x += 210;
    }
}

/**
 * @function determineGroups
 * 
 * derive validity of groups from tiles in hand
 * called from paintGroups() or from eat()
 * 
 * if all groups are valid, send WIN update
 */
function determineGroups ()
{
    /** derive # of triples, eyes based on current handtype */
    switch (handType)
    {
        case 'standard':
            triples = Math.floor(hand.length/3);
            eyes = 1;
            break;

        case '7 pairs':
            // may not have triple depending on hand length
            if (hand.length < 15)
            {
                triples = 0;
                eyes = Math.ceil(hand.length/2);
            }
            else
            {
                triples = 1;
                eyes = Math.floor(hand.length/2)-1;
            }
            break;
    }
    total = 0;

    /** reset groups */
    groups = [];

    // group either the eyes or triples first
    if (eyesFirst)
    {
        checkEyes(0);
        checkTriples(eyes*2);
    }
    else
    {
        checkTriples(0);
        checkEyes(triples*3);
    }


    /** paint waiting indicator */
    context.clearRect(5,850,190,50);
    if (total == groups.length - 1)
    {
        context.fillStyle = 'orange';
        context.fillText('waiting!',40,890);
    }
    // send WIN update if all groups valid
    else if (total == groups.length)
    {
        console.log(total + groups.length);
        updateSession('win', 0);
    }
}


/**
 * @function checkTriples
 * 
 * called from determineGroups()
 * determine validity of group of three tiles
 * do it for each triple in the hand
 */
function checkTriples (k)
{
    // if this is being checked second, adjust group index
    let l = (k ? eyes : 0);

    for (let i=0; i<triples; ++i)
    {
        // `j` index of first tile of triple (0, 3, 6, ...)
        j = k + i*3;
        // initially assume group is invalid
        groups[l+i] = [3, false];

        // if this is a full triple (3 tiles), we can check validity
        // otherwise we know its invalid
        if (j+2 < hand.length)
        {
            // read tile values, suits in `hand`
            let values = [
                hand[j].value, hand[j+1].value, hand[j+2].value,
            ];
            // sort `values` in increasing order
            values.sort((a,b) => a-b);

            let suit0 = hand[j].suit;
            let suit1 = hand[j+1].suit;
            let suit2 = hand[j+2].suit;

            /**
             * conditions for valid triple:
             * 
             * 1: tiles must match NON-FLOWER suit
             * 2a: if suit is winds or dragons: must be exact value match (2,2,2)
             * 2b: else: can be exact value match (2,2,2) OR subsequent run (1,2,3)
             */
            if ((suit0 == suit1 && suit0 == suit2 && suit0 != 'flowers')) // 1
            {
                if (suit0 == 'winds' || suit0 == 'dragons') // 2a
                {
                    if (values[0] == values[1] && values[0] == values[2])
                    {
                        groups[l+i] = [3, true];
                        ++total;
                    }
                }
                else // 2b
                {
                    if ((values[0] == values[1] && values[0] == values[2])
                        || (values[1]-values[0] == 1 && values[2]-values[1] == 1))
                    {
                        groups[l+i] = [3, true];
                        ++total;
                    }
                }
            }
        }
    }
}

/**
 * @function checkEyes
 * 
 * called from determineGroups()
 * determine validity of group of two tiles
 * do it for each group of eyes in the hand
 */
function checkEyes (k)
{
    // if this is being checked second, adjust groups index
    let l = (k ? triples : 0);

    for (let i=0; i<eyes; ++i)
    {
        // `j` index of first tile of eyes (3, 5, 7, ...)
        j = k + i*2;

        // initially assume invalid
        groups[l+i] = [2, false];

        // if there are two tiles to compare, check, otherwise group is invalid
        if (j+1 < hand.length)
        {
            /**
             * determine if eyes valid (exact tile match)
             * CANNOT BE FLOWERS
             * @NOTE: STRINGIFY object to compare PROPERTIES rather than REFERENCES
             */
            if (JSON.stringify(hand[j]) == JSON.stringify(hand[j+1]) && hand[j].suit != 'flowers')
            {
                groups[l+i] = [2, true];
                ++total;
            }
        }
    }
}


/**
 * @function setupEventListeners
 * 
 * add event listeners to canvas after start()
 */
function setupEventListeners ()
{
    canvas.addEventListener('mousemove', handleMousemove);
    canvas.addEventListener('mousedown', handleMousedown);
    canvas.addEventListener('mouseup', handleMouseup);
}


/**
 * @function handleMousemove
 * event listener
 * 
 * capture mouse movement as event
 * 1: display mouse coordinates (if deubgging)
 * 2: drag tiles in hand
 */
function handleMousemove (e)
{
    // display debug information
    if (debug)
    {
        let output = '';

        // mouse coordinates
        output += 'x: ' + e.offsetX + ', y: ' + e.offsetY + '<br>';
        // game status
        output += 'status: seat ' + game.turnCount + ' ' + game.status + '<br>';
        output += 'time: ' + game.seconds + '<br>';
        output += 'tileSelected: ' + tileSelected + ', indexToPlace: ' + indexToPlace + '<br><br>';
        // hand information
        output += 'triples: ' + triples + ', eyes: ' + eyes + '<br>';
        output += 'handType: ' + handType + '<br>';

        // value of selected tile
        // output += tileSeleted + ': ' + hand[tileSelected].value + ' ' + hand[tileSelected].suit;
        debugElt.innerHTML = output;
    }
    
    /** dragging tile in hand */
    if (dragging)
    {
        /** preemptively clear place indicators (discardPile, bar) */
        context.fillStyle = discardColor;
        context.fillRect(520,530,400,10);
        context.fillStyle = darkenColor;
        context.fillRect(205,770,1190,10);

        /**
         * check if we can discard
         * must be our (discarding) turn, dragging and hovering over discard pile
         */
        if (user.seat == game.turnCount && game.status == 'discarding' && between(e.offsetY,200,550))
        {
            // discard on mouseup
            indexToPlace = -1;

            // paint yellow place indicator on discard pile
            context.fillStyle = 'yellow';
            context.fillRect(520,530,400,10);
        }
        /* dragging, hovering over tiles */
        else
        {
            /* tile to swap on mouseup */
            indexToPlace = Math.floor((e.offsetX - 210)/70);

            // stay in bounds of user's hand
            if (indexToPlace < 0) indexToPlace = 0;
            if (indexToPlace > hand.length-1) indexToPlace = hand.length-1;

            // paint yellow place indicator on indexToPlace
            context.fillStyle = 'yellow';
            context.fillRect(220+(70*indexToPlace),770,40,10);
        }
    }
    // console.log(e);
}

/**
 * @function handleMousedown
 * event listener
 * 
 * capture mouse down as event
 * 1: select tile to drag
 * 2: changing hand type
 * 3: making/cancelling claims
 */
function handleMousedown (e)
{
    /** ignore if game has not started */
    if (game.status == 'waiting') return;

    // user currently making claim
    if (claim != '')
    {
        // selecting tile for chow/pung
        if (between(e.offsetY,790,866) && between(e.offsetX,210,210+hand.length*70))
        {
            // set tileSelected and call eat()
            tileSelected = Math.floor((e.offsetX - 210)/70);
            eat(tileSelected);
        }
        // cancel button to cancel claim
        else if (between(e.offsetX,5,105) && between(e.offsetY,740,780))
        {
            // undo sent claims
            if (claimSent)
            {
                updateSession('cancel', 'cancel');
                claimSent = false;
            }
            claim = '';
            eating = [];
            
            // clear the AREA
            context.clearRect(5,700,190,200);
        }
    }
    else // not making claim
    {
        /** select tile to drag */
        if (between(e.offsetY,790,866) && between(e.offsetX,210,210+hand.length*70))
        {
            // set tileSelected
            tileSelected = Math.floor((e.offsetX - 210)/70);

            /**
             * if `tileSelected` is FLOWER suit,
             * move the tile from our HAND to MELDS, then exit
             */
            if (hand[tileSelected].suit == 'flowers')
            { 
                melds.push( hand.splice(tileSelected,1)[0] );
                // update game state
                updateSession('place', tileSelected);

                paintHand();
                paintGroups();
                return;
            }

            // sanity: indexToPlace & tileSelected are the same
            // i.e. if immediate mouseup, no tile swap
            indexToPlace = tileSelected;

            // paint yellow place indicator on `indexToPlace`
            context.fillStyle = 'yellow';
            context.fillRect(220+(70*indexToPlace),770,40,10);

            // gray out `tileSelected`
            context.fillStyle = 'gray';
            context.fillRect(210+(tileSelected*70),790,60,76);

            // set global variable
            dragging = true;
        }
        // 2: changing hand type
        else if (between(e.offsetX, 1450, 1570))
        {
            paintHandType(e.offsetY);
            paintGroups();
        }
        // 3: start claim: chow/pung/kong/win
        else if (between(e.offsetY,485,525))
        {
            if (canChow && between(e.offsetX,290,375))
            {
                claim = 'chow';
                eat(-1);
            }
            else if (canPung && between(e.offsetX,385,470))
            {
                claim = 'pung';
                eat(-1);
            }
            else if (canKong && between(e.offsetX,480,565))
            {
                // send claim from here
                claim = 'kong';

                let eating = [];
                let dTile = JSON.stringify(discardPile[0]);

                // iterate through hand
                // find index of all (3) exact matches
                // tiles (3): hand -> message
                hand.forEach((tile, i) => {
                    if (dTile == JSON.stringify(tile))
                        eating.push(i);
                });

                // reverse sort the indices
                eating.sort((a,b) => b - a);

                context.fillStyle = 'lightgreen';
                context.fillText(claim + ' sent!',5,730);

                // paint lightgreen claim indicator over the tiles
                for (let i=0; i<3; ++i)
                {
                    let x = (220 + (70*eating[i]));
                    context.fillRect(x,770,40,10);
                }

                // paint cancel button
                context.font = '30px Arial';
                context.fillStyle = 'white';
                context.fillRect(5,740,100,40);
                context.fillStyle = 'black';
                context.fillText('cancel',10,770);

                // send claim update with the tile indices
                // they get moved to hold there, not here
                // on success they would be moved to melds
                updateSession('kong', eating);
                claimSent = true;
            }
            else if (canWin && between(e.offsetX,575,660))
            {
                claim = 'win';
                eat(-2);
            }
        }
    }
    // console.log(e);
}

/**
 * @function eat
 * eat tiles
 * 
 * @param i
 * selector for how this function behaves
 * 
 * at the end, send claim updat
 */
function eat (i)
{
    /** do nothing if the claim already sent @TODO is this needed? */
    if (claimSent) return;

    context.font = '20px Arial';

    // if i == -2 or -1 we are starting a claim
    switch (i)
    {
        // win claims (-2) execute instantly
        case -2:
            // if the last group is an eye, need discarded tile to be exact match
            if (groups[groups.length-1][0] == 2)
            {
                if (JSON.stringify(hand[hand.length-1]) == JSON.stringify(discardPile[0]))
                {
                    /** update.php: claim win with last tile */
                    updateSession('cWin', 1);
                    context.fillStyle = 'lightgreen';
                    context.fillText(claim + ' sent!',5,730);
 
                    // paint lightgreen claim indicators
                    let x = 220 + (70*(hand.length-1));
                    context.fillRect(x,770,40,10);

                    // paint cancel button
                    context.font = '30px Arial';
                    context.fillStyle = 'white';
                    context.fillRect(5,740,100,40);
                    context.fillStyle = 'black';
                    context.fillText('cancel',10,770);
                }
                else
                {
                    context.clearRect(0,700,190,200);
                    context.fillStyle = 'red';
                    context.fillText(claim + ' failed: invalid',5,730);

                    claim = '';
                }
            }
            // if the last group is a triple, need discarded tile to form valid triple
            else
            {
                // read tile values, suits in `hand`
                let values = [
                    discardPile[0].value,
                    hand[hand.length-1].value,
                    hand[hand.length-2].value
                ];
                // sort `values` in increasing order
                values.sort((a,b) => a-b);

                let suit0 = discardPile[0].suit;
                let suit1 = hand[hand.length-1].suit;
                let suit2 = hand[hand.length-2].suit;

                t0 = JSON.stringify(discardPile[0]);
                t1 = JSON.stringify(hand[eating[0]]);
                t2 = JSON.stringify(hand[eating[1]]);

                // CHOW OR PUNG
                if ((suit0 == suit1 && suit1 == suit2 &&
                    values[1]-values[0] == 1 && values[2]-values[1] == 1)
                    || t0 == t1 && t1 == t2)
                {
                    /** update.php: claim win with last 2 tiles */
                    updateSession('cWin', 2);
                    context.fillStyle = 'lightgreen';
                    context.fillText(claim + ' sent!',5,730);

                    // paint lightgreen claim indicators
                    let x = 220 + (70*(hand.length-2));
                    context.fillRect(x,770,40,10);
                    context.fillRect(x+70,770,40,10);

                    // paint cancel button
                    context.font = '30px Arial';
                    context.fillStyle = 'white';
                    context.fillRect(5,740,100,40);
                    context.fillStyle = 'black';
                    context.fillText('cancel',10,770);
                }
                else
                {
                    context.clearRect(0,700,190,200);
                    context.fillStyle = 'red';
                    context.fillText(claim + ' failed: invalid',5,730);

                    claim = '';
                }
            }
            return;


        // claim start: paint interface, return
        case -1:
            context.font = '20px Arial';
            context.fillStyle = 'black';
            context.clearRect(0,700,190,200);
            context.fillText(claim + ': select 2 tile(s)',5,730);

            // paint cancel button
            context.font = '30px Arial';
            context.fillStyle = 'white';
            context.fillRect(5,740,100,40);
            context.fillStyle = 'black';
            context.fillText('cancel',10,770);
            return;
    }

    // AT THIS POINT WE HAVE SELECTED A TILE
    // avoid flowers, chowing with dragons/winds, eating same tile(index)
    if (hand[i].suit == 'flowers'
        || ((hand[i].suit == 'winds' || hand[i].suit == 'dragons') && claim == 'chow')
        || (eating.length == 1 && i == eating[0]))
        return;

    // push to eating array
    eating.push(i);

    // paint green eat indicator
    let x = 220 + (i * 70);
    context.fillStyle = 'lightgreen';
    context.fillRect(x,770,40,10);

    // 2 tiles in `eating`: check claim and send if valid
    if (eating.length == 2)
    {
        let valid = false;
        // reverse sort indices for hand splice
        eating.sort((a,b) => b - a);

        console.log('checking claim validity' + JSON.stringify(eating));

        // @NOTE CAN'T DO WINDS OR DRAGONS??
        if (claim == 'chow')
        {
            // read tile values, suits in `hand`
            let values = [
                discardPile[0].value,
                hand[eating[0]].value,
                hand[eating[1]].value
            ];
            // sort `values` in increasing order
            values.sort((a,b) => a-b);

            let suit0 = discardPile[0].suit;
            let suit1 = hand[eating[0]].suit;
            let suit2 = hand[eating[1]].suit;

            // suits match + 3 straight: chow
            valid = (suit0 == suit1 && suit1 == suit2 && values[1]-values[0] == 1 && values[2]-values[1] == 1 && suit0 != 'dragons' && suit0 != 'winds');
        } 
        else if (claim == 'pung')
        {
            t0 = JSON.stringify(discardPile[0]);
            t1 = JSON.stringify(hand[eating[0]]);
            t2 = JSON.stringify(hand[eating[1]]);

            // valid if three tile exact match
            valid = (t0 == t1 && t1 == t2);
        }

        // based on validity
        context.clearRect(0,700,190,40);
        if (valid)
        {
            context.fillText(claim + ' sent!',5,730);
            updateSession(claim, [eating[0], eating[1]])
            claimSent = true;
        }
        else
        {
            context.fillStyle = 'red';
            context.fillText(claim + ' failed: invalid',5,730);
            // clear cancel button
            context.clearRect(5,740,100,40);
            claim = '';
        }

        // empty `eating`
        eating = [];
    }
}


/**
 * @EventListener handleMouseup
 * 
 * canvas listens for mouse up events
 */
async function handleMouseup (e)
{
    /** do nothing if in lobby or not dragging */
    if (game.status == 'waiting' || !dragging) return;

    /** clear placement indicators (discardPile, bar) */
    context.fillStyle = discardColor;
    context.fillRect(520,530,400,10);
    context.fillStyle = darkenColor;
    context.fillRect(205,770,1190,10);

    if (dragging)
    {
        /** @NOTE user can discard if its their turn */
        if (user.seat == game.turnCount && game.status == 'discarding' && between(e.offsetY,200,550))
        {
            // discarded tile: hand -> discardPile
            // array destructuring to extract tile from array
            let [tileDiscarded] = hand.splice(tileSelected, 1);
            // console.log(tileDiscarded.value + tileDiscarded.suit[0]);

            /** call update.php to discard the tile in database */
            updateSession('discard', tileSelected);
        }
        /** arrange tiles in hand */
        else if (tileSelected != indexToPlace)
        {
            // splice 1 tileSelected from hand
            let tileToMove = hand.splice(tileSelected, 1)[0];

            // re-insert that tile at indexToReplace
            // 0 because not removing any elements
            hand.splice(indexToPlace, 0, tileToMove);

            /** call update.php to swap tiles in database */
            await updateSession('arrange', [tileSelected, indexToPlace]);
        }

        // update global variable and call functions
        dragging = false;
        paintHand();
        paintGroups();
    }
    // console.log(e);
}

/**
 * @function updateSession
 * @call update.php
 * update database with new state
 * 
 * @param action the type of update that we're pushing
 * @param message provide context to the update
 */
async function updateSession (action, message)
{
    try
    {
        // run `php` with action as context
        let response = await fetch('backend/update.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: action,
                message: message
            })
        });

        if (!response.ok)
            console.error('update.php response was not ok: ', response.statusText);

        res = await response.json();

        // print message
        console.log(res.message);
    }
    catch (error)
    {
        console.error('update.php fetch error: ', error);
    }
}

/**
 * @function gameLoop
 * @call loop.php
 * 
 * fetch latest state from database,
 * update session & player view
 */
async function gameLoop ()
{
    try
    {
        let response = await fetch('backend/loop.php');

        if (!response.ok)
            console.error('loop.php response was not ok: ', response.statusText);

        data = await response.json();

        // print message
        console.log(data.message);

        // `success` true/false, based on if start.php placed us in a game
        if (data.success)
        {
            // extract session data
            game = data.gameData;
            user = data.userData;
            // console.log(game);
            // console.log(user);
            // console.log(game.status);

            // extract useful arrays
            hand = user.hand;
            melds = user.melds;
            hold = user.hold;
            discardPile = game.discardPile;
            // eating booleans
            canChow = user.canChow;
            canPung = user.canPung;
            canKong = user.canKong;

            // clearing claim stuff
            if (game.status != 'discarded')
            {
                context.clearRect(5,700,190,200);
                claim = '';
                claimSent = false;
            }

            // check
            game.status == 'waiting' ? paintLobby() : paintPlayers();

        }
    }
    catch (error)
    {
        console.error("loop.php fetch error: ", error);
    }
}

// after start() succeeds, call loop.php every second
function startLoopInterval ()
{
    setInterval(gameLoop, 1000);
}