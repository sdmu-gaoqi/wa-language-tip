# key => value 映射

### (输入 value 自动载入 key)

```
提供一份 key => value 的样本 根据 value 自动转换为 key 值
默认存放路径 src/constants/template.json 可以在插件设置里修改

```

##### 默认配置的文件的配置格式

```
{
"login": "登录",
}
```

##### 插件全局设置的格式

```
[
    {key: 'login', value: 'login', isString: true}
]
```

#### 使用方式

配置了插件读取的文件地址后
ts js 格式如下

```
export default {
    "main.name": "姓名",
    "main.age": "年龄"
}

```

在其他文件输入 i18n(key)时 可以输入 tip 发起提示信息
或 具体中文 姓名 发起提示信息

在其他文件中不确定 i18n(key) key 的中文语意 可以双击选中在 vscode 下方显示对应的配置文案
