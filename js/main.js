/* globals APIKEY */

const movieDatabaseURL = "https://api.themoviedb.org/3/";
let imgeURL = null;
let localTime = "";
let searchString = "";
let staleDataTimeOut = 3600;
let imageSizes = [];

let urlImg = "";
let sizeOfImgs = "";

let ModalValKey = "";
let pages = [];
let selectType = "";

document.addEventListener("DOMContentLoaded", init);

function init() {
    
    saveDataToLocalStorage();
    getPosterPathAndSizes();
    
    getLocalStorageData();
    
    addEventListeners();
    
    document.querySelector("#modalButtonDiv").addEventListener("click", showOverlay);
    document.querySelector(".cancelButton").addEventListener("click", hideOverlay);
    document.querySelector(".overlay").addEventListener("click", hideOverlay);
    document.querySelector(".btnback").addEventListener("click",goBack);

    document.querySelector("#search-input").addEventListener("keyup",function(eve){
        if(eve.keyCode == 13){
            startSearch();
        }
    });
    document.querySelector(".saveButton").addEventListener("click",saveModal);
}

function saveModal(e){
    let cheeseList = document.getElementsByName("preferences");
    let cheeseType = null;
    for (let i = 0; i < cheeseList.length; i++) {
        if (cheeseList[i].checked) {
            cheeseType = cheeseList[i].value;
            selectType = cheeseType;
            break;
        }
    }
    //alert(cheeseType);
    console.log("You picked " + cheeseType);
    localStorage.setItem(ModalValKey, cheeseType);
    hideOverlay(e);
}

function showOverlay(e) {
    e.preventDefault();
    let overlay = document.querySelector(".overlay");
    overlay.classList.remove("hide");
    overlay.classList.add("show");
    showModal(e);
}

function showModal(e) {
    e.preventDefault();
    let modal = document.querySelector(".modal");
    modal.classList.remove("off");
    modal.classList.add("on");
}

function hideOverlay(e) {
    e.preventDefault();
    e.stopPropagation(); // don't allow clicks to pass through
    let overlay = document.querySelector(".overlay");
    overlay.classList.remove("show");
    overlay.classList.add("hide");
    hideModal(e);
}

function hideModal(e) {
    e.preventDefault();
    let modal = document.querySelector(".modal");
    modal.classList.remove("on");
    modal.classList.add("off");
}

function addEventListeners() {
    let searchButton = document.querySelector(".searchButtonDiv");
    if (searchButton) {
        searchButton.addEventListener("click", startSearch);
    }
}

function saveDataToLocalStorage(){
    console.log("saved date to local storage");
    let now = new Date();
    localStorage.setItem(localTime, now);
    console.log(now);
}

function getPosterPathAndSizes() {
    
    let url = `${movieDatabaseURL}configuration?api_key=${APIKEY}`;

    fetch(url)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log(data);
            imgeURL = data.images.secure_base_url;
            imageSizes = data.images.poster_sizes;
            
            localStorage.setItem(urlImg, imgeURL);
            localStorage.setItem(sizeOfImgs, imageSizes);
            
            console.log(imgeURL);
            console.log(imageSizes);
        })
        .catch(function (error) {
            console.log(error);
        });
}


function getLocalStorageData() {
    
    if(localStorage.getItem(localTime)){
        console.log("Getting saved date from local storage");
        
        let savedDate = localStorage.getItem(localTime);
        savedDate = new Date(savedDate);
        console.log(savedDate);
        
        selectType = localStorage.getItem(ModalValKey);
        console.log(selectType);
        
        imgeURL = localStorage.getItem(imgeURL);
        imageSizes = localStorage.getItem(imageSizes);
        
        console.log(imgeURL);
        console.log(imageSizes);
        
        let seconds = calculateElapsedTime(savedDate);
        if(seconds > staleDataTimeOut){
            console.log("Local storage data is stale..");
            saveDataToLocalStorage();
            getPosterPathAndSizes();
        }
    } else{
        saveDataToLocalStorage();
    }

}

