// 浏览器端产物离线渲染契约测试。
//
// 目的：把「Node 端 presentationMeta → 客户端 tiebaMetaFrom → 渲染出的 HTML」这条
// 唯一此前没被自动化覆盖的链路钉死。不需要浏览器、不需要重启 dsh。
//
// 做法：按宿主真实加载路径执行 lib/client.js ——
//   1. 提供 window.__ModuleLoader__.load({ id, factory })；
//   2. 提供 require 垫片解析 react/jsx-runtime；
//   3. 调用 factory 拿到 { apply, inject, name }；
//   4. 用假 ctx 跑 apply，捕获 ctx.slots.register 的注册项；
//   5. 把 tiebaTools() 的真实 presentationMeta 输出喂给组件，用 react-dom/server 渲染。
//
// 依据（host asar 实读）：
// - dshmarket/client/client.js:1  window.__ModuleLoader__.load({ id, factory: (require) => {...} })
// - dsh-client-ui-tool/lib/client.js:1863  renderSlot("tool.call.toolview", owner, { entryKey: toolName })
// - dsh-client-ui-tool/lib/client.js:1832  owner = { callId, toolName, ...call }  → 组件收 { callId, toolName, phase, block }
// - dsh-client-ui-tool/lib/client.js:1804  block 三态：'kind' in block → 已结束；phase 'preparing' → 准备中

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const here = dirname(fileURLToPath(import.meta.url))
const pluginRoot = join(here, '..')

// 默认测源目录产物；设 TIEBA_CLIENT_ARTIFACT 可指向已安装副本
// （例如 <profile>/node_modules/@tieba/dsh-plugin/lib/client.js），验证装到 profile 的那份。
const clientArtifact = process.env.TIEBA_CLIENT_ARTIFACT
  ? process.env.TIEBA_CLIENT_ARTIFACT
  : join(pluginRoot, 'lib', 'client.js')

const { tiebaTools } = await import('../src/tool.ts')
const { renderToStaticMarkup } = require('react-dom/server')

// ── 按宿主路径加载浏览器端产物 ───────────────────────────────────────────────

function loadClientBundle() {
  const source = readFileSync(clientArtifact, 'utf8')
  let captured
  const fakeWindow = {
    __ModuleLoader__: {
      load({ id, factory }) {
        captured = { id, module: factory(require) }
      },
    },
  }
  // 产物第一行即 window.__ModuleLoader__.load(...)，用 Function 注入假 window。
  new Function('window', 'require', source)(fakeWindow, require)
  assert.ok(captured, 'client.js 没有调用 window.__ModuleLoader__.load')
  return captured
}

const bundle = loadClientBundle()

// ── 用假 ctx 跑 apply，捕获 keyed 注册 ───────────────────────────────────────

function collectRegistrations() {
  const registered = []
  const injected = []
  const ctx = {
    slots: {
      inject(slot, factory) {
        injected.push(slot)
        return factory()
      },
      register(options, component) {
        registered.push({ options, component })
        return () => {}
      },
    },
  }
  bundle.module.apply(ctx)
  return { registered, injected }
}

const { registered, injected } = collectRegistrations()

// ── 渲染助手 ─────────────────────────────────────────────────────────────────

/** 从某个工具的真实 presentationMeta 输出构造宿主会传给组件的 block。 */
function finishedBlock(toolName, args, value) {
  const tool = tiebaTools({}).find((t) => t.name === toolName)
  assert.ok(tool, `找不到工具 ${toolName}`)
  const presentationMeta = tool.output?.presentationMeta
  assert.equal(typeof presentationMeta, 'function', `${toolName}.output.presentationMeta 缺失`)
  return {
    kind: 'tool-result',
    isError: false,
    meta: presentationMeta(args, value),
    content: [{ type: 'text', text: value.text }],
  }
}

function renderFor(toolName, block) {
  const entry = registered.find((r) => r.options.key === toolName)
  assert.ok(entry, `${toolName} 没有注册 toolview`)
  return renderToStaticMarkup(entry.component({ callId: 'c1', toolName, phase: 'result', block }))
}

// ── 契约：注册 ───────────────────────────────────────────────────────────────

