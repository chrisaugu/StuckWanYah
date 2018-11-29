module.exports = {
	facebook: {
		// Facebook App Settings
		appID: process.env.FACEBOOK_APP_ID,
		appSecret: process.env.FACEBOOK_APP_SECRET,
		pageID: process.env.PAGE_ID || this. appID,
		appKey: process.env.APP_KEY || this.appID,
		clientID: process.env.CLIENT_ID || this.appID,
		clientSecret: process.env.CLIENT_SECRET || this.appSecret,
		
		// access token for posting to page
		pageAccessToken: process.env.PAGE_ACCESS_TOKEN,
		
		// access token for posting to user's feed
		userAccessToken: process.env.USER_ACCESS_TOKEN,
		
		callbackURL: 'https://stuckwanyah.herokuapp.com/api/v1/auth/facebook/callback',
		profileURL: 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email,age,brithdate,pictures,friends',
		profileFields: ['id', 'email', 'name'],
		
		// Memorable word to verify webhooks with Messenger platform
		verifyToken: process.env.VERIFICATION_TOKEN || 'this_is_my_token',
		botVerifyToken: process.env.BOT_VERIFY_TOKEN || "this_is_my_token"
	},
	mongodb: {
		testDbURL: "mongodb://localhost:27017/sweetlipsdb",
		dbURL: process.env.DATABASE_URL,
		mongodbURI: process.env.MONGODB_URI
	},
	session: {
	    cookieKey: 'sweetlips',
	    cookieSecret:"sweetlips"
	}
}
