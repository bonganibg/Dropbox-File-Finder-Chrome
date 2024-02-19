class Authentication
{
    AUTH_END_POINT = "https://www.dropbox.com/oauth2/authorize";

    constructor(client_id, redirect_link)
    {
        this.client_id = client_id
        this.redirect_link = redirect_link
    }

    setupDropboxConnection()
    {
        //Get token from local storage
        let accessToken = localStorage.getItem("access_token");

        //Stores token right after verification from the dashboard page
        if (accessToken === "null"){
            hashParams = new URLSearchParams(window.location.hash.substr(1));
            accessToken = hashParams.get("access_token"); //save token to variable
            localStorage.setItem("access_token", accessToken);
        }

        //DBX object
        this.dbx = new Dropbox.Dropbox({
            clientId: dropboxClientId,
            clientSecret: clientSecret,
            accessToken: accessToken,
        });                      
    }

    async checkToken()
    {
        console.log(`%c Checking token`, "color: #f078c0");
        console.log("removeSpinner", removeSpinner);  

        if (this.#isAuthenticated()){
            alert("Access token is still valid ✔");
            return;
        }

        if (removeSpinner) {
            routeList.innerHTML = "Token Expired";
            removeSpinner = false;
        }

        let getToken = confirm(
            'Tokens only last 4 hour. This token might have expired ❌. Proceeding to "Auth" to get a new one.'
        )

        console.log(`%c Access token expired or is invalid`, "color: #f94144");

        if (getToken){
            localStorage.setItem('access_token', null)
            this.auth2Flow()
        }
    }

    async #isAuthenticated()
    {
        try{
            await this.dbx.usersGetCurrentAccount();
            console.log(`%c Access token is still valid`, "color: #7cb518");
            return true
        } catch(error){
            console.log("removeSpinner", removeSpinner);
            console.error('Not Authenticated')

            return false
        }
    }


    auth2Flow(){
        console.log(`%c Auth2Flow`, "color: red");

        history.replaceState({}, document.title, window.location.href.split("#")[0]);

        let authUrl = [this.AUTH_END_POINT, "?response_type=token",
        "&client_id=", this.client_id, "&redirect_uri=", 
        encodeURIComponent(this.redirect_link)].join("")

        window.location.href = authUrl
    }
}