const apiurl = "http://localhost:3001";

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