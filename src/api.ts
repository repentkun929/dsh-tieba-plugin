import { contentImageCount, contentToText, parseFloorHtml, type FloorItem, type ReplyItem, type SearchItem, type ThreadItem } from './fragment.ts'

export const BASE = 'https://tieba.baidu.com'

/** 贴吧 APP_SALT：与 aiotieba helper/crypto/const.py 的 APP_SALT 一致。 */
const SALT = 'tiebaclient!!!'

/**
 * 计算贴吧客户端 API 的 sign。
 *
 * 定案事实（tools/verify_anon*.mjs 实测）：
 * - sign = md5(参数按 key 的 codepoint 序拼接成无分隔符 `k=v` 串 + "tiebaclient!!!")
 * - JS `Array.prototype.sort()` 默认就是 codepoint 序，等价于 .NET 的 StringComparer.Ordinal
 *   （PowerShell 的 `Sort-Object Name` 是 culture-aware 排序，会算错 sign）
 * - sign 必须在所有参数确定之后算一次，之后不得再往参数集里加键（加了就 110001）
 */
export function calcSign(params: Record<string, string>): string {
  const keys = Object.keys(params).sort()
  const raw = keys.map((k) => `${k}=${params[k]}`).join('')
  // 用同步实现，避免浏览器端/Node 端行为差异；这里只跑在 Node 端。
  return syncMd5(raw + SALT)
}

/**
 * 同步 MD5。
 *
 * 这里**不用** node:crypto 的 import，而是手写一个纯 JS 的 MD5：
 * - calcSign 是同步函数，同步 import 在 ESM 里做不到；
 * - 用 require() 会让 tsdown 把 node:crypto 打进产物，且 ESM 下 require 不存在；
 * - 手写实现零依赖、Node/浏览器/测试三端都能跑，也让 calcSign 可被契约测试直接钉死。
 */
function syncMd5(input: string): string {
  return md5Hex(input)
}

/* ------------------------------------------------------------------ *
 * 以下为标准 MD5 实现（RFC 1321），输入按 UTF-8 编码。
 * ------------------------------------------------------------------ */

const MD5_K = new Int32Array([
  0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
  0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
  0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
  0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
  0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
  0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
  0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
  0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
])

const MD5_S = new Int32Array([
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
])

