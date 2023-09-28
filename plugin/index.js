// Some main variables
let exportPath = "";
const textTrimFromBack = 30;
let currentFilePath = "";
let workFolder = new Map();
let currIndex = 0;
let currPageNum = -1;

async function selectFolder() { //selecting a folder
    console.log("Selecting a folder")

    const fslocal = window.require("uxp").storage.localFileSystem;
    const folder = await fslocal.getFolder();
    const token = await fslocal.createPersistentToken(folder);

    const folderObject = {
        name: folder.name, path: folder.nativePath, token: token, entry: folder,
    };
    const finalPath = folderObject.path;
    exportPath = finalPath;
    document.getElementById("exportFolderPath").innerHTML = "..." + finalPath.substring(finalPath.length - textTrimFromBack);
}


async function selectFile() {
    console.log("Select a File")
    const app = window.require("photoshop").app;
    const fs = window.require("uxp").storage.localFileSystem;
    const file = await fs.getFileForOpening(); //get the file
    console.log(file.isEntry);
    const token = await fs.createPersistentToken(file);

    const basename = path.basename(file.nativePath);
    const folder = file.nativePath.substring(0, file.nativePath.indexOf(basename) - 1);
    console.log(`folder path ${folder}`); //trying to get the folder with the files

    try {
        const document = await app.open(file); //opening the file in PS
        console.log("File opened!");
    } catch (e) {
        console.log(e);
    }
    await readFolder(folder); //getting all the other files from the folder

    const fileObject = {
        name: file.name, path: file.nativePath, token: token, entry: file,
    };

    currIndex = Array.from(workFolder.keys()).indexOf(fileObject.name);
    await getPageNum();
    currentFilePath = fileObject.path;
    document.getElementById("startFilePath").innerHTML = "..." + currentFilePath.substring(currentFilePath.length - textTrimFromBack);

}

async function updatePageInfo() { //gets the current page information from all the data given
    const manualPageNum = document.getElementById("manualPageNum").value;
    if (manualPageNum != "") {
        console.log(`Manual change of number to ${manualPageNum}`)
        currPageNum = manualPageNum;
        document.getElementById("manualPageNum").value = null;
    }
    document.getElementById("pageNum").innerHTML = `Page num: ${currPageNum}`;
    if (document.getElementById("seriesName").value !== "" && document.getElementById("chapterNum").value != "") {
        document.getElementById("exportName").innerHTML = `Export name: ${getExportFileName()}`;
    } else {
        await showAlert("No series name/chapter number given!");
    }
}

async function getPageNum() { //tries to get the current page number based on the differences between file names
    console.log("getPageNum")
    const currFile = Array.from(workFolder.keys())[currIndex];
    const nextFile = Array.from(workFolder.keys())[currIndex + 1];
    console.log(currFile);

    const regex = /\d+/g;
    const currMatches = currFile.match(regex);
    const nextMatches = nextFile.match(regex);
    let change = [];
    let numMatches = 0;
    for (let i = 0; i < currMatches.length; i++) {
        let currNum = parseInt(currMatches[i]);
        let nextNum = parseInt(nextMatches[i]);
        if (currNum != nextNum) {
            change[numMatches] = [currNum, nextNum];
            numMatches++;
        }
    }

    if (change.length > 1) {
        await showAlert("There seem to be multiple numbers that could be interpreted as page Num. Please input it manually!")
    } else if (change.length == 0) {
        await showAlert("No page number could be found. Please input it manually!")
    } else {
        currPageNum = change[0][0];
        console.log(`current page num: ${currPageNum}`);
    }
}

async function openNextFile(reverse) {
    console.log("next file");

    const app = require("photoshop").app;
    const doc = app.activeDocument;

    if (document.getElementById("exportClose").checked && exportPath !== "") {
        console.log("inside selection statement");
        await exportFile();
    }

    let entry;
    if (reverse) {
        if (currIndex - 1 >= 0) {
            currIndex--;
            currPageNum--;
            entry = workFolder.get(Array.from(workFolder.keys())[currIndex]);
        } else {
            showAlert("No page before this!");
        }
    } else {
        if (currIndex + 1 < Array.from(workFolder.keys()).length) {
            currIndex++;
            currPageNum++;
            entry = workFolder.get(Array.from(workFolder.keys())[currIndex]);
        } else {
            showAlert("No page after this!")
        }

    }

    await require('photoshop').core.executeAsModal(openFile.bind(null, entry));
    try {
        closeFile(doc);
    } catch (e) {
        await showAlert("Error occurred while trying to close the file!");
        await showAlert(e);
    }


}

