/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import * as vscode from 'vscode';
import { execFileSync } from 'child_process';
const fs = require('fs');

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient';

let client: LanguageClient;
const flint_dev_path = "/Users/Zubair/Documents/Imperial/Thesis/Code/flint/.build/debug/flint-lsp";
const flint_contract_analysis = "/Users/Zubair/Documents/Imperial/Thesis/Code/flint/.build/debug/flint-ca";

function getWebviewContent(tsDiagramPath: vscode.Uri) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TypeState Diagram,</title>
</head>
<body>
    <h1> Contract Analysis: Type State Diagram </h1>
    <img src="${tsDiagramPath}" width="300" />
</body>
</html>`;
}

function getWebviewContentOnError() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TypeState Diagram,</title>
</head>
<body>
	<h1> Contract does not compile thus analysis is not possible. Please fix the issues with the contract and try again </h1>	
</body>
</html>`;
}

function gen_typestate_diagram(sourceCode: string, fileName: string) : string
{
	return execFileSync(flint_contract_analysis, ["-t", sourceCode, fileName]).toString();
}

function getRandom(max: number, min: number) : number {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function create_type_state_graph(sourceCode: string, extension_path: string): string
{
			let graphCode = gen_typestate_diagram(sourceCode, "not_used");
			if (graphCode.includes("ERROR")) {
				return "ERROR";
			}	
			let fileName = getRandom(0, 1000).toString();
			let dotFilePath = path.join(extension_path, 'diagrams', "d" + fileName + ".dot");
			let pngFilePath = path.join(extension_path, 'diagrams', "p" + fileName + ".png");
			fs.writeFileSync(dotFilePath, graphCode);
			let s = execFileSync("dot", ["-Tpng", dotFilePath, "-o", pngFilePath]).toString();
			return pngFilePath;
}

export function activate(context: ExtensionContext) {
	// clean up previous diagrams and then restart
	let dir = path.join(context.extensionPath, 'diagrams');
	cleanDiagramDir(dir);
	createDiagramDir(dir);

	context.subscriptions.push(
		vscode.commands.registerCommand('drawTypeState.draw', () => {
			const panel = vscode.window.createWebviewPanel(
				'typeState',
				'Typestate Diagram',
				vscode.ViewColumn.Active
			);

			const srcCode = vscode.window.activeTextEditor.document.getText();
			const file_name = create_type_state_graph(srcCode, context.extensionPath);
			let html = "";
			if (file_name == "ERROR") {
				html = getWebviewContentOnError();
			} else {
				const diskPath = vscode.Uri.file(file_name);
				const diagramSrc = diskPath.with({ scheme: 'vscode-resource' });
				html = getWebviewContent(diagramSrc);
			}

			panel.webview.html = html;
		})
	);

	let serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'flint' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);


	// Start the client. This will also launch the server
	client.start();
}

function createDiagramDir(diagramsDir: string) {
	if (!fs.existsSync(diagramsDir)) {
		fs.mkdirSync(diagramsDir);
	}
}

function cleanDiagramDir(diagramPath: string) {
	if (fs.existsSync(diagramPath)) {
		fs.readdirSync(diagramPath).forEach((file) => {
			fs.unlinkSync(path.join(diagramPath, file));	
		});
		fs.rmdirSync(diagramPath);
	}
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
