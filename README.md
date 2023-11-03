# key => value 映射

### (输入 value 自动载入 key)

```
提供一份 key => value 的样本 根据 value 自动转换为 key 值
默认存放路径 src/constants/template.json 可以在插件设置里修改

ts js 格式如下
注意 最后一个value 后不能接, 否则报错
export default {
    "main.name": "姓名",
    "main.age": "年龄"
}
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
