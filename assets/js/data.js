const apiurl = "http://localhost:3001/api";

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

