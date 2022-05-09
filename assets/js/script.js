"use strict";

document.addEventListener("DOMContentLoaded",init);

let datafetcher = null;
let reader = null;
const apiurl = "https://f1stories.herokuapp.com/api";
const backendurl = "https://f1stories.herokuapp.com"
let commentstoryid = 0;


async function init(){
    datafetcher = await import("./data.js");
    reader = await import("./reader.js");
    await registerServiceWorker();
    isLoggedIn();
    document.querySelector("#burger-menu").addEventListener("click",openMobileMenu);
    const displaymode = await localforage.getItem("displaymode")
    if(displaymode){
        document.querySelector("html").classList.add("dark")
    }else{
        document.querySelector("html").classList.remove("dark")
    }
    addDesktopEventListeners();
}

async function registerServiceWorker(){
    if('serviceWorker' in navigator){
        await navigator.serviceWorker.register("/sw.js");
    }
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
    document.querySelectorAll("header>div>*:nth-child(2)").forEach(elem => {
        elem.classList.add("hidden");
    });
    removeBackbutton();//removes back buttons in header
    clearMain();//empty main
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
        elem.insertAdjacentHTML("beforeend",'<img class="backbutton" src="assets/images/back.png">')
        document.querySelectorAll(".backbutton").forEach(elem => elem.addEventListener('click',showStart));
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
        clearMain();//empty main
        //unhide the menu options
        document.querySelectorAll("header>div>*:nth-child(2)").forEach(elem => {
            elem.classList.remove("hidden");
        });
        //remove the back button
        removeBackbutton();
        showHome();
    }
}

