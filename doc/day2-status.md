# 第二天完成记录

## 已完成

- `Tokenizer`：支持空格分隔、双引号文本和 `#` 注释行。
- `CommandRegistry`：集中完成命令名到处理器的分派。
- `ShapeFactory`：集中创建 rect、circle、ellipse、line、text、g 六种内置图形。
- `CliApplication`：维护当前 Document，处理参数、错误和成功反馈。
- 文档命令：`init`、`canvas`。
- 创建和查询：`create`、`tree`、`show`，支持 `in <containerId>`。
- 基础编辑：`move`、`scale`、`set`，支持 Composite 递归移动和缩放。
- 公共属性：`fill`、`stroke`、`stroke-width` 以及各图形自身几何属性。

## 暂未实现

`read`、`save`、`delete`、`group`、`ungroup`、`addto`、`front`、`back`、`undo`、`redo` 会明确返回未实现提示，分别留给第四天和第三天。

## 验证

```text
npm run build
npm test
npm run cli
```

当前共有 12 个测试，覆盖 tokenizer、创建嵌套图形、tree/show、Composite 移动、缩放、set 和错误状态。
