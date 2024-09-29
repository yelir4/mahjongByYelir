<?php
session_start(); # start session
header('Content-Type: application/json'); # output response in json

/** global vars */
$message = "start.php: ";

/** database credentials */
$host = 'localhost';
$db = 'mahjongbyyelir';
$user = 'root'; // default XAMPP username
$pass = ''; // default password

/** attempt to connect to database */
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

/**
 * does session exist?
 * 
 * yes: skip, return session data
 * no: check, did js pass username?
 * 
 * no: exit
 * yes: check Player_T, does user exist? 
 * 
 * yes: do nothing @TODO ?
 * no: insert new user into Player_T
 */
if (!isset($_SESSION['user']))
{
    // decode index.js JSON request body
    $input = json_decode(file_get_contents('php://input'), true);

    // check if username is provided
    if (!isset($input['username']))
    {
        echo json_encode(['success' => false, 'message' => $message . 'need `username` or valid session']);
        exit();
    }

    // check for user in Player_T
    $sql = "
        SELECT PlayerName
        FROM Player_T
        WHERE PlayerName = ?
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([ $input['username'] ]);

    // fetch `user` (or empty row) from query
    $player = $stmt->fetch(PDO::FETCH_ASSOC);

    // user not in database, insert new
    if (!isset($player['PlayerName']))
    {
        $sql = "
            INSERT INTO Player_T (PlayerName)
            VALUES (?)
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([ $input['username'] ]);
    }
    // @TODO if player exists populate session data
    // with user's game and user data
    // and somehow send the response right away
    else
    {
        $x;
    }

//#############################################################################################
//#############################################################################################
//#############################################################################################

    // check Game_T for open games
    $sql = "
        SELECT GameID, GameNumberPlayers 
        FROM Game_T
        WHERE GameNumberPlayers < 4
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    // fetch 'game' (or empty row) from query
    $game = $stmt->fetch(PDO::FETCH_ASSOC);

    /**
     * does Game_T have open game?
     * 
     * yes: join
     * no: initialize new game
     */
    if (isset($game['GameID']))
    {
        // set GameID from fetched row
        $gameID = $game['GameID'];

        // update Player_T (take seat, link player to game)
        $sql = "
            UPDATE Player_T
            SET PlayerHand = ?, PlayerMelds = ?, PlayerHold = ?, PlayerSeat = ?, GameID = ?
            WHERE PlayerName = ?
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            json_encode([]),
            json_encode([]),
            json_encode([]),
            $game['GameNumberPlayers'],
            $gameID,
            $input['username']
        ]);

        // update Game_T (player join)
        $sql = "
            UPDATE Game_T
            SET GameNumberPlayers = ?
            WHERE GameID = ?
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([ 1+$game['GameNumberPlayers'], $gameID ]);


        // RE-SELECT FROM UPDATED TABLES
        /** NOTE: GROUP_CONCAT() concatenates values from multiple rows into a string */
        $sql = "
            SELECT G.GameID, GameDeck, GameDiscardPile, GameNumberPlayers, GameTurnCount, GameSeconds, GameStatus,
                GROUP_CONCAT(CONCAT(PlayerName, '|', PlayerHand, '|', PlayerMelds, '|', PlayerSeat) SEPARATOR '||') Players
            FROM Game_T G
            INNER JOIN Player_T P
            ON G.GameID = P.GameID
            WHERE G.GameID = ?
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([ $gameID ]);

        // re-fetch 'game'
        $game = $stmt->fetch(PDO::FETCH_ASSOC);

        // set session user
        $_SESSION['user'] = [
            'name' => $input['username'],
            'hand' => [],
            'melds' => [],
            'hold' => [],
            'seat' => $game['GameNumberPlayers'] - 1
        ];

        // set session game
        $_SESSION['game'] = [
            'gameID' => $game['GameID'],
            'deckLength' => count(json_decode($game['GameDeck'], true)), 
            'discardPile' => json_decode($game['GameDiscardPile'], true),
            'numberPlayers' => $game['GameNumberPlayers'],
            'turnCount' => $game['GameTurnCount'],
            'seconds' => $game['GameSeconds'],
            'status' => $game['GameStatus'],
            'players' => []
        ];

        // split `Players` column (string) into `players` array 
        // 'yelir:hand1;hello12:hand2'
        $players = explode('||', $game['Players']);

        // 'yelir:hand1'
        foreach ($players as $player)
        {
            // split `player` string into list containing its information
            list($name, $hand, $melds, $seat) = explode('|', $player);

            $_SESSION['game']['players'][] = [
                'name' => $name,
                'handCount' => count(json_decode($hand, true)),
                'melds' => json_decode($melds, true),
                'seat' => $seat
            ];
        }

        // update message code
        $message .= 'joined game' . $game['GameID'];
    }
    else /** initialize new game */
    {
        /** create deck of tiles */
        $flowers = [
            ['suit' => 'flowers', 'value' => 1, 'color' => 'blue'],
            ['suit' => 'flowers', 'value' => 5, 'color' => 'red'],

            ['suit' => 'flowers', 'value' => 2, 'color' => 'blue'],
            ['suit' => 'flowers', 'value' => 6, 'color' => 'red'],

            ['suit' => 'flowers', 'value' => 3, 'color' => 'blue'],
            ['suit' => 'flowers', 'value' => 7, 'color' => 'red'],

            ['suit' => 'flowers', 'value' => 4, 'color' => 'blue'],
            ['suit' => 'flowers', 'value' => 8, 'color' => 'red']
        ];

        $bamboos = [
            ['suit' => 'bamboos', 'value' => 1],
            ['suit' => 'bamboos', 'value' => 1],
            ['suit' => 'bamboos', 'value' => 1],
            ['suit' => 'bamboos', 'value' => 1],

            ['suit' => 'bamboos', 'value' => 2],
            ['suit' => 'bamboos', 'value' => 2],
            ['suit' => 'bamboos', 'value' => 2],
            ['suit' => 'bamboos', 'value' => 2],

            ['suit' => 'bamboos', 'value' => 3],
            ['suit' => 'bamboos', 'value' => 3],
            ['suit' => 'bamboos', 'value' => 3],
            ['suit' => 'bamboos', 'value' => 3],

            ['suit' => 'bamboos', 'value' => 4],
            ['suit' => 'bamboos', 'value' => 4],
            ['suit' => 'bamboos', 'value' => 4],
            ['suit' => 'bamboos', 'value' => 4],

            ['suit' => 'bamboos', 'value' => 5],
            ['suit' => 'bamboos', 'value' => 5],
            ['suit' => 'bamboos', 'value' => 5],
            ['suit' => 'bamboos', 'value' => 5],

            ['suit' => 'bamboos', 'value' => 6],
            ['suit' => 'bamboos', 'value' => 6],
            ['suit' => 'bamboos', 'value' => 6],
            ['suit' => 'bamboos', 'value' => 6],

            ['suit' => 'bamboos', 'value' => 7],
            ['suit' => 'bamboos', 'value' => 7],
            ['suit' => 'bamboos', 'value' => 7],
            ['suit' => 'bamboos', 'value' => 7],

            ['suit' => 'bamboos', 'value' => 8],
            ['suit' => 'bamboos', 'value' => 8],
            ['suit' => 'bamboos', 'value' => 8],
            ['suit' => 'bamboos', 'value' => 8],

            ['suit' => 'bamboos', 'value' => 9],
            ['suit' => 'bamboos', 'value' => 9],
            ['suit' => 'bamboos', 'value' => 9],
            ['suit' => 'bamboos', 'value' => 9],
        ];

        $dots = [
            ['suit' => 'dots', 'value' => 1],
            ['suit' => 'dots', 'value' => 1],
            ['suit' => 'dots', 'value' => 1],
            ['suit' => 'dots', 'value' => 1],

            ['suit' => 'dots', 'value' => 2],
            ['suit' => 'dots', 'value' => 2],
            ['suit' => 'dots', 'value' => 2],
            ['suit' => 'dots', 'value' => 2],

            ['suit' => 'dots', 'value' => 3],
            ['suit' => 'dots', 'value' => 3],
            ['suit' => 'dots', 'value' => 3],
            ['suit' => 'dots', 'value' => 3],

            ['suit' => 'dots', 'value' => 4],
            ['suit' => 'dots', 'value' => 4],
            ['suit' => 'dots', 'value' => 4],
            ['suit' => 'dots', 'value' => 4],

            ['suit' => 'dots', 'value' => 5],
            ['suit' => 'dots', 'value' => 5],
            ['suit' => 'dots', 'value' => 5],
            ['suit' => 'dots', 'value' => 5],

            ['suit' => 'dots', 'value' => 6],
            ['suit' => 'dots', 'value' => 6],
            ['suit' => 'dots', 'value' => 6],
            ['suit' => 'dots', 'value' => 6],

            ['suit' => 'dots', 'value' => 7],
            ['suit' => 'dots', 'value' => 7],
            ['suit' => 'dots', 'value' => 7],
            ['suit' => 'dots', 'value' => 7],

            ['suit' => 'dots', 'value' => 8],
            ['suit' => 'dots', 'value' => 8],
            ['suit' => 'dots', 'value' => 8],
            ['suit' => 'dots', 'value' => 8],

            ['suit' => 'dots', 'value' => 9],
            ['suit' => 'dots', 'value' => 9],
            ['suit' => 'dots', 'value' => 9],
            ['suit' => 'dots', 'value' => 9]
        ];

        $characters = [
            ['suit' => 'characters', 'value' => 1],
            ['suit' => 'characters', 'value' => 1],
            ['suit' => 'characters', 'value' => 1],
            ['suit' => 'characters', 'value' => 1],

            ['suit' => 'characters', 'value' => 2],
            ['suit' => 'characters', 'value' => 2],
            ['suit' => 'characters', 'value' => 2],
            ['suit' => 'characters', 'value' => 2],

            ['suit' => 'characters', 'value' => 3],
            ['suit' => 'characters', 'value' => 3],
            ['suit' => 'characters', 'value' => 3],
            ['suit' => 'characters', 'value' => 3],

            ['suit' => 'characters', 'value' => 4],
            ['suit' => 'characters', 'value' => 4],
            ['suit' => 'characters', 'value' => 4],
            ['suit' => 'characters', 'value' => 4],

            ['suit' => 'characters', 'value' => 5],
            ['suit' => 'characters', 'value' => 5],
            ['suit' => 'characters', 'value' => 5],
            ['suit' => 'characters', 'value' => 5],

            ['suit' => 'characters', 'value' => 6],
            ['suit' => 'characters', 'value' => 6],
            ['suit' => 'characters', 'value' => 6],
            ['suit' => 'characters', 'value' => 6],

            ['suit' => 'characters', 'value' => 7],
            ['suit' => 'characters', 'value' => 7],
            ['suit' => 'characters', 'value' => 7],
            ['suit' => 'characters', 'value' => 7],

            ['suit' => 'characters', 'value' => 8],
            ['suit' => 'characters', 'value' => 8],
            ['suit' => 'characters', 'value' => 8],
            ['suit' => 'characters', 'value' => 8],

            ['suit' => 'characters', 'value' => 9],
            ['suit' => 'characters', 'value' => 9],
            ['suit' => 'characters', 'value' => 9],
            ['suit' => 'characters', 'value' => 9]
        ];

        $winds = [
            ['suit' => 'winds', 'value' => 0, 'direction' => 'n'],
            ['suit' => 'winds', 'value' => 0, 'direction' => 'n'],
            ['suit' => 'winds', 'value' => 0, 'direction' => 'n'],
            ['suit' => 'winds', 'value' => 0, 'direction' => 'n'],

            ['suit' => 'winds', 'value' => 1, 'direction' => 'e'],
            ['suit' => 'winds', 'value' => 1, 'direction' => 'e'],
            ['suit' => 'winds', 'value' => 1, 'direction' => 'e'],
            ['suit' => 'winds', 'value' => 1, 'direction' => 'e'],

            ['suit' => 'winds', 'value' => 2, 'direction' => 'w'],
            ['suit' => 'winds', 'value' => 2, 'direction' => 'w'],
            ['suit' => 'winds', 'value' => 2, 'direction' => 'w'],
            ['suit' => 'winds', 'value' => 2, 'direction' => 'w'],

            ['suit' => 'winds', 'value' => 3, 'direction' => 's'],
            ['suit' => 'winds', 'value' => 3, 'direction' => 's'],
            ['suit' => 'winds', 'value' => 3, 'direction' => 's'],
            ['suit' => 'winds', 'value' => 3, 'direction' => 's'],
        ];

        $dragons = [
            ['suit' => 'dragons', 'value' => 0, 'color' => 'red'],
            ['suit' => 'dragons', 'value' => 0, 'color' => 'red'],
            ['suit' => 'dragons', 'value' => 0, 'color' => 'red'],
            ['suit' => 'dragons', 'value' => 0, 'color' => 'red'],

            ['suit' => 'dragons', 'value' => 1, 'color' => 'green'],
            ['suit' => 'dragons', 'value' => 1, 'color' => 'green'],
            ['suit' => 'dragons', 'value' => 1, 'color' => 'green'],
            ['suit' => 'dragons', 'value' => 1, 'color' => 'green'],

            ['suit' => 'dragons', 'value' => 2, 'color' => 'blue'],
            ['suit' => 'dragons', 'value' => 2, 'color' => 'blue'],
            ['suit' => 'dragons', 'value' => 2, 'color' => 'blue'],
            ['suit' => 'dragons', 'value' => 2, 'color' => 'blue'],
        ];

        /** merge into deck, shufle */
        $deck = array_merge($flowers, $bamboos, $dots, $characters, $winds, $dragons);
        shuffle($deck);

        // create new game in Game_T
        $sql = "
            INSERT INTO Game_T (GameDeck, GameDiscardPile, GameStatus)
            VALUES (?,?,?)
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([ json_encode($deck), json_encode([]), 'waiting' ]);

        // retrieve generated game ID
        $gameID = $pdo->lastInsertId();

        // create new player in Player_T, linked to the above game and taking seat 0
        $sql = "
            UPDATE Player_T
            SET PlayerHand = ?, PlayerMelds = ?, PlayerHold = ?, PlayerSeat = 0, GameID = ?
            WHERE PlayerName = ?
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            json_encode([]),
            json_encode([]),
            json_encode([]),
            $gameID,
            $input['username']
        ]);

        // set session user
        $_SESSION['user'] = [
            'name' => $input['username'],
            'hand' => [],
            'melds' => [],
            'hold' => [],
            'seat' => 0
        ];

        /** set session game */
        $_SESSION['game'] = [
            'gameID' => $gameID,
            'deckLength' => 144, 
            'discardPile' => [],
            'numberPlayers' => 1,
            'turnCount' => -1,
            'seconds' => -1,
            'status' => 'waiting',
            'players' => [
                [
                    'name' => $input['username'],
                    'handCount' => 0,
                    'melds' => [],
                    'seat' => 0
                ]
            ]
        ];

        // update message code
        $message .= 'Successfully created game ' . $gameID;
    }
}


// if message unchanged, session already exists
if ($message == 'start.php: ') $message .= 'nothing interesting...';

// JSON encoded response
echo json_encode([
    'success' => true,
    'message' => $message,
    'gameData' => $_SESSION['game'],
    'userData' => $_SESSION['user']
]);
?>