<?php
/**
 * script runs every second by each player
 * different behavior depending on player's seat
 */
session_start();
header('Content-Type: application/json'); # output json response

/** global variables */
$message = 'loop.php: ';
$changedG = false;
$changedP = false;
$changedAllP = false;

$hands = [];
$melds = [];
$holds = [];
$deck = [];
$discardPile = [];
$seat = $_SESSION['user']['seat'];

/** database credentials */
$host = 'localhost';
$db = 'mahjongbyyelir';
$user = 'root'; // default XAMPP username
$pass = ''; // default password

/** try to connect to database */
try
{
    // create new PDO instance to connect to MySQL
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}
/** database connection error */
catch (PDOException $e)
{
    echo json_encode(['success' => false, 'message' => $message . $e->getMessage()]);
    exit();
}

// sanity: session must have valid game to fetch latest state
if (!isset($_SESSION['game']))
{
    echo json_encode(['success' => false, 'message' => $message . 'requires active session']);
    exit();
}

// retrieve game
$sql = "
    SELECT G.GameID, GameDeck, GameDiscardPile,
        GameNumberPlayers, GameTurnCount, GameSeconds, GameStatus
        GROUP_CONCAT(CONCAT(PlayerName, '|', PlayerHand, '|', PlayerMelds, '|', PlayerHold, '|', PlayerSeat) SEPARATOR '||') Players
    FROM Game_T G
    INNER JOIN Player_T P
    ON G.GameID = P.GameID
    WHERE G.GameID = ?
";
$stmt = $pdo->prepare($sql);
$stmt->execute([ $_SESSION['game']['gameID'] ]);
// fetch game state
$game = $stmt->fetch(PDO::FETCH_ASSOC);

// decode arrays
$deck = json_decode($game['GameDeck'], true);
$discardPile = json_decode($game['GameDiscardPile'], true);

// split `Players` string
// 'yelir|hand1|melds1|0||hello12:hand2|1'
$players = explode('||', $game['Players']);

// 'yelir|hand1|melds1|0'
foreach ($players as $i => $player)
{
    // split `player` string into list containing user information
    list($lname, $lhand, $lmelds, $lhold, $lseat) = explode('|', $player);

    $hands[] = json_decode($lhand, true);
    $melds[] = json_decode($lmelds, true);
    $holds[] = json_decode($lhold, true);

    // if session game doesn't have user: insert name & seat
    // hand, melds added later
    if ($i >= count($_SESSION['game']['players']))
    {
        $_SESSION['game']['players'][] = [
            'name' => $lname,
            'seat' => $lseat
        ];
    }
}

// NOTE by default users CANNOT claim tiles
$_SESSION['user']['canChow'] = false;
$_SESSION['user']['canPung'] = false;
$_SESSION['user']['canKong'] = false;
// $_SESSION['user']['canWin'] = false;

/**
 * account for possible game states every second
 * 
 * 1: waiting (for 4 players)
 * 2: discarded tile
 * 3: drawing tile
 * 4: game finished
 */
