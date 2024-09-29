let gameElt = document.getElementById("game");


// what's going on here...
async function observe ()
{
    let gameID = document.getElementById("gameID").value;

    if (gameID != "")
    {
        try
        {        
            response = await fetch('backend/observer.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gameID : gameID
                })
            });

            if (!response.ok)
                throw new Error ("Network response not ok.");

            // decode into data
            data = await response.json();

            console.log(data);

            let output = "";
            // 0: deckLength: x, discardPileLength: y, ...
            for (let section of data)
            {
                // deckLength
                for (let row in section)
                {
                    // deckLength: 79
                    if (section.hasOwnProperty(row))
                    {
                        // hand: []
                        if (Array.isArray(section[row]))
                        {
                            output += row + ": (" + section[row].length + ") ";
                            for (let cell of section[row])
                            {
                                output += cell.value + " " + cell.suit + ", ";
                            }
                            output += "<br>";
                        }
                        else
                        {
                            output += row + ": " + section[row] + "<br>";
                        }
                    }
                }
                output += "<hr>";
            }
            gameElt.innerHTML = output;
        }
        catch (error)
        {
            console.error("error occurred: " + error);
        }
    }
}

// observe every second
setInterval(observe, 1000);