import express from 'express';
import bodyParser from 'body-parser';
import pokemon from 'pokemontcgsdk';
import paginate from 'paginate';

const app = express();
const port = 3000;
pokemon.configure({apiKey: `${process.env.apiKey}`})

//used to store most recent search from user
let curPokemon ="";

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');


// render home page
app.get("/", (req,res) => {
    res.render("index");
    res.end();
});

// handles searches by pokemon name
app.post("/search/:page", (req, res) => {
    // searchEntry from user
    let searchEntry = req.body.searchBar;

    // This happens when user inputs something into search bar, store it in global variable for reference later
    if(searchEntry !== undefined) {
        curPokemon = searchEntry;
    }

    // Starting index for query results
    let startIndex = 0;

    // This happens user clicks on button to go to next page, so store last search in searchEntry
    if(searchEntry === undefined) {
        searchEntry = curPokemon;
    }

    // If body has this property, then user clicks on button, find what page they want and set proper start index
    if(req.body.hasOwnProperty("nextBtn")) {
        startIndex = (req.body.nextBtn - 1) * 24;
    }

    // Update end index to 24 after start index
    let endIndex = startIndex + 24;

    console.log(!(/^[A-Za-z0-9- ]*$/.test(searchEntry)));

    //MAKRE SURE USER INPUT DOESN'T CRASH API QUERY
    if(!(/^[A-Za-z0-9-]*$/.test(searchEntry))) { 
        //Redirect to failure page based off of invalid input
        res.redirect("/failure");
        //Check if search entry doesn't include - symbol
    } else if(!searchEntry.includes('-')) {
        // HANDLES SEARCH BY NAME
        pokemon.card.where({ q: `name:${searchEntry}`}).then(
            result => {
                // check if pokemon was found
                let numOfResults = result.data.length;
                // make sure end index doesn't go out of bounds of arr returned
                if(endIndex > numOfResults) {endIndex = numOfResults;}
                // render failure page if no results found
                if(numOfResults === 0) {
                    res.render("failure");
                    res.end();
                //render page based off of search results
                } else {
                    res.render("search", {
                        cardArr: result.data,
                        numOfResults: numOfResults,
                        startIndex: startIndex,
                        endIndex: endIndex,
                        activeBtn: req.body.nextBtn,
                    });
                    res.end();
                }
            }
        );
    } else  {
        //HANDLES SEARCH BY ID
        pokemon.card.where({ q: `id:${searchEntry}`}).then(
        result => {
            //check if pokemon was found
            let numOfResults = result.data.length;
            // render failure page if no results found
            if(numOfResults === 0) {
                res.render("failure");
                res.end();
                //render card info page for id
            } else {
                res.redirect(`/cardpage/${searchEntry}}`);
            }
        }
);
    }
})

//dynamically render cardpage based off of cardID
app.get("/cardpage/:cardID", (req, res) => {
    let pokemonId = req.params.cardID;

    pokemon.card.where({ q: `id:${pokemonId}`}).then(
        result => {
            if(result.data.length === 0) {
                res.render("failure")
            } else {
                res.render('cardpage', {
                    pokemonImg: result.data[0].images.large,
                    pokemonName: result.data[0].name,
                    pokemonHP: result.data[0], 
                    pokemonTypes: result.data[0],
                    pokemonFrom: result.data[0],
                    pokemonEvos: result.data[0],
                    pokemonWeak: result.data[0],
                    pokemonRarity: result.data[0].rarity,
                    tcgLink: result.data[0].tcgplayer.url,
                    cardMarket: result.data[0].cardmarket.url,
                    cardArtist: result.data[0].artist,
                    cardId: pokemonId,
                });
                res.end();
            }
        }
    )

})

app.get("/failure", (req, res) => {
    res.render("failure");
})

app.listen(process.env.PORT || port, (req, res) => {
    console.log(`Listening on port: ${port}`);
})


