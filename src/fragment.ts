/** 共享契约纯函数：Node 端算、浏览器端渲染、测试钉死，三方共用。 */

/** 工具的 items 元素类型：output schema 的 items 是 `{type:'object',additionalProperties:true}`，
 *  InferValue 推出的就是 `Record<string, JsonValue>`，execute 返回值必须严格匹配它。 */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
export type JsonObject = Record<string, JsonValue>

/** 吧内帖子条目。
 *  注意：匿名 /c/f/frs/page_pc 通道**不提供** is_good/view_num/create_time/last_time
 *  （实测全部 absent，精品标记只存在于精品区页面），所以这里没有这些字段。 */
export interface ThreadItem {
  tid: string
  title: string
  author: string
  replyNum: number
  isTop: boolean
  url: string
  abstract: string
}

export interface FloorItem {
  floor: number
  author: string
  content: string
  imageCount: number
  replyNum: number
  time: number
  pid: string
}

export interface ReplyItem {
  author: string
  content: string
  time: number
}

export interface SearchItem {
  tid: string
  title: string
  forumName: string
  author: string
  url: string
  abstract: string
}

export type TiebaMeta =
  | { kind: 'tieba-threads'; forum: string; sort: string; items: ThreadItem[] }
  | { kind: 'tieba-floors'; tid: string; title: string; forum: string; floors: FloorItem[]; totalFloor: number }
  | { kind: 'tieba-replies'; tid: string; items: ReplyItem[] }
  | { kind: 'tieba-search'; word: string; forum: string; items: SearchItem[] }

/** 每种 kind 承载列表的字段名（floors 用 `floors`，其余用 `items`）——必须与 tool.ts 的 presentationMeta 一致。 */
const META_LIST_FIELD: Record<TiebaMeta['kind'], 'items' | 'floors'> = {
  'tieba-threads': 'items',
  'tieba-floors': 'floors',
  'tieba-replies': 'items',
  'tieba-search': 'items',
}

/** 结构化数据 -> 可持久化的 JSON 对象（供 presentationMeta 投影，满足 JsonValue 约束）。 */
export function toJsonObjects<T extends object>(list: T[]): Record<string, JsonValue>[] {
  return list as unknown as Record<string, JsonValue>[]
}

/** 从持久化 meta 还原结构化数据（浏览器端 Toolview 入口）。
 *  校验规则跟随 META_LIST_FIELD：floors 类只认 `floors` 数组，其余类只认 `items` 数组
 *  （此前统一要求 `items`，导致 tieba-floors 永远校验失败、楼层卡片静默退化为纯文本）。 */
export function tiebaMetaFrom(meta: unknown): TiebaMeta | undefined {
  if (!meta || typeof meta !== 'object') return undefined
  const m = meta as Record<string, unknown>
  const kind = m.kind
  if (typeof kind !== 'string' || !kind.startsWith('tieba-')) return undefined
  const field = META_LIST_FIELD[kind as TiebaMeta['kind']]
  if (field === undefined) return undefined
  if (!Array.isArray(m[field])) return undefined
  return m as unknown as TiebaMeta
}

/** 楼中楼 HTML 片段 -> 结构化列表（flr 的 floor_html，真实结构见 probe_flr_html.mjs dump）。 */
export function parseFloorHtml(html: string): ReplyItem[] {
  if (!html) return []
  const out: ReplyItem[] = []
  for (const chunk of html.split('<li ').slice(1)) {
    let author = ''
    const info = /data-info='([^']*)'/.exec(chunk)
    if (info) {
      const un = /"un"\s*:\s*"([^"]*)"/.exec(info[1]!)
      if (un) author = un[1]!
    }
    // 正文：优先 <span class="floor_content">（真实结构），退化时取整块去标签
    let text = ''
    const span = /<span[^>]*class="[^"]*floor_content[^"]*"[^>]*>([\s\S]*?)<\/span>/.exec(chunk)
    if (span) text = span[1]!
    else {
      const body = /<div[^>]*class="[^"]*l_post[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(chunk)
      text = body ? body[1]! : chunk.replace(/<\/?li[^>]*>/g, ' ')
    }
    text = text.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ').trim()
    // 清掉「回复 XXX :」前缀（去掉回复对象后的正文更干净）
    text = text.replace(/^回复\s+.*?\s*:\s*/, '').trim()
    if (text || author) out.push({ author, content: text, time: 0 })
  }
  return out
}

/** 楼层结构化 content -> 纯文本（跳过表情 type 2，保留文字 type 0）。 */
export function contentToText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  const parts: string[] = []
  for (const x of content) {
    if (x && typeof x === 'object' && (x as Record<string, unknown>).type === 0) {
      const t = (x as Record<string, unknown>).text
      if (typeof t === 'string') parts.push(t)
    }
  }
  return parts.join('')
}

/** 楼层结构化 content -> 图片数量（type 3）。 */
export function contentImageCount(content: unknown): number {
  if (!Array.isArray(content)) return 0
  let n = 0
  for (const x of content) {
    if (x && typeof x === 'object' && (x as Record<string, unknown>).type === 3) n += 1
  }
  return n
}

export function threadUrl(tid: string | number): string {
  return `https://tieba.baidu.com/p/${tid}`
}

export function formatTime(ts: number): string {
  if (!ts || ts <= 0) return ''
  const d = new Date(ts * 1000)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