switch ($game['GameStatus'])
{
    case 'waiting':
        // host (seat 0) starts game with 4 players
        if ($seat == 0 && $game['GameNumberPlayers'] == 4)
        {
            $changedG = true;
            // start timer
            if ($game['GameSeconds'] == -1)
            {
                $game['GameSeconds'] = 5;
            }
            // decrement timer
            else 
            {
                // end of timer: START GAME
                if ($game['GameSeconds'] == 0)
                {
                    $changedP = true; // now you get it 
                    $changedAllP = true;

                    /** INITIAL TILE DRAW */
                    // make new array of arrays with 16 tiles each
                    $hands[0] = array_splice($deck, 0, 16);
                    $hands[1] = array_splice($deck, 0, 16);
                    $hands[2] = array_splice($deck, 0, 16);
                    $hands[3] = array_splice($deck, 0, 16);

                    // update game status
                    ++$game['GameTurnCount'];
                    $game['GameStatus'] = 'drawing';

                    $message .= 'started game';
                }
                // decrement timer so it ends at -1
                --$game['GameSeconds'];
            }
        }
        break;

    case 'discarded':
        // host sets turn timer
        if ($seat == 0)
        {
            $changedG = true;
            // start timer
            if ($game['GameSeconds'] == -1)
            {
                $game['GameSeconds'] = 30;
            }
            // decrement timer
            else
            {
                // timer end: check holds and move turn
                if ($game['GameSeconds'] == 0)
                {
                    // cEater is the player who currently has best precedence
                    // `cPrec` the current lowest precedence number
                    $cEater = -1;
                    $cPrec = 8;

                    // THREE TIMES: FOR EACH NON DISCARDER
                    for ($i=1; $i<4; ++$i)
                    {
                        // go counter clockwise from discarder
                        $j = ($i + $_SESSION['game']['GameTurnCount']) % 4;

                        // no claim has: []
                        // ignore users with no claim
                // if player is claiming valid win, that takes precedence
                // then any player calling kong
                // then any player calling pung
                // then the next player's chow
                        if (count($holds[$j]))
                        {
                            $prec = 8;
                            switch ($holds[$j][0])
                            {
                                case 'win':
                                    // right->1, across->2, left->3
                                    $prec = $i;
                                    break;
                                case 'kong':
                                case 'pung':
                                    // right->4, across->5, left->6
                                    $prec = $i+3;
                                    break;
                                case 'chow':
                                    // TODO right->7, thats all we want to consider
                                    $prec = $i+6;
                                    break;
                            }

                            // if our precedence lower than current low,
                            // then current eater is the loser
                            // otherwise we are the loser
                            $loser;
                            if ($prec < $cPrec)
                            {
                                $loser = $cEater;

                                // update these
                                $cEater = $j;
                                $cPrec = $prec;
                            }
                            else
                            {
                                $loser = $j;
                            }

                            // if there is valid loser, clear out holdings
                            if ($loser != -1)
                            {
                                // tiles: hold index 2,1 -> hand
                                $hands[$loser][] = array_splice($holds[$loser], 2, 1)[0];
                                $hands[$loser][] = array_splice($holds[$loser], 1, 1)[0];
                            }
                        }
                    }

                    // case: no eating claims
                    // move turn to next player, drawing
                    if ($cPrec == 8)
                    {
                        $game['GameTurnCount'] = ++$game['GameTurnCount'] % 4;
                        $game['GameStatus'] = 'drawing';
                    }
                    else
                    {
                        switch ($cEater[$j][0])
                        {
                            // wins finish the game
                            case 'win':
                                $game['GameStatus'] = 'finished';
                                break;

                            // kong takes a lot of tiles, so user needs another
                            case 'kong':
                                $game['GameStatus'] = 'drawing';

                            // pung chow they just need to discard after eating
                            case 'pung':
                            case 'chow':
                                $game['GameStatus'] = 'discarding';
                                break;
                        }

                        // update turn count
                        $game['GameTurnCount'] = $cEater;
                    }
                }
                // decrement so the timer ends at -1
                --$game['GameSeconds'];
            }
        }

        // game status still discarded? (timer decrementing)
        // other users (we) may claim discarded tile
        if ($game['GameStatus'] == 'discarded' && $seat != $game['GameTurnCount'])
        {
            // discarded tile
            $tile = $discardPile[0];

            // (chow) 3 sequential
            $hasLower = false;
            $has2Lower = false;
            $hasUpper = false;
            $has2Upper = false;
            // exact matches
            $matchCount = 0;

            // compare with every tile in (our) hand
            foreach ($hands[$seat] as $hTile)
            {
                // subtract value against given tile
                $value = $tile['value'] - $hTile['value'];

                // comparisons only on suit match
                if ($tile['suit'] == $hTile['suit'])
                {
                    // set variables like so
                    switch ($value)
                    {
                        case -2:
                            $has2Upper = true;
                            break;
                        case -1:
                            $hasUpper = true;
                            break;
                        case 0:
                            ++$matchCount;
                            break;
                        case 1:
                            $hasLower = true;
                            break;
                        case 2:
                            $has2Lower = true;
                            break;
                    }
                }
            }

            // pung if hand has at least 2 exact tile matches
            // kong if 3 exact tile matches
            if ($matchCount >= 2)
            {
                $_SESSION['user']['canPung'] = true;

                if ($matchCount == 3)
                    $_SESSION['user']['canKong'] = true;
            }

            // chow if three tile straight in hand (ex: 1, 2, 3)
            // NOTE dragons and winds don't have sequential series, cant chow
            // @TODO can only chow if in position or can win?
            if ($tile['suit'] != 'dragons' &&
                $tile['suit'] != 'winds' &&
                $has2Lower && $hasLower ||
                $hasLower && $hasUpper ||
                $hasUpper && $has2Upper
            )
            {
                if ($game['GameTurnCount'] == $seat - 1)
                {
                    $_SESSION['user']['canChow'] = true;
                }

            }

            // @TODO NOTE for now, user derives `canwin` in index.js
            // check if user can go for win (x valid triple groupings?)
            // if ($_SESSION['user']['canChow'] || $_SESSION['user']['canPung']
            //     && $_SESSION['user']['hand'])
            // {
            
            // }
        }
        break;

    case 'drawing':
        // if its (our) user's turn to draw
        if ($seat == ($game['GameTurnCount'] % 4))
        {
            $changedP = true; // of course

            // first tile in deck -> our hand
            $hands[$seat][] = array_shift($deck);

            // update game status
            $game['GameStatus'] = 'discarding';
        }

        break;

    case 'finished':
        // @TODO my thought is that we just need to update session data and
        // go from there?
        // finished should mean no discarding follows

        echo json_encode(['success' => false, 'message' => $message . '`finished` status not implemented']);
        exit();
        break;
}


