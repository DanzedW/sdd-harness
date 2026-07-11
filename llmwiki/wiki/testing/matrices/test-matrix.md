# PC-080..PC-172 17-domain test matrix

状态含义：`existing` 是当前磁盘可定位证据；`planned` 是下一代码波次合同；`blocked` 是因 UNCONFIRMED 不得执行。共享 registry/ledger tests 只证明范围与禁用基础，不冒充领域语义测试。

| 业务域 | IDs | Unit evidence | Integration evidence | UI/route evidence | Manual evidence | Current semantic status |
|---|---|---|---|---|---|---|
| 内容运营 | PC-080..081 | existing catalog；planned contentOperationsService | planned publish/order audit flow | existing `/operations/domains/content-operations` + owner/maturity/evidence；planned content CRUD UI | query/edit/preview/publish/order checklist | typed shared |
| 用户管理 | PC-082..085 | existing privacy；planned userOperationsService | planned scoped profile/status/risk audit | existing UserPage + domain route；planned detail/status UI | masked identifier、population scope、PC-083 disabled | partial + blocked |
| 发票抽奖 | PC-086..092 | existing UNCONFIRMED rejection；planned invoiceLotteryService | planned verification→duplicate/locality→lottery→reward | existing shared pages；planned all-disabled invoice workbench | seven actions visibly blocked with dependency/reason | blocked 7/7 |
| 分类信息 | PC-093..094 | existing registry；planned categoryContentService | planned hierarchy/association integrity | existing CategoryPage + domain route | cycle rejection、information-only vs sellable association | partial |
| 商家管理 | PC-095..103 | existing split/settlement rules；planned merchantOperationsService | planned onboarding→store→QR→split lifecycle | existing Merchant/Shop/QR/Settlement pages | audit supplement、QR state、split config、PC-103 blocked | partial + blocked |
| 电商管理 | PC-104..112 | existing v03 domain/privacy；planned commerceLifecycleService | planned product→order→payment→fulfillment→refund | existing Product/Order/Logistics/Refund pages | price snapshot、state exception、PC-112 blocked | partial + blocked |
| 积分管理 | PC-113..120 | existing pointGrant/fundingPool/v03Mock | existing grant→claim→pool；planned source/expiry/order | existing PointGrant/Pending/Funding/Coin pages | idempotent grant、masked claim、pool reconcile、116/120 blocked | strongest existing + gaps |
| 票券管理 | PC-121..135 | existing fundingPool/v03Mock；planned couponLifecycleService | planned template→claim→lock→verify→refund→settle | existing Coupon/CouponPool pages | single coupon、scope、responsibility、121/132 blocked | partial + blocked |
| 积分权益 | PC-136..138 | existing rejection；planned pointBenefitService | planned sign-in→reward→benefit fulfillment | existing shared route；planned benefit page | versioned sign-in、record query、PC-138 blocked | first-wave + blocked |
| 活动报名 | PC-139..140 | existing registry；planned eventRegistrationService | planned event capacity→roster→idempotent verify | existing placeholder `/campaigns` + domain route；planned real page | closed/capacity/duplicate verification cases | placeholder gap |
| 生活缴费管理 | PC-141..146 | existing rejection；planned utilityPaymentService | planned provider/bill/payment/result/refund contract | existing shared pages；planned read-only workbench | six mutations disabled; provider/failure/refund visible | blocked 6/6 |
| 小程序管理 | PC-147 | existing registry；planned miniProgramConfigService | planned secret-safe config state audit | existing domain route；planned config page | no secret rendering/persistence; enable/disable audit | first-wave only |
| 焦点图 | PC-148..149 | existing registry；planned focusImageService | planned content/placement/schedule conflict | existing AdvertisementPage + domain route | preview/order/schedule/publish audit | partial |
| 平台协议与常见问题 | PC-150..154 | existing registry；planned platformContentService | planned version/audience/effective/sanitization | existing ContractPage；planned FAQ page | version history、safe preview、FAQ order | partial |
| 财务管理 | PC-155..162 | existing v03/split/settlement suites；planned withdrawalService | existing payment/split/settlement/reconcile primitives；planned 8-ID flow | existing specialized finance pages + workbench | integer/idempotency/state/audit/reversal/reconcile、158..160 blocked | strong primitives + trace gap |
| 系统管理 | PC-163..168 | existing registry；planned systemGovernanceService | planned parameters/RBAC/menu/admin/audit | existing SystemPage + domain route | least privilege、immutable log、versioned parameter | partial |
| 到家服务管理 | PC-169..172 | existing registry；planned homeServiceOperationsService | planned catalog→order→fulfillment→refund | existing shared/Refund pages；planned home-service page | state/exception/refund and old-reference conflict check | first-wave only |

## Cross-domain gates

| Gate | Unit | Integration | UI/manual |
|---|---|---|---|
| 93/17/24 source integrity | existing `pcRequirementRegistry.test.ts` | matrix/trace JSON union self-check | menu/domain inventory count |
| UNCONFIRMED migration | existing `requirementLedgerService.test.ts` | planned source/hash→migration→test→enable workflow | 24 disabled actions and reasons |
| Integer cents/basis points | existing `settlementRules.test.ts` + ledger guard | planned scan across all L-level services | input boundary/error visibility |
| Partial success/reversal/reconciliation | existing split/funding/v03 tests | planned cross-domain ledger fixture | finance pages preserve partial/error states |
| Evidence closure | JSON/locator validation | full test/typecheck/build | Browser probe + 17-domain manual checklist |

## Milestone evidence policy

- M0 existing：共享台账/service/overview、41 tests、typecheck/build、93-row trace。
- M1..M4 planned：没有真实文件和 passing test 前不得把表格中的 planned 改为 existing。
- M5 blocked until browser evidence：当前 probe `pass:false`，不能标 UI evidence complete。
- M6 closure：93 条 owner/page/service/test/status 分布必须反映真实领域边界；共享 locator 允许保留，但必须说明复用原因与未覆盖语义。
