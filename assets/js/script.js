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
    document.querySelectorAll("header div *:nth-child(2)").forEach(elem => {
        elem.classList.remove("hidden");
    });
    removeBackbutton();
    clearMain();
    const template = document.querySelector("#template-home");
    document.querySelector("main").appendChild(template.content.cloneNode(true));
    let data = await datafetcher.loadPosts();
    data.forEach(post => {
        let date = new Date(post.date)
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
            <div class="postinteractionbutton"><img src="./assets/images/liked.png"></div>
            <div class="postcommentbutton"><img src="./assets/images/comments.png"><p>101</p></div>
            <div class="postsharebutton"><img src="./assets/images/share.png"></div>
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
    });
    //make images clickable
    document.querySelectorAll('.postimage').forEach(elem => {
        elem.addEventListener("dblclick", toggleFullScreen);
        elem.addEventListener("click", toggleFullScreen);
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