export class AuthenticaionService
{
    constructor(clientId, clientSecret, redirectUrl)
    {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUrl = redirectUrl;

        this.createDbxConnection();
    }

    createDbxConnection()
    {
        let accessToken = localStorage.getItem("access_token");

        if (accessToken == "null"){
            hashParams = new URLSearchParams(window.location.hash.substr(1));
            accessToken = hashParams.get("access_token"); //save token to variable
            localStorage.setItem("access_token", accessToken);
        }

        let dbx = new Dropbox.Dropbox({
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            accessToken: accessToken
        });

        this.dbx = dbx;
    }

    getConnection(){
        return this.dbx;
    }    
}