# Saves Downloader
A node.js command line program for downloading your saved posts in reddit

Currently, it only supports images. Videos require the JSON of the post itself(I think), gallery URLs don't allow you to download it, and comments can sometime contain URLs that don't point to images, causing the program to stop. I've also only tested this on windows 10, so I'm not sure if it will work on other platforms.

## Installing
First, you will need to have node and npm installed. Go to [Node.js download page](https://nodejs.org/en/download/) and download node. The package includes npm too, so all you have to do is run the node installer. Verify that you have downloaded node correctly by opening command prompt and entering `node -v` into the console.

Once you have node installed, download the program by going under the releases tab. Unzip it, then navigate to the folder with `cd "File path to program files"`. Use [this](https://www.howtogeek.com/659411/how-to-change-directories-in-command-prompt-on-windows-10/) for windows, [this](https://www.macworld.com/article/221277/master-the-command-line-navigating-files-and-folders.html) if you are on Mac. Once you have navigated to the folder, enter `npm install` to download the dependecies required. Once you have done that, you can run the program now. The only thing you'll need to do is to enter your username, password, and client ID and secret.

## Getting your client ID and secret
First, go to <https://www.reddit.com/prefs/apps> and click create app. It will then ask for the following-

> name - Enter whatever you want, it doesn't matter  
> web app, installed app, or script - Click script, as this will only run on command prompt  
> description - You can leave this empty  
> about url - You can leave this empty  
> redirect url - Set this to https://www.reddit.com  

After filling it out, it will show up under **developed applications**. To get the client ID, copy the string beside the icon (or under the words "personal use script"). To get the client secret, click on edit then copy the string beside **secret**.

## Entering your user credentials to the program
Go to the program folder and and open `main.js` with a text editor such as notepad or VSCode. Then, find the area to put your credentials. It will look like this:
```javascript
const r = new snoowrap({
	userAgent : 'windows:savesImageDownloader:v1.0.0 (by u/clikuki)',
	clientId : 'client ID here',
	clientSecret : 'client secret here',
	username : 'username here',
	password : 'password here'
});
```
Replace the strings between the single quotes with their respective information, Then save.

## Adding allowed subreddits
To add subreddits or profiles the program should check for in your saves, go to the program folder and open `check.js` with a text editor such as notepad or VSCode. You should see this:
```javascript
exports.subredditsAndProfiles = [];
```
Put your subreddits in lowercase between the square brackets inside single or double quotations. Then separate the subreddits with commas. It should look something like this:
```javascript
exports.subredditsAndProfiles = ['pic', 'images'];
```
To add profiles, do the same but with u_ preceding it. It should look something like this:
```javascript
exports.subredditsAndProfiles = ['pic', 'images','u_clikuki','u_randomuser1234'];
```
After you have finished, save the file.

## Running the program
To run it, open command prompt, navigate to the folder with `cd "File path to program files"`. Use [this](https://www.howtogeek.com/659411/how-to-change-directories-in-command-prompt-on-windows-10/) for windows, [this](https://www.macworld.com/article/221277/master-the-command-line-navigating-files-and-folders.html) if you are on Mac. Then enter `node main`. You should see a prompt appear on the terminal. Follow the steps, and it should work.
