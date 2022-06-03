let today = new Date();

let imgArr = ["/images/dratini.png", "/images/eevee.png", "/images/lechonk.png", "/images/munchlax.png", "/images/pachirisu.png",
                "/images/piplup.png", "/images/turtwig.png"];

const img = document.querySelector(".home-pg-img");
if(img !== null) {
    img.src = imgArr[today.getDay()];
}

