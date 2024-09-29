# mahjongByYelir
online mahjong



current goals:

eating
port forwarding http, https, mysql (80, 443, 3306)




idea: at end of player's turn, they discard a tile.
others then have opportunity to: chow, pung, kong, or win with that tile.


so we submit requests on a timer
when timer ends, compare all requests

we know there is request if `PlayerHold` is not []
we know nature of request from `PlayerHold[0]` (win, pung, etc..)

we know only three players at the table can make request.
those closest on right from player who discarded
take precedence.


# precedence by index
1: closest right win
2: across table win
3: on left win
4: closest right pung/kong
5: across table pung/kong
6: on left pung/kong
7: on right chow