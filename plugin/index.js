// Some main variables
let importPath = "";
let exportPath = "";
const textTrimFromBack = 30;
let startFilePath = "";
let currentFile = "";



async function selectFolder() {
    console.log("Selecting a folder")
    const app = window.require("photoshop").app;

    const fslocal = window.require("uxp").storage.localFileSystem;
    const folder = await fslocal.getFolder();
    const token = await fslocal.createPersistentToken(folder);

    const folderObject = {
        name: folder.name,
        path: folder.nativePath,
        token: token,
        entry: folder,
    };
    const finalPath = folderObject.path;
    exportPath = finalPath;
    document.getElementById("exportFolderPath").innerHTML = "..." + finalPath.substring(finalPath.length - textTrimFromBack);
}


async function selectFile() {

    console.log("Select a File")
    const app = window.require("photoshop").app;

    const fs = window.require("uxp").storage.localFileSystem;
    const file = await fs.getFileForOpening();
    console.log(file.isEntry);
    const token = await fs.createPersistentToken(file);
    try {
        const document = await app.open(file);
    } catch (e) {
        console.log(e);
    }
    console.log("File opened!")

    const fileObject = {
        name: file.name,
        path: file.nativePath,
        token: token,
        entry: file,
    };

    startFilePath = fileObject.path;
    currentFile = startFilePath;
    document.getElementById("startFilePath").innerHTML = "..." + startFilePath.substring(startFilePath.length - textTrimFromBack);

}

async function nextFile(reverse) {
    console.log("next file");
    const currFileName = path.basename(currentFile); //gets the name of the file without folders
    const extension = currFileName.substring(currFileName.indexOf("."), currFileName.length);
    const currFileNoExt = currFileName.substring(0, currFileName.indexOf(".")); //removes the extension
    const matches = currFileNoExt.match("\\d+"); //gets all numbers from the file name
    let pageNum = matches[matches.length - 1]; //gets the page numbers
    const isLeadingZeroes = hasLeadingZeroes(pageNum); //checks if the number starts with zeroes
    let zeroesIndex = -1; //if value is -1, it doens't have leading zeroes
    if (isLeadingZeroes) {
        zeroesIndex = pageNum.length; //checks how long the number was with the leading zeroes
        let numStart = 1;
        while (pageNum.charAt(numStart) == '0') {
            numStart++;
        }
        pageNum = pageNum.substring(numStart, pageNum.length); //getting rid of leading zeroes
    }
    let nextPage;
    if (reverse) {
        nextPage = (parseInt(pageNum) -1 ).toString();
    } else {
        nextPage = (parseInt(pageNum) + 1).toString();
    }

    if (isLeadingZeroes) {
        while (nextPage.length != zeroesIndex) {
            nextPage = "0" + nextPage;
        }
    }
    nextPage += extension;
    let nextFilePath = currentFile.replace(currFileName, nextPage);
    if (await fileExists(nextFilePath)) {
        //open the new file
        console.log(nextFilePath);
        await require('photoshop').core.executeAsModal(openFile.bind(null, nextFilePath));
        currentFile = nextFilePath;
    }

}

function hasLeadingZeroes (pageNumber) {
    let hasZeroes = true;
    hasZeroes = hasZeroes && pageNumber.charAt(0) == '0';
    hasZeroes = hasZeroes && pageNumber.length > 1;
    return hasZeroes;
}

//TODO exporting function
async function exportFile() {
    const seriesName = document.getElementById("seriesName").innerHTML.split(" ");
    const volumeNum = document.getElementById("volumeNum").innerHTML;
    const chapterNum = document.getElementById("chapterNum").innerHTML;
// initial Of series Vol number Ch number pageNum
    let seriesInitials = "";
    for (let i = 0; i < seriesName.length; i++) {
        seriesInitials += seriesName[i].charAt(0);
    }
    const fileObject = {
        name: path.baseName(currentFile)
    }

    return false;
}

//TODO adding leading zeroes to the exported document
function addLeadingZeros() {

}

//TODO checking if the file exists before trying to open it
async function fileExists (filePath) {
    console.log("got here")
    const fs = require('uxp').storage.localFileSystem;
    try {
    const file = await fs.getEntryWithUrl(`file:\\${filePath}`);
    } catch (e) {
        showAlert(e)
        return false;
    }
        return true;

}

async function openFile(filePath) {
    try {
        const app = require("photoshop").app;
        const fs = require('uxp').storage.localFileSystem;
        const file = await fs.getEntryWithUrl(`file:\\${filePath}`);
        const document = await app.open(file);
    } catch (e) {
        console.log(e);
    }
}

async function runModal(command) {
    try {
        if (command == "start") {
            await require('photoshop').core.executeAsModal(selectFile);
        } else if (command == "next") {
            await require('photoshop').core.executeAsModal(nextFile(false));
        } else if (command == "previous") {
            await require('photoshop').core.executeAsModal(nextFile(true));
        } else {
            console.log("None of the commands were fulfilled")
        }
    } catch (e) {
        if (e.number == 9) {
            showAlert("executeAsModal was rejected (some other plugin is currently inside a modal scope)");
        } else {
            // This case is hit if the targetFunction throws an exception
        }
    }


}

async function showAlert(message) {
    const app = require('photoshop').app;
    await app.showAlert(message);
}

//button for getting folder paths
document.getElementById("btnExport").addEventListener("click", selectFolder.bind(null, false));
document.getElementById("importFile").addEventListener("click", runModal.bind(null, "start"));
document.getElementById("nextFile").addEventListener("click", runModal.bind(null, "next"));
document.getElementById("previousFile").addEventListener("click", runModal.bind(null, "previous"));

