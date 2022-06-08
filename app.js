import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import bodyParser from 'body-parser';
import pokemon from 'pokemontcgsdk';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import passportLocalMongose from 'passport-local-mongoose';
import GoogleStrategy from 'passport-google-oauth20';
GoogleStrategy.Strategy;
import findOrCreate from 'mongoose-findorcreate';

const app = express();
const port = 3000;
pokemon.configure({apiKey: `${process.env.API_KEY}`})

//used to store most recent search from user
let curPokemon ="";
let latestEndIndex;
let latestStartIndex;
let latestActiveBtn;
let curStyle = "images";

const password = process.env.PASS_KEY;
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

// config session pkg
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

// init passport package
app.use(passport.initialize());
// tell pasport to deal with sessions
app.use(passport.session());

mongoose.connect(`mongodb+srv://admin-mark:${password}@cluster0.vgavw.mongodb.net/collectionDB`);
// mongoose.connect("mongodb://localhost:27017/collectionDB");

// collection schema
const  collectionSchema = new mongoose.Schema({
    username: String,
    googleId: String,
    cards: [{cardId: String, cardImg: String}]
});

// magic
collectionSchema.plugin(passportLocalMongose);
collectionSchema.plugin(findOrCreate);

const Collection = new mongoose.model("Collection", collectionSchema);

//create login strategy
passport.use(Collection.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        cb(null, { id: user.id, username: user.username, name: user.name });
    });
});
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://whispering-retreat-18765.herokuapp.com/auth/google/pokemon"
    // callbackURL: "http://localhost:3000/auth/google/pokemon"
  },
  function(accessToken, refreshToken, profile, cb) {
    Collection.findOrCreate({ username: profile.displayName, googleId: profile.id}, function (err, user) {
      return cb(err, user);
    });
  }
));

// render home page
app.get("/", (req,res) => {
    if(req.session.hasOwnProperty("passport")) {
        res.render("index", {loggedIn: true});
    } else {
        res.render("index", {loggedIn: false});
    }  
});

// google auth authentication
app.get("/auth/google", passport.authenticate('google', {
    scope: ['profile']
}));

