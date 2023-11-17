// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";

/** 支持的语言类型 */
const LANGUAGES = [
  "typescriptreact",
  "typescript",
  "javascript",
  "javascriptreact",
];
let triggers = [""];

const defaultPath = "src/constants/template.json";

const defaultData = {
  sortText: "sortText",
  preselect: "preselect",
};
class MyDocumentRangeSemanticTokensProvider
  implements vscode.DocumentRangeSemanticTokensProvider
{
  provideDocumentRangeSemanticTokens(
    document: vscode.TextDocument,
    range: vscode.Range,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<any> {
    // 在此处实现逻辑，生成指定范围内的语义标记
  }
}

const getI18nMap = async (document: vscode.TextDocument) => {
  try {
    // 获取vscode配置下的解析地址以替换默认的值
    const globalPath = vscode.workspace
      .getConfiguration()
      .get("waLanguageTipSettingPath") as string;

    let realPath = globalPath ?? defaultPath;
    const file = await vscode.workspace.findFiles(realPath as string);

    const isJson = globalPath.endsWith(".json");
    const activeWork = vscode.workspace.getWorkspaceFolder(document.uri)?.uri
      .path;
    // 这里配置本地的
    if (file?.length > 0) {
      let jsonData = {};
      if (isJson) {
        jsonData = JSON.parse(await fs.readFileSync(file[0].path, "utf-8"));
      }
      if (!isJson) {
        // 当前活跃的文件夹;
        const fileUri = vscode.Uri.joinPath(
          vscode.Uri.file(activeWork!),
          globalPath
        );
        let fileContent = (await vscode.workspace.fs.readFile(fileUri))
          .toString()
          .replace(/export default|module.export = /g, "");
        jsonData = eval(`(${fileContent})`);
      }
      return jsonData;
    } else {
      return {};
    }
  } catch (err) {
    return {};
  }
};

const getI18nTexts = async (document: vscode.TextDocument) => {
  try {
    const globalConfigs = vscode.workspace
      .getConfiguration()
      .get("waLanguageTipGloablValue") as Record<
      "key" | "value" | "isString",
      string | boolean
    >[];
    let configs: Record<string, any>[] = [];
    // 这里配置全局的
    if (globalConfigs && globalConfigs?.length > 0) {
      globalConfigs.forEach(({ key, value, isString = true }) => {
        triggers.push(String(value));
        // 这里转换的是 key => '${value}'
        configs.push({
          label: `${value}:${key}`,
          detail: `${value} => ${key}`,
          insertText: isString ? `'${key}'` : key,
          documentation: String(value),
          describe: "123",
          kind: vscode.CompletionItemKind.Function,
          filterText: `'tip-${value}'`,
          ...defaultData,
        });
      });
    }
    const jsonData = await getI18nMap(document);
    if (jsonData) {
      Object.entries(jsonData).forEach(([oldKey, oldValue]) => {
        triggers.push(String(oldValue));
        // 这里转换的是 key => '${value}'
        configs.push({
          label: `${oldValue}:${oldKey}`,
          detail: `${oldValue} => ${oldKey}`,
          insertText: `'${oldKey}'`,
          documentation: String(oldValue),
          describe: "123",
          kind: vscode.CompletionItemKind.Function,
          filterText: `'tip-${oldValue}'`,
          ...defaultData,
        });
      });
    }
    return configs;
  } catch (err) {}
};
export async function activate(context: vscode.ExtensionContext) {
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    LANGUAGES,
    {
      async provideCompletionItems(document: vscode.TextDocument) {
        (global as any).vscode = vscode;
        const i18nTexts = await getI18nTexts(document);
        // ProviderResult<CompletionItem[] | CompletionList<CompletionItem>>
        return i18nTexts as vscode.ProviderResult<
          vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>
        >;
      },
    },
    ...triggers
  );
  context.subscriptions.push(completionProvider);
}

export const selectTip = async (
  text: string,
  document: vscode.TextDocument
) => {
  const jsonData: Record<string, any> = await getI18nMap(document);
  console.log(jsonData, "wordTip => jsonData");
  const value = jsonData?.[text];
  (global as any).vscode = vscode;
  if (value) {
    vscode.window.showInformationMessage(`${text} => ${value}`);
    return;
  }
};

vscode.window.onDidChangeTextEditorSelection((event) => {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const selection = editor.selection;
    const selectedWord = editor.document.getText(selection);
    // 处理选中的单词
    selectTip(selectedWord, editor.document);
  }
});

// This method is called when your extension is deactivated
export function deactivate() {}
