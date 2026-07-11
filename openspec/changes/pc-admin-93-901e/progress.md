# Progress

## [code]
- RED: targeted registry/service test run failed with 2 missing-module suites as expected.
- GREEN: targeted run passed 2 files / 4 tests after minimal registry/service implementation.
- Full test: pass 11 files / 41 tests.
- Typecheck failure classification (new): ES2020 lacks `Array.at` and literal inference widened page type; fixed at source with indexed access and const literals.
- Harness fallback: Windows `cat` YAML check and monorepo auto source/test discovery are non-portable; business commands are run directly and recorded.
- Perf waiver: timed experiment uses build output and bundle size as non-functional evidence; Lighthouse browser run is out of scope.

## [verify]
- CI/local evidence: full test pass 11 files / 41 tests; typecheck pass; production build pass.
- Coverage evidence: 93 unique trace rows, 24 UNCONFIRMED disabled, 12 required fields complete, locator path check has 0 broken paths.
- Failure classification: no functional regression; one fixed new typecheck failure; environment/blocker is unavailable browser/Lighthouse capture and non-portable Harness Windows/monorepo probes.
- Non-functional waiver: build bundle sizes captured; Browser/Lighthouse perf and accessibility scores not captured in the timed workspace.
- Risk: Ant Design chunk warning and absence of browser E2E remain explicitly disclosed.

## [target-T documentation contract]

- Read the two authorized 2026-07 reference documents; used them only for gap analysis, not functional scope.
- Added a 17-domain implementation matrix with current disk evidence, planned next-wave boundaries, milestones, UNCONFIRMED IDs and finance safety.
- Rewrote proposal, acceptance criteria, spec, design and tasks with 17 domain GWT, M0..M6 and verification commands.
- Expanded LLMWiki matrix to 17 rows with unit/integration/UI/manual evidence and existing/planned/blocked status.
- Added gap-and-surpass audit explicitly documenting that two shared pages and one shared service are first-wave coverage only.
- Constraint observed: no files under `apps/admin-web` changed in target-T round.

## [target-T code wave]

- RED: domain catalog test failed because `domainCatalog` did not exist; after minimal catalog implementation, 17/93/named-route and finance mapping assertions passed.
- RED: trace assertion then failed because first-wave trace had no specialized/shared status; regenerated from typed catalog and existing disk evidence.
- GREEN: targeted catalog/trace/UI-boundary 4/4 tests passed.
- Full evidence: 12 files / 45 tests passed; typecheck exit 0; build exit 0 with 3167 modules.
- Trace evidence: 93 unique rows; status 59 specialized / 10 shared / 24 disabled; unique distributions owner 17, route 17, page 17, service 8, mock 8, test 9; planned locator 0; broken locator 0.
- Remaining: M2/M4 domain semantic services and cross-domain lifecycle are partial; M5 Browser/Playwright evidence remains pending.
