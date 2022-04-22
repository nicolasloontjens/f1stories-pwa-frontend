"use strict";

document.addEventListener("DOMContentLoaded",init);

let datafetcher = null;
const apiurl = "http://localhost:3001/api";
const backendurl = "http://localhost:3001"


async function init(){
    datafetcher = await import("./data.js");
    isLoggedIn();
    document.querySelector("#burger-menu").addEventListener("click",openMobileMenu);
}

async function isLoggedIn(){
    if(!await localforage.getItem('loggedin')){
        showStart();
    }else{
        showHome();
    }
}

function showStart(){
    //hide the buttons in nav, display register or login button;
    document.querySelectorAll("header div *:nth-child(2)").forEach(elem => {
        elem.classList.add("hidden");
    });
    removeBackbutton();
    clearMain();
    //display template tag
    const template = document.querySelector("#template-start-buttons");
    document.querySelector("main").appendChild(template.content.cloneNode(true)); 
    //add event listeners
    document.querySelector("#registeruser").addEventListener("click",addStartForm);
    document.querySelector("#loginuser").addEventListener("click",addStartForm);
}

function addStartForm(e){
    e.preventDefault();
    clearMain();
    document.querySelectorAll("header div").forEach(elem => {
        if(document.querySelector("#backbutton")===null){
            elem.insertAdjacentHTML('beforeend','<img id="backbutton" src="assets/images/back.png">')
        }
        document.querySelector("#backbutton").addEventListener("click",showStart);
    })
    const template = document.querySelector("#template-start-form");
    document.querySelector("main").appendChild(template.content.cloneNode(true));
    if(e.target.getAttribute('value') === 'register'){
        document.querySelector("#start-form-submit").addEventListener("click",registerUser);
    }else{
        document.querySelector("#start-form-submit").addEventListener("click",loginUser);
    }
}

async function registerUser(e){
    e.preventDefault();
    let user = {"username":document.querySelector("#input-username").value,"password":document.querySelector("#input-password").value};
    let res = await datafetcher.registerUser(user);
    handleLogin(res);
}

async function loginUser(e){
    e.preventDefault();
    let user = {"username":document.querySelector("#input-username").value,"password":document.querySelector("#input-password").value};
    let res = await datafetcher.loginUser(user);
    handleLogin(res);
}

function handleLogin(res){
    if(res.hasOwnProperty('message')){
        document.querySelector("#input-username").value = "";
        document.querySelector("#input-password").value = "";
        document.querySelector("#errors").innerHTML = `${res.message}`;
    }else{
        localforage.setItem('token',res.token);
        localforage.setItem('loggedin',true);
        localforage.setItem('uid',parseJwt(res.token).uid);
        clearMain();
        document.querySelectorAll("header div *:nth-child(2)").forEach(elem => {
            elem.classList.remove("hidden");
        });
        showHome();
    }
}

function clearMain(){
    document.querySelector("main").innerHTML = "";
}

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
};

async function showHome(){
    removeBackbuttonAndDisplayHamburgerMenu()
    clearMain();
    
    const template = document.querySelector("#template-home");
    document.querySelector("main").appendChild(template.content.cloneNode(true));

    let data = await datafetcher.loadPosts();
    for(const post of data){
        let date = new Date(post.date)
        let comments = await datafetcher.getComments(post.storyid);
        document.querySelector("#postcontainer").insertAdjacentHTML('beforeend',`<container id="post${post.storyid}" class="post">
        <div class="postheader">
            <div>
                <p>${post.username}</p>
                <p>${post.racename} - ${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${post.country}</p>
            </div>
            <p class="postscore">${post.score}</p>
        </div>
        <div class="postbody">
           <p>${post.content}</p>
        </div>
        <div class="postimages">
        </div>
        <div class="postfooter">
            <div storyid="${post.storyid}" class="postcommentbutton"><img src="./assets/images/comments.png"><p>${comments.length}</p></div>
            <div title="${post.title}"class="postsharebutton"><img src="./assets/images/share.png"></div>
        </div>
    </container>`);
        if(post.liked === 1){
            document.querySelector(`#post${post.storyid} .postfooter`).insertAdjacentHTML("afterbegin", `<div liked="true" storyid="${post.storyid}" class="postinteractionbutton"><img src="./assets/images/liked.png"></div>`)
        }else{
            document.querySelector(`#post${post.storyid} .postfooter`).insertAdjacentHTML("afterbegin", `<div liked="false" storyid="${post.storyid}" class="postinteractionbutton"><img src="./assets/images/notliked.png"></div>`)
        }
        if(post.image1 !== null){
            document.querySelector(`#post${post.storyid} .postimages`).insertAdjacentHTML("beforeend",`<img class="postimage" src="${backendurl}${post.image1}">`)
        }
        if(post.image2 !== null){
            document.querySelector(`#post${post.storyid} .postimages`).insertAdjacentHTML("beforeend",`<img class="postimage" src="${backendurl}${post.image2}">`)
        }
        if(post.image3 !== null){
            document.querySelector(`#post${post.storyid} .postimages`).insertAdjacentHTML("beforeend",`<img class="postimage" src="${backendurl}${post.image3}">`)
        }
    }
    addStoryEventListeners();
}

