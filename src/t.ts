// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
const path = require("path");
import * as fs from "fs";

const defaultData = {
  sortText: "sortText",
  preselect: "preselect",
};

const getI18nTexts = async () => {
  try {
    const file = await vscode.workspace.findFiles("src/i18n/template.json");
    let configs: Record<string, any>[] = [];
    if (file?.length > 0) {
      const data = await fs.readFileSync(file[0].path, "utf-8");
      if (data) {
        const jsonData = JSON.parse(data);
        Object.entries(jsonData).forEach(([oldKey, oldValue]) => {
          configs.push({
            label: String(oldValue),
            detail: String(oldValue),
            insertText: oldKey,
            documentation: String(oldValue),
            describe: "123",
            kind: vscode.CompletionItemKind.Function,
            filterText: String(oldValue),
            ...defaultData,
          });
        });
        return configs;
      } else {
        return;
      }
    } else {
      return;
    }
  } catch (err) {}
};

const injectI18nKey = () => {};

// const provider1 = vscode.languages.registerCompletionItemProvider('语言ID', {

//   provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
//       ...
//       // 创建完成项
//       return [
//           // 返回创建的完成项目
//       ];
//   }
// },'触发字符可选');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "wa-p1" is now active!');
  const i18nTexts = await getI18nTexts();
  console.log(i18nTexts, "i18nTexts");

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("wa-p1.helloWorld", () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    // vscode.workspace.workspaceFolders
    vscode.window.showInformationMessage("vvvvvv");
  });
  const disposable2 = injectI18nKey();

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
