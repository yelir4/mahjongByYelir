-- run in phpMyAdmin

/**
	Game_T stores game state

	`GameTurnCount`
	whose turn is it? multiple like so, 0, 1, 2, 3, ...
	4 % 4 = 0, 5 % 4 = 1

	`GameSeconds`
	seconds passed since last discard? players can still call eat or win (???)
*/
CREATE TABLE Game_T (
    GameID				INT AUTO_INCREMENT PRIMARY KEY,
	GameDeck			TEXT,
	GameDiscardPile		TEXT,
	GameNumberPlayers	INT DEFAULT 1,
	GameTurnCount		INT DEFAULT -1,
	GameSeconds			INT DEFAULT -1,
	GameStatus			VARCHAR(20)
);

-- create player table to store player info and hand
CREATE TABLE Player_T (
    PlayerID			INT AUTO_INCREMENT PRIMARY KEY,
	PlayerName			VARCHAR(15),
	PlayerHand			TEXT,
	PlayerMelds			TEXT,
	PlayerHold			TEXT,
	PlayerSeat			INT,
    GameID              INT,
	FOREIGN KEY (GameID) REFERENCES Game_T(GameID)
);


DROP TABLE game_t, player_t;


TRUNCATE game_t;
TRUNCATE player_t;


UPDATE Player_T SET PlayerHand = '[{"suit":"dots","value":8}]' WHERE PlayerName = "chiq";
UPDATE game_t set gameturncount = 2 where gameid = 1;


UPDATE Player_T SET PlayerHand = '[{"suit":"dots","value":8},{"suit":"dots","value":8},{"suit":"dots","value":4},{"suit":"dots","value":6},{"suit":"dots","value":7}]' WHERE PlayerSeat = 0;
UPDATE Player_T SET PlayerHand = '[{"suit":"dots","value":8},{"suit":"dots","value":3},{"suit":"dots","value":5},{"suit":"dots","value":6}]' WHERE PlayerSeat = 1;
UPDATE Player_T SET PlayerHand = '[{"suit":"dots","value":8},{"suit":"dots","value":2},{"suit":"dots","value":4},{"suit":"dots","value":5}]' WHERE PlayerSeat = 2;
UPDATE Player_T SET PlayerHand = '[{"suit":"dots","value":8},{"suit":"dots","value":1},{"suit":"dots","value":3},{"suit":"dots","value":4}]' WHERE PlayerSeat = 3;
UPDATE Game_T SET GameTurnCount = 0;



UPDATE player_t
set PlayerMelds = '[{"suit":"flowers","value":1,"color":"blue"},{"suit":"flowers","value":1,"color":"blue"},{"suit":"flowers","value":1,"color":"blue"},{"suit":"flowers","value":1,"color":"blue"},{"suit":"flowers","value":1,"color":"blue"}]'