test('client 产物导出 apply / inject / name 三件套', () => {
  // 注册 id 必须等于 package.json 的 name：宿主 dsh-client-modules 用包名建图
  // （reconcilePackage(packageName) → graphRow(packageName, ...)），加载后靠 factories.has(row.id)
  // 确认；不匹配即 `loaded without registering "<包名>" via __ModuleLoader__.load`，客户端半边静默失效。
  const pkgName = JSON.parse(readFileSync(join(pluginRoot, 'package.json'), 'utf8')).name
  assert.equal(bundle.id, pkgName, 'ModuleLoader 注册 id 必须等于 package.json name')
  assert.equal(typeof bundle.module.apply, 'function')
  assert.deepEqual(bundle.module.inject, ['slots'])
  // 节点端 name 只是 Loader 条目的展示名（范本 dsh-workbuddy-connect 用 'llm-workbuddy'），
  // 允许与包名不同，但必须是稳定非空字符串。
  assert.equal(typeof bundle.module.name, 'string')
  assert.ok(bundle.module.name.length > 0)
})

test('四个 wire 工具名都注册到 tool.call.toolview（keyed）', () => {
  assert.deepEqual(injected, ['tool.call.toolview', 'tool.call.toolview', 'tool.call.toolview', 'tool.call.toolview'])
  assert.deepEqual(
    registered.map((r) => r.options.key).sort(),
    ['tieba_forum_search', 'tieba_forum_threads', 'tieba_thread_detail', 'tieba_thread_replies'],
  )
  for (const r of registered) {
    assert.equal(r.options.name, 'tool.call.toolview', 'name 必须与 slot 名一致')
    assert.equal(r.options.key.length > 0, true, 'keyed entry 必须有 key')
    assert.equal(typeof r.component, 'function')
  }
})

test('注册 key 与 Node 端工具名严格一致（否则 keyed 分发不命中）', () => {
  const nodeNames = tiebaTools({}).map((t) => t.name).sort()
  assert.deepEqual(registered.map((r) => r.options.key).sort(), nodeNames)
})

// ── 契约：block 三态 ─────────────────────────────────────────────────────────

test('准备中（block 无 kind）渲染骨架屏，不读 meta', () => {
  const html = renderFor('tieba_forum_threads', { phase: 'preparing' })
  assert.match(html, /正在读取贴吧/)
})

test('失败态（isError）渲染 fallback 文本，不尝试渲染卡片', () => {
  const html = renderFor('tieba_forum_threads', {
    kind: 'tool-result',
    isError: true,
    meta: { kind: 'tieba-threads', forum: '原神', sort: 'default', items: [] },
    content: [{ type: 'text', text: '读取失败：网络超时' }],
  })
  assert.match(html, /读取失败：网络超时/)
  assert.doesNotMatch(html, /原神吧 ·/)
})

test('meta 缺失时回退到结果首行文本', () => {
  const html = renderFor('tieba_forum_threads', {
    kind: 'tool-result',
    isError: false,
    content: [{ type: 'text', text: '贴吧「原神」默认排序 第 1 页，共 30 帖：' }],
  })
  assert.match(html, /第 1 页，共 30 帖/)
})

// ── 契约：四个卡片真实往返渲染 ───────────────────────────────────────────────

test('tieba_forum_threads 的真实 meta 渲染出帖子列表', () => {
  const value = {
    text: '贴吧「原神」默认排序 第 1 页，共 2 帖：\n1. 标题甲 · 作者甲 · 3 回复',
    items: [
      { tid: '111', title: '标题甲', author: '作者甲', replyNum: 3, isTop: true, url: 'https://tieba.baidu.com/p/111', abstract: '摘要甲' },
      { tid: '222', title: '标题乙', author: '作者乙', replyNum: 0, isTop: false, url: 'https://tieba.baidu.com/p/222', abstract: '' },
    ],
  }
  const html = renderFor('tieba_forum_threads', finishedBlock('tieba_forum_threads', { forum: '原神', sort: 'new' }, value))
  assert.match(html, /原神吧 · 按发帖时间 · 2 帖/)
  assert.match(html, /href="https:\/\/tieba\.baidu\.com\/p\/111"/)
  assert.match(html, /标题甲/)
  assert.match(html, /\[置顶\]/)
  assert.match(html, /作者甲 · 3 回复/)
  assert.match(html, /摘要甲/)
  assert.match(html, /标题乙/)
})

