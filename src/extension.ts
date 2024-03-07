// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";

const getPackage = async (document: vscode.TextDocument) => {
  const activeWork = vscode.workspace.getWorkspaceFolder(document.uri)?.uri
    .fsPath;
  const packageData = JSON.parse(
    await fs.readFileSync(`${activeWork}/package.json`, "utf-8")
  );
  const pageageConfig = packageData?.config || {};
  return {
    waLanguageTipSettingPath:
      pageageConfig["wa-language-tip"]?.waLanguageTipSettingPath,
  };
};

/** 支持的语言类型 */
const LANGUAGES = [
  "typescriptreact",
  "typescript",
  "javascript",
  "javascriptreact",
];
let triggers = [""];

const defaultPath = "src/locales/zh-CN.ts";

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
    const packageConfig = await getPackage(document);
    // 获取vscode配置下的解析地址以替换默认的值
    const globalPath = vscode.workspace
      .getConfiguration()
      .get("waLanguageTipSettingPath") as string;

    let realPath =
      packageConfig?.waLanguageTipSettingPath || globalPath || defaultPath;
    const file = await vscode.workspace.findFiles(realPath as string);

    const isJson = globalPath.endsWith(".json");
    const activeWork = vscode.workspace.getWorkspaceFolder(document.uri)?.uri
      .fsPath;
    // 这里配置本地的
    if (file?.length > 0) {
      let jsonData = {};
      if (isJson) {
        jsonData = JSON.parse(await fs.readFileSync(file[0].fsPath, "utf-8"));
      }
      if (!isJson) {
        // 当前活跃的文件夹;
        const fileUri = vscode.Uri.joinPath(
          vscode.Uri.file(activeWork!),
          realPath
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

export const showI18nInCodeLine = async (document?: vscode.TextDocument) => {
  const decorationType = vscode.window.createTextEditorDecorationType({
    // prevent conflicts:
    // https://github.com/microsoft/vscode/issues/33852
    // https://github.com/eamodio/vscode-gitlens/blob/main/src/annotations/lineAnnotationController.ts#L25
    after: { margin: "0 0 0 3em" },
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
  });

  if (!document || !LANGUAGES.includes(document.languageId)) {
    return;
  }
  const color = vscode.workspace
    .getConfiguration()
    .get("showTranslateColor") as string;
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const i18nMap = (await getI18nMap(editor.document)) as any;
    const documentText = document.getText();
    const joins = [];
    for (const i in i18nMap) {
      const startPosition = documentText.indexOf(i);
      const endPostion = startPosition + i?.length;
      const sp = document.positionAt(startPosition);
      const ep = document.positionAt(endPostion);
      const startText = documentText[startPosition - 1];
      // 确保""内或''内
      const endText = documentText[endPostion];
      if (startPosition > 0 && startText === endText) {
        const range = new vscode.Range(sp, ep);
        const decoration = {
          range: range,
          renderOptions: {
            after: {
              contentText: `i18n文案：${i18nMap[i]}`,
              color: color || "#CA61F2",
            },
          },
        };
        joins.push(decoration);
      }
      // const decorator = vscode.window.createTextEditorDecorationType({
      //   renderOptions: {
      //     after: { contentText: i18nMap[i] as string, color: "#1456f0" },
      //   },
      // });
    }
    editor.setDecorations(decorationType, joins);
  }
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
  const value = jsonData?.[text];
  (global as any).vscode = vscode;
  if (value) {
    vscode.window.setStatusBarMessage(`${text} => ${value}`, 6000);
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

vscode.window.onDidChangeActiveTextEditor((e) => {
  void showI18nInCodeLine(e?.document);
});

// This method is called when your extension is deactivated
export function deactivate() {}
