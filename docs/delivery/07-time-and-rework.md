# Time and Rework

## Commands

- 指定 4D CLI `sdd init`：成功；OCR LLM 未配置、LLMWiki Python/MCP 探测警告。
- `sdd run grill/product/dev/test/code/review/verify --change pc-admin-93-901e`：按顺序执行；阶段内容均本地落盘。
- `pnpm --filter admin-web test --run`：最终 11 files/41 tests passed。
- `pnpm typecheck`：最终 exit 0。
- `pnpm build`：最终 exit 0。

## Failure and rework count

- 预期 RED：1 次（2 suites 缺生产模块），随后 GREEN。
- 业务编译返工：1 次。首次 typecheck 发现 ES2020 `Array.at` 与字面量扩宽 2 个错误；按根因最小修复后通过。
- Harness 内容 gate 重跑：grill 3、product 3、dev 2、test 2、code 1，共 11 次未达标输出；其中多数是补齐机器格式。
- Harness fallback：2 类固定环境问题——Windows 缺 `cat` 导致 YAML 校验 false、pnpm monorepo auto source/test discovery 返回 0。未修改 Harness，手工验证 artifact 后推进。
- 功能实现修复尝试未超过 1 次；无架构回滚。

## 阶段时间口径

开发开始以指定 `sdd init` 后进入本 workspace 为准。开发到测试结束以最后一轮 fresh 全量测试、typecheck、build、追踪与敏感信息扫描 ready 为准；之后按控制器要求进行的 12,000 中文字符扩写单独视为文档阶段，不反向修改开发测试耗时。文件中不填写无法从工具输出精确还原的分钟数，避免伪造计时；父控制器持有正式开始时间。

控制器写入的 hash-chain 时间账本给出正式 `start` 为 `2026-07-11T03:40:39.641Z`，`test-report-ready` 为 `2026-07-11T03:59:13.000Z`，`elapsedMs=1113359`，即开发到测试报告 ready 为 18 分 33.359 秒。对应命令记录为 `pnpm test --run && pnpm typecheck && pnpm build`，exitCode 0；事件哈希和前序哈希保存在 `docs/delivery/time-ledger.jsonl`。文档扩写发生在该 ready 事件之后，不计入这个开发测试时长。

grill 首次只生成骨架，术语指标要求固定字符串 `**`，brief 还要求独立文件与 `route:`。补齐后推进。product 的 YAML 内容实际有效，但 Windows 环境执行 `cat` 失败，导致 `yaml_has_keys` 恒 false；保留三类场景后使用 fallback。dev 补齐 ADDED Requirements、File Structure Plan、boundary 和五项 task 后通过。

test 阶段的 auto discovery 在 pnpm workspace 返回 0，即使仓库已有多份 `*.test.ts`。没有修改 Harness 搜索逻辑，而是直接运行真实 Vitest。code 阶段同样无法由 auto source 在 monorepo 识别 `apps/admin-web/src`，所以以源码 diff、定向 RED/GREEN、全量测试、typecheck 和 build 为准推进。review 首次因 scaffold 缺权威行失败；按 skill 规定补 `Superpowers verdict: ready` 后通过。

verify 阶段要求 probe report 与 evidence audit。当前没有 Browser/Playwright 采集，不能填写 viewport 和 state transition，因此保存了真实不完整 evidence 和 `pass:false` report。这个失败计入环境/证据缺口，不计为业务测试回归。OCR 也因 init 报告 LLM backend 未配置而 deferred，LLMWiki MCP 因 Python 探测警告未启用；本地 OpenSpec、LLMWiki Markdown 与 testing case 仍已落盘。

## 返工分类

11 次 Harness 内容 gate 未达标主要是 scaffold 到正式 artifact 的正常填充，以及 Windows/monorepo 固定探测差异。真正业务代码返工只有首次 typecheck 一次，包含两个同根的静态类型问题。定向 RED 是 TDD 计划内失败，不归类为缺陷返工。追踪文件第一次生成时被工具单次输出上限截断，JSON 解析立即报错；随后改为 10 条一组的 apply_patch，重新生成并验证成功，这属于交付文档返工 1 次。

最后一轮综合验证脚本第一次因 PowerShell 正则引号解析失败，未执行任何测试；修正为简单 token 扫描后重新完整运行。这是验证命令返工 1 次，不是应用失败。所有失败均保留原因和后续证据，没有用后一个命令 exit 0 掩盖前一个失败。
