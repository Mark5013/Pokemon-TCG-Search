import express from 'express';
import bodyParser from 'body-parser';
import pokemon from 'pokemontcgsdk';


const app = express();
const port = 3000;
pokemon.configure({apiKey: `${process.env.apiKey}`})

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

// render home page
app.get("/", (req,res) => {
    res.render("index");
    res.end();
});

// handles searches by pokemon name
app.post("/search", (req, res) => {
    let pokemonName = req.body.searchBar;

    //MAKRE SURE USER INPUT DOESN'T CRASH API QUERY
    if(!(/^[A-Za-z0-9-]*$/.test(pokemonName))) { 
        res.redirect("failure");
    } else if(pokemonName.includes('-')) {
        //HANDLES SEARCH BY ID
        pokemon.card.where({ q: `id:${pokemonName}`}).then(
            result => {
                //check if pokemon was found
                let dataLength = result.data.length;
                if(dataLength === 0) {
                    res.render("failure");
                    res.end();
                } else {
                    res.redirect(`/cardpage/${pokemonName}`);
                }
            }
        );
    } else  {
        // HANDLES SEARCH BY NAME
        pokemon.card.where({ q: `name:${pokemonName}`}).then(
            result => {
                // check if pokemon was found
                let dataLength = result.data.length;
                if(dataLength === 0) {
                    res.render("failure");
                    res.end();
                } else {
                    res.render("search", {
                        cardArr: result.data,
                    });
                    res.end();
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
    )

})

app.get("/failure", (req, res) => {
    res.render("failure");
})

app.listen(process.env.PORT || port, (req, res) => {
    console.log(`Listening on port: ${port}`);
})


