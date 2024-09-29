console.log("index.js loaded");

/** global variables */
let game, user;
/** useful arrays */
let hand, melds, hold;
let discardPile;

/** useful booleans */
let canChow, canPung, canKong, canWin;

/** debugging */
let debug = true;
let useTileImages = true;
let debugElt = document.createElement("p");
debugElt.id = "debug";

/** adjustable colors */
let bgColor = "#363636";
let canvasColor = "#783678";
let darkenColor = "#593659";
let discardColor = darkenColor;
let white = "white";

/** `arrange` tiles */
let tileSelected = -1;
let indexToPlace = -1;
let dragging = false;

/** `eat` tiles */
let claim = '';
let eating = [];

/** eyes, triples, standard, 7 pairs */
let triples = 0;
let eyes = 0;
let total = -1;
let groups = [];
let handType = 'standard';

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

    // send encoded form data with fetch
    try
    {
        let response;

        // on page load: load session if available
        if (username == '')
        {
            // POST request to game.php
            response = await fetch('backend/start.php');
        }
        // entering a username
        else
        {
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

        // @TODO comment this out once u dont suck at coding
        // console.log("response:");
        // console.log(response);

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

            // extract useful arrays
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

            /** display canvas */
            canvas.style.display = 'flex';
            /** draw gameID */
            context.font = '18px Arial';
            context.fillStyle = 'black';
            context.fillText('gameID: ' + game.gameID,1350,18);
            
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
// fetch data on page load
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
 * preload tiles ONCE after start.php successfully fetches game data
 * saves into `tiles` array that holds all HTMLElements (images)
 */
function preloadTiles ()
{
    // temp array of tile names
    let tileNames = ['1 bamboos', '2 bamboos', '3 bamboos', '4 bamboos', '5 bamboos', '6 bamboos', '7 bamboos', '8 bamboos', '9 bamboos', '1 dots', '2 dots', '3 dots', '4 dots', '5 dots', '6 dots', '7 dots', '8 dots', '9 dots', '1 characters', '2 characters', '3 characters', '4 characters', '5 characters', '6 characters', '7 characters', '8 characters', '9 characters', '1 flowers', '2 flowers', '3 flowers', '4 flowers', '5 flowers', '6 flowers', '7 flowers', '8 flowers', '0 winds', '1 winds', '2 winds', '3 winds', '0 dragons', '1 dragons', '2 dragons'];

    // make image for each tile, insert into `tiles`
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
 * while game waits for four players
 * what do we show: middle discard pile
 */
function paintLobby ()
{
    // paint middle section
    context.fillStyle = discardColor;
    context.fillRect(200,200,1040,300);

    context.fillStyle = 'black';
    context.font = '22px Arial';
    /** paint players info */
    for (player of game.players)
    {
        // we are always on bottom, paint other players clockwise
        let pos = (4 + player.seat - user.seat) % 4;
        let posx, posy;
        
        switch (pos)
        {
            case 0:
                [posx, posy] = [450, 460];
                break;
            case 1:
                [posx, posy] = [1100, 320];
                break;
            case 2:
                [posx, posy] = [630, 230];
                break;
            case 3:
                [posx, posy] = [210, 290];
                break;
        }
        context.fillText(player.name,posx,posy);
        context.fillText('seat ' + player.seat,posx,posy+20);
    }

    /** paint game status, timer */
    context.font = '30px Arial';
    context.fillText(game.status + '. . .',680,380);
    game.seconds == -1 ? null : context.fillText(game.seconds,710,350);
}

/**
 * @function paintPlayers
 * paint players' information
 * 
 * NOTE this runs every second after start() success
 * (helps track how many tiles each player has)
 * @TODO we also need to update our hand every second? maybe
 */
function paintPlayers ()
{
    context.font = '30px Arial';
    /** paint players info */
    for (player of game.players)
    {
        // we are always on the bottom, paint other players clockwise
        let pos = (4 + player.seat - user.seat) % 4;
        let posx, posy;
        
        switch (pos)
        {
            case 0:
                [posx, posy] = [100, 570];
                break;
            case 1:
                [posx, posy] = [1240, 510];
                break;
            case 2:
                [posx, posy] = [1100, 0];
                break;
            case 3:
                [posx, posy] = [0, 30];
                break;
        }
        /** clear space for players */
        context.fillStyle = white;
        context.fillRect(posx, posy,200,90);

        /** different color for the player whose turn it is */
        context.fillStyle = (player.seat == game.turnCount) ? 'orange' : 'blue';
        /** paint players */
        context.fillText(player.name,posx+5,posy+30);
        context.fillText('seat ' + player.seat,posx+5,posy+55);
        context.fillText('(' + player.handCount + ')',posx+5,posy+80);
    }

    // paint game from here
    paintGame();
}


/**
 * paint game on canvas
 * occurs every second after & game starts
 */
function paintGame ()
{
    paintDiscard();
    paintHand();

    // calls to painthandtype from here should not change hand type
    // unless player does not have enough tiles for 7 pairs
    paintHandType(-1); 
    paintGroups();
}


/**
 * @function paintDiscard
 * paint discard pile (middle of canvas)
 * 
 * runs every second from paintGame()
 */
function paintDiscard ()
{
    // NOTE delay updates while dragging tile
    if (dragging) return;

    // paint discard pile, text
    context.fillStyle = discardColor;
    context.fillRect(200,200,1040,350);
    context.fillStyle = white;
    context.fillText('discard pile',1080,540);

    if (game.discardPile.length)
    {
        /** most recent tile 120x152 */
        let x = 210;

        /** show tile images or plain */
        if (useTileImages)
        {
            // select, paint tile image
            let tile = tiles[game.discardPile[0].value + ' ' + game.discardPile[0].suit];
            context.drawImage(tile,x,310,120,152);
        }
        else
        {
            context.fillStyle = white;
            context.fillRect(x,310,120,152);
            context.fillStyle = 'blue';
            context.font = '60px Arial';
            context.fillText(game.discardPile[0].value,x,360);
            context.font = '15px Arial';
            context.fillText(game.discardPile[0].suit.substring(0,7),x,375);
            context.font = '30px Arial';
        }
    }

    /** paint tiles CURRENTLY RECENT 14 */
    for (let i=1; i<game.discardPile.length; ++i)
    {
        // DISPLAY ALL TILES (60x76)
        let x = 140 + (i*70);

        /** paint tile with images or not */
        if (useTileImages)
        {
            // select, paint tile image
            let tile = tiles[game.discardPile[i].value + ' '  + game.discardPile[i].suit];
            context.drawImage(tile,x,210,60,76);
        }
        else
        {
            context.fillStyle = white;
            context.fillRect(x,210,60,76);
            context.fillStyle = 'blue';
            context.font = '30px Arial';
            context.fillText(game.discardPile[i].value,x,260);
            context.font = '15px Arial';
            context.fillText(game.discardPile[i].suit.substring(0,7),x,275);
            context.font = '30px Arial';
        }

        /** @TODO figure how you want to display all tiles */
        if (i == 14) break;
    }

    /** paint eat indicators for users that can eat */
    if (game.status == 'discarded' && user.seat != game.turnCount)
    {
        context.font = '30px Arial';
        if (canChow)
        {
            context.fillStyle = 'lightgray';
            context.fillRect(210, 485, 85, 40);
            context.fillStyle = 'black';
            context.fillText('chow',215,515);
        }

        if (canPung)
        {
            context.fillStyle = 'lightgray';
            context.fillRect(305, 485, 85, 40);
            context.fillStyle = 'black';
            context.fillText('pung',310,515);
        }

        if (canKong)
        {
            context.fillStyle = 'lightgray';
            context.fillRect(400, 485, 85, 40);
            context.fillStyle = 'black';
            context.fillText('kong',405,515);
        }

        if ((canChow || canPung) && total == (triples+eyes-1))
        {
            canWin = true;
            context.fillStyle = 'lightgray';
            context.fillRect(495, 485, 85, 40);
            context.fillStyle = 'black';
            context.fillText('win',500,515);
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
    // @NOTE delay updates while dragging
    if (dragging) return;

    // canvas properties
    context.fillStyle = darkenColor;
    context.strokeStyle = white;
    /** bottom bar */
    context.fillRect(100,670,1200,130);
    context.strokeRect(100,670,1200,130);
    /** meld bar */
    context.fillRect(300,571,900,88);
    context.strokeRect(300,571,900,88);

    /** @TODO paint melds of other users? */

    /** paint tiles */
    for (let i=0; i<hand.length; ++i)
    {
        // @NOTE tile size 60x76
        let x = 110 + (i*70);

        /** show tile images or plain */
        if (useTileImages)
        {
            // select, paint tile image
            let tile = tiles[hand[i].value + ' ' + hand[i].suit];
            context.drawImage(tile,x,700,60,76);
        }
        else
        {
            context.fillStyle = white;
            context.fillRect(x,700,60,76);
            context.fillStyle = 'blue';
            context.font = '30px Arial';
            context.fillText(hand[i].value, x,750);
            context.font = '15px Arial';
            context.fillText(hand[i].suit.substring(0,7),x,765);
            context.font = '30px Arial';
        }
    }

    /** paint melds */
    for (let i=0; i<melds.length; ++i)
    {
        // @NOTE tile size 60x76
        let x = 310 + (i * 70);

        /** show tile images or plain */
        if (useTileImages)
        {
            // select, paint tile image
            let tile = tiles[melds[i].value + ' ' + melds[i].suit];
            context.drawImage(tile,x,575,60,76);
        }
        else
        {
            context.fillStyle = white;
            context.fillRect(x,575,60,76);
            context.fillStyle = 'blue';
            context.font = '30px Arial';
            context.fillText(melds[i].value,x,625);
            context.font = '15px Arial';
            context.fillText(melds[i].suit.substring(0,7),x,640);
            context.font = '30px Arial';
        }
    }

    /** paint hold */
    for (let i=0; i<hold.length; ++i)
    {
        // @NOTE tile size 60x76
        let x = 310 + ((i + melds.length) * 70);

        /** show tile images or plain */
        if (useTileImages)
        {
            // select, paint tile image
            let tile = tiles[hold[i].value + ' ' + hold[i].suit];
            context.drawImage(tile,x,575,60,76);
        }
        else
        {
            context.fillStyle = white;
            context.fillRect(x,575,60,76);
            context.fillStyle = 'blue';
            context.font = '30px Arial';
            context.fillText(hold[i].value,x,625);
            context.font = '15px Arial';
            context.fillText(hold[i].suit.substring(0,7),x,640);
            context.font = '30px Arial';
        }
    }
}

/**
 * @function paintHandType
 * paint hand type
 * 
 * runs every second from paintGame()
 * runs on mousedown on handType panel
 */
function paintHandType (y)
{
    if (y == -1) {} // maintain handType for calls from paintGame() 
    else if (between(y,715,755))
    {
        handType = 'standard';
    }
    else if (between(y,760,800))
    {
        handType = '7 pairs';
    }
    else
        return; // not in expected y range, stop

    // align y
    switch (handType)
    {
        case 'standard':
            y=745;
            break;
        case '7 pairs':
            y=790;
            break;
    }

    // clear space
    context.fillStyle = 'black';
    context.font = '20px Arial';
    context.clearRect(1305,680,120,35);
    context.fillText('hand type',1305,705);

    /** draw hand types */
    context.font = '30px Arial';
    context.fillStyle = white;
    context.fillRect(1310,715,120,40);
    context.fillRect(1310,760,120,40);

    /** reset choices */
    context.fillStyle = 'black';
    context.fillText('standard',1310,745);

    // with insufficient tiles in your hand you can't possibly be 7 pairs
    if (hand.length < 13)
    {
        handType = 'standard';
        y=745;
        context.fillStyle = 'gray';
    }
    context.fillText('7 pairs',1310,790);

    /** mark new hand type */
    context.fillStyle = 'red';
    context.fillText(handType,1310,y);
}


/**
 * @function paintGroups
 * valid groupings have lightgreen underline
 * otherwise red
 * 
 * runs every second from paintGame()
 */
function paintGroups ()
{
    // do nothing with empty hand or if swapping tiles
    if (!hand.length || dragging) return;

    // j, x for placing indicators
    let j, x;

    // clear grouping indicators
    context.fillStyle = darkenColor;
    context.fillRect(110,785,1180,10);

    // set `groupings`
    determineGroupings();

    /** paint triple indicators */
    for (let i=0; i<triples; ++i)
    {
        // `x` coordinate of grouping indicators (red, lightgreen)
        x = 120 + (i*210);

        context.fillStyle = (groupings[i] == true) ? 'lightgreen' : 'red';
        context.fillRect(x,785,180,10);
    }

    /** paint eye indicator(s) */
    for (let i=0; i<eyes; ++i)
    {
        // `j` index of first tile of eyes (3, 5, 7, ...)
        j = triples*3 + 2*i;
        // `x` coordinate of grouping indicators (red, lightgreen)
        x = 120 + (j*70);

        context.fillStyle = (groupings[i+triples] == true) ? 'lightgreen' : 'red';
        context.fillRect(x,785,110,10);
    }

    // if all groups valid, win the game
    // @TODO NOTE this should only be the case if its our (discarding) turn
    if (total == eyes + triples && game.turnCount == user.seat)
    {
        updateSession('win', user.seat);
    }
}

/**
 * just do it
 * called from paintGroups() or from eat()
 */
function determineGroupings()
{
    switch (handType)
    {
        // 1 pair of eyes
        case 'standard':
            triples = Math.floor(hand.length/3);
            eyes = 1;
            break;
        // guess how many
        case '7 pairs':
            triples = 1;
            eyes = Math.floor(hand.length/2)-1;
            break;
    }
    total = 0;

    groupings = [];

    // triple groupings
    for (let i=0; i<triples; ++i)
    {
        // `j` index of first tile of triple (0, 3, 6, ...)
        j = i*3;

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
        groupings[i] = false;
        if ((suit0 == suit1 && suit0 == suit2 && suit0 != 'flowers')) // 1
        {
            if (suit0 == 'winds' || suit0 == 'dragons') // 2a
            {
                if (values[0] == values[1] && values[0] == values[2])
                {
                    groupings[i] = true;
                    ++total;
                }
            }
            else // 2b
            {
                if ((values[0] == values[1] && values[0] == values[2])
                    || (values[1]-values[0] == 1 && values[2]-values[1] == 1))
                {
                    groupings[i] = true;
                    ++total;
                }
            }
        }
    }

    // eye groupings
    for (let i=0; i<eyes; ++i)
    {
        // `j` index of first tile of eyes (3, 5, 7, ...)
        j = triples*3 + 2*i;

        /**
         * determine if eyes valid (exact tile match)
         * NOTE: stringify the tile object to compare properties rather than references
         */
        groupings[i+triples] = false;
        if (JSON.stringify(hand[j]) == JSON.stringify(hand[j+1]))
        {
            groupings[i+triples] = true;
            ++total;
        }
    }
}


/** add event listeners to the canvas after start() */
function setupEventListeners ()
{
    canvas.addEventListener('mousemove', handleMousemove);
    canvas.addEventListener('mousedown', handleMousedown);
    canvas.addEventListener('mouseup', handleMouseup);
}


/**
 * @EventListener handleMousemove
 * 
 * capture mouse movement as event
 * 1: display mouse coordinates
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
    
    /** dragging mahjong tile */
    if (dragging)
    {
        /** preemptively clear placement indicators (discardPile, bar) */
        context.fillStyle = discardColor;
        context.fillRect(520,530,400,10);
        context.fillStyle = darkenColor;
        context.fillRect(105,680,1150,20);

        /**
         * mouse hovering over discard pile
         * check conditions if we can highlight discard pile
         */
        if (user.seat == game.turnCount && game.status == 'discarding' && between(e.offsetY,200,550))
        {
            // discard on mouseup
            indexToPlace = -1;

            // yellow indicator on discard pile
            context.fillStyle = 'yellow';
            context.fillRect(520,530,400,10);
        }
        /* mouse hovering over tiles */
        else
        {
            /* tile to swap on mouseup */
            indexToPlace = Math.floor((e.offsetX - 110)/70);

            // stay in bounds of user's hand
            if (indexToPlace < 0) indexToPlace = 0;
            if (indexToPlace > hand.length-1) indexToPlace = hand.length-1;

            // yellow indicator on indexToPlace
            context.fillStyle = 'yellow';
            context.fillRect(105+(70*indexToPlace),680,5,20);
        }
    }
    // console.log(e);
}

/**
 * @EventListener handleMousedown
 * 
 * capture mouse down as event
 * 1: select tile to drag
 * 2: changing hand type
 * 3: trying to chow, pung, or kong
 */
function handleMousedown (e)
{
    /** do nothing if still in lobby */
    if (game.status == 'waiting') return;

    /** select tile to drag */
    if (between(e.offsetY, 690, 766) && between(e.offsetX, 110, 110+hand.length*70))
    {
        // set tileSelected
        tileSelected = Math.floor((e.offsetX - 110)/70);

        /**
         * if suit is flower
         * tile: hand -> melds, exit function
         */
        if (hand[tileSelected].suit == 'flowers')
        { 
            // take from hand
            let [tileToPlace] = hand.splice(tileSelected, 1);
            // add to melds
            melds.push(tileToPlace);
            // update game state
            updateSession('place', tileSelected);

            paintHand();
            paintGroups();
            return;
        }

        // @TODO CHOW, PUNG
        // check for tiles in temp array
        // TODO IF THE CLAIM IS FILED THEN WE WANT TO NOT DO SOMETHING HERE
        if (claim != '')
        {
            // push to the eating array, then do the fucntion
            // eating.push(tileSelected);
            eat(tileSelected);
            return;
        }

        // sanity: indexToPlace is the same tile
        // so if immediate mouseup, no tile swap
        indexToPlace = tileSelected;

        // yellow indicator on `indexToPlace`
        context.fillStyle = "yellow";
        context.fillRect(105+(70*indexToPlace),680,5,20);

        // gray out `tileSelected`
        context.fillStyle = "gray";
        context.fillRect(110+(tileSelected*70),700,60,76);

        // set global variable
        dragging = true;
    }
    // 2: changing hand type
    else if (between(e.offsetX, 1310, 1430))
    {
        paintHandType(e.offsetY);
        paintGroups();
    }
    // 3: chow/pung/kong
    else if (between(e.offsetY,485,525))
    {
        if (user.canChow && between(e.offsetX,210,295))
        {
            claim = 'chow';
            eat(-1);
        }
        else if (user.canPung && between(e.offsetX,305,390))
        {
            claim = 'pung';
            eat(-1);
        }
        else if (user.canKong && between(e.offsetX,400,485))
        {
            // claim kong from here
            claim = 'kong';

            let message = ['kong'];
            let dTile = JSON.stringify(discardPile[0]);

            // iterate through hand and get indexes of all (3) exact matches
            hand.forEach((tile, i) => {
                if (dTile == JSON.stringify(tile))
                    message.push(i);
            });

            updateSession('eat', message);
        }
        else if (user.canChow || user.canPung && total == (triples+eyes-1))
        {
            claim = 'win';
            eat(-1);
        }
    }
    // console.log(e);
}

// by the end we want to update session
function eat (i)
{
    // different behavior depending on passed `i`ndex
    switch (i)
    {
        // claim start
        case -1:
            context.font = '14px Arial';
            context.fillStyle = 'black';
            context.clearRect(5,540,150,30);
            // context.fillRect(5,540,150,30);
            context.fillText(claim + ': select 2 tiles',5,560);
            context.font = '30px Arial';
            break;

        default:
            switch (eating.length)
            {
                // avoid player clicking the same tile twice
                case 1:
                    if (eating[0] == i)
                        return;

                // 1 or 0 tiles
                default:
                    // paint green eat indicator
                    let x = 130 * (i + 70);
                    context.fillStyle = 'lightgreen';
                    context.fillRect(x,680,20,10);

                    eating.push(i);
                    break;
            }
            break;
    } 

    // 2 tiles in `eating`: check claim validity
    if (eating.length == 2)
    {
        done = false;

        if (claim == 'chow' || claim == 'win')
        {
            // read tile values, suits in `hand`
            let values = [
                discardPile[0].value, hand[eating[0]].value, hand[eating[1]].value
            ];
            // sort `values` in increasing order
            values.sort((a,b) => a-b);

            let suits = [
                discardPile[0].suit, hand[eating[0]].suit, hand[eating[1]].suit
            ];
            // if valid, chow
            if (suits[0] == suits[1] && suits[1] == suits[2] &&
                values[1]-values[0] == 1 && values[2]-values[1] == 1
            )
            {
                // 2 indexes from hand -> hold
                hold.push(hand.splice(eating[0], 1)[0]);
                hold.push(hand.splice(eating[1], 1)[0]);

                if (claim == 'chow')
                {
                    updateSession('eat', ['chow', eating[0], eating[1]])
                    done = true;
                }
                else
                {
                    // win claim
                    determineGroupings();
                    if (total == triples + eyes)
                    {
                        updateSession('eat', ['win', eating[0], eating[1]]);
                    }
                    else
                    {
                        // @TODO undo pushes on basis of failure
                        hand.push(hold.splice(0,1)[0]);
                        hand.push(hold.splice(0,1)[0]);
                    }
                }
            }
        } 
        
        if (!done && claim == 'pung' || claim == 'win')
        {
            t0 = JSON.stringify(discardPile[0]);
            t1 = JSON.stringify(eating[0]);
            t2 = JSON.stringify(eating[1]);

            if (t0 == t1 && t1 == t2)
            {
                // 2 indexes from hand -> hold
                hold.push(hand.splice(eating[0], 1)[0]);
                hold.push(hand.splice(eating[1], 1)[0]);

                if (claim == 'pung')
                {
                    updateSession('eat', [claim, eating[0], eating[1]])
                    done = true;
                }
                else
                {
                    // win claim
                    determineGroupings();
                    if (total == triples + eyes)
                    {
                        updateSession('eat', ['win', eating[0], eating[1]]);
                    }
                    else
                    {
                        // undo pushes on basis of failure
                        hand.push(hold.splice(0,1)[0]);
                        hand.push(hold.splice(0,1)[0]);
                    }
                }
            }
        }


        // i guess by here eating is already [];
        claim = '';
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
    context.fillRect(105,680,1150,20);

    if (dragging)
    {
        /** @TODO user can discard if its their turn */
        if (user.seat == game.turnCount && game.status == "discarding" && between(e.offsetY,200,500))
        {
            // discarded tile: hand -> discardPile
            // array destructuring to extract tile from array
            let [tileDiscarded] = hand.splice(tileSelected, 1);

            // debug information
            if (debug)
            {
                context.fillStyle = "red";
                context.fillRect(0,100,350,50);
                context.fillStyle = "black";

                context.font = "14px Arial";
                let text = tileDiscarded.value + tileDiscarded.suit[0];
                context.fillText("player discarded tile: " + text,10,130);
            }

            // changes to the discard pile come with session update
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

        dragging = false;
        paintHand();
        paintGroups();
    }
    // console.log(e);
}

// update database with new state
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
            console.error("update.php response was not ok: ", response.statusText);

        res = await response.json();

        // print message
        console.log(res.message);
    }
    catch (error)
    {
        console.error("update.php fetch error: ", error);
    }
}

/**
 * @function loop.php
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
            console.error("loop.php response was not ok: ", response.statusText);

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
            canChow = user.canChow;
            canPung = user.canPung;
            canKong = user.canKong;
            // TODO game logic for determining whether we are allowed to eat

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