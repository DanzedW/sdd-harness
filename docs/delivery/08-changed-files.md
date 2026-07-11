# Changed Files

## Runtime

- `apps/admin-web/src/registry/pcRequirementRegistry.ts` + test
- `apps/admin-web/src/services/requirementLedgerService.ts` + test
- `apps/admin-web/src/pages/RequirementLedgerPage.tsx`
- `apps/admin-web/src/pages/FinancialWorkbenchPage.tsx`
- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/layouts/AdminLayout.tsx`

## Governance and evidence

- `openspec/changes/pc-admin-93-901e/`：grill/product/dev/test/code/review/verify artifacts。
- `llmwiki/wiki/testing/`：test matrix 与 TC-PC-REGISTRY。
- `docs/delivery/`：9 份 Markdown + 93 条 JSON trace。
- `.sdd/`、`.codex/`、`.opencode/`、`openspec/`、`llmwiki/`：指定 CLI init/stage 生成或更新。

## 文件职责明细

`pcRequirementRegistry.ts` 是新增运行时事实层，`pcRequirementRegistry.test.ts` 是完整性门禁。`requirementLedgerService.ts` 是查询、详情、保护、幂等与审计边界，配套测试验证不能绕过的行为。`RequirementLedgerPage.tsx` 提供筛选、表格、详情和安全执行；`FinancialWorkbenchPage.tsx` 提供资金治理汇总。App 只增加路由与 import，AdminLayout 只增加 registry 派生菜单与父菜单映射，未重写既有页面。

OpenSpec change 目录包含 findings、brief、proposal、acceptance criteria、functional test draft、spec、design、tasks 和 progress。`.sdd/runs/pc-admin-93-901e` 保存 workflow frame、review notes、probe evidence 与 report。LLMWiki testing 目录包含一份矩阵和 TC-PC-REGISTRY，用于说明 registry/service 最小验收链。

`docs/delivery` 的 00 到 08 是合同要求的九份 Markdown；`requirements-traceability.json` 是 93 行机器追踪；`09-local-runbook.md` 是追加的本地运行与手工验收说明，不替代合同文档。构建产物位于 `apps/admin-web/dist`，由命令生成，未作为手写源码列入职责表。

目标 T 文档波次新增 `10-2026-07-gap-and-surpass.md` 与 `module-implementation-matrix.json`，并重写当前 change 的 proposal、acceptance criteria、spec、design、tasks 及 LLMWiki 17 域测试矩阵。该波次没有修改 `apps/admin-web`；planned page/service/test 只存在于实施合同，不作为当前源码文件计数。

## 未修改范围

没有修改 `.obsidian/`、`.claude/` 或 `.claudian/`。没有修改 common evaluator、controller、Harness 安装目录、另一个实验 workspace、原始 Excel 或原业务项目。`experiment/requirements.pc.json` 只读；Excel 只作为 immutable evidence。已有 services、mocks、domain 和页面文件除 App/Layout 接线外保持不变。

## 审查建议

先看 registry 与两个测试确认范围，再看 service 的边界顺序，然后看两个页面是否只调用 service，最后看 App/Layout 接线。治理文件量较大，多数来自 `sdd init`；审查业务 diff 时可聚焦 `apps/admin-web/src` 与 `docs/delivery`，但提交时仍保留阶段产物以满足实验可追溯性。