/** UTF-8 编码（走 TextEncoder，Node/浏览器都有）。 */
function utf8Bytes(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

function rotl(x: number, c: number): number {
  return (x << c) | (x >>> (32 - c))
}

export function md5Hex(input: string): string {
  const msg = utf8Bytes(input)
  const bitLen = msg.length * 8
  const withPad = new Uint8Array((((msg.length + 8) >> 6) + 1) << 6)
  withPad.set(msg)
  withPad[msg.length] = 0x80
  // 长度按小端 64 位写入（这里只支持 < 2^32 位）
  const dv = new DataView(withPad.buffer)
  dv.setUint32(withPad.length - 8, bitLen >>> 0, true)
  dv.setUint32(withPad.length - 4, Math.floor(bitLen / 0x100000000), true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  const M = new Int32Array(16)
  for (let i = 0; i < withPad.length; i += 64) {
    for (let j = 0; j < 16; j++) M[j] = dv.getInt32(i + j * 4, true)
    let A = a0, B = b0, C = c0, D = d0
    for (let j = 0; j < 64; j++) {
      let F: number
      let g: number
      if (j < 16) {
        F = (B & C) | (~B & D)
        g = j
      } else if (j < 32) {
        F = (D & B) | (~D & C)
        g = (5 * j + 1) % 16
      } else if (j < 48) {
        F = B ^ C ^ D
        g = (3 * j + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * j) % 16
      }
      F = (F + A + MD5_K[j]! + M[g]!) | 0
      A = D
      D = C
      C = B
      B = (B + rotl(F, MD5_S[j]!)) | 0
    }
    a0 = (a0 + A) | 0
    b0 = (b0 + B) | 0
    c0 = (c0 + C) | 0
    d0 = (d0 + D) | 0
  }

  const out = new Uint8Array(16)
  const odv = new DataView(out.buffer)
  odv.setInt32(0, a0, true)
  odv.setInt32(4, b0, true)
  odv.setInt32(8, c0, true)
  odv.setInt32(12, d0, true)
  let hex = ''
  for (const b of out) hex += b.toString(16).padStart(2, '0')
  return hex
}

export interface TiebaApi {
  /** 吧内帖子列表（/c/f/frs/page_pc，匿名，返回 page_data.feed_list）。 */
  forumThreads(forum: string, page: number, sort: 'default' | 'new', limit: number): Promise<{
    forumName: string
    items: ThreadItem[]
  }>
  /** 帖子楼层（/c/f/pb/page_pc，匿名，14~15 楼/页，可翻页；lz=1 只看楼主）。
   *  注意：`rn` 参数实测无效，每页条数由服务端决定；只看楼主时每页条数也不是 15，
   *  因此判断「还有没有下一页」必须用返回的 `hasMore`，不能用条数推断。 */
  threadFloors(tid: string, limit: number, page?: number, onlyLz?: boolean): Promise<{
    forum: string
    title: string
    floors: FloorItem[]
    totalFloor: number
    totalPage: number
    currentPage: number
    hasMore: boolean
    onlyLz: boolean
  }>
  /** 楼中楼（楼层内联 sub_post_list；匿名可用）。
   *  返回楼层定位（floor/page/subTotal）：调用方据此在播报里说明「第 N 楼（第 M 页）下的 X 条」。 */
  threadReplies(tid: string, pid: string, limit: number): Promise<{
    items: ReplyItem[]
    /** 命中楼层在帖内的楼层号；没找到时为 0。 */
    floor: number
    /** 命中楼层所在的翻页页码；没找到时为 0。 */
    page: number
    /** 该楼层楼中楼的总条数（可能多于已返回的条数）。 */
    subTotal: number
  }>
  /** 搜索（/c/s/searchpost，匿名；不带 kw 时全站，带 kw 时吧内）。可翻页。 */
  search(word: string, forum: string, limit: number, page?: number): Promise<{
    items: SearchItem[]
    totalPage: number
    hasMore: boolean
  }>
}

/** 从 HTML 里按 marker 提取内嵌 JSON（marker 后跳过空白/冒号再做括号配平）。 */
export function findJsonAfter(html: string, marker: string): unknown | undefined {
  const i = html.indexOf(marker)
  if (i < 0) return undefined
  let j = i + marker.length
  while (j < html.length && /[\s:]/.test(html[j]!)) j += 1
  const open = html[j]
  const close = open === '{' ? '}' : ']'
  if (open !== '{' && open !== '[') return undefined
  let depth = 0
  let inStr = false
  let esc = false
  for (let k = j; k < html.length; k++) {
    const c = html[k]!
    if (inStr) {
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') inStr = true
    else if (c === open) depth += 1
    else if (c === close) {
      depth -= 1
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(j, k + 1))
        } catch {
          return undefined
        }
      }
    }
  }
  return undefined
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : fallback
}
function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

/** 从 feed_head / author 这类结构里取显示名（优先 name_show）。 */
function nameOfAuthor(v: unknown): string {
  if (typeof v === 'string') return v
  if (!v || typeof v !== 'object') return ''
  const o = v as Record<string, unknown>
  for (const k of ['name_show', 'name', 'user_name', 'un', 'show_nickname']) {
    if (typeof o[k] === 'string' && o[k]) return o[k] as string
  }
  // feed_head 形态：main_data[0].text.text
  const main = o.main_data
  if (Array.isArray(main)) {
    for (const m of main) {
      const t = (m as Record<string, unknown> | null)?.text as Record<string, unknown> | undefined
      if (t && typeof t.text === 'string' && t.text) return t.text
    }
  }
  return ''
}

/** undici 的最小结构声明：只用到 ProxyAgent，且必须传对象（v7 起不再接受字符串）。 */
type ProxyAgentCtor = new (options: { uri: string }) => unknown
interface UndiciModule {
  ProxyAgent?: ProxyAgentCtor
}

/**
 * 用变量持有 specifier，避免 TS 在编译期去解析 'undici'、也避免被打包器内联。
 *
 * undici **不是**本插件的依赖：
 * - desktop profile 顶层有 undici@7.30.0（createRequire 实测可解析，ProxyAgent 是 function）；
 * - web profile 没有 undici（MODULE_NOT_FOUND）；
 * - Node 24 也没有 `node:undici` 内置模块（ERR_UNKNOWN_BUILTIN_MODULE）。
 * 所以只能运行时按需加载：没配 proxyUrl 就永远不碰它，配了但加载不到就给可读错误。
 */
const UNDICI_SPECIFIER = 'undici'

