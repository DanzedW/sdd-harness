# Design

## File Structure Plan
- `src/registry/pcRequirements.ts`: 93 条强类型 registry 与域/路由派生。
- `src/services/requirementLedgerService.ts`: Mock 查询、详情、动作保护与审计。
- `src/pages/RequirementLedgerPage.tsx`: 17 域配置驱动台账。
- `src/pages/FinancialWorkbenchPage.tsx`: 资金链路专用工作台。
- 对应 `*.test.ts`：registry/service/UI 合同测试。

## Boundary
_Boundary:_ UI/service/Mock hard boundary.
_Boundary_: 页面不得 import `mocks/`；所有数据访问经 services。UNCONFIRMED 动作在 UI 与 service 双层阻断。
_Depends_: React 19、TypeScript、Ant Design、React Router、Vitest；不增加运行时依赖。
