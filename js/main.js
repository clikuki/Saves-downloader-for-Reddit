const prompt = require('prompt'),
	  fs = require('fs'),
	  download = require('url-download');

const check = require('./check.js').subredditsAndProfiles;
	  r = require('./userInfo.js').r;

// Used for creating separators for console
const BIG_BAR = '========================================================================================================';
const SMALL_BAR = '---------------------------------------------';

// Fetches the saves listings
function getSaves(fetchLimit) {
	console.log(`${BIG_BAR}\nFetching saves...\n${BIG_BAR}`);
	r.getMe().getSavedContent({
		limit: fetchLimit
	}).then(async savesListing => {
		filteredListing = await filterSaveslisting(savesListing);

		if(filteredListing.urlArray.length === 0) {
			if(filteredListing.manualUrlArray.length !== 0) {
				removeUndownloadableSavesPrompt(filterSaveslisting.manualUrlArray);
			}
			return console.log('Nothing to download...');
		}else {
			chooseOperationPrompt(filteredListing);
		}
	})
}

// Filters the saves listing
function filterSaveslisting(savesListing) {
	let invalidPosts = [],
		urlArray = [],
		manualUrlArray = [],
		counter = {
			saveCounts: 0,
			image: 0,
			video: 0,
			gallery: 0,
			comment: 0,
			nsfw: 0,
			sfw: 0
		};

	for(let i = 0; i < savesListing.length; i++) {
		let subredditName = savesListing[i].subreddit.display_name,
			nsfw = false,
			type = postType(savesListing[i]),
			url = getUrl(type, savesListing[i]);

		if(isInvalid(subredditName)) {
			invalidPosts.push({
				permalink : `https://reddit.com${savesListing[i].permalink}`,
				subredditName : subredditName,
				type : 'comment',
				id : savesListing[i].id
			})
			continue;
		}

		if(savesListing[i].over_18 === true) {
			nsfw = true;
			counter.nsfw++;
		}else {
			counter.sfw++;
		}

		subredditName = prefixSubredditName(subredditName);

		if(type !== 'image') {
			manualUrlArray.push({
				index : i,
				url : url,
				subredditName : subredditName,
				nsfw : nsfw,
				type : type,
				id : savesListing[i].id
			});
		}else {
			urlArray.push({
				url : url,
				type : type,
				id : savesListing[i].id
			});
		}

		counter[type]++;
		counter.saveCounts++;
	}

	return {invalidPosts, urlArray, manualUrlArray, counter};
}

// Returns the type of post the save is
function postType(post) {
	if(post.hasOwnProperty('selftext')) {
		url = getUrl(1, post);

		if(url.includes('//v.') ||
			url.includes('.gif') ||
			url.includes('.mp4') ||
			url.includes('.mp3') ||
			url.includes('youtube')) {
			return type = 'video';
		}else if(url.includes('gallery')) {
			return type = 'gallery';
		}else {
			return type = 'image';
		}
	}else {
		return type = 'comment';
	}
}

