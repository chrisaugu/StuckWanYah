module.exports = {
	// Facebook Settings
	fb_app_id: process.env.FACEBOOK_APP_ID || "",
	fb_app_secret: process.env.FACEBOOK_APP_SECRET || "",
	fb_page_id: process.env.PAGE_ID || "",
	// APP Settings
	app_key: process.env.APP_KEY || "",
	client_secret: process.env.CLIENT_SECRET || "",
	page_access_token: process.env.PAGE_ACCESS_TOKEN || "",
	user_access_token: process.env.USER_ACCESS_TOKEN || "",
	verify_token: process.env.VERIFICATION_TOKEN || "",
	db: process.env.MONGODB_URI || "mongodb://localhost:27017/sweetlipsdb"
}