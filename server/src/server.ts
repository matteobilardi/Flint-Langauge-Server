/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
	createConnection,
	TextDocuments,
	TextDocument,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	CancellationToken,
	Hover,
	HoverRequest,
	RenameParams,
	WorkspaceEdit
} from 'vscode-languageserver';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();

let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we will fall back using global settings
	hasDiagnosticRelatedInformationCapability =
		!!(capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation);

	return {
		capabilities: {
			// syncKind is all about how u shud sync with the language server
			// whenever a change happens
			textDocumentSync: documents.syncKind,
			// Tell the client that the server supports code completion
			completionProvider: {
				resolveProvider: false,
				triggerCharacters: ["."]
			},
			hoverProvider : true
		}
	};
});

const {exec, execFile} = require('child_process');

function convertFlintToDiag(LSPDiag: Object) : Diagnostic
{
	
	let diagnosic: Diagnostic = {
		severity: DiagnosticSeverity.Error,
		range: {
			start: {"line": LSPDiag["Range"]["Start"]["Line"], "character": LSPDiag["Range"]["Start"]["Character"]},
			end: {"line": LSPDiag["Range"]["End"]["Line"], "character": LSPDiag["Range"]["End"]["Character"]}
		},
		message: LSPDiag["Message"],
		source: LSPDiag["Source"],
		code: "Language Error"
	};

	return diagnosic;
}

async function callFlintC(textDocument: TextDocument) : Promise<void>
{
	// send this over the pipeline
	let sourceCode: String = textDocument.getText();
	let fileName: String = textDocument.uri;
	execFile("/Users/Zubair/Documents/Imperial/Thesis/Code/flint/.build/debug/dev_version", [sourceCode, fileName], (error, stdout, stderror) => { 
		let diagnostics : Diagnostic[] = [];
		let arrayOfLspDiags: any;

		try {
			arrayOfLspDiags = JSON.parse(stdout);	
		} catch (error) {	  
		}	

		//let arrayOfLspDiags = JSON.parse(stdout);
		try {
			arrayOfLspDiags.forEach(element => {
				diagnostics.push(convertFlintToDiag(element));	
			});
		} catch (error)
		{

		}
		connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });					
	});	
}

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	callFlintC(change.document);
});

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

/*
connection.onRenameRequest(
	(params: RenameParams) : WorkspaceEdit => {
		return null;
	}
);

connection.onHover(
	(params: TextDocumentPositionParams): Hover => {

		let s = documents;
			let x:Hover = {
			contents: {language: "html", value:"hi"},
		};
		return x;
	});
	

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		var t = _textDocumentPosition.textDocument;
		let targetLine = _textDocumentPosition.position["line"];
		var txt = documents.get(t.uri).getText();
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			(item.detail = 'TypeScript details'),
				(item.documentation = 'TypeScript documentation');
		} else if (item.data === 2) {
			(item.detail = 'JavaScript details'),
				(item.documentation = 'JavaScript documentation');
		}
		return item;
	}
);

*/

/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.text the initial full content of the document.
	connection.console.log(`${params.textDocument.uri} opened.`);
});
connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});
connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`);
});
*/

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
