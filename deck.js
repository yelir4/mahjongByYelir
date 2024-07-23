console.log("deck.js loaded");

/** mahjong deck tiles */
let flowers = [
    "1fr", "1fb",
    "2fb", "2fr",
    "3fb", "3fr",
    "4fb", "4fr"
];

let bamboo = [
    "1b", "1b", "1b", "1b",
    "2b", "2b", "2b", "2b",
    "3b", "3b", "3b", "3b",
    "4b", "4b", "4b", "4b",
    "5b", "5b", "5b", "5b",
    "6b", "6b", "6b", "6b",
    "7b", "7b", "7b", "7b",
    "8b", "8b", "8b", "8b",
    "9b", "9b", "9b", "9b"
];

let dots = [
    "1d", "1d", "1d", "1d",
    "2d", "2d", "2d", "2d",
    "3d", "3d", "3d", "3d",
    "4d", "4d", "4d", "4d",
    "5d", "5d", "5d", "5d",
    "6d", "6d", "6d", "6d",
    "7d", "7d", "7d", "7d",
    "8d", "8d", "8d", "8d",
    "9d", "9d", "9d", "9d"
];

let characters = [
    "1c", "1c", "1c", "1c",
    "2c", "2c", "2c", "2c",
    "3c", "3c", "3c", "3c",
    "4c", "4c", "4c", "4c",
    "5c", "5c", "5c", "5c",
    "6c", "6c", "6c", "6c",
    "7c", "7c", "7c", "7c",
    "8c", "8c", "8c", "8c",
    "9c", "9c", "9c", "9c"
];

let winds = [
    "nw","nw","nw","nw",
    "ew","ew","ew","ew",
    "ww","ww","ww","ww",
    "sw","sw","sw","sw"
];

let dragons = [
    "rd","rd","rd","rd",
    "gd","gd","gd","gd",
    "bd","bd","bd","bd"
];

/** now form the deck out of all tiles */
let deck = [...flowers, ...bamboo, ...dots, ...characters, ...winds, ...dragons];

// shuffle deck
for(let i=deck.length-1; i>0; --i)
{
    // generate random index [0,i]
    const j = Math.floor(Math.random() * (i+1));
    // swap tiles i,j with array destructuring
    [deck[i], deck[j]] = [deck[j], deck[i]];
}

console.log(deck);