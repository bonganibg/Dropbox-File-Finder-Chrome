export class AuthenticaionService
{
    constructor(clientId, clientSecret, redirectUrl, shared){
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUrl = redirectUrl;
        this.shared = shared;
    }

    createDbxConnection()
    {
        let accessToken = localStorage.getItem("access_token");        

        if (accessToken === "null"){
            this.shared.hashParams = new URLSearchParams(window.location.hash.substr(1));            
            accessToken = this.shared.hashParams.get("access_token"); //save token to variable
            localStorage.setItem("access_token", accessToken);
        }

        let dbx = new Dropbox.Dropbox({
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            accessToken: accessToken
        });
        
        this.dbx = dbx
        return dbx;
    }

    async checkToken(dbx){
        console.log(`%c Checking token`, "color: #f078c0");
        console.log("removeSpinner", this.shared.removeSpinner);

        try {
            await dbx.usersGetCurrentAccount();
            console.log(`%c Access token is still valid`, "color: #7cb518");
            alert("Access token is still valid ✔");

        } catch (error) {
            console.log("removeSpinner", this.shared.removeSpinner);
            if (this.shared.removeSpinner) {
            this.shared.routeList.innerHTML = "Token Expired";
            this.shared.removeSpinner = false;
            }

            let getToken = confirm(
                'Tokens only last 4 hour. This token might have expired ❌. Proceeding to "Auth" to get a new one.'
            );

            console.log(`%c Access token expired or is invalid`, "color: #f94144");
            if (getToken) {
                localStorage.setItem("access_token", null);
                this.auth2Flow();
            }
        }
    }

    auth2Flow(){
        console.log(`%c Auth2Flow`, "color: red");
        history.replaceState({}, document.title, window.location.href.split("#")[0]);

        // Redirect the user to the authorization URL
        const authUrl =
            "https://www.dropbox.com/oauth2/authorize" +
            "?response_type=token" +
            "&client_id=" +
            this.clientId +
            "&redirect_uri=" +
            encodeURIComponent(this.redirectUrl);

        window.location.href = authUrl;
    }

    
}