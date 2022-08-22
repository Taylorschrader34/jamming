import SearchBar from "../Components/SearchBar/SearchBar";

console.log(process.env)
console.log(process.env.REACT_APP_SPOTIFY_CLIENT_KEY)

const clientID = process.env.REACT_APP_SPOTIFY_CLIENT_KEY;
//https://developer.spotify.com/dashboard/applications/eded7fe9ae10427fa2473cf6c0adadd5
// const redirectUri = "http://localhost:3000";
const redirectUri = "http://RoyalJammingReact.surge.sh";
let accessToken;

const Spotify = {
    getAccessToken() {
        if (accessToken) {
            return accessToken;
        }

        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        if (accessTokenMatch && expiresInMatch) {
            accessToken = accessTokenMatch[1];
            const expiresIn = Number(expiresInMatch[1]);
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else {
            const accessURL = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
            window.location = accessURL;
        }
    },

    search(term) {
        const accessToken = Spotify.getAccessToken();
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`

            }
        }).then(response => {
            return response.json();
        }).then(jsonResonse => {
            if (!jsonResonse.tracks) {
                return [];
            }

            return jsonResonse.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                albumArt: track.album.images[0].url,
                uri: track.uri,
            }))
        })
    },

    savePlaylist(name, trackUris) {
        if (!name || !trackUris.length) {
            return;
        }

        const accessToken = Spotify.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}` };
        let userId;

        return fetch("https://api.spotify.com/v1/me", { headers: headers }
        ).then(response => response.json()
        ).then(jsonResponse => {
            userId = jsonResponse.id;
            return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, 
            {
                headers: headers,
                method: "POST",
                body: JSON.stringify({name: name})
            }).then(response => response.json()
            ).then(jsonResponse => {
                const playlistID = jsonResponse.id;
                return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistID}/tracks`, 
                {
                    headers: headers,
                    method: "POST",
                    body: JSON.stringify({uris: trackUris})
                })
            })
        });
    },
}

export default Spotify;