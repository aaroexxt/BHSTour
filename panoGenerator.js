/*

PanoGenerator.js
generates pano metadata JSON
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
	res.end(JSON.stringify(configData.panos));
});


console.log("server init");
if (typeof configData.serverPort == "undefined") {
	throw "Port undefined in configData";
}
app.listen(configData.serverPort, () => console.log(`server OK, port=${configData.serverPort}!`))

console.log("init end")