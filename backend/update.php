<?php
/**
 * presumably you run this script in multiple scenarios:
 * 
 * 1: place flower from hand to melds
 * 2: arranging hand
 * 3: tile discard
 * 4: attempt to eat discarded tile
 * 5: canceling attempt to eat
 * 5: finish the game
 */
session_start();
header('Content-Type: application/json'); # output json response

/** global vars */
$message = 'update.php: ';

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


// sanity: session needs valid `game` to update state
if (!isset($_SESSION['game']))
{
    echo json_encode(['success' => false, 'message' => $message . 'requires valid session']);
    exit();
}

// @TODO method post?
// decode index.js JSON request
// `true` converts `input` to associative array
$input = json_decode(file_get_contents('php://input'), true);

// sanity: need `action` to update
if (!isset($input['action']))
{
    echo json_encode(['success' => false, 'message' => $message . 'requires `action`']);
    exit();
}


// retrieve game
$sql = "
    SELECT GameID, GameDeck, GameDiscardPile,
        GameNumberPlayers, GameTurnCount, GameSeconds,
        GameStatus
    FROM Game_T
    WHERE GameID = ?
";
$stmt = $pdo->prepare($sql);
$stmt->execute([ $_SESSION['game']['gameID'] ]);
$game = $stmt->fetch(PDO::FETCH_ASSOC);

// decode arrays
$deck = json_decode($game['GameDeck'], true);
$discardPile = json_decode($game['GameDiscardPile'], true);

// retrieve user
$sql = "
    SELECT PlayerName, PlayerHand, PlayerMelds, PlayerHold, PlayerSeat
    FROM Player_T
    WHERE PlayerName = ?
";
$stmt = $pdo->prepare($sql);
$stmt->execute([ $_SESSION['user']['name'] ]);
$player = $stmt->fetch(PDO::FETCH_ASSOC);

// decode arrays
$hand = json_decode($player['PlayerHand'], true);
$melds = json_decode($player['PlayerMelds'], true);
$hold = json_decode($player['PlayerHold'], true);


// switch case for performing action
switch ($input['action'])
{
    /** place flower tile in melds */
    case 'place':
        // tile index to place
        $i = $input['message'];

        // tile: hand index i -> melds index 0
        $tileToPlace = array_splice($hand, $i, 1)[0];
        array_unshift($melds, $tileToPlace);

        // placed flower: draw new tile
        // NOTE: tried setting game status here
        // but it interferes with loop script
        $hand[] = array_shift($deck);
        break;

    /** arranging hand */
    case 'arrange':
        // tile indexes for arrange
        $i = $input['message'][0];
        $j = $input['message'][1];

        // tile: hand index i -> $tileToMove -> hand index j
        $tileToMove = array_splice($hand, $i, 1);
        array_splice($hand, $j, 0, $tileToMove);
        break;

    case 'discard':
        // tile index to discard
        $i = $input['message'];

        // tile: hand index i -> discardPile index 0
        $tileToDiscard = array_splice($hand, $i, 1)[0];
        array_unshift($discardPile, $tileToDiscard);

        // update game status
        $game['GameStatus'] = 'discarded';
        break;
    
    // @TODO request, not immediate
    // idea: tiles: hand indices (message) -> hold
    // input action -> hold index 0
    // later in loop.php, if player discard goes through,
    // tiles: hold -> melds, along with discarded tile
    case 'chow':
    case 'kong':
    case 'pung':
        $hold = []; # reset hold

        // hold index 0: claim type
        $hold[] = $input['action'];

        // NOTE `message` should be reverse sorted from index.js

        // for-loop based on # of tiles in message
        // fill eye: 1
        // chow/pung/win: 2
        // kong: 3
        for ($i=0; $i<count($input['message']); ++$i)
        {
            $hold[] = array_splice($hand, $input['message'][$i], 1)[0];
        }
        break;
    
    // win claims handle different
    case 'cWin':
        $hold = []; # reset hold

        // hold index 0: claim type
        $hold[] = $input['action'];

        // for win claims, `n` is integer
        $n = $input['message'];

        // tiles: last `n` in hand -> hold
        for ($i=0; $i<$n; ++$i)
        {
            $hold[] = array_pop($hand);
        }

        break;
    
    // @TODO cancel functionality
    case 'cancel':
        // tiles: hold index 2,1 -> hand
        $hand[] = array_splice($hold,2,1)[0];
        $hand[] = array_splice($hold,1,1)[0];

        $hold = []; # remove claim type
        break;

    case 'win':
        // @TODO NOTE in order to win, it must be player's (our) turn
        // this doesn't come from claiming a win on discard
        // moreso when someone draws/arranges to a win
        $game['GameStatus'] = 'finished';
        break;

    default:
        echo json_encode(['success' => false, 'message' => $message . 'invalid `action`']);
        exit();
        break;
}

// update Game_T affected rows
$sql = "
    UPDATE Game_T
    SET GameDeck = ?, GameDiscardPile = ?, GameStatus = ?
    WHERE GameID = ?
";
$stmt = $pdo->prepare($sql);
$stmt->execute([
    json_encode($deck),
    json_encode($discardPile),
    $game['GameStatus'],
    $game['GameID']
]);

// update Player_T affected rows
$sql = "
    UPDATE Player_T
    SET PlayerHand = ?, PlayerMelds = ?, PlayerHold = ?
    WHERE PlayerName = ?
";
$stmt = $pdo->prepare($sql);
$stmt->execute([
    json_encode($hand),
    json_encode($melds),
    json_encode($hold),
    $_SESSION['user']['name']
]);

// sessions update through loop.php
// return success message
echo json_encode(['success' => true, 'message' => $message . '`' . $input['action'] . '` success']);

// echo json_encode(['success' => false, 'message' => $message . 'die here']);
// exit();
?>