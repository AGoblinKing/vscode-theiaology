"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand("theiaology.editor", () => {
        //registerCustomEditorProvider("theiaology.editor");
        TheiaologyPanel.createOrShow(context.extensionUri);
    }), vscode.commands.registerCommand("theiaology.start", () => {
        TheiaologyPanel.createOrShow(context.extensionUri);
    }), vscode.commands.registerCommand("onUri", () => {
        TheiaologyPanel.createOrShow(context.extensionUri);
    }), vscode.commands.registerCommand("theiaology.startDev", () => {
        TheiaologyPanel.createOrShow(context.extensionUri, true);
    }));
    if (vscode.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode.window.registerWebviewPanelSerializer(TheiaologyPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel, state) {
                console.log(`Got state: ${state}`);
                // Reset the webview options so we use latest uri for `localResourceRoots`.
                webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
                TheiaologyPanel.revive(webviewPanel, context.extensionUri);
            },
        });
    }
}
exports.activate = activate;
function getWebviewOptions(extensionUri) {
    return {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
    };
}
/**
 * Manages cat coding webview panels
 */
class TheiaologyPanel {
    constructor(panel, extensionUri, isDev = false) {
        this._disposables = [];
        this.isDev = false;
        this.isDev = isDev;
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview's initial html content
        this._update(this.isDev);
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Update the content based on view changes
        this._panel.onDidChangeViewState((e) => {
            if (this._panel.visible) {
                this._update(this.isDev);
            }
        }, null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case "alert":
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this._disposables);
    }
    static createOrShow(extensionUri, isDev = false) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        if (TheiaologyPanel.currentPanel) {
            TheiaologyPanel.currentPanel.isDev = isDev;
            TheiaologyPanel.currentPanel._panel.reveal(column);
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(TheiaologyPanel.viewType, "Theiaology", column || vscode.ViewColumn.One, getWebviewOptions(extensionUri));
        TheiaologyPanel.currentPanel = new TheiaologyPanel(panel, extensionUri, isDev);
    }
    static revive(panel, extensionUri) {
        TheiaologyPanel.currentPanel = new TheiaologyPanel(panel, extensionUri);
    }
    async _update(isDev = false) {
        const url = isDev ? "http://localhost:10001" : "https://theiaology.com";
        this._panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Theiaology</title>
            <style>
                html, body { padding: 0; margin: 0; width: 100%; height: 100%; overflow: none;}

            </style>
        </head>
        <body>
        <iframe src="${url}" width="100%" height="100%" frameborder="0"></iframe>
        </body>
        </html>
    `;
    }
    dispose() {
        TheiaologyPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
TheiaologyPanel.viewType = "theiaology";
//# sourceMappingURL=extension.js.map