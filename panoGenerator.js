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

var PanoTitles = [];
var PanoMetas = [];
var PanoObjects = [];
var metadataPresent = false;
var metadataState = {
	titlesPresent: false,
	metasPresent: false,
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
					} else {
						console.log("Metadata file exists, reading");
						currentProgress.update(0.17);
						metadataPresent = true;
						fs.readFile(path.join(configData.panoDirectory,configData.panoMetadataDirectory), (err, data) => {
							if (err) {
								metadataPresent = false;
							} else {
								currentProgress.update(0.18);
								let JSONdata = JSON.parse(data);
								if (typeof JSONdata.PanoTitles == "undefined") {
									console.log("PanoTitles Undefined");
									metadataState.titlesPresent = false;
								} else {
									console.log("PanoTitles OK");
									metadataState.titlesPresent = true;
								}
								currentProgress.update(0.19);
								if (typeof JSONdata.PanoMetas == "undefined") {
									console.log("PanoTitles Undefined");
									metadataState.metasPresent = false;
								} else {
									console.log("PanoTitles OK");
									metadataState.metasPresent = true;
								}
								currentProgress.update(0.2);
								if (typeof JSONdata.PanoObjects == "undefined") {
									console.log("PanoTitles Undefined");
									metadataState.objectsPresent = false;
								} else {
									console.log("PanoTitles OK");
									metadataState.objectsPresent = true;
								}
							}
						})
					}
				})
				currentProgress.update(0.2);
				fs.readdir(configData.panoDirectory, (err, files) => {
					if (err) {
						throw err;
					} else {
						console.log(files);
					}
				})
			}
		})
	}
} catch(e) {
	throw "Error reading config: "+e;
}