// in event of player changes
// tile draws (also initial), and chow/pung/kong
if ($changedP)
{
    // update Player_T hands, melds, molds
    $sql = "
        UPDATE Player_T
        SET PlayerHand = ?, PlayerMelds = ?, PlayerHold = ?
        WHERE PlayerName = ?
    ";
    $stmt = $pdo->prepare($sql);

    // initial tile draw or chow/pung/kong
    if ($changedAllP)
    {
        $stmt->execute([ json_encode($hands[0]), json_encode($allMelds[0]), json_encode($holds[0]), $_SESSION['game']['players'][0]['name'] ]);
        $stmt->execute([ json_encode($hands[1]), json_encode($allMelds[1]), json_encode($holds[1]), $_SESSION['game']['players'][1]['name'] ]);
        $stmt->execute([ json_encode($hands[2]), json_encode($allMelds[2]), json_encode($holds[2]), $_SESSION['game']['players'][2]['name'] ]);
        $stmt->execute([ json_encode($hands[3]), json_encode($allMelds[3]), json_encode($holds[3]), $_SESSION['game']['players'][3]['name'] ]);
    }
    else
    {
        $stmt->execute([
            json_encode($hands[$seat]),
            $_SESSION['game']['gameID'],
            $_SESSION['user']['name']
        ]);
    }
}
// IF ANY CHANGES WERE MADE
if ($changedG || $changedP)
{
    // update Game_T's affected rows
    $sql = "
        UPDATE Game_T
        SET GameDeck = ?, GameTurnCount = ?, GameSeconds = ?, GameStatus = ?
        WHERE GameID = ?
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        json_encode($deck),
        $game['GameTurnCount'],
        $game['GameSeconds'],
        $game['GameStatus'],
        $_SESSION['game']['gameID']
    ]);
}

// update session game
$_SESSION['game'] = array_merge($_SESSION['game'], [
    'deckLength' => count($deck), 
    'discardPile' => $discardPile,
    'numberPlayers' => $game['GameNumberPlayers'],
    'turnCount' => $game['GameTurnCount'],
    'seconds' => $game['GameSeconds'],
    'status' => $game['GameStatus'],
]);

// updating session game players
foreach ($players as $i => $player)
{
    // merge to update hand, melds
    $_SESSION['game']['players'][$i] = array_merge($_SESSION['game']['players'][$i], [
        'handCount' => count($hands[$i]),
        'melds' => $melds[$i],
        'hold' => $holds[$i]
    ]);
}

// update session user
$_SESSION['user'] = array_merge($_SESSION['user'], [
    'hand' => $hands[$seat],
    'melds' => $melds[$seat],
    'hold' => $holds[$i]
]);
 
// JSON encoded response to `index.js`
// there it will update variables & player view
echo json_encode([
    'success' => true,
    'message' => $message,
    'gameData' => $_SESSION['game'],
    'userData' => $_SESSION['user']
]);

// echo json_encode(['success' => false, 'message' => $message . 'die here']);
// exit();
?>