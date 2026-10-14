import type { ClientContext, ToolCallViewProps } from './types'
import { formatTime, tiebaMetaFrom, type TiebaMeta } from '../fragment'

export const name = 'dsh-tieba-plugin'
export const inject = ['slots']

const rowStyle = { padding: '4px 0', borderTop: '1px solid rgba(128,128,128,.2)' } as const

function Loading() {
  return (
    <div style={{ padding: 12, fontSize: 13, color: 'var(--text-secondary, #888)' }}>
      ⏳ 正在读取贴吧…
    </div>
  )
}

function Fallback({ block }: { block: { content?: unknown } }) {
  const c = block.content
  const text = Array.isArray(c) && c.length > 0 && typeof c[0] === 'object'
    && c[0] !== null && 'text' in c[0]
    ? String((c[0] as { text?: unknown }).text)
    : ''
  return <div style={{ padding: 12, fontSize: 13, whiteSpace: 'pre-wrap' }}>{text || '贴吧结果不可用'}</div>
}

function ThreadsView({ meta }: { meta: Extract<TiebaMeta, { kind: 'tieba-threads' }> }) {
  return (
    <div style={{ padding: 12, fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        {meta.forum}吧 · {meta.sort === 'new' ? '按发帖时间' : '默认排序'} · {meta.items.length} 帖
      </div>
      {meta.items.map((t) => (
        <div key={t.tid} style={rowStyle}>
          <a href={t.url} target="_blank" rel="noreferrer">{t.title}</a>
          {t.isTop ? ' [置顶]' : ''}
          <div style={{ opacity: 0.7 }}>
            {t.author || '未知'} · {t.replyNum} 回复
          </div>
          {t.abstract
            ? <div style={{ opacity: 0.55, marginTop: 2 }}>{t.abstract.slice(0, 100)}</div>
            : null}
        </div>
      ))}
    </div>
  )
}

function FloorsView({ meta }: { meta: Extract<TiebaMeta, { kind: 'tieba-floors' }> }) {
  return (
    <div style={{ padding: 12, fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        {meta.title || meta.tid} · 前 {meta.floors.length} 楼
      </div>
      {meta.floors.map((f) => (
        <div key={f.pid || f.floor} style={rowStyle}>
          <b>{f.floor}楼</b> {f.author}
          <div style={{ opacity: 0.9 }}>{f.content.slice(0, 120)}</div>
        </div>
      ))}
    </div>
  )
}

function RepliesView({ meta }: { meta: Extract<TiebaMeta, { kind: 'tieba-replies' }> }) {
  return (
    <div style={{ padding: 12, fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        楼中楼回复 · 前 {meta.items.length} 条
      </div>
      {meta.items.map((r, i) => (
        <div key={i} style={rowStyle}>
          <b>{r.author || '匿名'}</b>：{r.content}
        </div>
      ))}
    </div>
  )
}

function SearchView({ meta }: { meta: Extract<TiebaMeta, { kind: 'tieba-search' }> }) {
  return (
    <div style={{ padding: 12, fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        搜索「{meta.word}」{meta.forum ? `（${meta.forum}吧）` : ''} · {meta.items.length} 条
      </div>
      {meta.items.map((t) => (
        <div key={t.tid} style={rowStyle}>
          <a href={t.url} target="_blank" rel="noreferrer">{t.title}</a>
          <div style={{ opacity: 0.7 }}>[{t.forumName}] · {t.author}</div>
          {t.abstract
            ? <div style={{ opacity: 0.55, marginTop: 2 }}>{t.abstract.slice(0, 100)}</div>
            : null}
        </div>
      ))}
    </div>
  )
}

function TiebaView({ block }: { block: ToolCallViewProps['block'] }) {
  if (!('kind' in block)) return <Loading />
  if (block.isError) return <Fallback block={block} />
  const meta = tiebaMetaFrom(block.meta)
  if (!meta) return <Fallback block={block} />
  if (meta.kind === 'tieba-threads') return <ThreadsView meta={meta} />
  if (meta.kind === 'tieba-floors') return <FloorsView meta={meta} />
  if (meta.kind === 'tieba-replies') return <RepliesView meta={meta} />
  return <SearchView meta={meta} />
}

export function apply(ctx: ClientContext): void {
  for (const key of ['tieba_forum_threads', 'tieba_thread_detail', 'tieba_thread_replies', 'tieba_forum_search']) {
    ctx.slots.inject('tool.call.toolview', () => ctx.slots.register(
      { name: 'tool.call.toolview', key },
      TiebaView,
    ))
  }
}