test('tieba_thread_detail 的真实 meta（floors 字段）渲染出楼层', () => {
  const value = {
    text: '仅取前 2 楼（全帖共约 58 楼）：\n1楼 作者甲：正文甲',
    items: [
      { floor: 1, author: '作者甲', content: '正文甲', imageCount: 0, replyNum: 0, time: '2026-01-01 10:00', pid: '9001', title: '题目', forum: '原神', totalFloor: 58 },
      { floor: 2, author: '作者乙', content: '正文乙', imageCount: 2, replyNum: 4, time: '2026-01-01 10:05', pid: '9002', title: '题目', forum: '原神', totalFloor: 58 },
    ],
  }
  const html = renderFor('tieba_thread_detail', finishedBlock('tieba_thread_detail', { tid: '11102322434' }, value))
  // 关键回归：floors 类只认 meta.floors，若字段名回退成 items 这里会渲染成 fallback 文本
  assert.doesNotMatch(html, /贴吧结果不可用/)
  assert.match(html, /正文甲/)
  assert.match(html, /正文乙/)
  assert.match(html, /作者甲/)
})

test('tieba_thread_detail 的翻页状态渲染「还有第 N 页」', () => {
  const base = { title: '题目', forum: '原神', totalFloor: 219, totalPage: 15, page: 1, hasMore: true, onlyLz: false }
  const items = [
    { floor: 1, author: '作者甲', content: '正文甲', imageCount: 0, replyNum: 0, time: '2026-01-01 10:00', pid: '9001', ...base },
    { floor: 2, author: '作者乙', content: '正文乙', imageCount: 0, replyNum: 0, time: '2026-01-01 10:05', pid: '9002', ...base },
  ]
  const html = renderFor('tieba_thread_detail', finishedBlock('tieba_thread_detail', { tid: '11084319647', page: 1 }, { text: 'x', items }))
  assert.doesNotMatch(html, /贴吧结果不可用/)
  assert.match(html, /第 1\/15 页/)
  assert.match(html, /全帖约 219 楼/)
  assert.match(html, /还有第 2 页可读/)
})

test('tieba_thread_detail 只看楼主时渲染「只看楼主」且不显示总楼数', () => {
  const base = { title: '攻略帖', forum: '鸣潮', totalFloor: 219, totalPage: 8, page: 2, hasMore: true, onlyLz: true }
  const items = [
    { floor: 1, author: '楼主', content: '正文甲', imageCount: 0, replyNum: 0, time: '2026-01-01 10:00', pid: '9001', ...base },
  ]
  const html = renderFor('tieba_thread_detail', finishedBlock('tieba_thread_detail', { tid: '11084319647', page: 2, onlyLz: true }, { text: 'x', items }))
  assert.match(html, /只看楼主/)
  assert.match(html, /第 2 页/)
  // 只看楼主时 totalFloor 是「全帖回复数」，跟当前页条数没有可比性，不该显示
  assert.doesNotMatch(html, /全帖约/)
})

test('tieba_thread_detail 已到最后一页时渲染「已到最后一页」', () => {
  const base = { title: '题目', forum: '原神', totalFloor: 58, totalPage: 1, page: 1, hasMore: false, onlyLz: false }
  const items = [
    { floor: 1, author: '作者甲', content: '正文甲', imageCount: 0, replyNum: 0, time: '2026-01-01 10:00', pid: '9001', ...base },
  ]
  const html = renderFor('tieba_thread_detail', finishedBlock('tieba_thread_detail', { tid: '11102322434' }, { text: 'x', items }))
  assert.match(html, /已到最后一页/)
  assert.doesNotMatch(html, /还有第/)
})

