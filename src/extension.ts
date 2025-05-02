// declare global variables
let originalText: string;

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { escape } from "querystring";
import * as vscode from "vscode";
import MarkdownIt from "markdown-it";
import { minimatch } from "minimatch";
import path from "path";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let changeCase = vscode.commands.registerCommand(
    "html-markdown-shortcuts.changeCase",
    () => {
      // declare local constants
      const editor = vscode.window.activeTextEditor,
        selection = editor?.selection;

      // Check if editor exists and language is in allowed list
      const config = vscode.workspace.getConfiguration(
        "html-markdown-shortcuts"
      );
      const allowedLanguages = config.get<string[]>("changeCaseLanguages", [
        "markdown",
        "html",
      ]);
      if (!editor || !allowedLanguages.includes(editor.document.languageId)) {
        return;
      }

      if (selection && !selection.isEmpty) {
        // declare local constants
        const selectionRange = new vscode.Range(
            selection.start.line,
            selection.start.character,
            selection.end.line,
            selection.end.character
          ),
          selectedText = editor.document.getText(selectionRange);

        if (
          !originalText ||
          originalText.toLocaleUpperCase() !== selectedText.toLocaleUpperCase()
        )
          originalText = selectedText;

        if (selectedText === originalText)
          if (isLowerCase(selectedText))
            vscode.commands.executeCommand(
              "editor.action.transformToTitlecase"
            );
          else
            vscode.commands.executeCommand(
              "editor.action.transformToLowercase"
            );
        else if (isLowerCase(selectedText))
          vscode.commands.executeCommand("editor.action.transformToTitlecase");
        else if (isTitleCase(selectedText))
          vscode.commands.executeCommand("editor.action.transformToUppercase");
        else if (isUpperCase(selectedText))
          editor.edit((selectedText) => {
            selectedText.replace(selection, originalText);
          });
        else
          vscode.commands.executeCommand("editor.action.transformToLowercase");
      }
    }
  );

  let toggleStag = vscode.commands.registerCommand(
    "html-markdown-shortcuts.toggleStag",
    () => {
      // declare local constants
      const editor = vscode.window.activeTextEditor,
        selection = editor?.selection;

      if (selection && !selection.isEmpty) {
        const selectionRange = new vscode.Range(
            selection.start.line,
            selection.start.character,
            selection.end.line,
            selection.end.character
          ),
          selectedText = editor.document.getText(selectionRange);

        editor.edit((textEdit) => {
          if (selectedText.slice(0, 3) === "<s>") {
            let unstruckText = selectedText
              .replace(/<\/*s>/, "")
              .replace(/<\/*s>/, "");
            textEdit.replace(selection, unstruckText);
          } else {
            let struckText = `<s>${selectedText}</s>`;
            textEdit.replace(selection, struckText);
          }
        });
      }
    }
  );

  let toggleTildeWrap = vscode.commands.registerCommand(
    "html-markdown-shortcuts.toggleTildeWrap",
    () => {
      // declare local constants
      const editor = vscode.window.activeTextEditor,
        selection = editor?.selection;

      if (selection && !selection.isEmpty) {
        const selectionRange = new vscode.Range(
            selection.start.line,
            selection.start.character,
            selection.end.line,
            selection.end.character
          ),
          selectedText = editor.document.getText(selectionRange);

        editor.edit((textEdit) => {
          if (selectedText.slice(0, 2) === "~~") {
            let unstruckText = selectedText.replace("~~", "").replace("~~", "");
            textEdit.replace(selection, unstruckText);
          } else {
            let struckText = `~~${selectedText}~~`;
            textEdit.replace(selection, struckText);
          }
        });
      }
    }
  );

  let generateToc = vscode.commands.registerCommand(
    "html-markdown-shortcuts.generateToc",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor!");
        return;
      }

      const doc = editor.document;
      if (doc.languageId !== "markdown") {
        return;
      }

      const text = doc.getText();
      const md = new MarkdownIt();
      const tokens = md.parse(text, {});

      // Extract headings (h2 and below, skip "Table of Contents")
      const headings = tokens
        .map((t, i) => ({ t, originalIndex: i }))
        .filter(
          ({ t }) =>
            t.type === "heading_open" && parseInt(t.tag.replace("h", "")) >= 2
        )
        .map(({ t, originalIndex }) => ({
          level: parseInt(t.tag.replace("h", "")),
          text: tokens[originalIndex + 1].content,
        }))
        .filter((h) => h.text !== "Table of Contents");

      if (headings.length === 0) {
        vscode.window.showInformationMessage(
          "No valid headings found to generate TOC."
        );
        return;
      }

      // Generate numbered TOC
      let toc = "<details>\n\n   <summary>Contents</summary>\n\n";
      headings.forEach((h, i) => {
        const slug = h.text
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        const indent = "   ".repeat(h.level - 2);
        toc += `${indent}1. [${h.text}](#${slug})\n`;
      });
      toc += "\n</details>";

      // Insert or update TOC
      editor.edit((editBuilder) => {
        const tocRegex = /## Table of Contents\n+<details>[\s\S]*?<\/details>*/;
        const tocSection = `## Table of Contents\n\n${toc}`;

        if (tocRegex.test(text)) {
          // Replace existing TOC
          const match = text.match(tocRegex)!;
          const range = new vscode.Range(
            doc.positionAt(match.index!),
            doc.positionAt(match.index! + match[0].length)
          );
          editBuilder.replace(range, tocSection);
        } else {
          // Insert after first heading or at top
          const firstHeading = text.match(/^# .*\n/m);
          const insertPos = firstHeading
            ? doc.positionAt(firstHeading.index! + firstHeading[0].length)
            : new vscode.Position(0, 0);
          editBuilder.insert(insertPos, `\n${tocSection}\n`);
        }
      });
    }
  );

  // Auto-update TOC on save for Markdown files
  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument((event) => {
      const config = vscode.workspace.getConfiguration(
        "html-markdown-shortcuts"
      );
      const autoUpdateToc = config.get<boolean>("autoUpdateToc", true);
      const excludePatterns = config.get<string[]>("tocExcludePatterns", [
        "CHANGELOG.md",
      ]);
      if (
        autoUpdateToc &&
        event.document.languageId === "markdown" &&
        !excludePatterns.some((pattern) =>
          minimatch(path.basename(event.document.fileName), pattern)
        )
      ) {
        vscode.commands.executeCommand("html-markdown-shortcuts.generateToc");
      }
    })
  );

  context.subscriptions.push(
    changeCase,
    toggleStag,
    toggleTildeWrap,
    generateToc
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

/**
 *
 * @param {String} text
 * @returns {Boolean}
 */
function isLowerCase(text: string) {
  // declare local variables
  let result = true;

  text.split("").forEach((letter) => {
    if (typeof letter === "string")
      if (letter !== letter.toLowerCase()) result = false;
  });
  return result;
}

/**
 *
 * @param {String} sentence
 * @returns {Boolean}
 */
function isTitleCase(sentence: string) {
  // declare local variables
  let result = true;

  if (isUpperCase(sentence)) result = false;
  sentence.split(" ").forEach((word) => {
    if (typeof word[0] === "string")
      if (word[0] !== word[0].toUpperCase()) result = false;
  });
  return result;
}

/**
 *
 * @param {String} text
 * @returns {Boolean}
 */
function isUpperCase(text: string) {
  // declare local variables
  let result = true;

  text.split("").forEach((letter) => {
    if (typeof letter === "string")
      if (letter !== letter.toUpperCase()) result = false;
  });
  return result;
}
