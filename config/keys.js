module.exports = {
	facebook: {
		// Facebook App Settings
		appID: process.env.FACEBOOK_APP_ID || "1791165357568831",
		appSecret: process.env.FACEBOOK_APP_SECRET || "70b43373323e9c92705ecec5b1189f78",
		pageID: process.env.PAGE_ID || this. appID,
		appKey: process.env.APP_KEY || this.appID,
        clientID: process.env.CLIENT_ID || this.appID,
		clientSecret: process.env.CLIENT_SECRET || this.appSecret,
		// access token for posting to page
		pageAccessToken: process.env.PAGE_ACCESS_TOKEN,
		// access token for posting to user's feed
		userAccessToken: process.env.USER_ACCESS_TOKEN,
		callbackURL: 'http://localhost:5000/api/v1/auth/facebook/callback',
		profileURL: 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email,age,brithdate,pictures,friends',
		profileFields: ['id', 'email', 'name'],
		// Memorable word to verify webhooks with Messenger platform
		verifyToken: process.env.VERIFICATION_TOKEN || 'this_is_my_token',
		botVerifyToken: process.env.BOT_VERIFY_TOKEN || "this_is_my_token"
	},
	mongodb: {
	    testDbURL: "mongodb://localhost:27017/sweetlipsdb",
        dbURL: process.env.DATABASE_URL || "mongodb://admin:secr3t@ds117719.mlab.com:17719/sweetlipsdb",
        mongodbURI: process.env.MONGODB_URI || "mongodb://chrisaugu:chatm3@ds117719.mlab.com:17719/sweetlipsdb"
	},
    session: {
	    cookieKey: 'sweetlips',
	    cookieSecret:"sweetlips"
	}
}