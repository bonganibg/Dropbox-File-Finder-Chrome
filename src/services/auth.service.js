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

        return dbx;
    }

    
}