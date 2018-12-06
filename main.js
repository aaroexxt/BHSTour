/*

BHS Virtual Tour Application

For Architecture Class, Period 5
Copyright Aaron Becker


WIN COMMANDS:

net use X: \\bhs-nad\home\students\21BeckerA00
cd H:\BHSTour\
node main.js

to fix npm install dirs
cd H:\
mkdir NPMGlobal
npm config set prefix 'H:\NPMGlobal'
*/


console.log("Aaron's Tour Application - init begin");

console.log("1/3: Requiring stuff");
const fs = require('fs');
const express = require('express');
const path = require('path');

console.log("2/3: Reading configs");
try {
	var configData = fs.readFileSync("config.json", "utf8");
	configData = JSON.parse(configData);
	console.log("configData: "+JSON.stringify(configData));
	console.log("Reading metadata...");
	var panoMetadata = fs.readFileSync(path.join(__dirname,configData.panoDirectory,configData.panoMetadataDirectory));
	panoMetadata = JSON.parse(panoMetadata);
	console.log("configData: "+JSON.stringify(panoMetadata));
} catch(e) {
	throw "Error reading config: "+e;
}
console.log("3/3: Initializing routes and express");
const app = express();
app.use("/static",express.static(path.join(__dirname, configData.assetsDirectory))); //config static
console.log("routes init");

app.get('/', (req, res) => {
	console.log("cli request");
	fs.readFile(configData.frontendFile, (error, buffer) => {
		if (error) {
			res.end("Couldn't find file: "+configData.frontendFile);
		} else {
			res.end(buffer);
		}
	});
});
app.get('/panoramaData', (req, res) => {
	console.log("cli request: pano");
	res.end(JSON.stringify(panoMetadata));
});


console.log("server init");
if (typeof configData.serverPort == "undefined") {
	throw "Port undefined in configData";
}
app.listen(configData.serverPort, () => console.log(`server OK, port=${configData.serverPort}!`))

console.log("init end")