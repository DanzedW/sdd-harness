# Test and Evidence

## TDD evidence

- RED：`pnpm --filter admin-web test --run src/registry/pcRequirementRegistry.test.ts src/services/requirementLedgerService.test.ts`，2 suites 因生产模块不存在而失败。
- GREEN：同一命令，2 files/4 tests passed。
- 全量：`pnpm --filter admin-web test --run`，11 files/41 tests passed。
- 类型：`pnpm typecheck`，fresh exit 0。
- 构建：`pnpm build`，3166 modules transformed，fresh exit 0。

覆盖 registry 93/17/24、service 查询、UNCONFIRMED 拒绝、幂等审计、金额整数分和比例整数基点；既有支付/分账/结算/资金池/隐私测试继续通过。

## RED→GREEN 过程

测试先导入尚不存在的 `pcRequirementRegistry` 和 `requirementLedgerService`。第一次定向运行由 Vitest 稳定复现，两个 suite 均在收集阶段失败，错误分别是无法找到两个生产模块。这证明 RED 的原因是能力缺失，不是断言拼写或随机环境失败。随后只增加 registry 和 service 的最小实现；相同命令再次运行，2 个文件、4 个测试全部通过。

registry 的第一个测试同时断言数组长度、首尾编号、Set 唯一数、17 域和验证器结果；第二个测试断言 24 个未确认条目和每条可用运营路由。service 的第一个测试查询全部未确认条目并对其中一条执行，必须抛出包含 UNCONFIRMED 的错误。第二个测试执行确认条目两次并比较审计 ID，再检查审计轨迹只有一条，同时覆盖小数分和越界基点。

## 全量回归

最终 fresh 命令 `pnpm --filter admin-web test --run` 得到 11 个测试文件、41 个测试通过。除新增 4 个测试外，既有测试继续覆盖分账守恒、失败重试、部分成功冲正、资金池占用释放结算、超发保护、积分批量发放、待认领校验、线上线下结算资格、比例边界、Mock 隐私和六个 V0.3 页面入口。这些回归说明新增 registry 和菜单没有破坏资金领域原有合同。

首次 typecheck 真实失败两处：ES2020 lib 不声明 `Array.at`，以及条件表达式把 `page` 扩宽为普通 string。根因确认后，把测试改为长度索引，并为两个分支使用 const 字面量；没有升级 TypeScript target，也没有放松 strict。修复后的 `pnpm typecheck` exit 0。

`pnpm build` 先执行 `tsc -b`，再由 Vite 转换 3166 个模块并输出 dist。最终产物包括 0.58 kB 的 index.html、2.97 kB CSS、50.18 kB React chunk、511.27 kB 应用 chunk和 1,244.55 kB Ant Design chunk。命令 exit 0，但 Vite 对超过 1000 kB 的 chunk 给出警告；该警告作为性能风险保留，没有调整阈值掩盖。

## 证据限制

本轮没有采集浏览器 viewport、关键交互 state transition、Lighthouse 性能或可访问性分数。4D verify probe 因缺这些字段得到真实 `pass:false`，报告保存在 run 目录。交付没有把 unit/typecheck/build 冒充浏览器 E2E；手工验收步骤写在本地运行手册，后续补证时应启动 preview 并生成新的 probe evidence/report。

## Target-T 代码波次证据

- RED 1：`domainCatalog.test.ts` 因生产模块不存在失败；GREEN 后 catalog 的 17/93、命名 route 与资金专用映射通过。
- RED 2：catalog 两项通过但旧 trace 缺 `IMPLEMENTED_SPECIALIZED/SHARED` 而失败；重生成 93 行 trace 后通过。
- 定向：domain catalog 4/4 tests passed，覆盖 17 命名 route、领域归属、九项资金专用映射、trace 分布和 UI/service import 边界。
- Full：12 test files / 45 tests passed；`pnpm typecheck` exit 0；`pnpm build` exit 0，3167 modules transformed。
- 浏览器 probe 仍未补采，因此 M5 只完成 source-contract evidence，不宣称 Browser/Lighthouse 通过。
