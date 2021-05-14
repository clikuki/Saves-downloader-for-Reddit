const snoowrap = require('snoowrap');

// Where you put your username, password, client ID and secret (go to https://www.reddit.com/prefs/apps/ for the client ID an secret)
exports.r = new snoowrap({
	userAgent : 'windows:savesImageDownloader:v2.0.0 (by u/clikuki)',
	clientId : 'Client ID here',
	clientSecret : 'Client secret here',
	username : 'Reddit username here',
	password : 'Password here'
});