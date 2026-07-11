#!/bin/bash
# PreToolUse hook — 阻止越界写入和 wrong-phase 写入
# Claude Code 通过 JSON stdin 传 {tool_name, tool_input}（非位置参数）
# 仅对 Edit/Write/MultiEdit/Bash 生效
#
# ★ 关键修复（2026-06-29 hook 实证发现）：
#   exit 1 是非阻塞错误（工具仍执行）；exit 2 才是硬性拦截。
#   Claude Code 的 PreToolUse 退出码语义：
#     0 = 放行
#     1 = 非阻塞错误（记录但不拦截，工具照跑）← 旧版误用
#     2 = 硬性拦截（工具中止，stderr 反馈给模型）← 正确
#   拦截原因必须输出到 stderr（exit 2 的反馈通道）。

hook_allow() {
  printf '{"hook":"PreToolUse","pass":true,"reason":"%s"}\n' "$1"
  exit 0
}

hook_block() {
  printf '{"hook":"PreToolUse","pass":false,"reason":"%s"}\n' "$1" >&2
  exit 2
}

# Resolve project dir (platform-agnostic: Claude Code / Codex / OpenCode)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/_resolve-project-dir.sh"

# 从 stdin 读 JSON（Claude Code 的 hook 输入格式）
INPUT=$(cat)
# 从 tool_input.file_path（Write/Edit）或 tool_input.command（Bash）提取路径
TARGET_PATH=$(printf '%s' "$INPUT" | node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync(0,'utf8')); const i=d.tool_input||{}; process.stdout.write(i.file_path||i.notebook_path||i.path||'')" 2>/dev/null)
if [ $? -ne 0 ]; then
  hook_block "invalid JSON hook input"
fi

SDD_DIR="${SDD_PROJECT_DIR}/.sdd"
ACTIVE_RUN_FILE="${SDD_DIR}/active-run"

# 无 active run，不拦（SessionStart 已提示）
if [ ! -f "$ACTIVE_RUN_FILE" ]; then
  hook_allow "no active run"
fi

CHANGE_ID=$(cat "$ACTIVE_RUN_FILE" 2>/dev/null)

WF_FILE="${SDD_DIR}/runs/${CHANGE_ID}/workflow-frame.yaml"
if [ ! -f "$WF_FILE" ]; then
  hook_block "workflow frame missing"
fi

CURRENT_STAGE=$(grep -E '^[[:space:]]+current:' "$WF_FILE" | head -1 | awk '{print $2}')
GATE_STATUS=$(grep -E '^[[:space:]]+status:' "$WF_FILE" | head -1 | awk '{print $2}')
case "$CURRENT_STAGE" in
  grill|product|dev|test|code|review|verify|release|archive) ;;
  *) hook_block "workflow frame has invalid stage" ;;
esac
case "$GATE_STATUS" in
  pending|passed|failed) ;;
  *) hook_block "workflow frame has invalid gate status" ;;
esac

# 支持绝对路径和相对路径
# 阻止在非 dev/code/review 阶段对 src/ 的写入
if [[ "$TARGET_PATH" == *"/src/"* ]] || [[ "$TARGET_PATH" == "src/"* ]]; then
  if [[ "$CURRENT_STAGE" != "code" ]] && [[ "$CURRENT_STAGE" != "review" ]]; then
    # bypass 检查
    if [ -f "${SDD_DIR}/hooks/bypass" ]; then
      hook_allow "explicit project bypass"
    fi
    hook_block "stage=${CURRENT_STAGE} blocks source write"
  fi
fi

hook_allow "write is allowed for current stage"
