import { defineTool, type ToolDefinition } from '@deepseek-ai/dsh-tools'
import type { Config } from './config.ts'
import { makeApiClient } from './api.ts'
import { threadUrl, toJsonObjects, type JsonValue } from './fragment.ts'

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    text: { type: 'string', required: true },
    items: {
      type: 'array',
      required: true,
      items: { type: 'object', additionalProperties: true },
    },
  },
} as const

/** execute 返回值必须与 OUTPUT_SCHEMA 完全一致（additionalProperties:false），额外字段一律走 presentationMeta。 */
function ok(text: string, items: object[]): { text: string; items: Record<string, JsonValue>[] } {
  return { text, items: toJsonObjects(items) }
}

function fail(text: string): { text: string; items: Record<string, JsonValue>[] } {
  return { text, items: [] }
}

export function tiebaTools(config: Config): ToolDefinition[] {
  const api = makeApiClient({
    bduss: config.bduss,
    userAgent: config.userAgent,
    timeoutMs: config.timeoutMs,
    proxyUrl: config.proxyUrl || undefined,
  })

  const forumThreads = defineTool({
    name: 'tieba_forum_threads',
    description:
      '读取贴吧某个吧的帖子列表（标题/作者/回复数/摘要）。'
      + '当用户想了解某个吧在聊什么、要最新或最热的帖子时使用。'
      + '注意：不需要登录；吧名不带「吧」字，如「原神」而不是「原神吧」。',
    parameters: {
      forum: { type: 'string', required: true, description: '吧名，不带「吧」字，如 原神' },
      page: { type: 'number', description: '页码，从 1 开始，默认 1' },
      sort: {
        type: 'string',
        enum: ['default', 'new'],
        description: '排序：default=默认（算法推荐，置顶在前），new=按发帖时间倒序',
      },
    },
    output: {
      schema: OUTPUT_SCHEMA,
      render: (_args, value) => [{ type: 'text', text: value.text }],
      presentationMeta: (args, value) => ({
        kind: 'tieba-threads',
        forum: args.forum,
        sort: args.sort ?? 'default',
        items: value.items,
      }),
    },
    isConcurrencySafe: () => true,
    async execute(args) {
      const forum = typeof args.forum === 'string' ? args.forum.trim() : ''
      if (!forum) throw new Error('tieba_forum_threads: forum 是必填参数')
      const page = typeof args.page === 'number' && args.page > 0 ? Math.floor(args.page) : 1
      const sort = args.sort === 'new' ? 'new' : 'default'
      const limit = Math.max(1, Math.min(50, config.maxThreads))
      try {
        const { items } = await api.forumThreads(forum, page, sort, limit)
        if (items.length === 0) {
          return fail(`吧「${forum}」第 ${page} 页没有取到帖子（吧名是否正确？是否已翻到底？）`)
        }
        const lines = items.map(
          (t, i) => `${i + 1}. ${t.title}${t.isTop ? ' [置顶]' : ''} · ${t.author || '未知'} · ${t.replyNum} 回复`,
        )
        const text = [
          `贴吧「${forum}」${sort === 'new' ? '按发帖时间倒序' : '默认排序'} 第 ${page} 页，共 ${items.length} 帖：`,
          ...lines,
        ].join('\n')
        return ok(text, items)
      } catch (e) {
        return fail(`读取贴吧「${forum}」失败：${(e as Error).message}`)
      }
    },
    presentCall: () => ({ card: 'generic', title: '贴吧列表', kind: 'other' }),
    presentResult(_args, result) {
      if (result.isError) return undefined
      const meta = result.meta as { items?: unknown[] } | undefined
      const n = Array.isArray(meta?.items) ? meta!.items!.length : 0
      return { card: 'generic', title: `贴吧列表 · ${n} 帖`, kind: 'other' }
    },
  })

  const threadDetail = defineTool({
    name: 'tieba_thread_detail',
    description:
      '读取一个贴吧帖子的楼层内容（正文/图片数/回复数）。'
      + '当用户给了帖子链接、或已知 tid 想看帖子内容时使用。'
      + '注意：单页只返回前若干楼（接口 14 楼/页，超长帖请在回复中说明只取到前 N 楼）。',
    parameters: {
      tid: {
        type: 'string',
        required: true,
        description: '帖子 id，或 https://tieba.baidu.com/p/<tid> 形式的完整链接',
      },
    },
    output: {
      schema: OUTPUT_SCHEMA,
      render: (_args, value) => [{ type: 'text', text: value.text }],
      presentationMeta: (args, value) => {
        // OUTPUT_SCHEMA 是 additionalProperties:false，execute() 只能返回 {text, items}，
        // 所以标题/吧名这些静态字段由这里从 items[0] 上复用（api 层把它们挂在每条 floor 上）。
        const first = Array.isArray(value.items) && value.items.length > 0
          ? value.items[0] as Record<string, unknown>
          : {}
        return {
          kind: 'tieba-floors',
          tid: args.tid,
          title: typeof first.title === 'string' ? first.title : '',
          forum: typeof first.forum === 'string' ? first.forum : '',
          floors: value.items,
          totalFloor: typeof first.totalFloor === 'number' ? first.totalFloor : 0,
        }
      },
    },
    isConcurrencySafe: () => true,
    async execute(args) {
      const raw = typeof args.tid === 'string' ? args.tid.trim() : ''
      const tid = extractTid(raw)
      if (!tid) throw new Error('tieba_thread_detail: tid 是必填参数（帖子 id 或 p/<tid> 链接）')
      const limit = Math.max(1, Math.min(50, config.maxFloors))
      try {
        const { title, forum, floors, totalFloor } = await api.threadFloors(tid, limit)
        if (floors.length === 0) return fail(`帖子 ${tid} 没有取到楼层（可能已被删除或仅登录可见）`)
        const lines = floors.map(
          (f) => `${f.floor}楼 · ${f.author}：${f.content.slice(0, 200)}${f.imageCount ? ` [图 ${f.imageCount}]` : ''}`,
        )
        const text = [
          `帖子《${title || tid}》（${forum ? forum + '吧 · ' : ''}${threadUrl(tid)}）`,
          `仅取前 ${floors.length} 楼（全帖共约 ${totalFloor} 楼）：`,
          ...lines,
        ].join('\n')
        // title/forum/totalFloor 不属于 items 元素，但浏览器端 Toolview 需要它们；
        // output schema 是 additionalProperties:false，不能挂在返回值上，
        // 于是塞进每个 floor 元素的冗余字段，由 presentationMeta 从 items[0] 取回。
        const items = floors.map((f) => ({ ...f, title, forum, totalFloor }))
        return ok(text, items)
      } catch (e) {
        return fail(`读取帖子 ${tid} 失败：${(e as Error).message}`)
      }
    },
    presentCall: () => ({ card: 'generic', title: '贴吧楼层', kind: 'other' }),
    presentResult(_args, result) {
      if (result.isError) return undefined
      const meta = result.meta as { floors?: unknown[] } | undefined
      const n = Array.isArray(meta?.floors) ? meta!.floors!.length : 0
      return { card: 'generic', title: `贴吧楼层 · ${n} 楼`, kind: 'other' }
    },
  })

  const threadReplies = defineTool({
    name: 'tieba_thread_replies',
    description:
      '读取贴吧帖子某一层的楼中楼回复。'
      + '当帖子楼层里出现「查看回复/xxx 条回复」、或用户想看某条评论下的讨论时使用。'
      + '注意：楼中楼是楼层内联数据，最多返回该楼层已加载的那几条（接口限制）。',
    parameters: {
      tid: { type: 'string', required: true, description: '帖子 id 或 p/<tid> 链接' },
      pid: { type: 'string', required: true, description: '楼层 id（tieba_thread_detail 返回的 pid）' },
    },
    output: {
      schema: OUTPUT_SCHEMA,
      render: (_args, value) => [{ type: 'text', text: value.text }],
      presentationMeta: (args, value) => ({
        kind: 'tieba-replies',
        tid: args.tid,
        items: value.items,
      }),
    },
    isConcurrencySafe: () => true,
    async execute(args) {
      const tid = extractTid(typeof args.tid === 'string' ? args.tid.trim() : '')
      const pid = typeof args.pid === 'string' ? args.pid.trim() : ''
      if (!tid) throw new Error('tieba_thread_replies: tid 是必填参数')
      if (!pid) throw new Error('tieba_thread_replies: pid 是必填参数')
      try {
        const items = await api.threadReplies(tid, pid, Math.max(1, Math.min(20, config.maxFloors)))
        if (items.length === 0) return fail(`楼层 ${pid} 没有楼中楼回复（或取不到）`)
        const lines = items.map((r, i) => `${i + 1}. ${r.author}：${r.content.slice(0, 200)}`)
        const text = `帖子 ${tid} 楼层 ${pid} 的楼中楼回复（${items.length} 条）：\n${lines.join('\n')}`
        return ok(text, items)
      } catch (e) {
        return fail(`读取楼中楼失败：${(e as Error).message}`)
      }
    },
    presentCall: () => ({ card: 'generic', title: '楼中楼', kind: 'other' }),
    presentResult(_args, result) {
      if (result.isError) return undefined
      const meta = result.meta as { items?: unknown[] } | undefined
      const n = Array.isArray(meta?.items) ? meta!.items!.length : 0
      return { card: 'generic', title: `楼中楼 · ${n} 条`, kind: 'other' }
    },
  })

  const forumSearch = defineTool({
    name: 'tieba_forum_search',
    description:
      '在贴吧全站或指定吧内搜索含关键词的帖子。'
      + '当用户想找某个话题/人物/事件的贴吧讨论时使用。'
      + '注意：结果可能跨吧，可用 forum 参数限定吧名。',
    parameters: {
      word: { type: 'string', required: true, description: '搜索关键词' },
      forum: { type: 'string', description: '限定吧名（不带「吧」字），可留空表示全站搜索' },
    },
    output: {
      schema: OUTPUT_SCHEMA,
      render: (_args, value) => [{ type: 'text', text: value.text }],
      presentationMeta: (args, value) => ({
        kind: 'tieba-search',
        word: args.word,
        forum: args.forum ?? '',
        items: value.items,
      }),
    },
    isConcurrencySafe: () => true,
    async execute(args) {
      const word = typeof args.word === 'string' ? args.word.trim() : ''
      if (!word) throw new Error('tieba_forum_search: word 是必填参数')
      const forum = typeof args.forum === 'string' ? args.forum.trim() : ''
      const limit = Math.max(1, Math.min(30, config.maxSearch))
      try {
        const items = await api.search(word, forum, limit)
        if (items.length === 0) {
          return fail(fallbackSearchFail(word, forum))
        }
        const lines = items.map(
          (t, i) => `${i + 1}. [${t.forumName || '贴吧'}] ${t.title}${t.abstract ? ` — ${t.abstract.slice(0, 60)}` : ''}`,
        )
        const text = [
          `贴吧搜索「${word}」${forum ? `（限 ${forum}吧）` : ''} 前 ${items.length} 条：`,
          ...lines,
        ].join('\n')
        return ok(text, items)
      } catch (e) {
        return fail(`搜索「${word}」失败：${(e as Error).message}`)
      }
    },
    presentCall: () => ({ card: 'generic', title: '贴吧搜索', kind: 'other' }),
    presentResult(_args, result) {
      if (result.isError) return undefined
      const meta = result.meta as { items?: unknown[] } | undefined
      const n = Array.isArray(meta?.items) ? meta!.items!.length : 0
      return { card: 'generic', title: `贴吧搜索 · ${n} 条`, kind: 'other' }
    },
  })

  return [forumThreads, threadDetail, threadReplies, forumSearch]
}

function fallbackSearchFail(word: string, forum: string): string {
  return forum
    ? `在「${forum}」吧没有搜到与「${word}」相关的帖子（可去掉 forum 参数全站搜）`
    : `没有搜到与「${word}」相关的帖子（换个更短的关键词试试）`
}

/** 从用户/模型给的 tid 参数里提取纯数字 tid（支持 p/<tid> 链接）。 */
export function extractTid(raw: string): string {
  if (!raw) return ''
  const m = /\/p\/(\d+)/.exec(raw)
  if (m) return m[1]!
  const d = raw.match(/^\d{5,}$/)
  return d ? raw : ''
}
