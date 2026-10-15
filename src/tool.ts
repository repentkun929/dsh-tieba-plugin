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
      '读取一个贴吧帖子的楼层内容（正文/图片数/回复数）。可翻页。'
      + '当用户给了帖子链接、或已知 tid 想看帖子内容时使用。'
      + '注意：每页约 15 楼，长帖请用 page 翻页（返回里会说明当前页与是否还有下一页）。'
      + '读攻略帖、长帖想知道楼主说了什么时，用 onlyLz=true 只看楼主（能过滤掉大量无关回复）。',
    parameters: {
      tid: {
        type: 'string',
        required: true,
        description: '帖子 id，或 https://tieba.baidu.com/p/<tid> 形式的完整链接',
      },
      page: { type: 'number', description: '页码，从 1 开始，默认 1；每页约 15 楼' },
      onlyLz: { type: 'boolean', description: 'true = 只看楼主（读攻略帖推荐），默认 false 看全部' },
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
          page: typeof first.page === 'number' ? first.page : 1,
          totalPage: typeof first.totalPage === 'number' ? first.totalPage : 1,
          hasMore: first.hasMore === true,
          onlyLz: first.onlyLz === true,
        }
      },
    },
    isConcurrencySafe: () => true,
    async execute(args) {
      const raw = typeof args.tid === 'string' ? args.tid.trim() : ''
      const tid = extractTid(raw)
      if (!tid) throw new Error('tieba_thread_detail: tid 是必填参数（帖子 id 或 p/<tid> 链接）')
      const limit = Math.max(1, Math.min(50, config.maxFloors))
      const page = typeof args.page === 'number' && args.page > 0 ? Math.floor(args.page) : 1
      const onlyLz = args.onlyLz === true
      try {
        const { title, forum, floors, totalFloor, totalPage, currentPage, hasMore } =
          await api.threadFloors(tid, limit, page, onlyLz)
        if (floors.length === 0) {
          return fail(
            onlyLz
              ? `帖子 ${tid} 第 ${page} 页没有取到楼主的楼层（可能已翻到底）`
              : `帖子 ${tid} 第 ${page} 页没有取到楼层（可能已被删除、翻到底或仅登录可见）`,
          )
        }
        const lines = floors.map(
          (f) => `${f.floor}楼 · ${f.author}：${f.content.slice(0, 200)}${f.imageCount ? ` [图 ${f.imageCount}]` : ''}`,
        )
        // 翻页指引要写清楚：模型靠这句话决定要不要继续翻，而不是靠猜。
        const nav = hasMore
          ? `还有下一页（第 ${currentPage + 1} 页，共约 ${totalPage} 页）：继续调用本工具并传 page=${currentPage + 1}`
          : `已经是最后一页（第 ${currentPage}/${totalPage} 页）`
        const text = [
          `帖子《${title || tid}》（${forum ? forum + '吧 · ' : ''}${threadUrl(tid)}）`,
          onlyLz ? `【只看楼主】第 ${currentPage} 页，${floors.length} 楼：` : `第 ${currentPage} 页，${floors.length} 楼（全帖共约 ${totalFloor} 楼）：`,
          ...lines,
          nav,
        ].join('\n')
        // title/forum/totalFloor 不属于 items 元素，但浏览器端 Toolview 需要它们；
        // output schema 是 additionalProperties:false，不能挂在返回值上，
        // 于是塞进每个 floor 元素的冗余字段，由 presentationMeta 从 items[0] 取回。
        const items = floors.map((f) => ({
          ...f,
          title,
          forum,
          totalFloor,
          page: currentPage,
          totalPage,
          hasMore,
          onlyLz,
        }))
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
      presentationMeta: (args, value) => {
        const first = Array.isArray(value.items) && value.items.length > 0
          ? value.items[0] as Record<string, unknown>
          : {}
        return {
          kind: 'tieba-replies',
          tid: args.tid,
          items: value.items,
          floor: typeof first.floor === 'number' ? first.floor : 0,
          page: typeof first.page === 'number' ? first.page : 0,
          subTotal: typeof first.subTotal === 'number' ? first.subTotal : 0,
        }
      },
    },
    isConcurrencySafe: () => true,
    async execute(args) {
      const tid = extractTid(typeof args.tid === 'string' ? args.tid.trim() : '')
      const pid = typeof args.pid === 'string' ? args.pid.trim() : ''
      if (!tid) throw new Error('tieba_thread_replies: tid 是必填参数')
      if (!pid) throw new Error('tieba_thread_replies: pid 是必填参数')
      try {
        const { items, floor, page, subTotal } =
          await api.threadReplies(tid, pid, Math.max(1, Math.min(20, config.maxFloors)))
        if (items.length === 0) return fail(`楼层 ${pid} 没有楼中楼回复（或取不到）`)
        const lines = items.map((r, i) => `${i + 1}. ${r.author}：${r.content.slice(0, 200)}`)
        // floor/page 是 api 层扫页时顺带拿到的定位信息，让播报能说清「这层楼在哪」。
        const where = floor > 0 ? `（第 ${floor} 楼，位于第 ${page} 页）` : ''
        const count = subTotal > items.length ? `共约 ${subTotal} 条，取前 ${items.length} 条` : `${items.length} 条`
        const text = [
          `帖子 ${tid} 楼层 ${pid}${where}的楼中楼回复（${count}）：`,
          ...lines,
        ].join('\n')
        return ok(text, items.map((r) => ({ ...r, floor, page, subTotal })))
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
      '在贴吧全站或指定吧内搜索含关键词的帖子。可翻页。'
      + '当用户想找某个话题/人物/事件的贴吧讨论时使用。'
      + '注意：结果可能跨吧，可用 forum 参数限定吧名。'
      + '有些结果命中的是某帖里的某一层回复（不是帖子标题），这类结果会带上精确到楼层的链接，'
      + '且摘要就是那层楼的内容——找「某个具体问题怎么解」时这类命中往往比帖子标题更有用。',
    parameters: {
      word: { type: 'string', required: true, description: '搜索关键词' },
      forum: { type: 'string', description: '限定吧名（不带「吧」字），可留空表示全站搜索' },
      page: { type: 'number', description: '页码，从 1 开始，默认 1；没有想要的结果时翻下一页' },
    },
    output: {
      schema: OUTPUT_SCHEMA,
      render: (_args, value) => [{ type: 'text', text: value.text }],
      presentationMeta: (args, value) => {
        const first = Array.isArray(value.items) && value.items.length > 0
          ? value.items[0] as Record<string, unknown>
          : {}
        return {
          kind: 'tieba-search',
          word: args.word,
          forum: args.forum ?? '',
          items: value.items,
          page: typeof first.page === 'number' ? first.page : 1,
          hasMore: first.hasMore === true,
        }
      },
    },
    isConcurrencySafe: () => true,
    async execute(args) {
      const word = typeof args.word === 'string' ? args.word.trim() : ''
      if (!word) throw new Error('tieba_forum_search: word 是必填参数')
      const forum = typeof args.forum === 'string' ? args.forum.trim() : ''
      const limit = Math.max(1, Math.min(30, config.maxSearch))
      const page = typeof args.page === 'number' && args.page > 0 ? Math.floor(args.page) : 1
      try {
        const { items, hasMore, totalPage } = await api.search(word, forum, limit, page)
        if (items.length === 0) {
          return fail(fallbackSearchFail(word, forum))
        }
        const lines = items.map((t, i) => {
          const floorMark = t.isFloor ? '[楼层] ' : ''
          return `${i + 1}. ${floorMark}[${t.forumName || '贴吧'}] ${t.title}${t.abstract ? ` — ${t.abstract.slice(0, 80)}` : ''}`
        })
        const nav = hasMore
          ? `还有下一页（第 ${page + 1} 页）：继续调用本工具并传 page=${page + 1}`
          : `已经是最后一页（第 ${page}${totalPage > 1 ? `/${totalPage}` : ''} 页）`
        const text = [
          `贴吧搜索「${word}」${forum ? `（限 ${forum}吧）` : ''} 第 ${page} 页，${items.length} 条：`,
          ...lines,
          nav,
        ].join('\n')
        return ok(text, items.map((t) => ({ ...t, page, hasMore })))
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
