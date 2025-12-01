# n8n-aliyun

在 n8n 中提供阿里云常用服务（目前包含 ECS 与 CDN）的原生节点，方便在工作流里直接调用云端 API，无需自建微服务或脚本。

## 功能概览

| 节点 | 功能 | 说明 |
| --- | --- | --- |
| Aliyun ECS | `DescribeInstances` | 通过丰富的过滤条件（Region、实例 ID、VPC/VSwitch、IP、标签等）查询云服务器详情，并将每个实例作为单条输出数据，便于后续节点处理。 |
| Aliyun CDN | `RefreshObjectCaches` | 按路径或目录刷新 CDN 缓存，支持批量 URL、目录模式、强刷开关、OwnerId 与临时安全令牌等参数。 |

所有节点共用 `Aliyun API` 凭据。该凭据要求 AccessKey ID/Secret，并通过 ACS3-HMAC-SHA256 自动为请求签名。

## 安装

```bash
pnpm install
pnpm build
```

构建完成后，可将生成的 `dist` 包拷贝到你的 n8n 自定义节点目录（通常为 `~/.n8n/custom`），或发布到私有 npm 仓库后在 n8n 中安装。

## 使用方法

1. 在 n8n 设置中新增名为 **Aliyun API** 的凭据，填入拥有所需云服务权限的 AccessKey。
2. 在工作流中拖入所需节点：
   - **Aliyun ECS**：选择操作（目前仅 `DescribeInstances`），配置 Region、分页参数和附加过滤条件。
   - **Aliyun CDN**：粘贴要刷新的 URL/目录列表，指定刷新类型（文件/目录）以及是否强制刷新。
3. 运行节点，返回结果会以 JSON 的形式供后续节点使用。

## 开发与调试

- 代码位于 `nodes/` 与 `credentials/`，使用 TypeScript 编写。
- 常用脚本：

  ```bash
  pnpm dev      # watch 模式下编译
  pnpm lint     # 运行 ESLint
  pnpm lintfix  # 自动修复可修复项
  pnpm build    # 生成 dist 产物并拷贝图标
  ```

- 如要扩展新的阿里云服务，可按现有结构新增节点目录（例如 `nodes/AliyunOss`），并在 `package.json > n8n.nodes` 中注册新的入口。

## License

[MIT](LICENSE.md)
