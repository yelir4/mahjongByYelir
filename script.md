Hello, my name is Riley,
the date is october 7, 2024, and this is my personal project over the past few months; a web-based game of Mahjong.
So Mahjong originates from China but this specific form of Ricchi Mahjong is more popular in countries
such as Japan and the Philippines which was my inspiration for this game.

This game is built as a web project, using standard HTML, CSS, and Javascript.
I am using PHP for the backend, as well as MYSQL for queries to a database.
And these languages, alongside PHP sessions and Javascript's fetch API allows for four people to play concurrently, and see each
person's changes to the game.


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

On the screen we see various information about the other players, we have the name, seat number, and then a number which shows how many tiles each
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
the way to win a game of ricchi mahjong is you have to have valid groups for all tiles in hand.
groups are indicated by a red or lightgreen underline underneath the tiles.
so for instance, there's groups of three, and to make these 'valid', the tiles must have the same suit, and they must either match the value, i.e. they are the same tile
or they are 3 sequential tiles, so for example _, _, _

so once all of these underlines are light green, that player wins the game, and the game is over.
and just by how many tiles there are, players can only win the game on their turn, whether you just claimed a discard or
if you draw a tile on your turn which completed their hand





in the bottom right, we see a label "hand type",
and there's two different hand types, so the

first of which is `standard`, you have as many groups of three tiles as possible, with your tiles and then you have a pair of `eyes`, which is
a pair of matching tiles

and the second hand type is called "7 pairs", basically you have seven pairs of eyes, and one group of three tiles.

and this third button just changes, where the "eyes" are, just for the standard hand type, you can either have the eyes on the left or right side.
this becomes important when you're quote unquote `waiting` for a win, sometimes your hand will be waiting for the eye to complete it.
sometimes its waiting to fill this last group of three. so this functionality just allows that to happen

so now i'm going to show you some of the gameplay functionality,


so the player turn is indicated by the orange, so its this player's turn first. they drew a tile, which is why we have one more tile than the other players,
and since we haven't won the game yet, we can discard a tile, and move the game forward. and the turns go in counter-clockwise fashion until a player wins the game, or
when the deck runs out of tiles, which is uncommon.




now when we discard the tile, it shows up big in the discard pile,
saying we discarded the tile, and if a player has the means to claim the discarded tile, they have a timer to do so, before the turn moves on.


cancel







special cases: kong
pong with two people
pong vs chow
win


project structure
debug
code


what have i learned from this project
what more to develop