# Pokemon-TCG-Search

Website that allows you search for pokemon cards by name, id, or their series such as VMAX, EX, etc.... When searching by name or series, 
if there is a match, a page containing all matches will pop up with the picture of the card. Clicking on the card will bring you to the 
card's info page. When searching by ID, since every ID is unique, you will be taken straight to the card's info page if there is a match. Also, after 
searching for a card, the user has the option to either display the cards in list or image format. While in list format hovering over the cards id will display an image of the card and clicking on the id will bring the user to cards info page. 

This was created using the pokemon TCG api found at: https://pokemontcg.io/. I used the api to make queries based on the info the user inputed and 
extract info based on the results. EJS templating was also used to render each page and I used Node.js/Express for the backend. Bootstrap was used
to easily make the website responsive, and a bit of JS was used on the frontend to create semi-dynamic home images. Users can now use Oauth and sign in via their
google account and will be able to add cards to their "collection" where they can easily be accessed via their collection page. Users also won't be logged out by simply leaving the page, this was done by using passport and other passport packages to create a cookie and store the users sessions, so they aren't logged out if they leave the page. MongoDB/mongoose was also used to store account data so that users can access their card collection. I say users, but I believe only users emails I add to the test users section will be able to login via google unless I publish the app and push to production which requires a privacy policy, a youtube video on how I use user data, a written explanation to google, and the domains being verifid, so I will see if that happens

Website is hosted on heroku at: https://whispering-retreat-18765.herokuapp.com/
