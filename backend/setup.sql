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