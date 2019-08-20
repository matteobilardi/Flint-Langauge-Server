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
const configuration = workspace.getConfiguration();
const flintpath: string = configuration.get('flintpath');
const flint_contract_analysis = flintpath + '/.build/debug/flint-ca';
const options_with_env = {env: {'FLINTPATH': flintpath}};

function getWebViewContentGas(gas_estimate_table: string) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gas Estimates</title>
</head>
<body>
    <h1> Contract Analysis: Gas Estimates</h1>
	  ${gas_estimate_table}
</body>
</html>`;	
}

function getWebviewContent(tsDiagramPath: vscode.Uri, caller_analysis: string, fvDiagram: vscode.Uri) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TypeState Diagram,</title>
</head>
<body>
	<h1> Contract Insights: </h1>
	<h2> Type-state Visualisation </h2>
	<img src="${tsDiagramPath}" width="300" />
	</br>
	<h2> Function Visualisation </h2>
	<img src="${fvDiagram}"/>
	${caller_analysis}
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
	return execFileSync(flint_contract_analysis, ["-t", sourceCode, fileName], options_with_env).toString();
}

function gen_vis_diagram(sourceCode: string, fileName: string) : string
{
	return execFileSync(flint_contract_analysis, ["-f", sourceCode, fileName], options_with_env).toString();
}

function analyse_callers_and_states_of_funcs(sourceCode: string, fileName: string) : string
{
	let res  = execFileSync(flint_contract_analysis, ["-c", sourceCode, fileName], options_with_env).toString();

	if (res.includes("ERROR")) {
		return "ERROR";
	}

	let caller_state_info = JSON.parse(res);

	let tableHeaderCaller = " <h2> Caller & State Analysis </h2> \
	  <table style=\"width:100%\" border=\"1\">\
	  <tr>\
		<th align=\"left\"> Caller </th>\
		<th align=\"left\"> Functions </th>\
	  </tr>\
	";

	let tableHeaderState = "\
	<table style=\"width:100%\" border=\"1\">\
	<tr>\
	  <th align=\"left\"> State </th>\
	  <th align=\"left\"> Functions </th>\
	</tr>\
	";

	let caller_analysis  = JSON.parse(caller_state_info["caller"]);

	let tableEntries = "";
	let callerTable = "";
	if (Object.keys(caller_analysis).length > 0) {
		for (let caller in caller_analysis) {
			let funcs = caller_analysis[caller].toString();
			let tableEntry = `<tr> <td> ${caller} </td> <td> ${funcs} </td>`;
			tableEntries += tableEntry;
		}

		callerTable = tableHeaderCaller	+ tableEntries + "</table> </br>";
	}
	
	let state_analysis = JSON.parse(caller_state_info["states"]);

	let stateTableEntries = "";
	let stateTable = "";
	if (Object.keys(state_analysis).length > 0) {
		for (let state in state_analysis) {
			let funcs = state_analysis[state].toString();
			let tableEntry = `<tr> <td> ${state} </td> <td> ${funcs} </td>`;
			stateTableEntries += tableEntry;
		}

		stateTable = tableHeaderState + stateTableEntries + "</table> </br>"; 
	}

	let anyPercent = "<h3> % of methods under any caller blocks: " + caller_state_info["anyPercent"] + "%</h3>";

	return callerTable + stateTable + anyPercent;
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

function create_vis_graph(sourceCode: string, extension_path: string): string {
			let graphCode = gen_vis_diagram(sourceCode, "not_used");
			if (graphCode.includes("ERROR")) {
				return "ERROR";
			}	
			let fileName = getRandom(1001, 2000).toString();
			let dotFilePath = path.join(extension_path, 'diagrams', "d" + fileName + ".dot");
			let pngFilePath = path.join(extension_path, 'diagrams', "p" + fileName + ".png");
			fs.writeFileSync(dotFilePath, graphCode);
			let s = execFileSync("dot", ["-Tpng", dotFilePath, "-o", pngFilePath]).toString();
			return pngFilePath;

}

function gas_estimate(sourceCode: string, fileName: string) : string {
	let json_estimates = execFileSync(flint_contract_analysis, ["-g", sourceCode, fileName], options_with_env).toString();

	json_estimates.trim();

	if (json_estimates.includes("ERROR")) {
		return "ERROR";
	}

	let tableHeaderEstimate = "\
	<table style=\"width:100%\" border=\"1\">\
	<tr>\
	  <th align=\"left\"> Function </th>\
	  <th align=\"left\"> Gas Estimate </th>\
	</tr>\
	";

	let gas_estimates = JSON.parse(json_estimates);

	let estimateTableEntries = "";

	for (let funcName in gas_estimates) {
			let gas_estimate = gas_estimates[funcName].toString();
			let tableEntry = `<tr> <td> ${funcName} </td> <td> ${gas_estimate} </td>`;
			estimateTableEntries += tableEntry;
	}

	estimateTableEntries += "</table> </br>";

	return tableHeaderEstimate + estimateTableEntries;
}

export function activate(context: ExtensionContext) {
	// clean up previous diagrams and then restart
	let dir = path.join(context.extensionPath, 'diagrams');
	cleanDiagramDir(dir);
	createDiagramDir(dir);


	context.subscriptions.push(
		vscode.commands.registerCommand('gasEstimate.estimate', () => {
				const panel = vscode.window.createWebviewPanel(
					'gasEstimate',
					'Gas Estimation',
					vscode.ViewColumn.Active
				);

				const srcCode = vscode.window.activeTextEditor.document.getText();
				const gas_estimate_html = gas_estimate(srcCode, "not_used");
				let html = "";
				if (gas_estimate_html === "ERROR") {
					html = getWebviewContentOnError();
				} else {
					html = getWebViewContentGas(gas_estimate_html);
				}

				panel.webview.html = html;
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('drawTypeState.draw', () => {
			const panel = vscode.window.createWebviewPanel(
				'typeState',
				'Typestate Diagram',
				vscode.ViewColumn.Active
			);

			const srcCode = vscode.window.activeTextEditor.document.getText();
			const call_analysis_html = analyse_callers_and_states_of_funcs(srcCode, "not_used");
			const file_name = create_type_state_graph(srcCode, context.extensionPath);
			const file_name_vis = create_vis_graph(srcCode, context.extensionPath);

			let html = "";

			if (file_name === "ERROR" || call_analysis_html === "ERROR") {
				html = getWebviewContentOnError();
			} else {
				const diskPath = vscode.Uri.file(file_name);
				const diagramSrc = diskPath.with({ scheme: 'vscode-resource' });
				const diskPath_v = vscode.Uri.file(file_name_vis);
				const fvSrc = diskPath_v.with({scheme: 'vscode-resource' });
				html = getWebviewContent(diagramSrc, call_analysis_html, fvSrc);
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
			configurationSection: 'flintpath',
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