function addDesktopEventListeners(){
    document.querySelector("#desktopcreatepost").addEventListener("click", createPost);
    document.querySelector("#desktopgotoprofile").addEventListener("click", showProfile);
    document.querySelector("#desktopaddrace").addEventListener("click", addRace);
    document.querySelector("#desktopsettings").addEventListener("click", openSettings);  
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
    clearMain();
    document.querySelectorAll(".logo").forEach(elem => {elem.addEventListener("click",showHome)});
    
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
            <div storyid="${post.storyid}" username="${post.username}" gp="${post.racename}" class="postcommentbutton"><img src="./assets/images/comments.png"><p>${comments.length}</p></div>
            <div user="${post.username}"class="postsharebutton"><img src="./assets/images/share.png"></div>
        </div>
    </container>`);
        if(post.liked === 1){
            document.querySelector(`#post${post.storyid} .postfooter`).insertAdjacentHTML("afterbegin", `<div liked="true" storyid="${post.storyid}" class="postinteractionbutton"><img src="./assets/images/liked.png"></div>`)
        }else{
            document.querySelector(`#post${post.storyid} .postfooter`).insertAdjacentHTML("afterbegin", `<div liked="false" storyid="${post.storyid}" class="postinteractionbutton"><img src="./assets/images/notliked.png"></div>`)
        }
        if(post.image1 !== null && post.image1 !== undefined){
            document.querySelector(`#post${post.storyid} .postimages`).insertAdjacentHTML("beforeend",`<img class="postimage" src="${post.image1}">`)
        }
        if(post.image2 !== null && post.image2 !== undefined){
            document.querySelector(`#post${post.storyid} .postimages`).insertAdjacentHTML("beforeend",`<img class="postimage" src="${post.image2}">`)
        }
        if(post.image3 !== null && post.image3 !== undefined){
            document.querySelector(`#post${post.storyid} .postimages`).insertAdjacentHTML("beforeend",`<img class="postimage" src="${post.image3}">`)
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
            window.open(`https://twitter.com/intent/tweet?text=I'm loving the F1 Stories app! The post from ${elem.getAttribute('user')} is amazing!`, '_blank');
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
async function goToComments(e){
    const storyid = e.currentTarget.getAttribute('storyid');
    const username = e.currentTarget.getAttribute('username');
    const gp = e.currentTarget.getAttribute('gp');
    commentstoryid = storyid;
    await displayComments(storyid, username, gp);
}

async function displayComments(storyid, username, gp){
    if(document.querySelector("#home") !== null){
        document.querySelector("#home").classList.add("hidden");
    }else{
        document.querySelector("#profile").classList.add("hidden");
    }
    let comments = await datafetcher.getComments(storyid);
    document.querySelector("main").insertAdjacentHTML('afterbegin',`<section id="comments">
    <h1>${username} - ${gp}</h1>
    <div class="comments-list">
    </div>
    <button username="${username}" gp="${gp}" id="displayaddcommentbutton">Add a comment</button> 
    </section>`)
    for(const comment of comments){
        document.querySelector(".comments-list").insertAdjacentHTML("beforeend",`
        <div>
            <section>
                <h3>${comment.username}</h3>
                <p>${comment.content}</p>
            </section>
        </div>
        `)
        const uid = await localforage.getItem("uid")
        if(uid == comment.userid){
            document.querySelector(".comments-list div:last-of-type").innerHTML += `<div><img commentid="${comment.commentid}" class="removecommentbutton" src="./assets/images/delete.png">
            <img commentid="${comment.commentid}" storyid="${comment.storyid}" content="${comment.content}" class="editcommentbutton" src="./assets/images/edit.png"></div>`
        }
    }
    commentsUI();
}

function commentsUI(){
    document.querySelector("#displayaddcommentbutton").addEventListener("click",showAddCommentPage);
    //hide hamburger menu
    document.querySelectorAll("header>div>*:nth-child(2)").forEach(elem => {
        elem.classList.add("hidden");
    });
    //insert backbutton + add eventlistener to go back to home without refreshing
    document.querySelectorAll("header>div").forEach(elem => {
        elem.insertAdjacentHTML("beforeend",'<img class="backbutton" src="assets/images/back.png">')
        document.querySelectorAll('.backbutton').forEach(elem => {
            elem.addEventListener('click',(e) => {
                e.stopImmediatePropagation()
                document.querySelectorAll("header>div>*:nth-child(2)").forEach(elem => {
                    elem.classList.remove("hidden");
                });
                removeBackbutton();
                document.querySelector('#comments').remove();
                if(document.querySelector("#home") !== null){
                    document.querySelector("#home").classList.remove("hidden");
                }else{
                    document.querySelector("#profile").classList.remove("hidden");
                }
            })
        })
    })
    document.querySelectorAll(".removecommentbutton").forEach(elem => elem.addEventListener("click",async (e)=>{
        let id = e.target.getAttribute("commentid")
        await datafetcher.deleteComment(id);
        removeBackbuttonAndDisplayHamburgerMenu();
        if(document.querySelector("#home") !== null){
            showHome()
        }else{
            showProfile()
        }
    }))
    document.querySelectorAll(".editcommentbutton").forEach(elem => elem.addEventListener("click",showEditComment));
}

function showEditComment(e){
    let content = e.currentTarget.getAttribute('content')
    clearMain();
    const template = document.querySelector("#template-edit");
    document.querySelector("main").appendChild(template.content.cloneNode(true));
    document.querySelector("#edit-input-field").value = content;
    document.querySelector("#submit-edit").setAttribute("commentid", e.currentTarget.getAttribute('commentid'));
    document.querySelector("#submit-edit").setAttribute("storyid", e.currentTarget.getAttribute('storyid'));
    document.querySelector("#submit-edit").addEventListener("click",submitCommentEdit);
}

async function submitCommentEdit(e){
    e.preventDefault();
    let content = document.querySelector("#edit-input-field").value;
    await datafetcher.updateComment(content, e.currentTarget.getAttribute("storyid"), e.currentTarget.getAttribute("commentid"));
    removeBackbuttonAndDisplayHamburgerMenu();
    showHome();
}

async function showAddCommentPage(e){
    removeBackbutton();
    e.preventDefault();
    let username = e.currentTarget.getAttribute("username");
    let gp = e.currentTarget.getAttribute("gp");
    document.querySelector("#comments").classList.add("hidden");
    document.querySelector("main").insertAdjacentHTML("afterbegin",`
        <section id="add-comment">
            <h1>Your comment:</h1>
            <input id="commmentcontent" type="text">
            <button id="postcommentbutton">Post</button>
        </section>
    `)
    document.querySelector("#postcommentbutton").addEventListener("click",async ()=>{
        await submitComment();
        document.querySelectorAll("header>div>*:nth-child(2)").forEach(elem => {
            elem.classList.remove("hidden");
        });
        removeBackbutton();
        document.querySelector('#add-comment').remove();
        document.querySelector("#comments").remove();
        displayComments(commentstoryid, username, gp);
    })
    addCommentsUI(username, gp);
}

function addCommentsUI(username, gp){
    document.querySelectorAll("header>div>*:nth-child(2)").forEach(elem => {
        elem.classList.add("hidden");
    });
    document.querySelectorAll("header>div").forEach(elem => {
        elem.insertAdjacentHTML("beforeend",'<img class="backbutton" src="assets/images/back.png">')
        document.querySelectorAll('.backbutton').forEach(elem => {
            elem.addEventListener('click',(e) => {
                e.stopImmediatePropagation()
                document.querySelectorAll("header>div>*:nth-child(2)").forEach(elem => {
                    elem.classList.remove("hidden");
                });
                removeBackbutton();
                document.querySelector('#add-comment').remove();
                document.querySelector("#comments").remove();
                displayComments(commentstoryid, username, gp)
            })
        })
    })
}

async function submitComment(){
    let comment = document.querySelector("#commmentcontent").value;
    await datafetcher.addComment(comment,commentstoryid);
}

function removeBackbutton(){
    document.querySelectorAll(".backbutton").forEach(button => {
        button.remove();
    })
}

function openMobileMenu(e){
    e.preventDefault();
    clearMain();
    const template = document.querySelector("#template-mobile-menu");
    document.querySelector("main").appendChild(template.content.cloneNode(true));
    removeHamburgerMenuandDisplayBackbutton()
    //add eventlisteners to move to different pages
    document.querySelector(".viewprofilemobilebutton").addEventListener("click",(e) => {
        e.preventDefault();
        showProfile
    });
    document.querySelector(".createpostmobilebutton").addEventListener("click",(e)=>{
        e.preventDefault();
        createPost();
    });
    document.querySelector(".addracemobilebutton").addEventListener("click",(e)=>{
        e.preventDefault();
        addRace();
    });
    document.querySelector(".opensettingsmobilebutton").addEventListener("click",(e)=>{
        e.preventDefault();
        openSettings();
    });
}

async function openSettings(){
    clearMain();
    removeBackbuttonAndDisplayHamburgerMenu();
    const template = document.querySelector("#template-settings");
    document.querySelector("main").appendChild(template.content.cloneNode(true));
    const checkboxval = await localforage.getItem('displaymode');
    if(checkboxval){
        document.querySelector("#darkmodecheckbox").checked = true;
    }
    document.querySelector("#darkmodecheckbox").addEventListener("click",changeDisplayMode);
    document.querySelector("#logout").addEventListener("click",async ()=>{
        await localforage.clear();
        location.reload();
    })
}

async function changeDisplayMode(e){
    if(e.target.checked){
        document.querySelector("html").classList.add("dark")
    }else{
        document.querySelector("html").classList.remove("dark")
    }
    await localforage.setItem('displaymode',e.target.checked);
}

async function createPost(){
    clearMain();
    removeBackbuttonAndDisplayHamburgerMenu();
    const template = document.querySelector("#template-create-story");
    document.querySelector("main").appendChild(template.content.cloneNode(true));
    const races = await datafetcher.getRaces();
    for(let race of races){
        document.querySelector("#raceselect").insertAdjacentHTML('beforeend',`<option value="${race.raceid}">${race.title}</option>`)
    }
    document.querySelector("#addstorysubmit").addEventListener("click",submitStory);
}

async function submitStory(e){
    e.preventDefault();
    const filefield = document.querySelector(".custom-file-input");
    let files = filefield.files.length;
    if(filefield.files.length > 3){
        document.querySelector("#form-error").innerHTML = "";
        document.querySelector("#form-error").innerHTML += "<p>You selected too many files, please select 3 max</p>"
        return;
    }
    let raceid = document.querySelector("#raceselect").value;
    let content = document.querySelector("#postcontent").value;
    await datafetcher.addStory(filefield, raceid, content);
    showHome();
}

function removeBackbuttonAndDisplayHamburgerMenu(){
    document.querySelectorAll("header>div>*:nth-child(2)").forEach(elem => {
        elem.classList.remove("hidden");
    });
    removeBackbutton();
}

function removeHamburgerMenuandDisplayBackbutton(){
    document.querySelectorAll("header>div>*:nth-child(2)").forEach(elem => {
        elem.classList.add("hidden");
    });
    document.querySelectorAll("header>div").forEach(elem => {
        elem.insertAdjacentHTML('beforeend','<img class="backbutton" src="assets/images/back.png">')
        document.querySelectorAll(".backbutton").forEach(elem => elem.addEventListener("click",(e) =>{
            e.stopImmediatePropagation();
            removeBackbuttonAndDisplayHamburgerMenu()
            showHome();
        }));
    })
}

async function showProfile(){
    clearMain();
    removeBackbuttonAndDisplayHamburgerMenu();
    const template = document.querySelector("#template-profile");
    document.querySelector("main").appendChild(template.content.cloneNode(true));
    let user = await datafetcher.getUserData();
    let userscore = user.userscore
    if(userscore == null){
        userscore = 0;
    }
    document.querySelector("#profileinfo").insertAdjacentHTML(`afterbegin`,`<h1>${user.username}</h1>
    <div>
    <h2>Userscore:</h2> <h2>${userscore}</h2>
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
                <p>${user.username}</p>
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
            <div storyid="${post.storyid}" class="profiledeletepostbutton"><img src="./assets/images/delete.png"></div>
            <div storyid="${post.storyid}" username="${user.username}" gp=${post.racename}" class="postcommentbutton"><img src="./assets/images/comments.png"><p>${comments.length}</p></div>
            <div user="${user.username}"class="postsharebutton"><img src="./assets/images/share.png"></div>
            <div storyid="${post.storyid}"class="posteditbutton"><img src="./assets/images/edit.png"></div>
        </div>
    </container>`);
        if(post.image1 !== null && post.image1 !== undefined){
            document.querySelector(`#post${post.storyid} .postimages`).insertAdjacentHTML("beforeend",`<img class="postimage" src="${post.image1}">`)
        }
        if(post.image2 !== null && post.image2 !== undefined){
            document.querySelector(`#post${post.storyid} .postimages`).insertAdjacentHTML("beforeend",`<img class="postimage" src="${post.image2}">`)
        }
        if(post.image3 !== null && post.image3 !== undefined){
            document.querySelector(`#post${post.storyid} .postimages`).insertAdjacentHTML("beforeend",`<img class="postimage" src="${post.image3}">`)
        }
    }
    addStoryEventListeners();

    document.querySelectorAll(".profiledeletepostbutton").forEach(elem => elem.addEventListener("click",async (e)=>{
        e.preventDefault();
        await datafetcher.deletePost(e.currentTarget.getAttribute("storyid"));
        showProfile();
    }));
    document.querySelectorAll(".posteditbutton").forEach(elem => elem.addEventListener("click",editPost));
}

