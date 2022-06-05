# Pokemon-TCG-Search

Website that allows you search for pokemon cards by name, id, or their series such as VMAX, EX, etc.... When searching by name or series, 
if there is a match, a page containing all matches will pop up with the picture of the card. Clicking on the card will bring you to the 
card's info page. When searching by ID, since every ID is unique, you will be taken straight to the card's info page if there is a match. Also, after 
searching for a card, the user has the option to either display the cards in list or image format. While in list format hovering over the cards id will display an image of the card and clicking on the id will bring the user to cards info page. 

This was created using the pokemon TCG api found at: https://pokemontcg.io/. I used the api to make queries based on the info the user inputed and 
extract info based on the results. EJS templating was also used to render each page and I used Node.js/Express for the backend. Bootstrap was used
to easily make the website responsive, and a bit of JS was used on the frontend to create semi-dynamic home images. 

Website is hosted on heroku at: https://whispering-retreat-18765.herokuapp.com/