app.get('/auth/google/pokemon', 
  passport.authenticate('google', { failureRedirect: '/index' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/');
    
});

// renders users collection page
app.get("/collection", (req, res) => {
    // vars to keep track of pagination
    let startIndex = 0;
    let endIndex = 24;
    let activeBtn = 1;

    if(req.isAuthenticated()) {
        Collection.findById(req.user.id, function(err, doc) {
            if(err) {
                console.log(err);
            } else {
                if(endIndex > doc.cards.length) {endIndex = doc.cards.length;}
                res.render("collection", {
                    cardArr: doc.cards, 
                    startIndex: startIndex, 
                    endIndex: endIndex,
                    numOfResults: doc.cards.length,
                    activeBtn: activeBtn,
                });
            }
        });
    } else {
        res.redirect("/");
    }
});

// logs user out
app.get("/logout", (req, res) => {
    req.logout(function(err) {
        if(err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});

// render failure page
app.get("/failure", (req, res) => {
    res.render("failure");
});

//dynamically render cardpage based off of cardID
app.get("/cardpage/:cardID", (req, res) => {
    let inCollection = false;

    // if user is logged in, then it will check if card is in collection or not 
    if(req.session.hasOwnProperty("passport")) {
        const id = req.session.passport.user.id;
        Collection.find({"_id": id, "cards.cardId": req.params.cardID}, function(err, docs) {
            if(err) {
                console.log(err);
            } else if(docs.length >= 1) {
                inCollection = true;
            } else {
                inCollection = false;
            }
        });
    };

    let pokemonId = req.params.cardID;

    pokemon.card.where({ q: `id:${pokemonId}`}).then(
        result => {
            if(result.data.length === 0) {
                res.render("failure")
            } else {
                res.render('cardpage', {
                    pokemonImg: result.data[0].images,
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
                    inCollection: inCollection
                });
                res.end();
            }
        }
    );

});

// adds card to users collection and redirects to collection on success and home page if user isn't logged in
app.post("/addToCollection", (req, res) => {
    if(req.isAuthenticated()) {
        let cardId = req.body.addBtn;
        let cardImg = req.body.cardImg;
        const userId = req.user.id;
        // finds user with matching id and pushes card into their card arr
        Collection.findByIdAndUpdate(userId, {$push: {"cards":{cardId: cardId, cardImg: cardImg}}}, {new: true}, function(err, doc) {
            if(err) {
                console.log(err);
            } else { 
                res.redirect("/collection");   
            }
        });
    } else {
        res.redirect("/");
    }
});

// renders collection page but handles pagination 
app.post("/collection/:page", (req, res) => {
    let startIndex = 0;

    if(req.body.hasOwnProperty("nextBtn")) {
        startIndex = (req.body.nextBtn - 1) * 24;
    }

    let endIndex = startIndex + 24;
    let id = req.session.passport.user.id;
    let activeBtn = req.body.nextBtn;

    Collection.findById(id, function(err, doc) {
        if(err) {
            console.log(err);
        } else {
            if(endIndex > doc.cards.length) {endIndex = doc.cards.length;}
            res.render("collection", {
                cardArr: doc.cards, 
                startIndex: startIndex, 
                endIndex: endIndex,
                numOfResults: doc.cards.length,
                activeBtn: activeBtn,
            });
        }
    });    
})


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

    //MAKRE SURE USER INPUT DOESN'T CRASH API QUERY
    if(!(/^[A-Za-z0-9-]*$/.test(searchEntry))) { 
        //Redirect to failure page based off of invalid input
        res.redirect("/failure");
        //Check if search entry doesn't include - symbol
    } else if(!searchEntry.includes('-')) {
        if(curStyle === "list") {
            pokemon.card.where({ q: `name:${curPokemon}`}).then(
                result => {
                    // check if pokemon was found
                    
                    let numOfResults = result.data.length;
                    // make sure end index doesn't go out of bounds of arr returned
                    if(endIndex > numOfResults) {endIndex = numOfResults;}
                    latestStartIndex = startIndex;
                    latestEndIndex = endIndex;
                    latestActiveBtn = req.body.nextBtn;
                    // render failure page if no results found
                    if(numOfResults === 0) {
                        res.render("failure");
                        res.end();
                    //render page based off of search results IN LIST FORMAT BASED OFF OF CURSTYLE
                    } else {
                        res.render("listLayout", {
                            curName: curPokemon,
                            cardArr: result.data,
                            numOfResults: numOfResults,
                            startIndex: latestStartIndex,
                            endIndex: latestEndIndex,
                            activeBtn: latestActiveBtn,
                        });
                        res.end();
                    }
                }
            );  
        } else {
            // HANDLES SEARCH BY NAME
            pokemon.card.where({ q: `name:${searchEntry}`}).then(
                result => {
                    // check if pokemon was found
                    let numOfResults = result.data.length;
                    // make sure end index doesn't go out of bounds of arr returned
                    if(endIndex > numOfResults) {endIndex = numOfResults;}
                    latestStartIndex = startIndex;
                    latestEndIndex = endIndex;
                    latestActiveBtn = req.body.nextBtn;
                    // render failure page if no results found
                    if(numOfResults === 0) {
                        res.render("failure");
                        res.end();
                    //render page based off of search results IN IMAGE FORMAT BASED OFF OF CURSTYLE
                    } else {
                        res.render("search", {
                            curName: searchEntry,
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
        }
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
                res.redirect(`/cardpage/${searchEntry}`);
            }
        }
        );
    }
});


// handles removing card from collection and redirects to collection on success
app.post("/removeFromCollection", (req, res) => {
    let id = req.session.passport.user.id;
    
    // CURSED CODE THAT REMOVES ONLY ONE CARD IN CASE OF DUPLICATES
    // actually updates one card ID to "REMOVE" then performs another query and removes the card ID with "REMOVE", why is this not a function already
    Collection.findOneAndUpdate({"_id": id, "cards.cardId": req.body.removeBtn},{$set: {"cards.$.cardId": "REMOVE"}}, function(err, docs) {
        if(err) {
            console.log(err);
        } else {
            Collection.findByIdAndUpdate(id, {$pull: {cards: {cardId: "REMOVE"}}}, function(err, docs) {
                if(err) {
                    console.log(err);
                } else {
                    res.redirect("/collection");
                }
            });
        }
    });  
});

// HANDLE PAGE LAYOUT
app.post("/pageStyle", (req, res) => {
    if(req.body.hasOwnProperty("imageBtn")) {
        curStyle = "images";
        pokemon.card.where({ q: `name:${curPokemon}`}).then(
            result => {
                // check if pokemon was found
                let numOfResults = result.data.length;
                // make sure end index doesn't go out of bounds of arr returned
                if(latestEndIndex > numOfResults) {latestEndIndex = numOfResults;}
                // render failure page if no results found
                if(numOfResults === 0) {
                    res.render("failure");
                    res.end();
                //render page based off of search results IN IMAGE FORMAT 
                } else {
                    res.render("search", {
                        curName: curPokemon,
                        cardArr: result.data,
                        numOfResults: numOfResults,
                        startIndex: latestStartIndex,
                        endIndex: latestEndIndex,
                        activeBtn: latestActiveBtn,
                    });
                    res.end();
                }
            }
        ); 
    } else {
        curStyle = "list";
        pokemon.card.where({ q: `name:${curPokemon}`}).then(
            result => {
                // check if pokemon was found
                let numOfResults = result.data.length;
                // make sure end index doesn't go out of bounds of arr returned
                if(latestEndIndex > numOfResults) {latestEndIndex = numOfResults;}
                // render failure page if no results found
                if(numOfResults === 0) {
                    res.render("failure");
                    res.end();
                //render page based off of search results IN LIST FORMAT
                } else {
                    res.render("listLayout", {
                        curName: curPokemon,
                        cardArr: result.data,
                        numOfResults: numOfResults,
                        startIndex: latestStartIndex,
                        endIndex: latestEndIndex,
                        activeBtn: latestActiveBtn,
                    });
                    res.end();
                }
            }
        ); 
    }
});

// set up server to listen on port ***
app.listen(process.env.PORT || port, (req, res) => {
    console.log(`Listening on port: ${port}`);
});
