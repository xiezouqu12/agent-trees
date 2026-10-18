window.__ModuleLoader__.load({
  id: 'agent-trees',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'agent-trees';
    const EMPTY_OBJECT = Object.freeze({});
    const EMPTY_STATE = Object.freeze({ byId: EMPTY_OBJECT, projectionsBySession: EMPTY_OBJECT });
    const AUTO_OPEN_MIN_AGENTS = 3;
    const AUTO_OPEN_MIN_MS = 25000;
    const autoOpenedSessions = new Set();
    const observedRunStarts = new Map();
    const lastTodosBySession = new Map();
    const MIN_ZOOM = 0.35;
    const MAX_ZOOM = 2.5;

    /* ------------------------------------------------------------------ */
    /* Locale dictionaries                                                 */
    /* ------------------------------------------------------------------ */

    const zh = {
      'view.label': '智能体树',
      'sidebar.title': '智能体树',
      'sidebar.guide': '以多叉树查看当前会话的智能体工作流与进度',
      'sidebar.open': '在侧边栏打开智能体树',
      'sidebar.aria': '在侧边栏打开智能体树',
      'title': '智能体工作流',
      'subtitle': '当前会话 · {title}',
      'live': '实时',
      'stat.agents': '智能体',
      'stat.running': '运行中',
      'stat.done': '已完成',
      'stat.tokens': 'Tokens',
      'overall': '整体进度',
      'overall.detail': '{finished} / {total} 已结束 · {running} 运行中',
      'overall.estimate': '按各智能体进度估算',
      'overall.rootPlan': '按主任务计划估算',
      'overall.finishedRatio': '按已结束智能体比例估算',
      'filter.all': '全部',
      'filter.running': '运行中',
      'filter.done': '已完成',
      'filter.attention': '需关注',
      'filter.label': '筛选智能体',
      'layout.chart': '图谱布局',
      'layout.list': '列表布局',
      'layout.label': '树形布局',
      'canvas.hint': '拖动查看 · 双击复位',
      'search.placeholder': '搜索任务…',
      'action.refresh': '刷新',
      'action.expand': '展开全部',
      'action.collapse': '收起全部',
      'action.reveal': '定位当前',
      'action.retry': '重试',
      'action.expandBranch': '展开 {title} 的子任务',
      'action.collapseBranch': '收起 {title} 的子任务',
      'badge.current': '当前',
      'status.running': '运行中',
      'status.completed': '已完成',
      'status.pending': '待开始',
      'status.ended': '已结束',
      'status.idle': '空闲',
      'status.external': '外部任务',
      'mode.root': '主智能体',
      'mode.continuable': '可继续',
      'mode.oneShot': '一次性',
      'mode.external': '外部',
      'mode.unknown': '未知',
      'progress.running': '进行中',
      'progress.external': '外部',
      'progress.todo': '{done}/{total}',
      'progress.noPlan': '无计划',
      'role.main': '主智能体',
      'role.sub': '子智能体',
      'priority.P0': '主任务',
      'priority.P1': '直接子任务',
      'priority.P2': '二级任务',
      'priority.P3': '深层任务',
      'priority.tip.P0': 'P0 · 主任务（最高优先级）',
      'priority.tip.P1': 'P1 · 直接子任务',
      'priority.tip.P2': 'P2 · 二级任务',
      'priority.tip.P3': 'P3 · 深层任务',
      'loading.children': '读取子任务…',
      'error.children': '子任务读取失败',
      'error.render': '智能体树渲染失败',
      'empty.title': '还没有子智能体',
      'empty.body': '当主智能体通过 subagent、subagent_fork 或 workflow 派发任务后，这里会自动长出分支。',
      'empty.hint': '提示：在任务标签前加 [P0]–[P3] 可指定优先级；未指定时按层级 P0–P3。',
      'empty.filtered': '没有符合条件的智能体',
      'footer': '数据来自会话投影 subagentCatalog / todos / subagentTiming · 实时更新',
      'tokens': '{value} tok',
      'children.one': '{count} 个子任务',
      'children.other': '{count} 个子任务',
      'duration.seconds': '{n}秒',
      'duration.minutes': '{m}分{s}秒',
      'duration.hours': '{h}时{m}分',
      'aria.tree': '智能体工作流树',
      'aria.card': '{title}，{status}，进度 {progress}',
      'aria.progress': '{title} 的进度',
      'card.tooltip': '{title} · 点击打开会话',
    };

    const en = {
      'view.label': 'Agent Trees',
      'sidebar.title': 'Agent Trees',
      'sidebar.guide': "View the current session's agent workflow and progress as a tree.",
      'sidebar.open': 'Open Agent Trees in the sidebar',
      'sidebar.aria': 'Open Agent Trees in the sidebar',
      'title': 'Agent workflow',
      'subtitle': 'Current session · {title}',
      'live': 'Live',
      'stat.agents': 'Agents',
      'stat.running': 'Running',
      'stat.done': 'Done',
      'stat.tokens': 'Tokens',
      'overall': 'Overall progress',
      'overall.detail': '{finished} / {total} finished · {running} running',
      'overall.estimate': "Estimated from each agent's progress",
      'overall.rootPlan': 'Main task plan progress',
      'overall.finishedRatio': 'Estimated from finished agents',
      'filter.all': 'All',
      'filter.running': 'Running',
      'filter.done': 'Done',
      'filter.attention': 'Attention',
      'filter.label': 'Filter agents',
      'layout.chart': 'Chart layout',
      'layout.list': 'List layout',
      'layout.label': 'Tree layout',
      'canvas.hint': 'Drag to pan · double-click to reset',
      'search.placeholder': 'Search tasks…',
      'action.refresh': 'Refresh',
      'action.expand': 'Expand all',
      'action.collapse': 'Collapse all',
      'action.reveal': 'Locate current',
      'action.retry': 'Retry',
      'action.expandBranch': 'Expand {title} subtasks',
      'action.collapseBranch': 'Collapse {title} subtasks',
      'badge.current': 'Current',
      'status.running': 'Running',
      'status.completed': 'Completed',
      'status.pending': 'Not started',
      'status.ended': 'Ended',
      'status.idle': 'Idle',
      'status.external': 'External task',
      'mode.root': 'Main agent',
      'mode.continuable': 'Continuable',
      'mode.oneShot': 'One-shot',
      'mode.external': 'External',
      'mode.unknown': 'Unknown',
      'progress.running': 'Running',
      'progress.external': 'External',
      'progress.todo': '{done}/{total}',
      'progress.noPlan': 'No plan',
      'role.main': 'Main agent',
      'role.sub': 'Subagent',
      'priority.P0': 'Main',
      'priority.P1': 'Direct',
      'priority.P2': 'Nested',
      'priority.P3': 'Deep',
      'priority.tip.P0': 'P0 · Main task (highest priority)',
      'priority.tip.P1': 'P1 · Direct child task',
      'priority.tip.P2': 'P2 · Nested task',
      'priority.tip.P3': 'P3 · Deep task',
      'loading.children': 'Loading subtasks…',
      'error.children': 'Could not load subtasks',
      'error.render': 'Agent Trees failed to render',
      'empty.title': 'No subagents yet',
      'empty.body': 'Branches appear here automatically when the main agent delegates through subagent, subagent_fork, or workflow.',
      'empty.hint': 'Tip: prefix a task label with [P0]–[P3] to set its priority; otherwise depth decides P0–P3.',
      'empty.filtered': 'No agents match this view',
      'footer': 'Live from the subagentCatalog / todos / subagentTiming session projections',
      'tokens': '{value} tok',
      'children.one': '{count} subtask',
      'children.other': '{count} subtasks',
      'duration.seconds': '{n}s',
      'duration.minutes': '{m}m {s}s',
      'duration.hours': '{h}h {m}m',
      'aria.tree': 'Agent workflow tree',
      'aria.card': '{title}, {status}, progress {progress}',
      'aria.progress': 'Progress of {title}',
      'card.tooltip': '{title} · click to open the session',
    };

    /* ------------------------------------------------------------------ */
    /* Pure helpers                                                       */
    /* ------------------------------------------------------------------ */

    function shortId(id) {
      const text = typeof id === 'string' ? id : String(id || '');
      if (text === '') return '—';
      return text.length <= 12 ? text : text.slice(0, 8);
    }

    function tokenTotal(usage) {
      if (!usage || typeof usage !== 'object') return 0;
      let total = 0;
      const keys = ['uncachedInputTokens', 'outputTokens', 'cacheReadTokens', 'cacheWriteTokens'];
      for (const key of keys) {
        const value = usage[key];
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) total += value;
      }
      return total;
    }

    function formatTokens(value) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '0';
      if (value < 1000) return String(Math.round(value));
      if (value < 1000000) {
        const scaled = value / 1000;
        const text = scaled >= 100 ? String(Math.round(scaled)) : scaled.toFixed(1).replace(/\.0$/, '');
        return text + 'k';
      }
      const millions = value / 1000000;
      return millions.toFixed(1).replace(/\.0$/, '') + 'M';
    }

    function costUsageTokens(usage) {
      if (!usage || typeof usage !== 'object') return 0;
      let total = 0;
      for (const key of ['input', 'output', 'cacheRead', 'cacheWrite']) {
        const value = usage[key];
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) total += value;
      }
      return total;
    }

    function formatCost(value) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '—';
      if (value < 0.0001) return '<$0.0001';
      if (value < 1) return '$' + value.toFixed(4);
      return '$' + value.toFixed(2);
    }

    function formatDuration(ms, t) {
      if (typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) return '';
      const totalSeconds = Math.floor(ms / 1000);
      if (totalSeconds < 60) return t('duration.seconds', { n: totalSeconds });
      const totalMinutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      if (totalMinutes < 60) {
        return t('duration.minutes', { m: totalMinutes, s: String(seconds).padStart(2, '0') });
      }
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return t('duration.hours', { h: hours, m: String(minutes).padStart(2, '0') });
    }

    function durationOf(node, now) {
      const timing = node && node.timing;
      if (!timing || typeof timing !== 'object') return 0;
      let total = typeof timing.settledMs === 'number' && Number.isFinite(timing.settledMs) ? timing.settledMs : 0;
      const active = timing.active;
      if (active && typeof active.since === 'number' && Number.isFinite(active.since)) {
        const through = typeof active.through === 'number' && Number.isFinite(active.through)
          ? active.through
          : active.since;
        const end = node.running ? now : through;
        if (end > active.since) total += end - active.since;
      }
      return total;
    }

    function nodeDuration(node, now) {
      const active = durationOf(node, now);
      if (active > 0) return active;
      if (node && node.mode === 'root') {
        const summary = node.summary || {};
        const rawCreated = summary.createdAt ?? summary.created ?? summary.startedAt ?? summary.startTime
          ?? (summary.header && summary.header.createdAt)
          ?? (summary.session && summary.session.createdAt);
        const created = typeof rawCreated === 'number' ? rawCreated : Date.parse(rawCreated);
        if (Number.isFinite(created) && created > 0 && created <= now) return now - created;
      }
      const observed = observedRunStarts.get(node.id);
      if (observed && Number.isFinite(observed.startedAt)) {
        const end = node.running ? now : (observed.stoppedAt || now);
        if (end > observed.startedAt) return end - observed.startedAt;
      }
      return 0;
    }

    /**
     * Parse an optional `[P0]` / `P1:` prefix from a task label and fall back
     * to depth. The prefix is removed from the displayed title.
     */
    function parsePriority(rawTitle, depth) {
      let title = typeof rawTitle === 'string' ? rawTitle.trim() : '';
      let explicit = null;
      const match = /^\s*[\[(]?\s*(P[0-3])\s*[\])]?\s*(?:[:：\-–—·|]\s*)?/i.exec(title);
      if (match) {
        const whole = match[0];
        const rest = title.slice(whole.length).trim();
        const bracketed = /[\[(]/.test(whole);
        const separated = /[:：\-–—·|]/.test(whole);
        if (bracketed || separated || rest.length > 0) {
          explicit = match[1].toUpperCase();
          if (rest.length > 0) title = rest;
        }
      }
      const fallback = depth <= 0 ? 'P0' : depth === 1 ? 'P1' : depth === 2 ? 'P2' : 'P3';
      return {
        title: title === '' ? '—' : title,
        priority: explicit === null ? fallback : explicit,
        explicit: explicit !== null,
      };
    }

    function nodeProgress(node) {
      if (node.mode === 'external') {
        return { kind: 'external', pct: null, indeterminate: false };
      }
      const todos = node.todos;
      if (Array.isArray(todos) && todos.length > 0) {
        let done = 0;
        let active = 0;
        for (const item of todos) {
          if (!item || typeof item !== 'object') continue;
          if (item.status === 'completed') done += 1;
          else if (item.status === 'in_progress') active += 1;
        }
        const total = todos.length;
        const pct = Math.max(0, Math.min(100, Math.round(((done + active * 0.5) / total) * 100)));
        return {
          kind: !node.running && done === total ? 'done' : 'todo',
          pct,
          done,
          total,
          indeterminate: false,
        };
      }
      if (node.running) return { kind: 'running', pct: 0, indeterminate: false };
      if (node.completed) return { kind: 'done', pct: 100, indeterminate: false };
      if (node.pending) return { kind: 'pending', pct: 0, indeterminate: false };
      return { kind: 'ended', pct: 0, indeterminate: false };
    }

    function progressClass(progress) {
      if (progress.kind === 'done') return 'is-done';
      if (progress.kind === 'ended') return 'is-ended';
      if (progress.kind === 'pending') return 'is-pending';
      if (progress.kind === 'external') return 'is-external';
      return 'is-running';
    }

    function progressLabel(progress, t) {
      if (progress.kind === 'external') return t('progress.external');
      if (progress.total) return t('progress.todo', { done: progress.done, total: progress.total });
      if (progress.kind === 'running' || progress.kind === 'pending' || progress.kind === 'ended') {
        return t('progress.noPlan');
      }
      return String(progress.pct === null ? 0 : progress.pct) + '%';
    }

    function statusOf(node, t) {
      if (node.mode === 'external') return { text: t('status.external'), cls: 'external' };
      if (node.running) return { text: t('status.running'), cls: 'running' };
      if (node.completed) return { text: t('status.completed'), cls: 'completed' };
      if (node.pending) return { text: t('status.pending'), cls: 'pending' };
      if (node.mode === 'root') return { text: t('status.idle'), cls: 'idle' };
      return { text: t('status.ended'), cls: 'ended' };
    }

    function modeOf(node, t) {
      if (node.mode === 'root') return t('mode.root');
      if (node.mode === 'external') return t('mode.external');
      if (node.mode === 'one-shot') return t('mode.oneShot');
      if (node.mode === 'continuable') return t('mode.continuable');
      return t('mode.unknown');
    }

    function decorate(node) {
      let size = 1;
      let running = node.running ? 1 : 0;
      let completed = node.completed ? 1 : 0;
      let tokens = tokenTotal(node.tokenUsage);
      let hasRunning = node.running;
      for (const child of node.children) {
        const stats = decorate(child);
        size += stats.size;
        running += stats.running;
        completed += stats.completed;
        tokens += stats.tokens;
        if (stats.hasRunning) hasRunning = true;
      }
      node.subtreeSize = size;
      node.subtreeRunning = running;
      node.subtreeCompleted = completed;
      node.subtreeTokens = tokens;
      node.hasRunningDescendant = hasRunning;
      node.isActiveBranch = hasRunning;
      node.descendantCount = size - 1;
      return { size, running, completed, tokens, hasRunning };
    }

    function buildTree(currentId, byId, projections, statuses, liveRootTodos) {
      if (typeof currentId !== 'string' || currentId === '') {
        return { root: null, rootId: null, currentId: null, nodes: [], lineage: [] };
      }
      let rootId = currentId;
      const lineageSet = new Set([rootId]);
      for (let guard = 0; guard < 64; guard += 1) {
        const summary = byId[rootId];
        if (!summary || summary.origin !== 'subagent') break;
        const parentId = summary.parentId;
        if (typeof parentId !== 'string' || parentId === '') break;
        if (lineageSet.has(parentId) || !byId[parentId]) break;
        rootId = parentId;
        lineageSet.add(rootId);
      }

      const seen = new Set();
      const nodes = [];
      let seq = 0;

      const visit = (id, parentId, depth, address) => {
        if (seen.has(id)) return null;
        seen.add(id);

        const summary = byId[id] || EMPTY_OBJECT;
        const snapshot = projections[id];
        const values = snapshot && snapshot.values && typeof snapshot.values === 'object'
          ? snapshot.values
          : EMPTY_OBJECT;
        const rawCatalog = values.subagentCatalog;
        const entries = Array.isArray(rawCatalog) ? rawCatalog : [];
        const status = statuses && typeof statuses.get === 'function' ? statuses.get(id) : undefined;
        const running = status && typeof status.running === 'boolean'
          ? status.running
          : summary.running === true;
        const projectionValues = summary.projectionValues && typeof summary.projectionValues === 'object'
          ? summary.projectionValues
          : EMPTY_OBJECT;
        const timingValue = projectionValues.subagentTiming || values.subagentTiming;
        const tokenValue = projectionValues.tokenUsage || values.tokenUsage;
        const timing = timingValue && typeof timingValue === 'object' ? timingValue : undefined;
        const tokenUsage = tokenValue && typeof tokenValue === 'object' ? tokenValue : undefined;
        const costUsageValue = values.costUsage || projectionValues.costUsage;
        const costUsage = costUsageValue && typeof costUsageValue === 'object' ? costUsageValue : undefined;
        const cost = costUsage && typeof costUsage.cost === 'number' && Number.isFinite(costUsage.cost)
          ? costUsage.cost
          : null;
        const rawTodos = Array.isArray(values.todos)
          ? values.todos
          : Array.isArray(projectionValues.todos)
            ? projectionValues.todos
            : null;
        if (Array.isArray(rawTodos)) {
          if (rawTodos.length > 0) lastTodosBySession.set(id, rawTodos);
          else lastTodosBySession.delete(id);
        }
        let todos = rawTodos;
        if (id === rootId && rootId === currentId && Array.isArray(liveRootTodos)) {
          if (liveRootTodos.length > 0) lastTodosBySession.set(id, liveRootTodos);
          else lastTodosBySession.delete(id);
          todos = liveRootTodos;
        }
        if ((!Array.isArray(todos) || todos.length === 0) && lastTodosBySession.has(id)) {
          todos = lastTodosBySession.get(id);
        }
        const rawTitle = (address && address.label) || summary.title || shortId(id);
        const parsed = parsePriority(rawTitle, depth);
        const blank = summary.blank === true;
        const todosDone = Array.isArray(todos)
          && todos.length > 0
          && todos.every((item) => item && item.status === 'completed');
        const completed = !running && (todosDone || (timing !== undefined && timing.lastTurnCompleted === true));
        const pending = !running && !completed && blank;
        const ended = !running && !completed && !pending;

        seq += 1;
        const node = {
          id,
          parentId: parentId || null,
          depth,
          seq,
          title: parsed.title,
          priority: parsed.priority,
          explicitPriority: parsed.explicit,
          mode: address ? address.mode : 'root',
          address: address || null,
          summary,
          values,
          timing,
          tokenUsage,
          costUsage,
          cost,
          todos,
          running,
          completed,
          pending,
          ended,
          blank,
          isCurrent: id === currentId,
          children: [],
          catalogKnown: Array.isArray(rawCatalog),
          catalogState: snapshot ? snapshot.state : 'missing',
          catalogError: snapshot ? snapshot.error : undefined,
        };
        nodes.push(node);

        for (const entry of entries) {
          if (!entry || typeof entry.id !== 'string' || entry.id === '') continue;
          const child = visit(entry.id, id, depth + 1, {
            parentSessionId: id,
            childSessionId: entry.id,
            mode: entry.mode,
            label: entry.label,
          });
          if (child !== null) node.children.push(child);
        }
        return node;
      };

      const root = visit(rootId, null, 0, null);
      if (root === null) {
        return { root: null, rootId, currentId, nodes, lineage: [] };
      }
      decorate(root);

      const lineage = [];
      const guard = new Set();
      let cursor = currentId;
      while (cursor && !guard.has(cursor)) {
        guard.add(cursor);
        lineage.unshift(cursor);
        if (cursor === rootId) break;
        const summary = byId[cursor];
        if (!summary || typeof summary.parentId !== 'string') break;
        cursor = summary.parentId;
      }

      return { root, rootId, currentId, nodes, lineage };
    }

    function matchesFilter(node, filter) {
      if (filter === 'running') return node.running;
      if (filter === 'done') return node.completed;
      if (filter === 'attention') return node.ended && node.mode !== 'external';
      return true;
    }

    function filterTree(node, query, filter) {
      const children = [];
      for (const child of node.children) {
        const kept = filterTree(child, query, filter);
        if (kept !== null) children.push(kept);
      }
      const haystack = (node.title + ' ' + node.id + ' ' + node.mode).toLowerCase();
      const selfMatch = (query === '' || haystack.indexOf(query) >= 0) && matchesFilter(node, filter);
      if (!selfMatch && children.length === 0) return null;
      return Object.assign({}, node, { children, selfMatch, filtered: true });
    }

    function countMatches(node) {
      let total = node.selfMatch ? 1 : 0;
      for (const child of node.children) total += countMatches(child);
      return total;
    }

    function escapeSelector(value) {
      if (typeof CSS !== 'undefined' && CSS && typeof CSS.escape === 'function') return CSS.escape(value);
      return String(value).replace(/["\\]/g, '\\$&');
    }

    /* ------------------------------------------------------------------ */
    /* Styles                                                             */
    /* ------------------------------------------------------------------ */

    const CSS = `
.agt-root {
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  overflow: auto;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-base);
  font-size: 13px;
  line-height: 1.45;
}
.agt-root *, .agt-root *::before, .agt-root *::after { box-sizing: border-box; }
.agt-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1040px;
  height: 100%;
  min-height: 0;
  margin: 0 auto;
  padding: 16px 20px 28px;
}
.agt-header {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 0 0 6px;
}
.agt-heading { min-width: 0; }
.agt-title-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
.agt-page-title {
  margin: 0;
  font-size: 20px;
  line-height: 28px;
  font-weight: 620;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.agt-live {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  padding: 1px 7px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
  line-height: 16px;
}
.agt-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dsw-alias-brand-primary);
  animation: agt-pulse 1.4s ease-in-out infinite;
}
.agt-subtitle {
  margin-top: 2px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.agt-summary-line {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 3px;
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
  line-height: 14px;
}
.agt-summary-item { display: inline-flex; align-items: center; }
.agt-summary-item + .agt-summary-item::before {
  content: "·";
  margin: 0 6px;
  color: var(--dsw-alias-label-secondary);
}
.agt-summary-pct {
  color: var(--dsw-alias-brand-primary);
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.agt-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.agt-icon-button:hover:not(:disabled) {
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
}
.agt-icon-button:disabled { opacity: 0.55; cursor: default; }
.agt-icon-button:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
.agt-actions { display: flex; align-items: center; gap: 6px; flex: none; }
.agt-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
.agt-button:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary);
  border-color: var(--dsw-alias-border-l2);
}
.agt-button:active:not(:disabled) { transform: translateY(1px); }
.agt-button:disabled { opacity: 0.55; cursor: default; }
.agt-button:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
.agt-stats { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 14px; }
.agt-stat {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 5px 9px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
}
.agt-stat-value { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }
.agt-stat-label { color: var(--dsw-alias-label-secondary); font-size: 11px; }
.agt-overall {
  margin-bottom: 14px;
  padding: 14px 16px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
}
.agt-overall-head { display: flex; align-items: center; gap: 10px; }
.agt-overall-title { font-weight: 600; }
.agt-overall-value {
  margin-left: auto;
  font-size: 20px;
  line-height: 24px;
  font-weight: 640;
  font-variant-numeric: tabular-nums;
}
.agt-overall-bar {
  height: 7px;
  margin: 10px 0 7px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  overflow: hidden;
}
.agt-overall-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--dsw-alias-brand-primary);
  transition: width 0.3s ease;
}
.agt-overall-fill.is-indeterminate {
  width: 34%;
  animation: agt-slide 1.5s ease-in-out infinite;
}
.agt-overall-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
}
.agt-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.agt-search { position: relative; display: inline-flex; align-items: center; }
.agt-search-icon {
  position: absolute;
  left: 9px;
  color: var(--dsw-alias-label-secondary);
  pointer-events: none;
}
.agt-search-input {
  width: 220px;
  height: 30px;
  padding: 0 10px 0 28px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  outline: none;
}
.agt-search-input::placeholder { color: var(--dsw-alias-label-secondary); }
.agt-search-input:focus {
  border-color: var(--dsw-alias-brand-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent);
}
.agt-filters {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
}
.agt-filter {
  height: 26px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
.agt-filter:hover { color: var(--dsw-alias-label-primary); }
.agt-filter.is-active {
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);
}
.agt-filter:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}
.agt-toolbar-spacer { flex: 1 1 auto; min-width: 0; }
.agt-toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.agt-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin: 0 0 12px;
}
.agt-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
}
.agt-tree-wrap {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}
.agt-tree {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}
.agt-node { position: relative; }
.agt-row { display: flex; align-items: flex-start; gap: 6px; }
.agt-toggle {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 30px;
  margin-top: 8px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.agt-toggle:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.agt-toggle svg { transition: transform 0.14s ease; }
.agt-toggle.is-open svg { transform: rotate(90deg); }
.agt-toggle-space { flex: none; width: 22px; height: 1px; }
.agt-card {
  flex: 0 1 380px;
  width: min(100%, 380px);
  min-width: 0;
  min-height: 96px;
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-label-primary);
  border-radius: 8px;
  background: var(--dsw-alias-bg-base);
  cursor: pointer;
  transition: background-color 0.14s ease;
}
.agt-card:hover { background: var(--dsw-alias-bg-layer-1); }
.agt-card:focus-visible {
  outline: 2px solid var(--dsw-alias-label-primary);
  outline-offset: 2px;
}
.agt-card.is-current { cursor: default; }
.agt-card.is-external { cursor: default; }
.agt-card.is-chart {
  flex: none;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.agt-card.is-chart .agt-title {
  height: 34px;
  margin: 4px 0 6px;
  font-size: 12px;
  line-height: 17px;
  -webkit-line-clamp: 2;
}
.agt-card.is-chart .agt-card-foot { margin-top: 4px; }
.agt-layouts {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: 7px;
  background: var(--dsw-alias-bg-layer-2);
}
.agt-layout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.agt-layout:hover { color: var(--dsw-alias-label-primary); }
.agt-layout.is-active {
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);
}
.agt-layout:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}
.agt-canvas-scroll {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  width: 100%;
  max-width: 100%;
  min-height: 280px;
  overflow: hidden;
  border-radius: 12px;
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.agt-canvas-scroll.is-panning { cursor: grabbing; }
.agt-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 12px;
  background-color: var(--dsw-alias-bg-base);
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--dsw-alias-border-l1) 55%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--dsw-alias-border-l1) 55%, transparent) 1px, transparent 1px);
  background-size: 24px 24px;
}
.agt-canvas-links {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.agt-canvas-inner {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  will-change: transform;
}
.agt-link {
  fill: none;
  stroke: var(--dsw-alias-border-l2);
  stroke-width: 1.5;
}
.agt-link.is-active {
  stroke: var(--dsw-alias-brand-primary);
  stroke-width: 2;
}
.agt-canvas-hint {
  position: absolute;
  right: 10px;
  bottom: 8px;
  z-index: 3;
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--dsw-alias-bg-base);
  background: color-mix(in srgb, var(--dsw-alias-bg-base) 82%, transparent);
  color: var(--dsw-alias-label-secondary);
  font-size: 9px;
  line-height: 14px;
  pointer-events: none;
  opacity: 0.85;
}
.agt-canvas-node { position: absolute; z-index: 1; }
.agt-canvas-toggle {
  position: absolute;
  left: 50%;
  bottom: -10px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 50%;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  transform: translateX(-50%);
}
.agt-canvas-toggle:hover {
  color: var(--dsw-alias-label-primary);
  border-color: var(--dsw-alias-border-l2);
}
.agt-canvas-toggle svg { transition: transform 0.14s ease; }
.agt-canvas-toggle.is-open svg { transform: rotate(90deg); }
.agt-canvas-toggle:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
.agt-empty.is-chart {
  max-width: 560px;
  margin: 18px auto 0;
}
.agt-card-top { display: flex; align-items: center; gap: 6px; min-width: 0; }
.agt-seq {
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  flex: none;
}
.agt-priority {
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 5px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.02em;
  flex: none;
}
.agt-priority.p0 {
  color: var(--dsw-alias-brand-primary);
  background: var(--dsw-alias-bg-layer-2);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);
}
.agt-priority.p1 {
  color: var(--dsw-alias-state-warn-primary);
  background: var(--dsw-alias-bg-layer-2);
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 16%, transparent);
}
.agt-priority.p2 {
  color: var(--dsw-alias-state-idle-primary);
  background: var(--dsw-alias-bg-layer-2);
  background: color-mix(in srgb, var(--dsw-alias-state-idle-primary) 18%, transparent);
}
.agt-priority.p3 {
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-bg-layer-2);
}
.agt-current-badge {
  flex: none;
  padding: 0 4px;
  border: 1px solid var(--dsw-alias-label-primary);
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-size: 9px;
  line-height: 14px;
  font-weight: 500;
}
.agt-node-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 14px;
  height: 14px;
}
.agt-node-spinner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent);
  border-top-color: var(--dsw-alias-label-primary);
  animation: agt-spin 0.8s linear infinite;
}
.agt-node-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dsw-alias-state-idle-primary);
}
.agt-node-dot.is-success { background: var(--dsw-alias-state-success-primary); }
.agt-node-dot.is-error { background: var(--dsw-alias-state-error-primary); }
.agt-node-dot.is-idle { background: var(--dsw-alias-state-idle-primary); }
.agt-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 5px 0 8px;
  font-size: 13px;
  line-height: 18px;
  font-weight: 520;
  white-space: normal;
  word-break: break-word;
}
.agt-progress-row { display: flex; align-items: center; gap: 8px; }
.agt-progress {
  flex: 1 1 auto;
  height: 5px;
  min-width: 40px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent);
  overflow: hidden;
}
.agt-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--dsw-alias-label-primary);
  transition: width 0.2s ease;
}
.agt-progress-label {
  flex: none;
  min-width: 38px;
  text-align: right;
  color: var(--dsw-alias-label-secondary);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
}
.agt-card-foot {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
  color: var(--dsw-alias-label-secondary);
  font-size: 9px;
  line-height: 13px;
  font-variant-numeric: tabular-nums;
}
.agt-foot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
.agt-foot-item {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.agt-children {
  position: relative;
  margin-left: 10px;
  padding-left: 26px;
}
.agt-children::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-left: 1px solid var(--dsw-alias-border-l2);
}
.agt-child { position: relative; padding: 4px 0; }
.agt-child::before {
  content: "";
  position: absolute;
  left: -26px;
  top: 27px;
  width: 22px;
  border-top: 1px solid var(--dsw-alias-border-l2);
}
.agt-child:last-child::after {
  content: "";
  position: absolute;
  left: -27px;
  top: 27px;
  bottom: -4px;
  width: 2px;
  background: var(--dsw-alias-bg-base);
}
.agt-node.is-active > .agt-children::before {
  border-color: var(--dsw-alias-brand-primary);
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, var(--dsw-alias-border-l2));
}
.agt-node.is-active > .agt-children > .agt-child::before {
  border-color: var(--dsw-alias-brand-primary);
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, var(--dsw-alias-border-l2));
}
.agt-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 0 34px;
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
}
.agt-loading::before {
  content: "";
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  animation: agt-spin 0.9s linear infinite;
}
.agt-node-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0 0 34px;
  color: var(--dsw-alias-state-error-primary);
  font-size: 10px;
}
.agt-retry {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-brand-primary);
  font: inherit;
  font-size: 10px;
  text-decoration: underline;
  cursor: pointer;
}
.agt-empty {
  margin: 18px 0 0 34px;
  padding: 20px;
  border: 1px dashed var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
}
.agt-empty-icon { color: var(--dsw-alias-label-secondary); margin-bottom: 8px; }
.agt-empty-title { font-weight: 600; margin-bottom: 4px; }
.agt-empty-body { color: var(--dsw-alias-label-secondary); font-size: 12px; max-width: 640px; }
.agt-empty-hint {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
}
.agt-footer {
  margin-top: 22px;
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
  line-height: 15px;
}
.agt-sidebar-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.agt-sidebar-trigger:hover {
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
}
.agt-sidebar-trigger:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
.agt-root.is-sidebar .agt-page {
  max-width: none;
  padding: 10px 10px 18px;
}
.agt-root.is-sidebar .agt-header {
  position: static;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  padding: 0 0 8px;
  background: transparent;
  backdrop-filter: none;
}
.agt-root.is-sidebar .agt-page-title { font-size: 16px; line-height: 22px; }
.agt-root.is-sidebar .agt-subtitle { font-size: 11px; white-space: normal; }
.agt-root.is-sidebar .agt-actions { align-self: flex-start; }
.agt-root.is-sidebar .agt-stats { gap: 6px; margin: 8px 0 10px; }
.agt-root.is-sidebar .agt-stat { padding: 3px 7px; }
.agt-root.is-sidebar .agt-stat-value { font-size: 13px; }
.agt-root.is-sidebar .agt-stat-label { font-size: 10px; }
.agt-root.is-sidebar .agt-overall { margin-bottom: 10px; padding: 10px 12px; }
.agt-root.is-sidebar .agt-overall-value { font-size: 17px; }
.agt-root.is-sidebar .agt-overall-bar { margin: 8px 0 5px; }
.agt-root.is-sidebar .agt-overall-detail { font-size: 10px; }
.agt-root.is-sidebar .agt-toolbar { gap: 6px; margin-bottom: 8px; }
.agt-root.is-sidebar .agt-search { flex: 1 1 100%; }
.agt-root.is-sidebar .agt-search-input { width: 100%; }
.agt-root.is-sidebar .agt-filters { width: 100%; overflow-x: auto; }
.agt-root.is-sidebar .agt-filter { flex: 0 0 auto; padding: 0 8px; }
.agt-root.is-sidebar .agt-toolbar-spacer { display: none; }
.agt-root.is-sidebar .agt-toolbar-actions { width: 100%; margin-left: 0; }
.agt-root.is-sidebar .agt-legend { gap: 4px 10px; margin-bottom: 8px; }
.agt-root.is-sidebar .agt-card {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
}
.agt-root.is-sidebar .agt-children { margin-left: 4px; padding-left: 18px; }
.agt-root.is-sidebar .agt-child::before { left: -18px; width: 14px; }
.agt-root.is-sidebar .agt-child:last-child::after { left: -19px; }
.agt-root.is-sidebar .agt-empty { margin-left: 0; padding: 14px; }
.agt-root.is-sidebar .agt-empty.is-chart { margin: 12px auto 0; }
.agt-root.is-sidebar .agt-summary-line { font-size: 9px; }
.agt-root.is-sidebar .agt-canvas { background-size: 20px 20px; }
.agt-root.is-sidebar .agt-card.is-chart .agt-card-foot { font-size: 8.5px; }
.agt-root.is-sidebar .agt-footer { margin-top: 14px; }
.agt-error-fallback { padding: 24px; color: var(--dsw-alias-state-error-primary); }
@keyframes agt-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.78); }
}
@keyframes agt-slide {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(340%); }
}
@keyframes agt-spin {
  to { transform: rotate(360deg); }
}
@media (max-width: 720px) {
  .agt-page { padding: 14px 14px 36px; }
  .agt-header { flex-direction: column; gap: 10px; }
  .agt-actions { width: 100%; flex-wrap: wrap; }
  .agt-card { flex: 1 1 auto; width: auto; }
  .agt-search-input { width: 100%; }
  .agt-search { flex: 1 1 100%; }
  .agt-search-input { width: 100%; }
  .agt-toolbar-spacer { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .agt-live-dot, .agt-status-dot.running, .agt-progress-fill.indeterminate,
  .agt-overall-fill.is-indeterminate, .agt-loading::before { animation: none; }
  .agt-card, .agt-progress-fill, .agt-overall-fill { transition: none; }
}
`;

    /* ------------------------------------------------------------------ */
    /* Icons                                                              */
    /* ------------------------------------------------------------------ */

    function TreeIcon(props) {
      const size = props && typeof props.size === 'number' ? props.size : 18;
      return h('svg', {
        width: size, height: size, viewBox: '0 0 20 20', fill: 'none',
        'aria-hidden': 'true', focusable: 'false',
      },
        h('rect', { x: 1.75, y: 2.25, width: 8.5, height: 6.5, rx: 2, stroke: 'currentColor', strokeWidth: 1.5 }),
        h('rect', { x: 12.25, y: 2.25, width: 6, height: 5, rx: 1.5, stroke: 'currentColor', strokeWidth: 1.5 }),
        h('rect', { x: 12.25, y: 13.25, width: 6, height: 5, rx: 1.5, stroke: 'currentColor', strokeWidth: 1.5 }),
        h('path', { d: 'M10.25 5.5h2M6 8.75v4a2 2 0 0 0 2 2h4.25', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' })
      );
    }

    function ChartLayoutIcon() {
      return h('svg', {
        width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none',
        'aria-hidden': 'true', focusable: 'false',
      },
        h('rect', { x: 5, y: 1.5, width: 6, height: 4, rx: 1.2, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('rect', { x: 1.5, y: 10.5, width: 5, height: 4, rx: 1, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('rect', { x: 9.5, y: 10.5, width: 5, height: 4, rx: 1, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('path', { d: 'M8 5.5v3M4 10.5V9h8v1.5', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round' })
      );
    }

    function ListLayoutIcon() {
      return h('svg', {
        width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none',
        'aria-hidden': 'true', focusable: 'false',
      },
        h('path', {
          d: 'M2.2 3.4h2.2M6.4 3.4h7.4M2.2 8h2.2M6.4 8h7.4M2.2 12.6h2.2M6.4 12.6h7.4',
          stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round',
        })
      );
    }

    function AgentTreesSidebarButton(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const openSidebar = typeof props.openSidebar === 'function' ? props.openSidebar : () => {};
      const autoOpenSidebar = typeof props.autoOpenSidebar === 'function' ? props.autoOpenSidebar : () => {};
      const sessionId = props.sessionId;

      const useSessions = typeof props.useSessions === 'function'
        ? props.useSessions
        : (selector) => selector(EMPTY_STATE);
      const useSessionStatus = typeof props.useSessionStatus === 'function'
        ? props.useSessionStatus
        : (selector) => selector(undefined);
      const byId = useSessions((state) => (state || EMPTY_STATE).byId) || EMPTY_OBJECT;
      const projections = useSessions((state) => (state || EMPTY_STATE).projectionsBySession) || EMPTY_OBJECT;
      const statuses = useSessionStatus((value) => value);
      const autoModel = React.useMemo(
        () => buildTree(sessionId, byId, projections, statuses),
        [sessionId, byId, projections, statuses]
      );
      const autoStartedRef = React.useRef(0);

      React.useEffect(() => {
        if (typeof sessionId !== 'string' || sessionId === '' || autoOpenedSessions.has(sessionId)) return undefined;
        const current = byId[sessionId];
        if (!current || current.origin === 'subagent') return undefined;
        if (autoModel.nodes.length < AUTO_OPEN_MIN_AGENTS || !autoModel.nodes.some((node) => node.running)) {
          autoStartedRef.current = 0;
          return undefined;
        }
        if (autoStartedRef.current === 0) autoStartedRef.current = Date.now();
        const check = () => {
          if (autoOpenedSessions.has(sessionId)) return;
          if (!autoModel.nodes.some((node) => node.running)) {
            autoStartedRef.current = 0;
            return;
          }
          if (Date.now() - autoStartedRef.current < AUTO_OPEN_MIN_MS) return;
          autoOpenedSessions.add(sessionId);
          autoOpenSidebar();
        };
        check();
        const timer = window.setInterval(check, 5000);
        return () => window.clearInterval(timer);
      }, [sessionId, byId, autoModel, autoOpenSidebar]);

      return h('button', {
        type: 'button',
        className: 'agt-sidebar-trigger',
        title: t('sidebar.open'),
        'aria-label': t('sidebar.aria'),
        onClick: (event) => {
          event.preventDefault();
          event.stopPropagation();
          openSidebar();
        },
      }, h(TreeIcon, { size: 16 }));
    }

    function ChevronIcon() {
      return h('svg', {
        width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none',
        'aria-hidden': 'true', focusable: 'false',
      }, h('path', {
        d: 'M6 3.5 10.5 8 6 12.5',
        stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
      }));
    }

    function RefreshIcon() {
      return h('svg', {
        width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none',
        'aria-hidden': 'true', focusable: 'false',
      },
        h('path', {
          d: 'M13.2 6.1A5.5 5.5 0 1 0 13.5 10',
          stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round',
        }),
        h('path', {
          d: 'M13.5 2.9v3.6H9.9',
          stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
        })
      );
    }

    function LocateIcon() {
      return h('svg', {
        width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none',
        'aria-hidden': 'true', focusable: 'false',
      },
        h('circle', { cx: 8, cy: 8, r: 3, stroke: 'currentColor', strokeWidth: 1.5 }),
        h('path', {
          d: 'M8 1.2v2.4M8 12.4v2.4M1.2 8h2.4M12.4 8h2.4',
          stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round',
        })
      );
    }

    function SearchIcon() {
      return h('svg', {
        width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none',
        'aria-hidden': 'true', focusable: 'false',
      },
        h('circle', { cx: 7, cy: 7, r: 4.5, stroke: 'currentColor', strokeWidth: 1.5 }),
        h('path', { d: 'm10.4 10.4 3.1 3.1', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' })
      );
    }

    /* ------------------------------------------------------------------ */
    /* View                                                               */
    /* ------------------------------------------------------------------ */

    function AgentTreesView(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const sessionId = props.sessionId;
      const host = props.host === 'sidebar' ? 'sidebar' : 'main';
      const refreshProjections = typeof props.refreshProjections === 'function'
        ? props.refreshProjections
        : () => {};
      const openSession = typeof props.openSession === 'function' ? props.openSession : () => {};

      const useSessions = typeof props.useSessions === 'function'
        ? props.useSessions
        : (selector) => selector(EMPTY_STATE);
      const useSessionStatus = typeof props.useSessionStatus === 'function'
        ? props.useSessionStatus
        : (selector) => selector(undefined);
      const useProjection = typeof props.useProjection === 'function'
        ? props.useProjection
        : () => undefined;

      const liveRootTodos = useProjection('todos');
      const byId = useSessions((state) => (state || EMPTY_STATE).byId) || EMPTY_OBJECT;
      const projections = useSessions((state) => (state || EMPTY_STATE).projectionsBySession) || EMPTY_OBJECT;
      const statuses = useSessionStatus((value) => value);

      const model = React.useMemo(
        () => buildTree(sessionId, byId, projections, statuses, liveRootTodos),
        [sessionId, byId, projections, statuses, liveRootTodos]
      );

      const [collapsed, setCollapsed] = React.useState(() => new Set());
      const [query, setQuery] = React.useState('');
      const [filter, setFilter] = React.useState('all');
      const [layout, setLayout] = React.useState('chart');
      const [view, setView] = React.useState({ x: 0, y: 0, zoom: 1 });
      const [panning, setPanning] = React.useState(false);
      const [now, setNow] = React.useState(() => Date.now());
      const [refreshing, setRefreshing] = React.useState(false);
      const requestedRef = React.useRef(new Map());
      const rootRef = React.useRef(null);
      const canvasHostRef = React.useRef(null);
      const panDragRef = React.useRef(null);
      const chartSizeRef = React.useRef({ w: 0, h: 0 });
      const refreshTimerRef = React.useRef(null);

      const anyRunning = model.nodes.some((node) => node.running);
      const filterActive = query.trim() !== '' || filter !== 'all';
      const forceOpen = filterActive;

      const displayedRoot = React.useMemo(() => {
        if (!model.root) return null;
        if (!filterActive) return model.root;
        return filterTree(model.root, query.trim().toLowerCase(), filter);
      }, [model.root, query, filter, filterActive]);

      const hasChart = layout === 'chart' && displayedRoot !== null;

      React.useEffect(() => {
        if (!hasChart) return undefined;
        const host = canvasHostRef.current;
        if (!host) return undefined;
        const handleWheel = (event) => {
          event.preventDefault();
          const size = chartSizeRef.current;
          if (!size || !size.w || !size.h) return;
          const hostElement = canvasHostRef.current;
          if (!hostElement) return;
          const rect = hostElement.getBoundingClientRect();
          const cursorX = event.clientX - rect.left;
          const cursorY = event.clientY - rect.top;
          const delta = event.deltaMode === 1
            ? event.deltaY * 16
            : event.deltaMode === 2
              ? event.deltaY * 100
              : event.deltaY;
          if (delta === 0) return;
          const factor = Math.exp(-delta * 0.0015);
          setView((current) => {
            const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.zoom * factor));
            if (Math.abs(nextZoom - current.zoom) < 0.0001) return current;
            const centerX = hostElement.clientWidth / 2;
            const centerY = hostElement.clientHeight / 2;
            const localX = (cursorX - centerX - current.x) / current.zoom + size.w / 2;
            const localY = (cursorY - centerY - current.y) / current.zoom + size.h / 2;
            let nextX = cursorX - centerX - (localX - size.w / 2) * nextZoom;
            let nextY = cursorY - centerY - (localY - size.h / 2) * nextZoom;
            const maxX = Math.max(0, (size.w * nextZoom + hostElement.clientWidth) / 2 - 100);
            const maxY = Math.max(0, (size.h * nextZoom + hostElement.clientHeight) / 2 - 100);
            nextX = Math.min(maxX, Math.max(-maxX, nextX));
            nextY = Math.min(maxY, Math.max(-maxY, nextY));
            return { x: nextX, y: nextY, zoom: nextZoom };
          });
        };
        host.addEventListener('wheel', handleWheel, { passive: false });
        return () => host.removeEventListener('wheel', handleWheel);
      }, [hasChart, sessionId]);

      const matchCount = filterActive
        ? (displayedRoot ? countMatches(displayedRoot) : 0)
        : model.nodes.length;
      const finishedAgents = model.nodes.filter((node) => !node.running && !node.pending).length;
      const runningAgents = model.nodes.filter((node) => node.running).length;
      const completedAgents = model.nodes.filter((node) => node.completed).length;
      const totalTokens = model.nodes.reduce((sum, node) => sum + tokenTotal(node.tokenUsage), 0);

      const progressValues = model.nodes.map((node) => nodeProgress(node)).filter((value) => value.pct !== null);
      const rootProgress = model.root ? nodeProgress(model.root) : null;
      const useRootPlan = !!(rootProgress && rootProgress.total && rootProgress.total > 0);
      const rootRunningUnknown = !!(model.root && model.root.running && !useRootPlan);
      let overallPct;
      if (useRootPlan) {
        overallPct = rootProgress.pct;
      } else if (rootRunningUnknown) {
        overallPct = model.nodes.length > 0
          ? Math.round((finishedAgents / model.nodes.length) * 100)
          : null;
      } else if (progressValues.length > 0) {
        overallPct = Math.round(progressValues.reduce((sum, value) => sum + value.pct, 0) / progressValues.length);
      } else {
        overallPct = finishedAgents === model.nodes.length && model.nodes.length > 0 ? 100 : null;
      }
      if (overallPct !== null && anyRunning) overallPct = Math.min(99, overallPct);
      const overallIndeterminate = (overallPct === null && anyRunning)
        || (rootRunningUnknown && finishedAgents === 0);
      const overallHint = useRootPlan
        ? 'overall.rootPlan'
        : rootRunningUnknown
          ? 'overall.finishedRatio'
          : 'overall.estimate';

      React.useEffect(() => {
        if (!sessionId) return;
        requestedRef.current.set(sessionId, Date.now());
        refreshProjections(sessionId);
      }, [sessionId, refreshProjections]);

      React.useEffect(() => {
        if (!model.root) return;
        const nowMs = Date.now();
        for (const node of model.nodes) {
          const snapshot = projections ? projections[node.id] : undefined;
          const values = snapshot && snapshot.values ? snapshot.values : null;
          if (values && values.subagentCatalog !== undefined) continue;
          if (snapshot && (snapshot.state === 'loading' || snapshot.state === 'error' || snapshot.state === 'migration-required')) continue;
          const last = requestedRef.current.get(node.id) || 0;
          if (nowMs - last < 4000) continue;
          requestedRef.current.set(node.id, nowMs);
          refreshProjections(node.id);
        }
      }, [model, projections, refreshProjections]);

      React.useEffect(() => {
        if (!anyRunning) return undefined;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
      }, [anyRunning]);

      React.useEffect(() => {
        const at = Date.now();
        for (const node of model.nodes) {
          const entry = observedRunStarts.get(node.id);
          if (node.running) {
            if (!entry || entry.stoppedAt) observedRunStarts.set(node.id, { startedAt: at, stoppedAt: 0 });
          } else if (entry && !entry.stoppedAt) {
            observedRunStarts.set(node.id, { ...entry, stoppedAt: at });
          }
        }
      }, [model, now]);

      React.useEffect(() => {
        setView({ x: 0, y: 0, zoom: 1 });
        setPanning(false);
        panDragRef.current = null;
      }, [sessionId, layout]);

      React.useEffect(() => () => {
        if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
      }, []);

      const toggle = (id) => {
        setCollapsed((previous) => {
          const next = new Set(previous);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      };

      const expandAll = () => setCollapsed(new Set());

      const collapseAll = () => {
        const ids = model.nodes.filter((node) => node.children.length > 0).map((node) => node.id);
        setCollapsed(new Set(ids));
      };

      const revealCurrent = () => {
        setCollapsed((previous) => {
          const next = new Set(previous);
          for (const id of model.lineage) next.delete(id);
          return next;
        });
        window.setTimeout(() => {
          const host = rootRef.current;
          if (!host || !model.currentId) return;
          const target = host.querySelector('[data-agt-id="' + escapeSelector(model.currentId) + '"]');
          if (target && typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }, 40);
      };

      const refreshAll = () => {
        requestedRef.current.clear();
        setRefreshing(true);
        const nowMs = Date.now();
        for (const node of model.nodes) {
          requestedRef.current.set(node.id, nowMs);
          refreshProjections(node.id);
        }
        if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = window.setTimeout(() => {
          refreshTimerRef.current = null;
          setRefreshing(false);
        }, 800);
      };

      const open = (node) => {
        if (!node || node.id === model.currentId || node.mode === 'external') return;
        try {
          if (node.parentId) {
            openSession({
              parentSessionId: node.parentId,
              childSessionId: node.id,
              mode: node.mode,
            });
          } else {
            openSession(node.id);
          }
        } catch (error) {
          /* The Host decides whether an address is still openable; ignore stale rows. */
        }
      };

      const onTreeKeyDown = (event) => {
        const host = rootRef.current;
        if (!host) return;
        const key = event.key;
        if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Home' && key !== 'End' && key !== 'ArrowRight' && key !== 'ArrowLeft') return;
        const cards = Array.from(host.querySelectorAll('[data-agt-card="true"]'));
        if (cards.length === 0) return;
        const activeIndex = cards.indexOf(document.activeElement);
        if (key === 'ArrowDown') {
          event.preventDefault();
          cards[Math.min(cards.length - 1, activeIndex + 1)].focus();
          return;
        }
        if (key === 'ArrowUp') {
          event.preventDefault();
          cards[Math.max(0, activeIndex - 1)].focus();
          return;
        }
        if (key === 'Home') {
          event.preventDefault();
          cards[0].focus();
          return;
        }
        if (key === 'End') {
          event.preventDefault();
          cards[cards.length - 1].focus();
          return;
        }
        const active = document.activeElement;
        if (!active || active.getAttribute('data-agt-card') !== 'true') return;
        const id = active.getAttribute('data-agt-id');
        if (!id) return;
        const node = model.nodes.find((entry) => entry.id === id);
        if (!node || node.children.length === 0) return;
        event.preventDefault();
        setCollapsed((previous) => {
          const next = new Set(previous);
          if (key === 'ArrowRight') next.delete(id);
          else next.add(id);
          return next;
        });
      };

      const filters = [
        { id: 'all', label: t('filter.all') },
        { id: 'running', label: t('filter.running') },
        { id: 'done', label: t('filter.done') },
        { id: 'attention', label: t('filter.attention') },
      ];

      const isNodeOpen = (node) => node.children.length > 0 && (forceOpen || !collapsed.has(node.id));

      const makeCard = (node, chart) => {
        const progress = nodeProgress(node);
        const status = statusOf(node, t);
        const statusText = status.text;
        const progressText = progressLabel(progress, t);
        const duration = nodeDuration(node, now);
        const tokens = tokenTotal(node.tokenUsage) || costUsageTokens(node.costUsage);
        const hasChildren = node.children.length > 0;
        const isOpen = isNodeOpen(node);
        const cardClasses = ['agt-card'];
        if (chart) cardClasses.push('is-chart');
        if (node.isCurrent) cardClasses.push('is-current');
        if (node.mode === 'external') cardClasses.push('is-external');
        const dotClass = status.cls === 'completed'
          ? 'is-success'
          : status.cls === 'ended' && node.mode !== 'root'
            ? 'is-error'
            : 'is-idle';
        const roleLabel = node.mode === 'root' ? t('role.main') : t('role.sub');
        const tokenLabel = tokens > 0 ? t('tokens', { value: formatTokens(tokens) }) : '—';
        const costLabel = node.cost !== null ? formatCost(node.cost) : '—';
        const timeLabel = duration > 0 ? formatDuration(duration, t) : '—';

        return h('div', {
          className: cardClasses.join(' '),
          'data-agt-card': 'true',
          'data-agt-id': node.id,
          role: 'treeitem',
          tabIndex: 0,
          'aria-level': node.depth + 1,
          'aria-current': node.isCurrent ? 'true' : undefined,
          'aria-expanded': hasChildren ? isOpen : undefined,
          'aria-label': t('aria.card', { title: node.title, status: statusText, progress: progressText }),
          title: node.isCurrent ? t('badge.current') + ' · ' + node.title : t('card.tooltip', { title: node.title }),
          onClick: () => open(node),
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              open(node);
            }
          },
        },
          h('div', { className: 'agt-card-top' },
            h('span', { className: 'agt-node-status', title: statusText, 'aria-label': statusText },
              node.running
                ? h('span', { className: 'agt-node-spinner' })
                : h('span', { className: 'agt-node-dot ' + dotClass })
            ),
            h('span', {
              className: 'agt-priority ' + node.priority.toLowerCase(),
              title: t('priority.tip.' + node.priority),
            }, node.priority),
            node.isCurrent ? h('span', { className: 'agt-current-badge' }, t('badge.current')) : null
          ),
          h('div', { className: 'agt-title' }, node.title),
          h('div', { className: 'agt-progress-row' },
            h('div', {
              className: 'agt-progress',
              role: 'progressbar',
              'aria-valuemin': 0,
              'aria-valuemax': 100,
              'aria-valuenow': progress.pct === null ? undefined : progress.pct,
              'aria-label': t('aria.progress', { title: node.title }),
            },
              h('div', {
                className: 'agt-progress-fill',
                style: progress.pct === null ? undefined : { width: progress.pct + '%' },
              })
            ),
            h('span', { className: 'agt-progress-label' }, progressText)
          ),
          h('div', { className: 'agt-card-foot' },
            h('div', { className: 'agt-foot-row' },
              h('span', { className: 'agt-foot-item' }, tokenLabel),
              h('span', { className: 'agt-foot-item', title: 'USD' }, costLabel)
            ),
            h('div', { className: 'agt-foot-row' },
              h('span', { className: 'agt-foot-item' }, roleLabel),
              h('span', { className: 'agt-foot-item' }, timeLabel)
            )
          )
        );
      };

      const renderNode = (node) => {
        const hasChildren = node.children.length > 0;
        const isOpen = isNodeOpen(node);
        return h('div', {
          className: 'agt-node' + (node.isActiveBranch ? ' is-active' : ''),
          key: node.id,
          'data-agt-node': node.id,
        },
          h('div', { className: 'agt-row' },
            hasChildren
              ? h('button', {
                type: 'button',
                className: 'agt-toggle' + (isOpen ? ' is-open' : ''),
                tabIndex: -1,
                'aria-label': t(isOpen ? 'action.collapseBranch' : 'action.expandBranch', { title: node.title }),
                onClick: (event) => {
                  event.stopPropagation();
                  toggle(node.id);
                },
              }, h(ChevronIcon))
              : h('span', { className: 'agt-toggle-space' }),
            makeCard(node, false)
          ),
          isOpen ? h('div', { className: 'agt-children', role: 'group' },
            node.children.map((child) => h('div', { className: 'agt-child', key: child.id }, renderNode(child)))
          ) : null,
          !node.catalogKnown && node.mode !== 'external' && node.catalogState !== 'error'
            ? h('div', { className: 'agt-loading' }, t('loading.children'))
            : null,
          node.catalogState === 'error'
            ? h('div', { className: 'agt-node-error' },
              h('span', null, t('error.children')),
              h('button', { type: 'button', className: 'agt-retry', onClick: () => refreshProjections(node.id) }, t('action.retry'))
            )
            : null
        );
      };

      const renderChart = (rootNode) => {
        const metrics = host === 'sidebar'
          ? { w: 220, h: 128, x: 18, y: 52, pad: 14 }
          : { w: 240, h: 132, x: 30, y: 64, pad: 22 };

        const build = (node) => {
          const open = isNodeOpen(node);
          const children = open ? node.children.map(build) : [];
          let childrenWidth = 0;
          children.forEach((child, index) => {
            childrenWidth += child.width;
            if (index > 0) childrenWidth += metrics.x;
          });
          return {
            node,
            open,
            children,
            width: Math.max(metrics.w, childrenWidth),
            childrenWidth,
            left: 0,
            top: 0,
            centerX: 0,
          };
        };

        const layoutRoot = build(rootNode);
        const positioned = [];
        let maxDepth = 0;
        const place = (entry, left, depth) => {
          entry.left = left + (entry.width - metrics.w) / 2;
          entry.centerX = left + entry.width / 2;
          entry.top = metrics.pad + depth * (metrics.h + metrics.y);
          maxDepth = Math.max(maxDepth, depth);
          positioned.push(entry);
          let childLeft = left + (entry.width - entry.childrenWidth) / 2;
          for (const child of entry.children) {
            place(child, childLeft, depth + 1);
            childLeft += child.width + metrics.x;
          }
        };
        place(layoutRoot, metrics.pad, 0);

        const canvasWidth = layoutRoot.width + metrics.pad * 2;
        const canvasHeight = maxDepth * (metrics.h + metrics.y) + metrics.h + metrics.pad * 2;
        chartSizeRef.current = { w: canvasWidth, h: canvasHeight };

        const links = [];
        const walk = (entry) => {
          for (const child of entry.children) {
            const y1 = entry.top + metrics.h;
            const y2 = child.top;
            const midY = y1 + (y2 - y1) * 0.5;
            links.push(h('path', {
              key: entry.node.id + '->' + child.node.id,
              d: 'M ' + entry.centerX + ' ' + y1
                + ' C ' + entry.centerX + ' ' + midY
                + ', ' + child.centerX + ' ' + midY
                + ', ' + child.centerX + ' ' + y2,
              className: 'agt-link' + (child.node.isActiveBranch ? ' is-active' : ''),
            }));
            walk(child);
          }
        };
        walk(layoutRoot);

        const onCanvasPointerDown = (event) => {
          if (event.button !== 0) return;
          const target = event.target;
          if (target && typeof target.closest === 'function'
            && (target.closest('[data-agt-card="true"]') || target.closest('button'))) return;
          const hostElement = canvasHostRef.current;
          if (!hostElement) return;
          panDragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            panX: view.x,
            panY: view.y,
          };
          try {
            if (typeof hostElement.setPointerCapture === 'function') hostElement.setPointerCapture(event.pointerId);
          } catch (error) {
            /* Pointer capture can fail for synthetic events; dragging still works over the canvas. */
          }
          setPanning(true);
          event.preventDefault();
        };

        const onCanvasPointerMove = (event) => {
          const drag = panDragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          const hostElement = canvasHostRef.current;
          const nextX = drag.panX + (event.clientX - drag.startX);
          const nextY = drag.panY + (event.clientY - drag.startY);
          setView((current) => {
            const maxX = hostElement ? Math.max(0, (canvasWidth * current.zoom + hostElement.clientWidth) / 2 - 100) : 1200;
            const maxY = hostElement ? Math.max(0, (canvasHeight * current.zoom + hostElement.clientHeight) / 2 - 100) : 1200;
            return {
              ...current,
              x: Math.min(maxX, Math.max(-maxX, nextX)),
              y: Math.min(maxY, Math.max(-maxY, nextY)),
            };
          });
        };

        const endCanvasDrag = (event) => {
          const drag = panDragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          panDragRef.current = null;
          setPanning(false);
        };

        const onCanvasDoubleClick = (event) => {
          const target = event.target;
          if (target && typeof target.closest === 'function'
            && (target.closest('[data-agt-card="true"]') || target.closest('button'))) return;
          setView({ x: 0, y: 0, zoom: 1 });
        };

        return h('div', {
          className: 'agt-canvas-scroll' + (panning ? ' is-panning' : ''),
          ref: canvasHostRef,
          onPointerDown: onCanvasPointerDown,
          onPointerMove: onCanvasPointerMove,
          onPointerUp: endCanvasDrag,
          onPointerCancel: endCanvasDrag,
          onLostPointerCapture: endCanvasDrag,
          onDoubleClick: onCanvasDoubleClick,
        },
          h('div', { className: 'agt-canvas' },
            h('div', {
              className: 'agt-canvas-inner',
              style: {
                width: canvasWidth + 'px',
                height: canvasHeight + 'px',
                transform: 'translate(-50%, -50%) translate(' + view.x + 'px, ' + view.y + 'px) scale(' + view.zoom + ')',
              },
            },
              h('svg', {
                className: 'agt-canvas-links',
                width: canvasWidth,
                height: canvasHeight,
                viewBox: '0 0 ' + canvasWidth + ' ' + canvasHeight,
                'aria-hidden': 'true',
              }, links),
              positioned.map((entry) => h('div', {
                key: entry.node.id,
                className: 'agt-canvas-node',
                role: 'presentation',
                style: {
                  left: entry.left + 'px',
                  top: entry.top + 'px',
                  width: metrics.w + 'px',
                  height: metrics.h + 'px',
                },
              },
                makeCard(entry.node, true),
                entry.node.children.length > 0
                  ? h('button', {
                    type: 'button',
                    className: 'agt-canvas-toggle' + (entry.open ? ' is-open' : ''),
                    tabIndex: -1,
                    'aria-label': t(entry.open ? 'action.collapseBranch' : 'action.expandBranch', { title: entry.node.title }),
                    onClick: (event) => {
                      event.stopPropagation();
                      toggle(entry.node.id);
                    },
                  }, h(ChevronIcon))
                  : null
              ))
            ),
            h('div', { className: 'agt-canvas-hint' }, t('canvas.hint') + ' · ' + Math.round(view.zoom * 100) + '%')
          )
        );
      };

      return h('div', { className: 'agt-root' + (host === 'sidebar' ? ' is-sidebar' : ''), ref: rootRef },
        h('style', null, CSS),
        h('div', { className: 'agt-page' },
          h('div', { className: 'agt-header' },
            h('div', { className: 'agt-heading' },
              h('div', { className: 'agt-title-row' },
                h(TreeIcon, { size: 20 }),
                h('h2', { className: 'agt-page-title' }, t('title')),
                anyRunning ? h('span', { className: 'agt-live' }, h('span', { className: 'agt-live-dot' }), t('live')) : null
              ),
              h('div', { className: 'agt-subtitle' }, t('subtitle', { title: (model.nodes.find((node) => node.isCurrent) || model.root || { title: '—' }).title }))
            ),
            h('div', { className: 'agt-actions' },
              h('div', { className: 'agt-layouts', role: 'group', 'aria-label': t('layout.label') },
                h('button', {
                  type: 'button',
                  className: 'agt-layout' + (layout === 'chart' ? ' is-active' : ''),
                  title: t('layout.chart'),
                  'aria-label': t('layout.chart'),
                  'aria-pressed': layout === 'chart',
                  onClick: () => setLayout('chart'),
                }, h(ChartLayoutIcon)),
                h('button', {
                  type: 'button',
                  className: 'agt-layout' + (layout === 'list' ? ' is-active' : ''),
                  title: t('layout.list'),
                  'aria-label': t('layout.list'),
                  'aria-pressed': layout === 'list',
                  onClick: () => setLayout('list'),
                }, h(ListLayoutIcon))
              ),
              h('button', {
                type: 'button',
                className: 'agt-icon-button',
                onClick: refreshAll,
                disabled: refreshing,
                title: t('action.refresh'),
                'aria-label': t('action.refresh'),
              }, h(RefreshIcon))
            )
          ),
          h('div', { className: 'agt-summary-line' },
            h('span', { className: 'agt-summary-item' }, String(model.nodes.length) + ' ' + t('stat.agents')),
            h('span', { className: 'agt-summary-item' }, String(runningAgents) + ' ' + t('stat.running')),
            h('span', { className: 'agt-summary-item' }, String(completedAgents) + ' ' + t('stat.done')),
            overallPct === null
              ? null
              : h('span', { className: 'agt-summary-item agt-summary-pct', title: t(overallHint) }, overallPct + '%'),
            totalTokens > 0
              ? h('span', { className: 'agt-summary-item' }, t('tokens', { value: formatTokens(totalTokens) }))
              : null
          ),
          h('div', { className: 'agt-tree-wrap' },
            h('div', {
              className: 'agt-tree',
              role: 'tree',
              'aria-label': t('aria.tree'),
              onKeyDown: onTreeKeyDown,
            },
              displayedRoot
                ? (layout === 'chart' ? renderChart(displayedRoot) : renderNode(displayedRoot))
                : h('div', { className: 'agt-empty' + (layout === 'chart' ? ' is-chart' : '') },
                  h('div', { className: 'agt-empty-title' }, model.root ? t('empty.filtered') : t('empty.title')),
                  h('div', { className: 'agt-empty-body' }, t('empty.body'))
                )
            )
          ),
          !filterActive && model.root && model.root.catalogKnown && model.root.children.length === 0
            ? h('div', { className: 'agt-empty' + (layout === 'chart' ? ' is-chart' : '') },
              h('div', { className: 'agt-empty-icon' }, h(TreeIcon, { size: 28 })),
              h('div', { className: 'agt-empty-title' }, t('empty.title')),
              h('div', { className: 'agt-empty-body' }, t('empty.body')),
              h('div', { className: 'agt-empty-hint' }, t('empty.hint'))
            )
            : null
        )
      );
    }

    /* ------------------------------------------------------------------ */
    /* Error boundary                                                     */
    /* ------------------------------------------------------------------ */

    class AgentTreesBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }

      static getDerivedStateFromError(error) {
        return { error };
      }

      componentDidCatch(error) {
        if (typeof console !== 'undefined' && typeof console.error === 'function') {
          console.error('agent-trees: render failed', error);
        }
      }

      render() {
        if (this.state.error) {
          const t = typeof this.props.t === 'function' ? this.props.t : (key) => key;
          return h('div', { className: 'agt-root' },
            h('div', { className: 'agt-error-fallback' },
              h('div', { className: 'agt-empty-title' }, t('error.render')),
              h('div', { className: 'agt-empty-body' }, String(this.state.error && this.state.error.message || this.state.error))
            )
          );
        }
        return this.props.children;
      }
    }

    function AgentTreesViewSafe(props) {
      return h(AgentTreesBoundary, { t: props.t }, h(AgentTreesView, props));
    }

    /* ------------------------------------------------------------------ */
    /* Client plugin                                                      */
    /* ------------------------------------------------------------------ */

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'agent-trees: dictionaries');
      const t = ctx.locale.bind(NS);

      const refreshProjections = (id) => {
        if (!id) return;
        try {
          const result = ctx.sessions.refreshProjections(id);
          if (result && typeof result.catch === 'function') result.catch(() => {});
        } catch (error) {
          /* Projection refresh is best-effort; the store keeps the last value. */
        }
      };

      const openSession = (target) => {
        try {
          ctx.uiWorkspace.openSession(target);
        } catch (error) {
          /* An address that is no longer openable is ignored. */
        }
      };

      const openSidebar = () => {
        try {
          const sidebar = ctx.get('sidebarRight');
          if (!sidebar) return;
          if (typeof sidebar.openTab === 'function') sidebar.openTab(NS);
          if (typeof sidebar.isExpanded === 'function'
            && typeof sidebar.toggleExpanded === 'function'
            && sidebar.isExpanded() !== true) {
            sidebar.toggleExpanded();
          }
        } catch (error) {
          /* The right Sidebar may be absent or no Session may be on screen. */
        }
      };

      const autoOpenSidebar = () => {
        try {
          const sidebar = ctx.get('sidebarRight');
          if (!sidebar) return;
          const expanded = typeof sidebar.isExpanded === 'function' ? sidebar.isExpanded() : false;
          if (expanded === true) return;
          if (typeof sidebar.openTab === 'function') sidebar.openTab(NS);
          if (typeof sidebar.toggleExpanded === 'function') sidebar.toggleExpanded();
        } catch (error) {
          /* Auto-open is best-effort; the header button remains available. */
        }
      };

      const registerView = () => ctx.slots.register({
        name: 'conversation.view',
        id: NS,
        order: 40,
        locale: NS,
        label: () => t('view.label'),
      }, (props) => h(AgentTreesViewSafe, Object.assign({}, props, {
        t: typeof props.t === 'function' ? props.t : t,
        refreshProjections,
        openSession,
      })));

      ctx.effect(() => ctx.slots.inject('conversation.view', registerView), 'agent-trees: conversation view');

      const sidebarIntegration = ctx.inject(['sidebarRightTabs'], (scope) => {
        const tabs = scope.sidebarRightTabs;
        if (!tabs || typeof tabs.register !== 'function') return undefined;
        const disposers = [];
        const add = (disposer) => {
          if (typeof disposer === 'function') disposers.push(disposer);
        };
        const cleanup = () => {
          while (disposers.length > 0) {
            const dispose = disposers.pop();
            try {
              dispose();
            } catch (error) {
              /* Teardown races between HMR generations are harmless. */
            }
          }
        };
        try {
          add(tabs.register({
            id: NS,
            kind: NS,
            title: () => t('sidebar.title'),
            guide: [{
              order: 40,
              title: () => t('sidebar.title'),
              description: () => t('sidebar.guide'),
              icon: TreeIcon,
            }],
          }));
          add(scope.slots.inject('sidebar.right.pane.tab', () => scope.slots.register({
            name: 'sidebar.right.pane.tab',
            key: NS,
            locale: NS,
          }, (props) => h(AgentTreesViewSafe, Object.assign({}, props, {
            t: typeof props.t === 'function' ? props.t : t,
            refreshProjections,
            openSession,
            host: 'sidebar',
          })))));
          add(scope.slots.inject('conversation.session.header.utilities', () => scope.slots.register({
            name: 'conversation.session.header.utilities',
            id: 'agent-trees-sidebar',
            order: 30,
            locale: NS,
          }, (props) => h(AgentTreesSidebarButton, Object.assign({}, props, {
            t: typeof props.t === 'function' ? props.t : t,
            openSidebar,
            autoOpenSidebar,
          })))));
        } catch (error) {
          cleanup();
          return undefined;
        }
        return cleanup;
      });

      ctx.effect(() => () => {
        try {
          sidebarIntegration?.dispose?.();
        } catch (error) {
          /* The injection may already be disposed with the plugin fiber. */
        }
      }, 'agent-trees: sidebar integration');
    }

    return {
      inject: ['slots', 'locale', 'sessions', 'uiWorkspace'],
      apply,
    };
  },
});