async function fileExists(filePath) {
    console.log("got here")
    const fs = require('uxp').storage.localFileSystem;
    try {
        const file = await fs.getEntryWithUrl(`file:\\${filePath}`);
    } catch (e) {
        await showAlert(e)
        return false;
    }
    return true;
}

async function openFile(entry) {
    try {
        const app = require("photoshop").app;
        if (entry.isEntry) {
            const document = await app.open(entry);
        } else {
            console.log("the file is not an entry")
        }
    } catch (e) {
        await showAlert("An error occurred when opening a file!")
        await showAlert(e);
    }
}


async function pathToEntry(filePath) { //converts the filepath to an entry which is then used to open up the files
    const fs = require('uxp').storage.localFileSystem;
    try {
        const file = await fs.getEntryWithUrl(filePath);
        return file;
    } catch (e) {
        await showAlert(`An error occurred while making the entry! ${filePath}`);
        await showAlert(e);

    }
}


async function exportFile() {
    console.log("Exporting!")
    const fileType = document.getElementById("fileDropdown").selectedIndex;
    if (document.getElementById("seriesName").value !== "" && document.getElementById("chapterNum").value !== "" && fileType !== -1) {
        const expFileName = getExportFileName();
        const fs = require('uxp').storage.localFileSystem;
        const expFolderEntry = await pathToEntry(exportPath);
        let entry;
        try {
            switch (fileType) {
                case 0:
                    entry = await expFolderEntry.createFile(`${expFileName}.psd`, {overwrite: true});
                    await require('photoshop').core.executeAsModal(savePSD.bind(null, entry));
                    break;
                case 1:
                    entry = await expFolderEntry.createFile(`${expFileName}.png`, {overwrite: true});
                    await require('photoshop').core.executeAsModal(savePNG.bind(null, entry));
                    break;
                case 2:
                    entry = await expFolderEntry.createFile(`${expFileName}.jpg`, {overwrite: true});
                    await require('photoshop').core.executeAsModal(saveJPG.bind(null, entry));
                    break;
            }
        } catch (e) {
            await showAlert("An error occurred while exporting!");
            await showAlert(e);
        }
    } else {
        await showAlert("No series name/chapter number/file type given!");
    }
}


async function savePNG(entry) {
    console.log("Saving as png");
    const app = require('photoshop').app;
    const doc = app.activeDocument;
    try {
        await doc.saveAs.png(entry);

    } catch (e) {
        console.log(e);
    }

}

async function saveJPG(entry) {
    console.log("Saving as jpg");
    const app = require('photoshop').app;
    const doc = app.activeDocument;
    try {
        await doc.saveAs.jpg(entry, {quality: 12}, true);

    } catch (e) {
        console.log(e);
    }
}

async function savePSD(entry) {
    console.log("Saving as psd");
    const app = require('photoshop').app;
    const doc = app.activeDocument;
    try {
        await doc.saveAs.psd(entry);

    } catch (e) {
        console.log(e);
    }

}


function getExportFileName() {
    //The naming: Name of the Series initial Vol. number Chap Num, Page num
    //Example: SCK Vol.3 Ch.10 001
    const seriesName = document.getElementById("seriesName").value;
    const chapterNum = parseInt(document.getElementById("chapterNum").value);
    const volumeNum = document.getElementById("volumeNum").value;
    const spacesExchange = document.getElementById("spacesExchange").value;
    const volumeLeading = document.getElementById("volumeLeading").value;
    const chapterLeading = document.getElementById("chapterLeading").value;
    const pageLeading = document.getElementById("pageLeading").value;

    let finalName = "";
    console.log(`Series name: ${seriesName}`);
    const seriesNameWords = seriesName.split(" "); //get the intials of the series and put them into the final string
    for (let i = 0; i < seriesNameWords.length; i++) {
        finalName += seriesNameWords[i].charAt(0);
    }
    if (volumeNum !== "") {
        if (volumeLeading === "" || !document.getElementById("volumeLeadingRadio").checked) {
            finalName += ` Vol.${volumeNum}`;
        } else {
            finalName += ` Vol.${addLeadingZeros(volumeNum, parseInt(volumeLeading))}`;
        }
    }
    if (chapterLeading === "" || !document.getElementById("chapterLeadingGroup").checked) {
        finalName += ` Chap.${chapterNum}`;
    } else {
        finalName += ` Chap.${addLeadingZeros(chapterNum, parseInt(chapterLeading))}`;
    }
    if (pageLeading === "" || !document.getElementById("pageLeadingGroup").checked) {
        finalName += ` ${currPageNum}`;
    } else {
        finalName += ` ${addLeadingZeros(currPageNum, parseInt(pageLeading))}`;
    }
    if (spacesExchange !== "") {
        finalName = finalName.replaceAll(" ", spacesExchange);
    }
    console.log(`Export name: ${finalName}`);
    return finalName;
}


