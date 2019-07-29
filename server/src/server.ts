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
			// specify that we do full document sync
			textDocumentSync: documents.syncKind,
			// Tell the client that the server supports code completion
			/*
			completionProvider: {
				resolveProvider: false,
				triggerCharacters: ["."]
			},
			hoverProvider : false
			*/
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

const flint_lsp = "/Users/Zubair/Documents/Imperial/Thesis/Code/flint/.build/debug/flint-lsp";

async function callFlintC(textDocument: TextDocument) : Promise<void>
{
	// send this over the pipeline
	let sourceCode: String = textDocument.getText();
	let fileName: String = textDocument.uri;
	execFile(flint_lsp, [sourceCode, fileName], (error, stdout, stderror) => { 
		let diagnostics : Diagnostic[] = [];
		let arrayOfLspDiags: any;

		try {
			arrayOfLspDiags = JSON.parse(stdout);	
		} catch (error) {	  
		}	

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


// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
