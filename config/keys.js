module.exports = {
	facebook: {
		// Facebook App Settings
		appID: process.env.FACEBOOK_APP_ID,
		appSecret: process.env.FACEBOOK_APP_SECRET,
		appKey: process.env.FACEBOOK_APP_KEY,
		pageID: process.env.FACEBOOK_PAGE_ID,

		// access token for posting to page
		pageAccessToken: process.env.PAGE_ACCESS_TOKEN,
		
		// access token for posting to user's feed
		userAccessToken: process.env.USER_ACCESS_TOKEN,
		
		callbackURL: 'https://stuckwanyah.herokuapp.com/api/v1/auth/facebook/callback',
		profileURL: 'https://graph.facebook.com/v2.5/me?fields=id,name,first_name,last_name,age_range,birthday,gender,picture{url},friends{id}',
		profileFields: ['id', 'email', 'name'],
		
		// Memorable word to verify webhooks with Messenger platform
		botVerifyToken: process.env.BOT_VERIFICATION_TOKEN
	},
	mongodb: {
		testDbURL: process.env.DB_TEST,
		mongodbURI: process.env.MONGODB_URL
	},
	session: {
		cookieKey: 'sweetlips',
		cookieSecret:"sweetlips"
	}
};