async function editPost(e){
    e.preventDefault();
    let content = document.querySelector(`#post${e.currentTarget.getAttribute('storyid')} .postbody p`).innerHTML;
    clearMain();
    const template = document.querySelector("#template-edit");
    document.querySelector("main").appendChild(template.content.cloneNode(true));
    document.querySelector("#edit-input-field").value = content;
    document.querySelector("#submit-edit").setAttribute("storyid", e.currentTarget.getAttribute('storyid'));
    document.querySelector("#submit-edit").addEventListener("click",submitPostEdit);
}

async function submitPostEdit(e){
    e.preventDefault();
    let content = document.querySelector("#edit-input-field").value;
    await datafetcher.updatePost(content, e.currentTarget.getAttribute("storyid"));
    showProfile();
}

async function addRace(){
    clearMain();
    removeBackbuttonAndDisplayHamburgerMenu();
    const template = document.querySelector("#template-add-race");
    document.querySelector("main").appendChild(template.content.cloneNode(true));
    await reader.init();
}

export async function receiveBarcodeInput(code){
    if(code.success){
        let barcode = code.barcode;
        console.log(barcode);
        let races = await datafetcher.getRaces();
        let therace = races.filter(function(races){
            return races.title == barcode;
        })
        if(therace.length === 1){
            await datafetcher.addRace(therace[0].title)
            clearMain();
            document.querySelector("main").insertAdjacentHTML("afterbegin",`<div id="raceconfirmation"><h1>Race added to your profile!</h1></div>`)
        }else{
            clearMain();
            document.querySelector("main").insertAdjacentHTML("afterbegin",`<div id="raceconfirmation"><h1>Invalid race.</h1><button id="tryagain">Try again?</button></div>`)
            document.querySelector("#tryagain").addEventListener("click",()=>{
                addRace();
            })
        }
    }else{
        clearMain();
        document.querySelector("main").insertAdjacentHTML("afterbegin",`<div id="raceconfirmation"><h1>Something went wrong.</h1></div>`)
    }
}

