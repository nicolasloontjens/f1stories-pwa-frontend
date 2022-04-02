"use strict";

document.addEventListener("DOMContentLoaded",init);

function init(){
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
    console.log(e.target.getAttribute("value"));
    const template = document.querySelector("#template-start-form");
    document.querySelector("main").appendChild(template.content.cloneNode(true));
    if(e.target.getAttribute('value') === 'register'){
        document.querySelector("start-form-submit").addEventListener("click",registerUser);
    }else{
        document.querySelector("start-form-submit").addEventListener("click",loginUser);
    }
}

async function registerUser(e){
    e.preventDefault();
}

async function loginUser(e){
    e.preventDefault();
}

function clearMain(){
    document.querySelector("main").innerHTML = "";
}

function showHome(){
    //here we show all the posts, etc
}