module.exports = {
	facebook: {
		// Facebook App Settings
		appID: process.env.FACEBOOK_APP_ID,
		appSecret: process.env.FACEBOOK_APP_SECRET,
		pageID: process.env.FACEBOOK_PAGE_ID,

		// access token for posting to page
		pageAccessToken: process.env.PAGE_ACCESS_TOKEN,
		
		// access token for posting to user's feed
		userAccessToken: process.env.USER_ACCESS_TOKEN,
		
		callbackURL: 'http://stuckwanyah.herokuapp.com/api/auth/facebook/callback',
		profileURL: 'https://graph.facebook.com/v2.5/me?fields=id,name,first_name,last_name,age_range,birthday,gender,picture{url},friends{id}',
		profileFields: ['id', 'email', 'name'],
		
		// Memorable word to verify webhooks with Messenger platform
		botVerifyToken: process.env.BOT_VERIFICATION_TOKEN
	},
	instagram: {
		appID: process.env.INSTAGRAM_CLIENT_ID,
		appSecret: process.env.INSTAGRAM_CLIENT_SECRET
	},
	mongodb: {
		testDbURL: process.env.DB_TEST,
		mongodbURI: process.env.MONGODB_ADDON_URI
	},
	session: {
		cookieKey: 'sweetlips',
		cookieSecret:"sweetlips"
	}
};