function calculateElapsedTime(savedDate){
    let now = new Date(); //Current date
    //console.log(now);
    
    let elapsedTime = now.getTime() - savedDate.getTime();
    
    let seconds = Math.ceil(elapsedTime/1000);
    console.log("Elapsed Time: "+seconds + " seconds");
    
    return seconds;
}


function goBack(){
    pages = document.querySelectorAll(".page");
    for(let i=0; i<pages.length; i++){
        if(pages[i].classList.contains("active")){
            let pageId = pages[i].id;
            let activePage = document.getElementById(pageId);
            activePage.classList.remove("active");
            if(pageId == "recommend-results"){
                document.querySelector("#search-results").classList.add("active");
            }else if(pageId == "search-results"){
                document.querySelector("#search-results").classList.remove("active");
                document.getElementById("search-input").value = "";
            }
        }
    }
}

function startSearch() {

    console.log("start search");
    searchString = document.getElementById("search-input").value;
    if (!searchString) {
        alert("please enter search data");
        return;
    }

    getSearchResults();

}


function getSearchResults() {
    let url = `${movieDatabaseURL}search/movie?api_key=${APIKEY}&query=${searchString}`;

    fetch(url)
        .then(response => response.json())
        .then((data) => {

            console.log(data);
            createPage(data,"s");
        })
        .catch((error) => console.log(error));
}

function createPage(data,T) {
    let content = "";
    let title = "";
    if(T == "s"){
        content = document.querySelector("#search-results>.content");
        title = document.querySelector("#search-results>.title");
        document.getElementById("search-results").classList.add("active");
        document.getElementById("recommend-results").classList.remove("active");
        
    }else{
        content = document.querySelector("#recommend-results>.content");
        title = document.querySelector("#recommend-results>.title");
        document.getElementById("recommend-results").classList.add("active");
        document.getElementById("search-results").classList.remove("active");
    }
    
    let message = document.createElement("h2");
    content.innerHTML = "";
    title.innerHTML = "";

    if (data.total_result == 0) {

        message.innerHTML = `No result found for ${searchString}`;
    } else {
        message.innerHTML = `Total = ${data.total_results} for ${searchString}`;
    }
    title.appendChild(message);

    createMovieCards(data.results);
    let documentFragment = new DocumentFragment();
    documentFragment.appendChild(createMovieCards(data.results));

    content.appendChild(documentFragment);
    let cardList = document.querySelectorAll(".content>div");

    cardList.forEach(function (item) {
        item.addEventListener("click", getRecommendations);
    });

}

function createMovieCards(results) {
    let documentFragment = new DocumentFragment();
    results.forEach(function (movie) {

        let movieCard = document.createElement("div");
        let section = document.createElement("section");
        let image = document.createElement("img");
        let videoTitle = document.createElement("p");
        let videoDate = document.createElement("p");
        let videoRating = document.createElement("p");
        let videoOverview = document.createElement("p");

        // set up the content
        videoTitle.textContent = movie.title;
        videoDate.textContent = movie.release_date;
        videoRating.textContent = movie.vote_average;
        videoOverview.textContent = movie.overview;
        
        // set up image source URL
        image.src = `${imgeURL}${imageSizes[2]}${movie.poster_path}`;

        // set up movie data attributes
        movieCard.setAttribute("data-title", movie.title);
        movieCard.setAttribute("data-id", movie.id);

        // set up class names
        movieCard.className = "movieCard";
        section.className = "imageSection";
        
        // append elements
        section.appendChild(image);
        movieCard.appendChild(section);
        movieCard.appendChild(videoTitle);
        movieCard.appendChild(videoDate);
        movieCard.appendChild(videoRating);
        movieCard.appendChild(videoOverview);

        documentFragment.appendChild(movieCard);

    });

    return documentFragment;

}

function getRecommendations() {
    let movieTitle = this.getAttribute("data-title");

    let movieID = this.getAttribute("data-id");
    console.log("you clicked: " + movieTitle + " " + movieID);

    let url = `${movieDatabaseURL}movie/${movieID}/recommendations?api_key=${APIKEY}`;

    fetch(url)
        .then(response => response.json())
        .then((data) => {
            console.log(data);
            createPage(data,"r");
        })
        .catch((error) => console.log(error));
}
