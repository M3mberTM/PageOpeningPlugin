const {entrypoints} = window.require("uxp");


entrypoints.setup({

    // Object containing Panels
    panels: {

        "import": { // <- must match the manifest id for panel #1
            // Lifecycle events
            show(body) {
                let content = document.getElementById("import");
                body.appendChild(content);
            },
        },
        "export": { // <- must match the manifest id for panel #2
            // Lifecycle events
            show(body) {
                let content = document.getElementById("export");
                body.appendChild(content);
            },
        },
        "opening": { // <- must match the manifest id for panel #2
            // Lifecycle events
            show(body) {
                let content = document.getElementById("opening");
                body.appendChild(content);
            },
        }
    }
});