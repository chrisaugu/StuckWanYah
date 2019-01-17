module.exports = {
	facebook: {
		// Facebook App Settings
		appID: process.env.FACEBOOK_APP_ID,
		appSecret: process.env.FACEBOOK_APP_SECRET,
		pageID: process.env.FACEBOOK_PAGE_ID,
		appKey: process.env.FACEBOOK_APP_KEY,
		clientID: process.env.FACEBOOK_CLIENT_ID,
		clientSecret: process.env.FACEBOOK_CLIENT_SECRET,

		// access token for posting to page
		pageAccessToken: process.env.PAGE_ACCESS_TOKEN,
		
		// access token for posting to user's feed
		userAccessToken: process.env.USER_ACCESS_TOKEN,
		
		// callbackURL: 'https://stuckwanyah.herokuapp.com/api/v1/auth/facebook/callback',
		callbackURL: "http://localhost:5000/api/v1/auth/facebook/callback",
		profileURL: 'https://graph.facebook.com/v2.5/me?fields=id,name,first_name,last_name,age_range,birthday,gender,picture{url},friends{age_range,birthday,name,picture{url},first_name,last_name}',
		profileFields: ['id', 'email', 'name'],
		
		// Memorable word to verify webhooks with Messenger platform
		botVerifyToken: process.env.BOT_VERIFICATION_TOKEN
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