function addStoryEventListeners(){
    document.querySelectorAll('.postimage').forEach(elem => {
        elem.addEventListener("dblclick", toggleFullScreen);
        elem.addEventListener("click", toggleFullScreen);
    })
    
    document.querySelectorAll(".postinteractionbutton").forEach(elem => {
        elem.addEventListener("click",interactWithPost);
    })
    document.querySelectorAll(".postcommentbutton").forEach(elem => {
        elem.addEventListener("click",goToComments);
    })
    document.querySelectorAll(".postsharebutton").forEach(elem => {
        elem.addEventListener("click",()=>{
            window.open(`https://twitter.com/intent/tweet?text=I love this post on the F1 Stories app titled: ${elem.getAttribute('title')}`, '_blank');
        });
    })
}


function toggleFullScreen(e){
    if(!document.fullscreenElement){
        e.target.requestFullscreen();
    }
    else{
        if(document.exitFullscreen){
            document.exitFullscreen();
        }
    }
}

//like / dislike posts
function interactWithPost(e){
    let currstatus = (e.currentTarget.getAttribute("liked")=='true');
    let storyid = e.currentTarget.getAttribute("storyid");
    if(currstatus){
        document.querySelector(`#post${storyid} .postscore`).innerHTML = parseInt(document.querySelector(`#post${storyid} .postscore`).innerHTML) - 1
        e.target.setAttribute('src','./assets/images/notliked.png')
        e.currentTarget.setAttribute('liked','false');
        datafetcher.sendInteraction(storyid, 0);
    }else{
        document.querySelector(`#post${storyid} .postscore`).innerHTML = parseInt(document.querySelector(`#post${storyid} .postscore`).innerHTML) + 1
        e.target.setAttribute('src','./assets/images/liked.png')
        e.currentTarget.setAttribute('liked','true');
        datafetcher.sendInteraction(storyid, 1);
    }
}

//view comments
function goToComments(e){

}

function removeBackbutton(){
    if(document.querySelector('#backbutton')!==null){
        let back = document.querySelector("#backbutton");
        back.parentElement.removeChild(back);
    }
}

function openMobileMenu(e){
    e.preventDefault();
    clearMain();
    const template = document.querySelector("#template-mobile-menu");
    document.querySelector("main").appendChild(template.content.cloneNode(true));
    removeHamburgerMenuandDisplayBackbutton()
    //add eventlisteners to move to different pages
    document.querySelector(".viewprofilemobilebutton").addEventListener("click",showProfile);
    //document.querySelector(".createpostmobilebutton").addEventListener("click",createPost);
    //document.querySelector(".addracemobilebutton").addEventListener("click",addRace);
    //document.querySelector(".opensettingsmobilebutton").addEventListener("click",openSettings);
}

function removeBackbuttonAndDisplayHamburgerMenu(){
    document.querySelectorAll("header div *:nth-child(2)").forEach(elem => {
        elem.classList.remove("hidden");
    });
    removeBackbutton();
    clearMain();
}

function removeHamburgerMenuandDisplayBackbutton(){
    document.querySelectorAll("header div *:nth-child(2)").forEach(elem => {
        elem.classList.add("hidden");
    });
    document.querySelectorAll("header div").forEach(elem => {
        if(document.querySelector("#backbutton")===null){
            elem.insertAdjacentHTML('beforeend','<img id="backbutton" src="assets/images/back.png">')
        }
        document.querySelector("#backbutton").addEventListener("click",showHome);
    })
}

async function showProfile(){
    removeBackbuttonAndDisplayHamburgerMenu();
    const template = document.querySelector("#template-profile");
    document.querySelector("main").appendChild(template.content.cloneNode(true));
    let user = await datafetcher.getUserData();
    console.log(user);
    document.querySelector("#profileinfo").insertAdjacentHTML(`afterbegin`,`<h1>${user.username}</h1>
    <div>
    <h2>Userscore:</h2> <h2>${user.userscore}</h2>
    <h2>Stories:</h2> <h2>${user.stories.length}</h2>
    <h2>Races visited:</h2> <h2>${user.racesvisited}</h2>
    <h2>Posts:</h2>
    </div>`);

    for(const post of user.stories){
        let date = new Date(post.date)
        let comments = await datafetcher.getComments(post.storyid);
        document.querySelector("#profileposts").insertAdjacentHTML('beforeend',`<container id="post${post.storyid}" class="post">
        <div class="postheader">
            <div>
                <p>${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${post.country}</p>
            </div>
            <p class="postscore">${post.score}</p>
        </div>
        <div class="postbody">
           <p>${post.content}</p>
        </div>
        <div class="postimages">
        </div>
        <div class="postfooter">
            <div storyid="${post.storyid}" class="postcommentbutton"><img src="./assets/images/comments.png"><p>${comments.length}</p></div>
            <div title="${post.title}"class="postsharebutton"><img src="./assets/images/share.png"></div>
        </div>
    </container>`);
        if(post.image1 !== null){
            document.querySelector(`#post${post.storyid} .postimages`).insertAdjacentHTML("beforeend",`<img class="postimage" src="${backendurl}${post.image1}">`)
        }
        if(post.image2 !== null){
            document.querySelector(`#post${post.storyid} .postimages`).insertAdjacentHTML("beforeend",`<img class="postimage" src="${backendurl}${post.image2}">`)
        }
        if(post.image3 !== null){
            document.querySelector(`#post${post.storyid} .postimages`).insertAdjacentHTML("beforeend",`<img class="postimage" src="${backendurl}${post.image3}">`)
        }
    }
    addStoryEventListeners();
}