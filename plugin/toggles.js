function enableLeadingZeros(isChecked) {
    const leadingZerosDiv = document.getElementById("leadingZerosGroup");

    if (!isChecked) {

        leadingZerosDiv.classList.add("hidden");
    } else {

        leadingZerosDiv.classList.remove("hidden");
    }
}

function enableExport(isChecked) {
    const exportContent = document.getElementById("exportContent");
    const button = document.getElementById("btnExport");
    if (!isChecked) {
        exportContent.classList.add("hidden");
        button.disabled = true;
    } else {
        button.disabled = false;
        exportContent.classList.remove("hidden");
    }
}

function enableTextfield(isChecked, enabledContent) {
    const exportContent = document.getElementById(enabledContent);
    if (!isChecked) {
        exportContent.classList.add("hidden");

    } else {
        exportContent.classList.remove("hidden");
    }
}

//checkboxes
document.getElementById("exportClose").addEventListener("change", evt => {
    enableExport(evt.target.checked);
});
document.getElementById("leadingZeros").addEventListener("change", evt => {
    enableLeadingZeros(evt.target.checked)
});

//leadingZeroesSubmenu
document.getElementById("volumeLeadingRadio").addEventListener("change", evt => {
    enableTextfield(evt.target.checked, "volumeLeading")
});
document.getElementById("chapterLeadingGroup").addEventListener("change", evt => {
    enableTextfield(evt.target.checked, "chapterLeading")
});
document.getElementById("pageLeadingGroup").addEventListener("change", evt => {
    enableTextfield(evt.target.checked, "pageLeading")
});