function addLeadingZeros(number, size) {
    let text = "0000000000000" + number;
    return text.substring(text.length - size - 1);
}

function closeFile(document) {
    console.log("closeFile");
    try {
        document.close();
    } catch (e) {
        console.log(e);
    }
}

async function runModal(command) {
    try {
        if (command == "start") {
            await require('photoshop').core.executeAsModal(selectFile);
        } else if (command == "next") {
            if (currentFilePath != "" && currentFilePath != null) {
                await require('photoshop').core.executeAsModal(openNextFile.bind(null, false));
            } else {
                showAlert("You have not selected any starting file");
            }

        } else if (command == "previous") {
            if (currentFilePath != "" && currentFilePath != null) {
                await require('photoshop').core.executeAsModal(openNextFile.bind(null, true));
            } else {
                showAlert("You have not selected any starting file");
            }

        } else {
            console.log("None of the commands were fulfilled")
        }
    } catch (e) {
        if (e.number == 9) {
            await showAlert("executeAsModal was rejected (some other plugin is currently inside a modal scope)");
        } else {
            // This case is hit if the targetFunction throws an exception
        }
    }
}

async function showAlert(message) {
    const app = require('photoshop').app;
    await app.showAlert(message);
}

async function readFolder(folderPath) { //gets all the files in the folder with the starting file for easy switching between pages
    console.log("reading folder!")
    const fs = require('fs');
    try {
        let paths = fs.readdirSync(`file:\\${folderPath}`);
        let fileNames = []
        for (let i = 0; i < paths.length; i++) {
            fileNames[i] = paths[i];
        }

        fileNames.sort(sorting);

        for (const fileName of fileNames) {
            workFolder.set(fileName, await pathToEntry(folderPath + "\\" + fileName));
        }
        console.log(workFolder);


    } catch (e) {
        await showAlert("Error occurred while trying to get the folder files!");
        await showAlert(e);
    }
}

function sorting(a, b) { //sorting function
    const smallerLength = a.length < b.length ? a.length : b.length;
    const chosenLength = a.length < b.length ? a : b;
    let offsetA = 0;
    let offsetB = 0;
    for (let i = 0; i < smallerLength; i++) {
        let currA = a.charAt(i + offsetA);
        let currB = b.charAt(i + offsetB);

        if (currA == "" || currB == "") {
            break;
        }

        let aIsNumber = isNumber(currA);
        let bIsNumber = isNumber(currB);
        //begins with comparing the same symbols
        //different algorithm for numbers and letters
        if (aIsNumber && bIsNumber) {
            let numberResult = numberComparison(a.substring(i), b.substring(i));
            if (numberResult[0] != 0) {
                return numberResult[0];
            }

            if (numberResult[1] > 0) {
                if (numberResult[3] == -1) {
                    offsetA += numberResult[1];
                } else {
                    offsetB += numberResult[1];
                }
            }

            i += numberResult[2];
        } else if (!aIsNumber && !bIsNumber) {
            if (currA != currB) {
                return currA.localeCompare(currB);
            }
        } else {
            if (aIsNumber) {
                return -1;
            } else {
                return 1;
            }
        }

    }
    if (chosenLength == a) {
        return -1;
    } else {
        return 1;
    }
    return 0;
}

function numberComparison(a, b) {
//get the number first
    const aNumber = /\d+/.exec(a)[0];
    const bNumber = /\d+/.exec(b)[0];
    const aInt = parseInt(aNumber);
    const bInt = parseInt(bNumber);
    let smallerLength = aNumber.length;
    let offsetParam;
    if (aNumber.length < bNumber.length) {
        smallerLength = aNumber.length;
        offsetParam = -1;
    } else if (bNumber.length < aNumber.length) {
        smallerLength = bNumber.length;
        offsetParam = 1;
    } else {
        smallerLength = aNumber.length;
        offsetParam = 1;
    }
    if (aInt == bInt) {
        return [0, Math.abs(aNumber - bNumber), smallerLength, offsetParam]; //first param is the equal, second is the offset, third is the length to not put the offset on
    }
    if (aInt < bInt) {
        return [-1, 0, 0];
    } else {
        return [1, 0, 0];
    }
}

function isNumber(char) {
    const pattern = /\d/;
    return pattern.test(char);

}


//buttons
document.getElementById("btnExport").addEventListener("click", selectFolder.bind(null, false));
document.getElementById("importFile").addEventListener("click", runModal.bind(null, "start"));
document.getElementById("nextFile").addEventListener("click", runModal.bind(null, "next"));
document.getElementById("previousFile").addEventListener("click", runModal.bind(null, "previous"));
document.getElementById("getExportName").addEventListener("click", updatePageInfo);