// Gets the URL of image in post or the URL included in the comment
function getUrl(type, post) {
	if(type === 'comment') {
		let urlArray = separateUrlFromString(JSON.stringify(post.body));
		
		if(urlArray === null) {
			return JSON.stringify(post.link_permalink).replace(/['"]+/g, '') + post.id;
		}else {
			return [...urlArray, post.link_permalink].toString().replace(/,/g, ', ');
		}
	}else {
		return JSON.stringify(post.url).replace(/['"]+/g, '');
	}
}

// Gets substrings between parenthesises
function separateUrlFromString(string) {
	const regex = /\(([^\)(]+)\)/g,
		  linkArray = string.match(regex);

	if(linkArray === null) return null;

	linkArray.forEach((link, index) => {
		linkArray[index] = link.replace(/[()]/g, '');
	})

	return linkArray;
}

// Checks if subreddit of post is included in check.js
function isInvalid(subredditName, type) {
	if(!check.includes(subredditName.toLowerCase())) {
		if(type === 'comment') {
			if(url === body || url === '' || !url.includes('https://')) {
				return true;
			}
		}else return true;
	}else return false;
}

// Prefixes subredditName with r/ if it is a subreddit, and u/ if it is a user profile
function prefixSubredditName(subredditName) {
	if(subredditName.includes('u_')) {
		return subredditName.replace('_', '/');
	}else {
		return subredditName = 'r/' + subredditName;
	}
}

// Logs the counter and manual URLs
function log(manualUrlArray, counter) {
	console.log(BIG_BAR);
	console.log(
		`Number of valid saves : ${counter.saveCounts}\nImages : ${counter.image}\nVideos : ${counter.video}\nGalleries : ${counter.gallery}\nComments : ${counter.comment}\nNSFW : ${counter.nsfw}\nSFW : ${counter.sfw}`,
	);
	console.log(BIG_BAR);

	// If manual array is empty, then this function stops executing
	if(manualUrlArray.length === 0) return;

	console.log(`You may need to download these saves manually :\n${SMALL_BAR}`);
	for (let i = 0; i < manualUrlArray.length; i++) {
		console.log(
			`index ${manualUrlArray[i].index} || ${manualUrlArray[i].subredditName}\n${SMALL_BAR}\ntype : ${manualUrlArray[i].type}\nnsfw : ${manualUrlArray[i].nsfw}\nurl : ${manualUrlArray[i].url}`
		);

		if(i === manualUrlArray.length - 1) {
			console.log(BIG_BAR);
		}else {
			console.log(`${SMALL_BAR}`)
		}
	}
}

// Downloads images taken from saves
async function downloadUrls(urlArray, manualUrlArray) {
	const dest = './downloads';

	console.log(`\nDownloads starting - downloading to ${dest}\n${BIG_BAR}\n`);

	for (let i = 0; i < urlArray.length; i++) {
		download(urlArray[i].url, dest);
	}
	
	removeSavesPrompt(urlArray, manualUrlArray);
}

// Removes saves that have been downloaded
function removeDownloadedSaves(urlArray) {
	for (let i = 0; i < urlArray.length; i++) {
		r.getSubmission(urlArray[i].id).unsave();
	}
}

// Removes saves that can't be downloaded and writes the subreddit and URL to the post or comment
function removeUndownloadableSaves(manualUrlArray) {
	const writeTo = fs.createWriteStream('./urls/manualPosts.txt', {
		flags: 'a'
	})
	
	for (let i = 0; i < manualUrlArray.length; i++) {
		writeTo.write(`${manualUrlArray[i].subredditName} - ${manualUrlArray[i].url}\r\n`);

		if(manualUrlArray[i].type !== 'comment') {
			r.getSubmission(manualUrlArray[i].id).unsave();
		}else {
			r.getComment(manualUrlArray[i].id).unsave();
		}
	}
}

// Removes saves that are invalid (not in check.js) and writes the subreddit and URL to post or comment
function removeInvalidSaves(invalidPosts) {
	const writeTo = fs.createWriteStream('./urls/invalidPosts.txt', {
		flags: 'a'
	})

	console.log(`${BIG_BAR}\nRemoving invalid posts...\n${BIG_BAR}`);
	for (let i = 0; i < invalidPosts.length; i++) {
		writeTo.write(`${invalidPosts[i].subredditName} - ${invalidPosts[i].permalink}\r\n`);

		if(invalidPosts[i].type === 'comment') {
			r.getComment(invalidPosts[i].id).unsave();
		}else {
			r.getSubmission(invalidPosts[i].id).unsave();
		}
	}
}

//============================
// prompt functions
//============================

// Asks user for the amount of saves to fetch.
function setFetchLimitPrompt() {
	prompt.start();
	console.log(`${BIG_BAR}\nPlease enter a number from 1 to 100 to set the saves fetch limit.\n`);
	prompt.get(['Limit'], (err, resolve) => {
		if(err) throw err;

		// Fetch limit defaults to 10, and can only be from 1 - 100
		let fetchLimit = +resolve['Limit'];
		if(resolve['Limit'] === '') {
			console.log('Setting fetch limit to default value of 10');
			fetchLimit = 10;
		}else if(isNaN(fetchLimit)) {
			console.log('Invalid input, fetch limit set to 10');
			fetchLimit = 10;
		}else if(fetchLimit < 10) {
			console.log('Input is too small, fetch limit set to 10');
			fetchLimit = 10;
		}else if(fetchLimit > 100) {
			console.log('Input is too large, fetch limit set to 100');
			fetchLimit = 100;
		}else {
			console.log(`Fetch limit set to ${fetchLimit}`);
		}

		getSaves(fetchLimit);
	})
}

// Asks user if it should remove saves that have been downloaded, and those that can't be downloaded
function removeSavesPrompt(urlArray, manualUrlArray) {
	// Allows for multiple prompts
	const schema = {
		properties : {
			Downloadable : {type : 'string', required : true, allowEmpty : false},
			Undownloadable : {type : 'string', required : true, allowEmpty : false}
		}
	}

	prompt.start();
	console.log(`Unsave downloaded and undownloadable saves?`);
	prompt.get(schema, (err, resolve) => {
		if(err) throw err;

		if(['yes', 'y'].includes(resolve['Downloadable'])) {
			console.log(`\nRemoving saves...\n${BIG_BAR}`);
			
			removeDownloadedSaves(urlArray);
			if(['yes', 'y'].includes(resolve['Undownloadable'])) {
				removeUndownloadableSaves(manualUrlArray)
			}
		}else if(['no', 'n'].includes(resolve['Downloadable'])) {
			if(['yes', 'y'].includes(resolve['Undownloadable'])) {
				removeUndownloadableSaves(manualUrlArray)
			}else {
				console.log(`\nExiting script.\n${BIG_BAR}`);
			}
		}else {
			console.log('Response is invalid.\r\nyes : yes / y\r\nno : no / n\n');
			// repeats prompt for valid input
			removeSavesPrompt(urlArray, manualUrlArray);
		}
	})
}

// Prompt user if it should remove undownloadable saves and write them in invalidPosts.txt (use this if URL array is empty)
function removeUndownloadableSavesPrompt(manualUrlArray) {
	prompt.start();
	console.log(`Unsave undownloadable saves?`);
	prompt.get(['Undownloadable'], (err, resolve) => {
		if(err) throw err;

		if(['yes', 'y'].includes(resolve['Undownloadable'])) {
			removeUndownloadableSaves(manualUrlArray)
		}else if(['no', 'n'].includes(resolve['Undownloadable'])) {
			console.log(`\nExiting script.\n${BIG_BAR}`);
		}else {
			console.log('Response is invalid.\r\nyes : yes / y\r\nno : no / n\n');
			// repeats prompt for valid input
			removeUndownloadableSavesPrompt(manualUrlArray)
		}
	})
}

// Asks user if it should download saves
function startDownloadsPrompt(urlArray, manualUrlArray) {
	prompt.start();
	console.log(`Start downloads?`);
	prompt.get(['Choice'], (err, resolve) => {
		if(err) throw err;
		if(['yes', 'y'].includes(resolve['Choice'])) {
			downloadUrls(urlArray, manualUrlArray);
		}else if(['no', 'n'].includes(resolve['Choice'])) {
			console.log(`\nExiting script.\n${BIG_BAR}`);
		}else {
			console.log('Response is invalid.\r\nyes : yes / y\r\nno : no / n\n');
			// repeats prompt for valid input
			startDownloadsPrompt(urlArray, manualUrlArray);
		}
	})
}

// Asks user if it should download, remove invalid posts, or exit
function chooseOperationPrompt(filteredListing, firstTime = true) {
	prompt.start();
	if(firstTime) {
		console.log(
			'To download your saves, enter \"d".\nTo remove invalid saves, enter \"r".\nTo exit, enter \"e\"\n'
		);
	}
	prompt.get(['Choice'], (err, resolve) => {
		if(err) throw err;
		switch (resolve['Choice'].toLowerCase()) {
			case 'd':
				log(filteredListing.manualUrlArray, filteredListing.counter);
				startDownloadsPrompt(filteredListing.urlArray, filteredListing.manualUrlArray)
				break;
			case 'r':
				removeInvalidSaves(filteredListing.invalidPosts)
				break;
			case 'e':
				console.log(`\nExiting script\n${BIG_BAR}`);
				break;
			default:
				console.log(
					'Response is invalid.\n\nEnter \"d\" to download saves.\nEnter \"r\" to remove invalid saves.\nEnter \"e\" to exit.\n'
				);
			// repeats prompt for valid input
				chooseOperationPrompt(filteredListing, false);
				break;
		}
	})
}

setFetchLimitPrompt();