const apiurl = "https://f1stories.herokuapp.com/api";

export async function registerUser(data){
    const res = await fetch(`${apiurl}/users/register`,{
        method:'POST',
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    let response = await res.json();
    return response;
}

export async function loginUser(data){
    const res = await fetch(`${apiurl}/users/login`,{
        method:'POST',
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    let response = await res.json();
    return response;
}

async function getLikes(){
    const res = await fetch(`${apiurl}/users/${await localforage.getItem('uid')}/likes`);
    let response = await res.json();
    return response;
}

export async function getRaces(){
    const res = await fetch(`${apiurl}/races`);
    let response = await res.json();
    return response;
}

export async function getComments(id){
    const res = await fetch(`${apiurl}/stories/${id}/comments`);
    let response = await res.json();
    return response;
}

export async function loadPosts(){
    const response = await fetch(`${apiurl}/stories`);
    let data = await response.json();
    let likes = await getLikes();
    let races = await getRaces();
    data.forEach(story => {
        let like = likes.filter(function(likes){
            return likes.storyid === story.storyid
        })
        let race = races.filter(function(races){
            return races.raceid = story.raceid
        })
        story.racename = race[0].title
        if(like.length === 1){
            story.liked = like[0].interaction
        }else{
            story.liked = 0;
        }
    })
    return data;
}

export async function sendInteraction(storyid, interaction){
    let token = await localforage.getItem("token");
    const data = new FormData();
    data.set('interact',interaction);
    await fetch(`${apiurl}/stories/${storyid}/interact`,{
        method:'POST',
        headers:{
            'authorization': token
        },
        body: data
    });
}

export async function getUserData(){
    let uid = await localforage.getItem("uid");
    const res = await fetch(`${apiurl}/users/${uid}`);
    const response = await res.json()
    let races = await getRaces();
    response.stories.forEach(story => {
        let race = races.filter(function(races){
            return races.raceid = story.raceid
        })
        story.racename = race[0].title
    })
    return response;
}

export async function addComment(comment,storyid){
    let token = await localforage.getItem("token");
    const data = new FormData();
    data.set('content',comment);
    await fetch(`${apiurl}/stories/${storyid}/comments`,{
        method:'POST',
        headers:{
            'authorization': token
        },
        body:data
    })
}

export async function addStory(filefield, raceid, content){
    const data = new FormData();
    for(let i = 0; i < Array.from(filefield.files).length; i++){
        data.append(`file${i}`,filefield.files[i]);
    }
    const country = await getCountry();
    data.set('content', content);
    data.set('country', country);
    data.set('raceid',raceid);
    let token = await localforage.getItem("token");
    await fetch(`${apiurl}/stories`,{
        method:"POST",
        body:data,
        headers:{
            "authorization":token
        }
    })
}

export async function deletePost(storyid){
    let token = await localforage.getItem("token");
    await fetch(`${apiurl}/stories/${storyid}`,{
        method:"DELETE",
        headers:{
            "authorization": token
        }
    })
}

export async function deleteComment(id){
    let token = await localforage.getItem("token");
    await fetch(`${apiurl}/comments/${id}`,{
        method:"DELETE",
        headers:{
            "authorization": token
        }
    })
}

export async function addRace(race){
    let token = await localforage.getItem("token");
    let uid = await localforage.getItem("uid");
    let data = new FormData();
    data.set("race",race);
    await fetch(`${apiurl}/users/${uid}/race`,{
        method:"POST",
        body:data,
        headers:{
            "authorization":token
        }
    });
}
//post for put request because laravel doesn't handle put requests well
export async function updatePost(content, storyid){
    let token = await localforage.getItem("token");
    let data = new FormData();
    data.set("content",content);
    data.set('_method','PUT');
    await fetch(`${apiurl}/stories/${storyid}`,{
        method:'POST',
        body:data,
        headers:{
            'authorization':token
        }
    });
}

export async function updateComment(content, commentid){
    let token = await localforage.getItem("token");
    let data = new FormData();
    data.set("content",content);
    data.set('_method','PUT');
    await fetch(`${apiurl}/comments/${commentid}`,{
        method:'POST',
        body:data,
        headers:{
            'authorization':token
        }
    });
}

async function getCountry(){
    const response = await fetch("https://ipinfo.io?token=7c6ec19f4b6e0c");
    const res = await response.json();
    let code = res.country;
    const response2 = await fetch(`https://restcountries.com/v3.1/alpha/${code}`)
    const res2 = await response2.json();
    return res2[0].name.common
}