/** 默认 dispatcher 工厂：动态加载 undici 的 ProxyAgent（懒加载 + 只在配了 proxyUrl 时才调用）。 */
async function defaultDispatcherFactory(uri: string): Promise<unknown> {
  let mod: UndiciModule
  try {
    mod = (await import(UNDICI_SPECIFIER)) as UndiciModule
  } catch (e) {
    const why = e instanceof Error ? e.message : String(e)
    throw new Error(
      `配置了 proxyUrl 但当前环境加载不到 undici（${why}）。` +
        `请在插件所在 profile 里安装 undici，或清空 proxyUrl 改为直连。`,
    )
  }
  if (typeof mod.ProxyAgent !== 'function') {
    throw new Error('配置了 proxyUrl 但当前 undici 没有导出 ProxyAgent，请升级 undici 或清空 proxyUrl。')
  }
  return new mod.ProxyAgent({ uri })
}

export function makeApiClient(opts: {
  bduss?: string
  userAgent?: string
  timeoutMs: number
  proxyUrl?: string
  fetchImpl?: typeof fetch
  /** 代理 dispatcher 工厂；默认动态加载 undici 的 ProxyAgent。测试可注入替身。 */
  proxyDispatcherFactory?: (uri: string) => Promise<unknown>
}): TiebaApi {
  const fetchImpl = opts.fetchImpl ?? fetch
  const userAgent = opts.userAgent || 'curl/8.0'
  const proxyUrl = (opts.proxyUrl ?? '').trim()

  /** 代理 dispatcher 缓存：整个生命周期只建一次（ProxyAgent 持有连接池）。 */
  let dispatcher: Promise<unknown> | undefined
  function getDispatcher(): Promise<unknown> {
    if (!dispatcher) {
      const factory = opts.proxyDispatcherFactory ?? defaultDispatcherFactory
      dispatcher = factory(proxyUrl)
    }
    return dispatcher
  }

  /** 带 sign 的 GET。sign 必须在所有参数确定后算一次。 */
  async function signedGet(path: string, params: Record<string, string | number>): Promise<unknown> {
    const raw: Record<string, string> = {}
    for (const [k, v] of Object.entries(params)) raw[k] = String(v)
    raw.sign = calcSign(raw)
    const qs = Object.entries(raw)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')
    const url = `${BASE}${path}?${qs}`
    // 先解析 dispatcher 再起计时器：代理加载失败不该占用请求超时预算。
    // dispatcher 是 undici 对 fetch 的扩展，不在 @types/node 的 RequestInit 里，
    // 而我们又不依赖 undici 的类型 —— 所以这里用中立结构承载，最后一次断言。
    const init: {
      method: string
      headers?: Record<string, string>
      signal?: AbortSignal
      dispatcher?: unknown
    } = { method: 'GET' }
    if (proxyUrl) init.dispatcher = await getDispatcher()
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), opts.timeoutMs)
    try {
      const headers: Record<string, string> = {
        'User-Agent': userAgent,
        'Accept': 'application/json, text/plain, */*',
      }
      if (opts.bduss) headers['Cookie'] = `BDUSS=${opts.bduss}`
      init.headers = headers
      init.signal = ac.signal
      const res = await fetchImpl(url, init as RequestInit)
      const text = await res.text()
      let j: unknown
      try {
        j = JSON.parse(text)
      } catch {
        throw new Error(`响应不是 JSON（HTTP ${res.status}，${text.length} 字节）`)
      }
      const o = j as Record<string, unknown>
      // searchpost 之类的接口在部分响应里会把 error_code 省成 0/缺失；这里只在
      // 「明确非 0」时报错，避免把正常响应误判成失败。
      const ec = typeof o.error_code === 'number' ? o.error_code : 0
      if (ec !== 0) {
        if (ec === 110001) throw new Error('签名校验失败（sign 与参数集不匹配）')
        if (ec === 210009) throw new Error('参数错误（接口返回 210009）')
        throw new Error(`接口返回 error_code=${ec}${o.error_msg ? `：${str(o.error_msg)}` : ''}`)
      }
      return j
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    async forumThreads(forum, page, sort, limit) {
      const params: Record<string, string | number> = { kw: forum, pn: page, rn: Math.max(1, limit) }
      if (sort === 'new') params.sort_type = '1'
      const d = (await signedGet('/c/f/frs/page_pc', params)) as Record<string, unknown>
      const pageData = (d.page_data ?? {}) as Record<string, unknown>
      const list = Array.isArray(pageData.feed_list) ? pageData.feed_list : []
      const items: ThreadItem[] = []
      for (const entry of list) {
        if (!entry || typeof entry !== 'object') continue
        const e = entry as Record<string, unknown>
        if (e.layout === 'frs_top_thread_card') {
          const card = (e.frs_top_thread_card ?? {}) as Record<string, unknown>
          const comps = Array.isArray(card.components) ? card.components : []
          for (const c of comps) {
            const co = (c ?? {}) as Record<string, unknown>
            if (co.component !== 'frs_top_thread') continue
            const tt = (co.frs_top_thread ?? {}) as Record<string, unknown>
            const social = (tt.author_social ?? {}) as Record<string, unknown>
            const tid = str(social.tid)
            if (!tid) continue
            const picAbstract = (tt.pic_abstract ?? {}) as Record<string, unknown>
            items.push({
              tid,
              title: textOfRich(tt.title),
              author: nameOfAuthor(tt.author_social),
              replyNum: num(social.comment_num),
              isTop: true,
              url: `https://tieba.baidu.com/p/${tid}`,
              abstract: textOfRich(picAbstract.abstract),
            })
          }
          continue
        }
        if (e.layout !== 'feed') continue
        const feed = (e.feed ?? {}) as Record<string, unknown>
        const comps: Record<string, Record<string, unknown>> = {}
        for (const c of Array.isArray(feed.components) ? feed.components : []) {
          const co = (c ?? {}) as Record<string, unknown>
          if (typeof co.component === 'string') comps[co.component] = co
        }
        const social = (comps.feed_social?.feed_social ?? {}) as Record<string, unknown>
        const tid = str(social.tid)
        if (!tid) continue
        const titleComp = (comps.feed_title?.feed_title ?? {}) as Record<string, unknown>
        const absComp = (comps.feed_abstract?.feed_abstract ?? {}) as Record<string, unknown>
        items.push({
          tid,
          title: textOfRich(titleComp.data),
          author: nameOfAuthor(comps.feed_head?.feed_head),
          replyNum: num(social.comment_num),
          isTop: false,
          url: `https://tieba.baidu.com/p/${tid}`,
          abstract: textOfRich(absComp.data).slice(0, 120),
        })
      }
      return { forumName: forum, items: items.slice(0, Math.max(1, limit)) }
    },

    async threadFloors(tid, limit, page, onlyLz) {
      // pn 必须显式传：实测 pn=1/2/3 分别返回 2-15 / 16-31 / 32-46 楼，可正常翻页。
      // lz=1 是「只看楼主」（实测 author_id 恒等于 thread.author.id，且与分页正交）；
      // 只看楼主时每页条数不再是 15，所以 hasMore 只能取 page.has_more。
      const params: Record<string, string | number> = { kz: tid, pn: Math.max(1, page ?? 1) }
      if (onlyLz) params.lz = '1'
      const d = (await signedGet('/c/f/pb/page_pc', params)) as Record<string, unknown>
      const thread = (d.thread ?? {}) as Record<string, unknown>
      const forum = (d.forum ?? d.display_forum ?? {}) as Record<string, unknown>
      const pageInfo = (d.page ?? {}) as Record<string, unknown>
      // 主楼在 first_floor（对象），楼层在 post_list（数组）
      const floors: FloorItem[] = []
      const first = d.first_floor
      if (first && typeof first === 'object' && !Array.isArray(first)) {
        floors.push(toFloor(first as Record<string, unknown>, userMap(d)))
      }
      for (const p of Array.isArray(d.post_list) ? d.post_list : []) {
        if (!p || typeof p !== 'object') continue
        floors.push(toFloor(p as Record<string, unknown>, userMap(d)))
      }
      floors.sort((a, b) => a.floor - b.floor)
      const capped = floors.slice(0, Math.max(1, limit))
      const totalPage = num(pageInfo.total_page, 1)
      const currentPage = num(pageInfo.current_page, Math.max(1, page ?? 1))
      // has_more 有 0/1 两种取值；缺失时退回用「当前页 < 总页数」推断。
      const hasMore = typeof pageInfo.has_more === 'number'
        ? pageInfo.has_more === 1
        : currentPage < totalPage
      return {
        forum: str(forum.name),
        title: str(thread.title),
        floors: capped,
        totalFloor: num(thread.reply_num),
        totalPage,
        currentPage,
        hasMore,
        onlyLz: Boolean(onlyLz),
      }
    },

    async threadReplies(tid, pid, limit) {
      // 楼中楼：取该 tid 前几页楼层，找 pid 匹配的楼层读内联 sub_post_list。
      // 注意：匿名通道的楼中楼只有楼层内联一份，不能单独翻页（/c/f/pb/nestedFloor 要登录）。
      const out: ReplyItem[] = []
      const cap = Math.max(1, limit)
      const pages = Math.max(1, Math.min(20, Math.ceil(cap / 14) + 1))
      const wanted = String(pid)
      let users: Map<string, string> | null = null
      for (let pn = 1; pn <= pages; pn++) {
        const d = (await signedGet('/c/f/pb/page_pc', { kz: tid, pn })) as Record<string, unknown>
        if (!users) users = userMap(d)
        const posts = Array.isArray(d.post_list) ? d.post_list : []
        for (const p of posts) {
          if (!p || typeof p !== 'object') continue
          const o = p as Record<string, unknown>
          if (str(o.id) !== wanted) continue
          const sub = (o.sub_post_list ?? {}) as Record<string, unknown>
          const all = Array.isArray(sub.sub_post_list) ? sub.sub_post_list : []
          for (const s of all) {
            if (!s || typeof s !== 'object') continue
            const so = s as Record<string, unknown>
            const aid = str(so.author_id)
            out.push({
              author: (aid && users.get(aid)) || `uid_${aid || '?'}`,
              content: contentToText(so.content),
              time: num(so.time),
            })
          }
          // 把「这层楼在哪一页、是第几楼、楼中楼总共几条」一并回给调用方：
          // 只回回复列表的话，调用方无法在播报里说明定位，也没法判断是不是漏了。
          return {
            items: out.slice(0, cap),
            floor: num(o.floor),
            page: pn,
            subTotal: num(sub.total_num, all.length),
          }
        }
        const page = (d.page ?? {}) as Record<string, unknown>
        if (num(page.total_page, 1) <= pn) break
      }
      return { items: out, floor: 0, page: 0, subTotal: 0 }
    },

    async search(word, forum, limit, page) {
      // pn 必须显式传：实测 pn=1/2/3 返回完全不同的帖子，可正常翻页。
      const params: Record<string, string | number> = {
        word,
        pn: Math.max(1, page ?? 1),
        rn: Math.max(1, limit),
      }
      if (forum) params.kw = forum
      const d = (await signedGet('/c/s/searchpost', params)) as Record<string, unknown>
      const list = Array.isArray(d.post_list) ? d.post_list : []
      const items: SearchItem[] = []
      for (const p of list) {
        if (!p || typeof p !== 'object') continue
        const o = p as Record<string, unknown>
        const tid = str(o.tid ?? o.id)
        if (!tid) continue
        // is_floor=1 表示这条命中的是「某帖里的一个楼层」而不是帖子标题本身。
        // 此时 pid 就是该楼层的 post id（实测与 /c/f/pb/page_pc 里的楼层 id 一致），
        // 用它能把链接精确指到那一楼，而不是让用户自己在一百多楼里翻。
        const isFloor = num(o.is_floor) === 1
        const pid = str(o.pid)
        items.push({
          tid,
          title: str(o.title),
          forumName: str(o.fname),
          author: nameOfAuthor(o.author),
          url: isFloor && pid ? `https://tieba.baidu.com/p/${tid}?pid=${pid}` : `https://tieba.baidu.com/p/${tid}`,
          abstract: str(o.content).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120),
          pid,
          isFloor,
        })
      }
      const pageInfo = (d.page ?? {}) as Record<string, unknown>
      const totalPage = num(pageInfo.total_page, 1)
      const currentPage = num(pageInfo.current_page, Math.max(1, page ?? 1))
      const hasMore = typeof pageInfo.has_more === 'number'
        ? pageInfo.has_more === 1
        : currentPage < totalPage
      return { items: items.slice(0, Math.max(1, limit)), totalPage, hasMore }
    },
  }
}

