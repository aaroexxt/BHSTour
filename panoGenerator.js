/*

PanoGenerator.js
generates pano metadata JSON
*/


console.log("init begin");

console.log("requiring stuff");
const fs = require('fs');
const path = require('path');
const singleLineLog = require('single-line-log').stdout; //single line logging for progressBar
const colors = require('colors');
const windowPlugin = require('window-size');

//ProgressBar code from CarOS

function progressBar(options) {
    var windowSize = windowPlugin.get();
    
    if (typeof options != "object") {
        options = {
            startPercent: 0,
            task: "Doing a task: ",
            showETA: false,
            updateOnConstruct: true
        }
    } else {
        if (typeof options.startPercent == "undefined") {
            options.startPercent = 0;
        }
        if (typeof options.task == "undefined") {
            options.task = "Doing a task: ";
        } else {
            options.task = options.task+": ";
        }
        if (typeof options.showETA !== "boolean") {
            options.showETA = false;
        }
        if (typeof options.updateOnConstruct !== "boolean") {
        	options.updateOnConstruct = true;
        }
    }
    if (options.task.length+9 > windowSize.width) {
        options.task = options.task.substring(0,windowSize.width-9);
    }

    this.update = (newPercent, eta) => {
        var windowSize = windowPlugin.get(); //inefficient but fine

        if (newPercent > 1) {
            newPercent = 1;
        }
        if (newPercent < 0) {
            newPercent = 0;
        }
        if (eta && options.showETA) {
            var chars = Math.round((windowSize.width-options.task.length-11-eta.length)*newPercent);
        } else {
            var chars = Math.round((windowSize.width-options.task.length-9)*newPercent);
        }
        
        var str = colors.red(options.task)+"[";
        var hashStr = "";
        for (var i=0; i<chars; i++) {
            //hashStr+="█";
            hashStr+="#";
        }
        str+=colors.grey(hashStr);
        if (eta && options.showETA) {
            str+=("]> ")+colors.green(String(Math.round(newPercent*100)+"%, "+eta));
        } else {
            str+=("]> ")+colors.green(String(Math.round(newPercent*100)+"%"));
        }
        singleLineLog(str);
    }

    if (options.updateOnConstruct) {
    	this.update(options.startPercent);
    }
}
const currentProgress = new progressBar({
	//updateOnConstruct: false
	startPercent: 0.1,
	task: "MG progress"
});
const debugMessages = false;
const originalConsoleLog=  console.log;
console.log = function() {
	for (var i=0; i<arguments.length; i++) {
		arguments[i] = "\n"+arguments[i];
	}
	originalConsoleLog.apply(null, arguments)
}

//Pano State Tracking

var PanoObjects = [];
var metadataPresent = false;
var metadataState = {
	objectsPresent: false
};

//MetadataGenerator code

if (debugMessages) {console.log("pano metadata generator ready - finding files");}
try {
	var configData = fs.readFileSync("config.json", "utf8");
	configData = JSON.parse(configData);
	//console.log("configData: "+JSON.stringify(configData));
	if (typeof configData.panoDirectory == "undefined") {
		throw "panoDirectory undefined";
	} else if (typeof configData.panoMetadataDirectory == "undefined") {
		throw "panoMetadataDirectory undefined";
	} else {
		if (debugMessages) {console.log("checking if pano directory is ok...");}
		currentProgress.update(0.15);
		fs.stat(configData.panoDirectory, (err, stats) => {
			if (err) {
				throw err;
			} else {
				if (debugMessages) {console.log('Directory OK');}
				currentProgress.update(0.16);
				fs.stat(path.join(configData.panoDirectory,configData.panoMetadataDirectory), (err, stats) => {
					if (err) {
						console.log("Metadata file doesn't exist");
						metadataPresent = false;
						updateMetadata();
					} else {
						console.log("Metadata file exists, reading");
						currentProgress.update(0.17);
						metadataPresent = true;
						fs.readFile(path.join(configData.panoDirectory,configData.panoMetadataDirectory), (err, data) => {
							if (err) {
								metadataPresent = false;
								updateMetadata();
							} else {
								currentProgress.update(0.18);
								try {
									let JSONdata = JSON.parse(data);
									currentProgress.update(0.2);
									if (typeof JSONdata.PanoObjects == "undefined") {
										console.log("PanoObjects Undefined");
										console.log("Deleting metadata file because it's useless...");
										fs.unlink(path.join(configData.panoDirectory,configData.panoMetadataDirectory), (err) => {
											if (err) {
												throw "Error unlinking invalid metadata file: "+err;
											}
										})
										metadataState.objectsPresent = false;
										metadataPresent = false;
									} else {
										console.log("PanoObjects OK");
										metadataState.objectsPresent = true;
									}
								} catch(e) {
									console.warn("Error parsing metadata file, it's invalid. Deleting");
									fs.unlink(path.join(configData.panoDirectory,configData.panoMetadataDirectory), (err) => {
										if (err) {
											throw "Error unlinking invalid metadata file: "+err;
										}
									})
									metadataState.objectsPresent = false;
									metadataPresent = false;
								}
								updateMetadata();
							}
						})
					}
				})
			}
		})
	}

	function updateMetadata() {
		currentProgress.update(0.2);
		fs.readdir(configData.panoDirectory, (err, files) => {
			if (err) {
				throw err;
			} else {
				console.log("Compiling metadata...");
				var currentPercent = 0.2;
				var percentPerFile = (currentPercent+0.6)/files.length; //will go to 0.8
				
				new Promise( (resolve, reject) => {
					console.log("Inside promise");
					function fileParsedHandler(index) {
						//console.log("proc file "+index+"fname "+files[index])
						if (metadataState.objectsPresent && metadataPresent) {
							let metadataPresent = false;
							for (var i=0; i<PanoObjects.length; i++) {
								if (PanoObjects[i].path.toLowerCase() == files[index].toLowerCase()) {
									metadataPresent = true;
								}
							}
							if (!metadataPresent) { //not found in existing data
								PanoObjects.push({
									metadata: "",
									index: index,
									path: files[index].toLowerCase(),
									absolutePath: path.join(__dirname,configData.panoDirectory,files[index].toLowerCase())
								})
							}
						} else {
							PanoObjects.push({
								metadata: "",
								index: index,
								path: files[index].toLowerCase(),
								absolutePath: path.join(__dirname,configData.panoDirectory,files[index].toLowerCase())
							})
						}
						if (index >= files.length-1) {
							resolve();
						} else {
							currentPercent+=percentPerFile;
							currentProgress.update(currentPercent);
							fileParsedHandler(index+1);
						}
					}
					fileParsedHandler(0); //start handler
				})
				.then( () => {
					console.log("Finished compiling metadata, wrapping & writing file...");
					currentProgress.update(0.9);
					let stringifiedData = JSON.stringify(PanoObjects); //now updated panoObjects
					fs.writeFile(path.join(__dirname,configData.panoDirectory,configData.panoMetadataDirectory), stringifiedData, err => {
						if (err) {
							console.log("Dumping JSON data...");
							console.log(stringifiedData);
							throw "Error writing file: "+err;
						}
					})
					currentProgress.update(1);
					console.log("Done.");
				})	

				

			}
		})
	}
} catch(e) {
	throw "Error reading config: "+e;
}