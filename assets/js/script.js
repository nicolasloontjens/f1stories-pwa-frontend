"use strict";

document.addEventListener("DOMContentLoaded",init);

let datafetcher = null;

async function init(){
    datafetcher = await import("./data.js");
    isLoggedIn();
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
    let data = await datafetcher.loadPosts();
    data.forEach(post => {
        document.querySelector("#postcontainer").insertAdjacentHTML('beforeend','<p>a post</p>');
    })
}