/** 楼主/楼层作者名从 user_list（按 author_id 索引）里取。 */
function userMap(d: Record<string, unknown>): Map<string, string> {
  const m = new Map<string, string>()
  const list = Array.isArray(d.user_list) ? d.user_list : []
  for (const u of list) {
    if (!u || typeof u !== 'object') continue
    const o = u as Record<string, unknown>
    const id = str(o.id)
    const name = nameOfAuthor(o)
    if (id && name) m.set(id, name)
  }
  return m
}

function toFloor(o: Record<string, unknown>, users: Map<string, string>): FloorItem {
  const aid = str(o.author_id)
  return {
    floor: num(o.floor),
    author: users.get(aid) || `uid_${aid || '?'}`,
    content: contentToText(o.content),
    imageCount: contentImageCount(o.content),
    replyNum: num(o.sub_post_number),
    time: num(o.time),
    pid: str(o.id ?? o.pid),
  }
}

/** 贴吧富文本结构（title/abstract）-> 纯文本：取 text_info.text，跳过 type 2（表情）。 */
function textOfRich(v: unknown): string {
  if (typeof v === 'string') return v
  if (!Array.isArray(v)) return ''
  const parts: string[] = []
  for (const x of v) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    if (o.type === 2) continue
    const t = o.text_info as Record<string, unknown> | undefined
    if (t && typeof t.text === 'string') parts.push(t.text)
  }
  return parts.join('')
}

export { parseFloorHtml }
