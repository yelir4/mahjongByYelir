Hello, my name is Riley, the date is october 10, 2024,
and this is my personal project over the past few months; a web-based game of Mahjong.

So Mahjong originates from China but this specific form of Ricchi Mahjong is more popular in countries
such as Japan and the Philippines which was my inspiration for this game.

This game is built as a web project, using standard HTML, CSS, and Javascript.
I am using PHP for the backend, as well as MYSQL for queries to a database.
And these languages, alongside PHP sessions and Javascript's fetch API allows for four people to play concurrently, and see
changes to the game in real time


So to start off, Ricchi Mahjong requires 4 people to play, so I have four separate browser tabs open.
We're going to enter people's names, and as you will see...

players are able
to see who is in their game, lobby. Each player sees themselves on the bottom.

riley
PLAY2
PTHREE
PFOUR


So after entering each player's names, we see a countdown, and when the countdown ends that's when the game officially begins.


The game begins and we have this interface, I'll explain now how all of this works.

On the screen we see various information about the other players, we have their name, seat number, and then a number which shows how many tiles each
player is holding.

On the bottom, this bottom bar has tiles, 16 tiles, and this is our HAND. Only we can see our hand, other players can't see our hand. We can move the tiles around, arranging them as we like,
and if we have a special flower tile, we can click on it to place it in our `melds`

Above our hand is another bar,
this is our completed MELDS, which every player is able to see. And as we can see, we see other player's melds. Melds are for
flower tiles as we mentioned before, that's how they operate, and for, well `melds`, which is; when players discard a tile, depending on certain conditions, other players
can 'claim' those tiles, and they will show up here.

And finally, in the middle is the discard pile, this will show all of the tiles that have been discarded as the game goes on.




EXPLAINING MORE RULES

ok so ricchi mahjong is played with a set of 144 mahjong tiles.
the way to win a game of ricchi mahjong is to have valid groups for all tiles in hand.
groups are indicated by a red or lightgreen underline underneath the tiles.
so for instance, there's groups of three, and to make these 'valid', the tiles must have the same suit, and they must either match the value, i.e. they are the same tile
or they are 3 sequential tiles, so for example _, _, _

so once all of these underlines are light green, that player wins the game, and the game is over.
and just by how many tiles there are, players can only win the game on their turn, whether you just claimed a discard or
if you draw a tile on your turn which completed their hand



in the bottom right, we see a label "hand type",
and there's two different hand types, so the

first of which is `standard`, you have as many groups of three tiles as can fit in your hand, with your tiles and then you have a pair of `eyes`, which is
a pair of matching tiles

and the second hand type is called `7 pairs`, basically you have seven pairs of eyes, and one group of three tiles.

and this third button just changes, where the "eyes" are, so for either hand type you can either have the eyes on the left or right side.
this becomes important when you're quote unquote `waiting` for a win, sometimes your hand needs the eye as the last group.
sometimes its waiting to fill this last group of three. so this functionality just allows players to choose which side the eye goes on.



GAMEPLAY FUNCTIONALITY

so now i'm going to go into some of the gameplay functionality,


so the player turn is indicated by the orange, so its this player's turn first. at the beginning of the player's turn, they draw a tile, which is why we have one more tile than the other players.
since we haven't won the game yet, we can discard a tile, and move the game forward. and the turns go in counter-clockwise fashion until a player wins the game, or
when the deck runs out of tiles.



now when we discard the tile, it shows up big in the discard pile,
saying we discarded the tile. We also have a timer appear here in the bottom right of the discard pile.
and if a player has the means to claim the discarded tile, they have the entirety of the timer to do so, before the next turn begins.


GAMEPLAY EXAMPLES

here we have an example where, this player discards a tile, and the next player is able to claim the tile because it forms three sequential tiles of the same suit. so because of this, a button appears
and they can click the button, and they are prompted to select two tiles. If the player selects two tiles that do not do not match, the claim fails and informs the player. However, if the tiles are correct,
you'll see that the game informs them that the claim was sent. At the end of the timer, the claim will process and as you can see, the tiles from the player's hand and from the discard pile are moved
to that player's melds, bringing that player closer to victory.

important to note here that unless its for the win, players can only `chow` when the player to their left discards the tile.


Here we have a pung, where the player has two tiles in hand that match the discarded tile. Here we can see that after selecting the tiles, the user can still opt to 'cancel' their claim
as long as the timer is still ongoing. essentially this removes the claim.


will note that there is a precedence to claims that go on, so for example if a tile is discarded, and two players try to claim the tile, the server does some logic to determine which player wins.
The precedence goes: win, then pung/kong are the same precedence, then chow. also, if the claim is of the same type, then the player closest on the right to the person who discarded the tile
takes precedence.


finally, here this player is `waiting`, they only need one more claim to win, they make the claim, and when the timer ends, they win the match


ALRIGHT, TIME TO GO OVER THE PROJECT STRUCTURE

so as previously mentioned we have standard html, css, javascript, its a single page application. i also have observer.html and javascript, these are more for debugging purposes
that i created to monitor the state of the database and php sessions as the game is ongoing

in assets/ folder, i have all of the images of the tiles that are preloaded into the browser when the user logs in
and then in backend/ folder, we have the scripts for logging in, sending updates to the backend, nad retrieving updates from the backend. i also have the sql queries for creating the tables
within the database.



so what have i learned, what coding experience have i gained from this project?
	well i got to work on the entirety of the coding project completely on my own, both front-end and back-end functionality
	increasing my competence in the web development languages of html/css/js, and then expanding beyond my comfort zone with PHP
	i felt that this project was great for leveraging the knowledge that i've gained in the classroom, in web development classes
	and, thinks like how servers work and how to formulate the database,
	putting that all together for this project and then seeing it come to fruition has been extremely satisfying
	

what would i do differently now that i have this working demo?
	if i were to start over, i would definitely consider working with a runtime environment such as Node.js and have that function as
	the webserver, for this project i decided to use XAMPP, and then PHP for the backend, and these served their purpose for this project,
	however i think Node.js has some added benefits that kind of make it more effective and convenient when compared to my setup.
	mainly i think for concurrent playing, my solution for this project is essentially polling, as each client receives data from the backend
	every second and updates the screen accordingly,
	
	for this purpose it works, but with Node.js we could have more real-time updates, which i think works better for a project like this one


Finally, what more is there to develop
	This project has completed all of the necessary elements of an isolated game of Ricchi mahjong, if i were to continue development in the future,
	which i am likely to do, i would put my focus on adding a 'points' system, or coins system, as typically players would play multiple games of
	ricchi in one sitting, and during certain events in the game, such as a kong, 4 flowers, and WINS there is an exchange of money or coins between
	the players, so adding this in as a functionality would be the next step.
	
	that would be the immediate next challenge for this project
	

Thank you so much for watching my demo of this project, I hope you enjoyed it, this project was a lot of fun to make so i would greatly appreciate
if you would like to check it out for yourself, i will put the github repository link in the description box below. Thank you!