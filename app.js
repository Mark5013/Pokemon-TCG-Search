import express from 'express';
import bodyParser from 'body-parser';
import pokemon from 'pokemontcgsdk';


const app = express();
const port = 3000;
pokemon.configure({apiKey: `${process.env.apiKey}`})

app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');


app.get("/", (req,res) => {
    res.render("index");
});

app.post("/search", (req, res) => {
    let pokemonName = req.body.searchBar;
    
    pokemon.card.where({ q: `name:${pokemonName}`}).then(
        result => {
            let dataLength = result.data.length;
            if(dataLength === 0) {
                res.render("failure")
            } else {
                res.render("search", {
                    cardArr: result.data,
                })
            }
        }
    )
})

app.post("/cardpage", (req, res) => {
    let pokemonId = req.body.finalBtn;

    pokemon.card.where({ q: `id:${pokemonId}`}).then(
        result => {
            res.render('cardpage', {
                pokemonImg: result.data[0].images.large,
                pokemonName: result.data[0].name,
                pokemonHP: result.data[0].hp, 
                pokemonTypes: result.data[0].types,
                pokemonFrom: result.data[0],
                pokemonEvos: result.data[0],
                pokemonWeak: result.data[0],
                pokemonRarity: result.data[0].rarity,
                tcgLink: result.data[0].tcgplayer.url,
                cardMarket: result.data[0].cardmarket.url,
                cardArtist: result.data[0].artist,
                cardId: pokemonId,
            })
        }
    )

})

app.use(express.static("public"));

app.listen(process.env.PORT || port, (req, res) => {
    console.log(`Listening on port: ${port}`);
})


