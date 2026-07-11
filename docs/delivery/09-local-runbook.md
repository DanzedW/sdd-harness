# Local Runbook

## 前置条件

在本 workspace 根目录执行命令。需要 Node.js、pnpm 和当前 lockfile 对应依赖；不要从另一个 workspace 复制 `node_modules`、配置或构建产物。若依赖未安装，运行 `pnpm install --frozen-lockfile`。安装过程只应读取本仓库 `package.json`、`pnpm-workspace.yaml` 与 `pnpm-lock.yaml`，不得注入真实后端地址、支付密钥或私有 MCP 配置。

建议开发端口使用 Vite 默认 5173；如果已占用，可运行 `pnpm --filter admin-web dev -- --port 5174`。本项目登录与业务均为本地 Mock，不需要启动 API、数据库、消息队列或支付模拟器。页面会读取浏览器 localStorage 中的 `admin-token`，通过现有登录页进入即可。

## 安装与质量命令

```powershell
pnpm install --frozen-lockfile
pnpm --filter admin-web test --run
pnpm typecheck
pnpm build
```

预期测试为 11 个文件、41 个测试通过；如果数量因后续新增测试上升，只要求零失败，不能为了匹配旧数字删测试。typecheck 应 exit 0。build 会先跑 `tsc -b` 再运行 Vite，当前会提示 Ant Design chunk 超过 1000 kB；这是已知警告，不是构建失败，也不应通过提高阈值隐藏。

## 启动开发服务

```powershell
pnpm --filter admin-web dev -- --port 5173
```

浏览器打开 `http://localhost:5173/login`。使用现有 Mock 登录表单进入后台。若已有 `admin-token`，根路径会进入 Dashboard。退出按钮会清除 token 并返回登录。开发服务器只用于本机验收，不要暴露到不可信网络，也不要把 Mock 成功结果解释为真实渠道结果。

## 生产预览

```powershell
pnpm build
pnpm --filter admin-web preview -- --port 4173
```

打开 `http://localhost:4173`。preview 应使用刚生成的 `apps/admin-web/dist`。如果更改源码后未重新 build，preview 仍会展示旧产物；验收前先停止旧服务、重新 build，再启动 preview。建议 5173 留给 dev，4173 留给 preview，避免访问错进程。

## 关键路由

- `/operations`：全部 93 条功能台账。
- `/operations/domains/<slug>`：17 个稳定命名业务域，例如 `/operations/domains/finance`。
- `/operations/requirements/pc-080` 到 `/operations/requirements/pc-172`：需求详情深链。
- `/financial-workbench`：资金链路专用工作台。
- `/payments`、`/refund`、`/split-instructions`、`/settlement`、`/reconciliation`：保留的既有资金专页。

业务域使用 typed catalog 的稳定 slug，不再依赖数字索引；逐条深链使用需求 ID。访问不存在的 slug 或需求会回到台账。所有这些路由都在 RequireAuth 内，未登录时应跳转 `/login`。

## 手工验收清单

1. 登录后确认左侧出现“PC 功能台账（17域）”，展开后有“全部 93 条”、17 个域和资金专用工作台。
2. 进入全部台账，底部总数应为 93。搜索 `PC-080`，结果应包含新闻资讯；点击详情，地址变为 `/operations/pc-080`，抽屉显示来源哈希。
3. 清空搜索，选择任一业务域，表格只显示该域。刷新域路由后筛选仍由 URL 恢复。
4. 选择 UNCONFIRMED 状态，总数应为 24。每行显示黄色标签，执行按钮禁用并带原因。不要通过修改 DOM 将其视为可执行；service 仍会拒绝。
5. 返回已确认范围，对 PC-080 点击执行，应显示“Mock 动作完成并已审计”。这只证明本地 service 行为，不代表持久化或后端成功。
6. 进入资金专用工作台，确认有需求数、未确认数、cent、bp 四类统计，并能看到幂等、状态、审计和对账说明。
7. 分别打开既有支付、退款、分账、结算和对账页面，确认新增菜单没有替换或破坏旧入口。
8. 缩窄浏览器宽度，检查表格横向滚动、菜单滚动和详情抽屉。当前没有自动浏览器证据，发现布局问题应截图并补回归用例。

## 数据与安全检查

页面代码不应直接 import `src/mocks`。若新增页面需要数据，扩展 service 并写失败测试。金额字段传给 service 时使用整数分，例如 12300 表示 123.00 元；比例用整数基点，例如 250 表示 2.50%。小数金额、负数金额、小数基点或超过 10000 的比例必须被拒绝。

不得在 localStorage、源码、交付文档或 trace 中写真实手机号、银行卡、密钥、Token 或私有 URL。现有 token 是固定 Mock 登录标记，不提供真实授权。若浏览器中残留其他项目数据，使用独立 profile 或先清理本站 storage，不要把个人数据录入 Mock 表单。

## 故障排查

测试找不到模块时确认工作目录是 workspace 根目录，且新增文件位于 `apps/admin-web/src`。typecheck 报 `Array.at` 时不要随意提升 target，本项目当前是 ES2020，应使用兼容索引。路由打开后回到 Dashboard，先检查登录 token，再检查 App route 是否仍在 RequireAuth/AdminLayout 内。

若表格没有 93 条，运行 registry 定向测试并检查 `experiment/requirements.pc.json` 是否被意外修改。若 UNCONFIRMED 不是 24，停止开放动作，先核对来源与哈希。若 build 只出现 chunk warning，可以继续本地验收；若 exit 非 0，必须按完整错误定位根因，不能只删除 dist 或放松 TypeScript。

4D Harness 在本 Windows pnpm workspace 已知有两个探测差异：YAML gate 调用 `cat`，auto source/test discovery 返回 0。不要修改 Harness；以直接运行的 Vitest、TypeScript 和 Vite 输出为业务证据。verify probe 当前缺 Browser/Playwright state transition，因此 report 为 false。要补齐时应真实启动 preview、采集 viewport、console、关键交互 before/after，再运行指定 `sdd probe`，不能手工改 report 为通过。

## 结束与清理

验收完成后停止 dev/preview 进程。`dist` 可由 build 重建，但不要递归删除 workspace 之外的目录。提交前运行 `git diff --check`、追踪 JSON 解析、敏感信息扫描和三条质量命令。若只修改文档，不需要改变应用版本，但仍应确认 Markdown 数量、链接路径和 trace JSON 未被格式化工具破坏。
