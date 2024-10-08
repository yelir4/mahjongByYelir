<?php
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
    echo json_encode(['success' => false, 'status' => $e->getMessage()]);
    exit();
}

// retrieve 'gameID' passed from observer.js
$input = json_decode(file_get_contents('php://input'), true);
$gameID = $input['gameID'];


$sql = "SELECT * FROM Game_T WHERE GameID = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute([ $gameID ]);

$game = $stmt->fetch(PDO::FETCH_ASSOC);

$response[] = [
    'deckLength' => count(json_decode($game['GameDeck'], true)),
    'discardPileLength' => count(json_decode($game['GameDiscardPile'], true)),
    'numberPlayers' => $game['GameNumberPlayers'],
    'turnCount' => $game['GameTurnCount'],
    'seconds' => $game['GameSeconds'],
    'status' => $game['GameStatus']
];



$sql = "SELECT * FROM Player_T WHERE GameID = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute([ $gameID ]);
$players = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($players as $player)
{
    $response[] = [
        'name' => $player['PlayerName'],
        'hand' => json_decode($player['PlayerHand'], true),
        'melds' => json_decode($player['PlayerMelds'], true),
        'hold' => json_decode($player['PlayerHold'], true),
        'seat' => $player['PlayerSeat']
    ];
}

echo json_encode($response);
?>