// declare global variables
let originalText: string;

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { escape } from 'querystring';
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('HTML & Markdown Shortcuts is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let changeCase = vscode.commands.registerCommand("html-markdown-shortcuts.changeCase", () => {

		// declare local constants
		const editor = vscode.window.activeTextEditor,
			selection = editor?.selection;
	
		if (selection && !selection.isEmpty) {

			// declare local constants
			const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character),
				selectedText = editor.document.getText(selectionRange);

			if (!originalText || originalText.toLocaleUpperCase() !== selectedText.toLocaleUpperCase())
				originalText = selectedText;

			if (selectedText === originalText)
				if (isLowerCase(selectedText))
					vscode.commands.executeCommand("editor.action.transformToTitlecase");
				else
					vscode.commands.executeCommand("editor.action.transformToLowercase");
			else
				if (isLowerCase(selectedText))
					vscode.commands.executeCommand("editor.action.transformToTitlecase");
				else
					if (isTitleCase(selectedText))
						vscode.commands.executeCommand("editor.action.transformToUppercase");
					else
						if (isUpperCase(selectedText))
							editor.edit(selectedText => {
								selectedText.replace(selection, originalText);
							});
						else vscode.commands.executeCommand("editor.action.transformToLowercase");
		}
	});

	let toggleStag = vscode.commands.registerCommand("html-markdown-shortcuts.toggleStag", () => {

		// declare local constants
		const editor = vscode.window.activeTextEditor,
			selection = editor?.selection;

			if (selection && !selection.isEmpty) {

				const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character),
					selectedText = editor.document.getText(selectionRange);

				editor.edit(textEdit => {

					// declare local constants
					const editor = vscode.window.activeTextEditor;

					if (selectedText.slice(0, 3) === "<s>") {

						let unstruckText = selectedText.replace(/<\/*s>/, '',).replace(/<\/*s>/, '',);
						textEdit.replace(selection, unstruckText);
					} else {

						let struckText = `<s>${selectedText}</s>`;
						textEdit.replace(selection, struckText);
					}
				});
			} else editor.edit(textEdit => textEdit.replace(selection, '~'));
	});

	let toggleStrikethrough = vscode.commands.registerCommand("html-markdown-shortcuts.toggleStrikethrough", () => {

		// declare local constants
		const editor = vscode.window.activeTextEditor,
			selection = editor?.selection;

			if (selection && !selection.isEmpty) {

				const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character),
					selectedText = editor.document.getText(selectionRange);

				editor.edit(textEdit => {

					if (selectedText.slice(0, 3) === "<s>") {

						let unstruckText = selectedText.replace(/<\/*s>/, '',).replace(/<\/*s>/, '',);
						textEdit.replace(selection, unstruckText);
					} else {

						let struckText = `<s>${selectedText}</s>`;
						textEdit.replace(selection, struckText);
					}
				});
			}
	});

	let toggleTildeWrap = vscode.commands.registerCommand("html-markdown-shortcuts.toggleTildeWrap", () => {

		// declare local constants
		const editor = vscode.window.activeTextEditor,
			selection = editor?.selection;

			if (selection && !selection.isEmpty) {

				const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character),
					selectedText = editor.document.getText(selectionRange);

				editor.edit(textEdit => {

					if (selectedText.slice(0, 2) === "~~") {

						let unstruckText = selectedText.replace("~~", '',).replace("~~", '',);
						textEdit.replace(selection, unstruckText);
					} else {

						let struckText = `~~${selectedText}~~`;
						textEdit.replace(selection, struckText);
					}
				});
			} else editor.edit(textEdit => textEdit.replace(selection, '~'));
	});

	context.subscriptions.push(changeCase, toggleStag, toggleStrikethrough, toggleTildeWrap);
}

// This method is called when your extension is deactivated
export function deactivate() {}

/**
 * 
 * @param {String} text
 * @returns {Boolean}
 */
function isLowerCase (text: string) {

	// declare local variables
	let result = true;

	text.split('').forEach(letter => {

		if (typeof(letter) === "string")
			if (letter !== letter.toLowerCase()) result = false;
	});
	return result;
}

/**
 * 
 * @param {String} sentence
 * @returns {Boolean}
 */
function isTitleCase (sentence: string) {

	// declare local variables
	let result = true;

	if (isUpperCase(sentence)) result = false;
	sentence.split(' ').forEach(word => {
		
		if (typeof(word[0]) === "string")
			if (word[0] !== word[0].toUpperCase()) result = false;
	});
	return result;
}

/**
 * 
 * @param {String} text
 * @returns {Boolean}
 */
function isUpperCase (text: string) {

	// declare local variables
	let result = true;

	text.split('').forEach(letter => {

		if (typeof(letter) === "string")
			if (letter !== letter.toUpperCase()) result = false;
	});
		return result;
}