test('tieba_thread_replies 的真实 meta 渲染出楼中楼', () => {
  const value = {
    text: '楼中楼 2 条：',
    items: [
      { pid: '1', author: '甲', content: '回复一', time: '2026-01-01 10:00', floor: 5, page: 1, subTotal: 2 },
      { pid: '2', author: '乙', content: '回复二', time: '2026-01-01 10:01', floor: 5, page: 1, subTotal: 2 },
    ],
  }
  const html = renderFor('tieba_thread_replies', finishedBlock('tieba_thread_replies', { tid: '11096100313', pid: '154021327232' }, value))
  assert.doesNotMatch(html, /贴吧结果不可用/)
  assert.match(html, /回复一/)
  assert.match(html, /回复二/)
  // floor>0 时卡片要标出「第 N 楼」，让播报的定位与卡片一致
  assert.match(html, /第 5 楼/)
})

test('tieba_thread_replies 的 meta 缺 floor 时不渲染楼层定位', () => {
  const value = {
    text: '楼中楼 1 条：',
    items: [{ pid: '1', author: '甲', content: '回复一', time: '2026-01-01 10:00' }],
  }
  const html = renderFor('tieba_thread_replies', finishedBlock('tieba_thread_replies', { tid: '1', pid: '1' }, value))
  assert.doesNotMatch(html, /贴吧结果不可用/)
  assert.doesNotMatch(html, /第 \d+ 楼/)
  assert.match(html, /回复一/)
})

test('tieba_forum_search 的真实 meta 渲染出跨吧结果', () => {
  const value = {
    text: '贴吧搜索「米提亚强度」前 2 条：',
    items: [
      { tid: '333', title: '结果一', author: '甲', forumName: '原神', replyNum: 5, url: 'https://tieba.baidu.com/p/333', abstract: '摘要一', pid: '', isFloor: false, page: 1, hasMore: true },
      { tid: '444', title: '结果二', author: '乙', forumName: '原神新料', replyNum: 1, url: 'https://tieba.baidu.com/p/444', abstract: '', pid: '', isFloor: false, page: 1, hasMore: true },
    ],
  }
  const html = renderFor('tieba_forum_search', finishedBlock('tieba_forum_search', { word: '米提亚强度' }, value))
  assert.doesNotMatch(html, /贴吧结果不可用/)
  assert.match(html, /结果一/)
  assert.match(html, /原神新料/)
  assert.match(html, /第 1 页/)
  assert.match(html, /还有第 2 页可读/)
})

test('tieba_forum_search 的楼层级命中渲染 [楼层] 标记与 ?pid= 直达链接', () => {
  const value = {
    text: '贴吧搜索「电磁」第 1 页，1 条：',
    items: [
      {
        tid: '777',
        title: '心月狐强度认真的吗？',
        author: '甲',
        forumName: '鸣潮',
        url: 'https://tieba.baidu.com/p/777?pid=154013095236',
        abstract: '电磁比同奏高',
        pid: '154013095236',
        isFloor: true,
        page: 1,
        hasMore: false,
      },
    ],
  }
  const html = renderFor('tieba_forum_search', finishedBlock('tieba_forum_search', { word: '电磁', forum: '鸣潮' }, value))
  assert.doesNotMatch(html, /贴吧结果不可用/)
  // 楼层级命中必须带 ?pid=，否则用户得自己在几百楼里翻
  assert.match(html, /href="https:\/\/tieba\.baidu\.com\/p\/777\?pid=154013095236"/)
  assert.match(html, /\[楼层\]/)
  assert.match(html, /已到最后一页/)
  assert.doesNotMatch(html, /还有第 2 页/)
})

test('业务失败（items 空）渲染空列表而不崩', () => {
  const value = { text: '贴吧「不存在的吧名字xyz」没有取到帖子。', items: [] }
  const html = renderFor('tieba_forum_threads', finishedBlock('tieba_forum_threads', { forum: '不存在的吧名字xyz' }, value))
  assert.match(html, /不存在的吧名字xyz吧/)
  assert.match(html, /0 帖/)
})

// ── 契约：产物自身不破坏宿主约定 ─────────────────────────────────────────────

test('组件不使用 React hooks（避免依赖宿主 dispatcher）', () => {
  const source = readFileSync(clientArtifact, 'utf8')
  for (const hook of ['useState', 'useEffect', 'useMemo', 'useRef', 'useContext']) {
    assert.doesNotMatch(source, new RegExp(`\\b${hook}\\s*\\(`), `client 产物不应调用 ${hook}`)
  }
})
