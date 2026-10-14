import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { contentToText, contentImageCount, formatTime, tiebaMetaFrom } from '../src/fragment.ts'
import { calcSign, findJsonAfter, makeApiClient, md5Hex } from '../src/api.ts'
import { tiebaTools } from '../src/tool.ts'

/** 构造一个按 URL 匹配返回固定 JSON 的假 fetch。 */
function fakeFetch(routes) {
  const calls = []
  const impl = async (url) => {
    calls.push(String(url))
    for (const [needle, body] of routes) {
      if (String(url).includes(needle)) return new Response(body)
    }
    return new Response(JSON.stringify({ error_code: 404, error_msg: 'not found' }))
  }
  impl.calls = calls
  return impl
}

describe('fragment 契约', () => {
  it('contentToText 只取文字（type 0），跳过表情', () => {
    const content = [
      { type: 0, text: '楼主说得对' },
      { type: 2, text: 'image_emoticon43', src: 'x.png' },
      { type: 0, text: '+1' },
    ]
    assert.equal(contentToText(content), '楼主说得对+1')
    assert.equal(contentToText('纯字符串'), '纯字符串')
    assert.equal(contentToText(null), '')
  })

  it('contentImageCount 只数 type 3', () => {
    const content = [{ type: 3, src: 'a' }, { type: 0, text: 't' }, { type: 3, src: 'b' }]
    assert.equal(contentImageCount(content), 2)
  })

  it('formatTime 输出 YYYY-MM-DD HH:mm（UTC+8）', () => {
    // 1768546197 = 2026-01-16 14:49 UTC+8
    assert.equal(formatTime(1768546197), '2026-01-16 14:49')
    assert.equal(formatTime(0), '')
  })

  it('tiebaMetaFrom 只认 tieba-* meta', () => {
    assert.equal(tiebaMetaFrom({ kind: 'weather' }), undefined)
    assert.equal(tiebaMetaFrom(null), undefined)
    const m = tiebaMetaFrom({ kind: 'tieba-threads', items: [] })
    assert.equal(m?.kind, 'tieba-threads')
  })

  it('tiebaMetaFrom 按 kind 校验对应列表字段（floors 类用 floors，不是 items）', () => {
    // 回归：presentationMeta 对 tieba-floors 产出的是 `floors`，若校验仍写死 `items`，
    // 楼层卡片会静默退化成纯文本回退。
    assert.equal(tiebaMetaFrom({ kind: 'tieba-floors', floors: [] })?.kind, 'tieba-floors')
    assert.equal(tiebaMetaFrom({ kind: 'tieba-floors', items: [] }), undefined)
    assert.equal(tiebaMetaFrom({ kind: 'tieba-threads', floors: [] }), undefined)
    for (const kind of ['tieba-replies', 'tieba-search', 'tieba-threads']) {
      assert.equal(tiebaMetaFrom({ kind, items: [] })?.kind, kind, kind)
    }
    assert.equal(tiebaMetaFrom({ kind: 'tieba-unknown', items: [] }), undefined)
  })
})

describe('sign 契约', () => {
  it('md5Hex 与 node:crypto 一致', async () => {
    const { createHash } = await import('node:crypto')
    for (const s of ['', 'abc', 'tiebaclient!!!', 'kz=11102322434&pn=1', '原神强度']) {
      assert.equal(md5Hex(s), createHash('md5').update(s, 'utf8').digest('hex'), `md5(${s})`)
    }
  })

  it('calcSign = md5(按 key 的 codepoint 序拼接 + SALT)', async () => {
    const { createHash } = await import('node:crypto')
    const params = { kz: '11102322434', pn: '1' }
    const keys = Object.keys(params).sort()
    const expect = createHash('md5')
      .update(keys.map((k) => `${k}=${params[k]}`).join('') + 'tiebaclient!!!', 'utf8')
      .digest('hex')
    assert.equal(calcSign(params), expect)
  })

  it('calcSign 对 key 顺序不敏感（对象字面量顺序不同结果相同）', () => {
    const a = calcSign({ b: '2', a: '1' })
    const b = calcSign({ a: '1', b: '2' })
    assert.equal(a, b)
  })
})

describe('api 层', () => {
  it('findJsonAfter 括号配平取数组', () => {
    const html = 'var x = 1; thread_list: [{"tid":"1"},{"tid":"2"}] ;end'
    const arr = findJsonAfter(html, 'thread_list:')
    assert.equal(arr.length, 2)
    assert.equal(arr[1].tid, '2')
  })

  it('findJsonAfter 跳过字符串内的括号', () => {
    const html = 'thread_list: [{"t":"a]b[","x":1}]'
    const arr = findJsonAfter(html, 'thread_list:')
    assert.equal(arr.length, 1)
    assert.equal(arr[0].t, 'a]b[')
  })

  it('findJsonAfter 找不到 marker 返回 undefined', () => {
    assert.equal(findJsonAfter('<html></html>', 'thread_list:'), undefined)
  })

  it('forumThreads 解析 frs/page_pc 的 feed_list（默认排序）', async () => {
    const json = JSON.stringify({
      error_code: 0,
      page_data: { feed_list: [
        { layout: 'frs_top_thread_card', frs_top_thread_card: { components: [
          { component: 'frs_top_thread', frs_top_thread: {
            title: [{ type: 0, text_info: { text: '置顶活动' } }],
            author_social: { tid: '100', comment_num: 33 },
          } },
        ] } },
        { layout: 'feed', feed: { components: [
          { component: 'feed_head', feed_head: { main_data: [{ text: { text: '小明' } }] } },
          { component: 'feed_title', feed_title: { data: [{ type: 0, text_info: { text: '水一帖' } }] } },
          { component: 'feed_abstract', feed_abstract: { data: [{ type: 0, text_info: { text: '日常记录' } }] } },
          { component: 'feed_social', feed_social: { tid: '111', comment_num: 5 } },
        ] } },
      ] },
    })
    const fetchImpl = fakeFetch([['/c/f/frs/page_pc', json]])
    const api = makeApiClient({ userAgent: 'UA', timeoutMs: 5000, fetchImpl })
    const { items } = await api.forumThreads('原神', 1, 'default', 30)
    assert.equal(items.length, 2)
    assert.equal(items[0].tid, '100')
    assert.equal(items[0].isTop, true)
    assert.equal(items[0].title, '置顶活动')
    assert.equal(items[0].replyNum, 33)
    assert.equal(items[1].tid, '111')
    assert.equal(items[1].isTop, false)
    assert.equal(items[1].author, '小明')
    assert.equal(items[1].title, '水一帖')
    assert.equal(items[1].abstract, '日常记录')
    assert.equal(items[1].url, 'https://tieba.baidu.com/p/111')
    // sort=new 时必须带 sort_type=1
    assert.ok(fetchImpl.calls[0].includes('sort_type=1') === false)
  })

  it('forumThreads sort=new 会加 sort_type=1 且进签名', async () => {
    const json = JSON.stringify({ error_code: 0, page_data: { feed_list: [] } })
    const fetchImpl = fakeFetch([['/c/f/frs/page_pc', json]])
    const api = makeApiClient({ userAgent: 'UA', timeoutMs: 5000, fetchImpl })
    await api.forumThreads('原神', 2, 'new', 30)
    const url = fetchImpl.calls[0]
    assert.ok(url.includes('sort_type=1'), 'URL 应含 sort_type=1')
    const params = new URL(url).searchParams
    // sign 必须覆盖 sort_type：重算一次比对
    assert.equal(calcSign(Object.fromEntries([...params].filter(([k]) => k !== 'sign'))), params.get('sign'))
  })

  it('threadFloors 解析 pb/page_pc：first_floor + post_list + user_list', async () => {
    const json = JSON.stringify({
      error_code: 0,
      forum: { name: '原神' },
      thread: { title: '强度讨论', reply_num: 57 },
      page: { total_page: 2 },
      user_list: [{ id: 11, name: '梦起夜游' }, { id: 22, name_show: '牢大' }],
      first_floor: {
        floor: 1, id: '9001', time: 1768546197, author_id: 11, sub_post_number: 0,
        content: [
          { type: 0, text: '这期池子怎么样' },
          { type: 2, text: 'image_emoticon1' },
          { type: 3, src: 'i.png' },
        ],
      },
      post_list: [{
        floor: 2, id: '9002', time: 1768546200, author_id: 22, sub_post_number: 3,
        content: [{ type: 0, text: '爆金币' }],
      }],
    })
    const fetchImpl = fakeFetch([['/c/f/pb/page_pc', json]])
    const api = makeApiClient({ userAgent: 'UA', timeoutMs: 5000, fetchImpl })
    const r = await api.threadFloors('111', 30)
    assert.equal(r.forum, '原神')
    assert.equal(r.title, '强度讨论')
    assert.equal(r.totalFloor, 57)
    assert.equal(r.totalPage, 2)
    assert.equal(r.floors.length, 2)
    assert.equal(r.floors[0].floor, 1)
    assert.equal(r.floors[0].author, '梦起夜游')
    assert.equal(r.floors[0].content, '这期池子怎么样')
    assert.equal(r.floors[0].imageCount, 1)
    assert.equal(r.floors[0].pid, '9001')
    assert.equal(r.floors[1].author, '牢大')
    assert.equal(r.floors[1].replyNum, 3)
  })

  it('threadFloors 按楼层号排序（缺楼/乱序都归位）', async () => {
    const json = JSON.stringify({
      error_code: 0,
      forum: { name: 'x' },
      thread: { title: 't', reply_num: 10 },
      page: { total_page: 1 },
      user_list: [],
      first_floor: { floor: 1, id: '1', time: 1, author_id: 1, content: [{ type: 0, text: 'a' }] },
      post_list: [
        { floor: 5, id: '5', time: 1, author_id: 1, content: [{ type: 0, text: 'e' }] },
        { floor: 3, id: '3', time: 1, author_id: 1, content: [{ type: 0, text: 'c' }] },
      ],
    })
    const api = makeApiClient({
      userAgent: 'UA', timeoutMs: 5000,
      fetchImpl: fakeFetch([['/c/f/pb/page_pc', json]]),
    })
    const r = await api.threadFloors('111', 30)
    assert.deepEqual(r.floors.map((f) => f.floor), [1, 3, 5])
  })

  it('threadFloors 楼层数超过 limit 时截断', async () => {
    const postList = []
    for (let i = 2; i <= 16; i++) {
      postList.push({ floor: i, id: String(i), time: 1, author_id: 1, content: [{ type: 0, text: `f${i}` }] })
    }
    const json = JSON.stringify({
      error_code: 0,
      forum: { name: 'x' },
      thread: { title: 't', reply_num: 99 },
      page: { total_page: 2 },
      user_list: [],
      first_floor: { floor: 1, id: '1', time: 1, author_id: 1, content: [{ type: 0, text: 'a' }] },
      post_list: postList,
    })
    const api = makeApiClient({
      userAgent: 'UA', timeoutMs: 5000,
      fetchImpl: fakeFetch([['/c/f/pb/page_pc', json]]),
    })
    const r = await api.threadFloors('111', 5)
    assert.equal(r.floors.length, 5)
    assert.equal(r.floors[4].floor, 5)
  })

  it('error_code=3（吧不存在）抛出中文错误', async () => {
    const json = JSON.stringify({ error_code: 3, error_msg: '该吧还未建立，去看看其他贴吧吧' })
    const api = makeApiClient({
      userAgent: 'UA', timeoutMs: 5000,
      fetchImpl: fakeFetch([['/c/f/frs/page_pc', json]]),
    })
    await assert.rejects(() => api.forumThreads('不存在的吧', 1, 'default', 5), /该吧还未建立/)
  })

  it('error_code=350008（帖子被删）抛出中文错误', async () => {
    const json = JSON.stringify({ error_code: 350008, error_msg: '该贴已被删除，请浏览其他贴子' })
    const api = makeApiClient({
      userAgent: 'UA', timeoutMs: 5000,
      fetchImpl: fakeFetch([['/c/f/pb/page_pc', json]]),
    })
    await assert.rejects(() => api.threadFloors('1', 30), /已被删除/)
  })

  it('error_code=110001 报签名校验失败', async () => {
    const json = JSON.stringify({ error_code: 110001, error_msg: '未知错误' })
    const api = makeApiClient({
      userAgent: 'UA', timeoutMs: 5000,
      fetchImpl: fakeFetch([['/c/f/frs/page_pc', json]]),
    })
    await assert.rejects(() => api.forumThreads('原神', 1, 'default', 5), /签名校验失败/)
  })

  it('threadReplies 从楼层内联 sub_post_list 取楼中楼', async () => {
    const json = JSON.stringify({
      error_code: 0,
      forum: { name: 'x' },
      thread: { title: 't', reply_num: 10 },
      page: { total_page: 1 },
      user_list: [{ id: 77, name: 'bdfftw' }, { id: 88, name: '咪啪寒蝉' }],
      first_floor: { floor: 1, id: '1', time: 1, author_id: 1, content: [{ type: 0, text: 'a' }] },
      post_list: [
        { floor: 2, id: '9002', time: 1, author_id: 1, sub_post_number: 2, content: [{ type: 0, text: 'x' }],
          sub_post_list: { pid: '9002', sub_post_list: [
            { id: '1', author_id: 77, time: 100, content: [{ type: 0, text: '确实如此' }] },
            { id: '2', author_id: 88, time: 101, content: [{ type: 0, text: '+1' }] },
          ] } },
        { floor: 3, id: '9003', time: 1, author_id: 1, sub_post_number: 0, content: [{ type: 0, text: 'y' }] },
      ],
    })
    const api = makeApiClient({
      userAgent: 'UA', timeoutMs: 5000,
      fetchImpl: fakeFetch([['/c/f/pb/page_pc', json]]),
    })
    const items = await api.threadReplies('111', '9002', 10)
    assert.equal(items.length, 2)
    assert.equal(items[0].author, 'bdfftw')
    assert.equal(items[0].content, '确实如此')
    assert.equal(items[1].author, '咪啪寒蝉')
  })

  it('threadReplies 楼层无楼中楼返回空数组', async () => {
    const json = JSON.stringify({
      error_code: 0,
      forum: { name: 'x' },
      thread: { title: 't', reply_num: 10 },
      page: { total_page: 1 },
      user_list: [],
      first_floor: { floor: 1, id: '1', time: 1, author_id: 1, content: [{ type: 0, text: 'a' }] },
      post_list: [{ floor: 2, id: '9002', time: 1, author_id: 1, sub_post_number: 0, content: [] }],
    })
    const api = makeApiClient({
      userAgent: 'UA', timeoutMs: 5000,
      fetchImpl: fakeFetch([['/c/f/pb/page_pc', json]]),
    })
    assert.deepEqual(await api.threadReplies('111', '9002', 10), [])
  })

  it('search 解析 searchpost 的 post_list', async () => {
    const json = JSON.stringify({
      error_code: 0,
      post_list: [
        { tid: '1', title: '甲', fname: '原神', author: { name: 'u1' }, content: '摘要一' },
        { tid: '2', title: '乙', fname: '崩铁', author: { name_show: 'u2' }, content: '摘要二' },
      ],
      page: { page_size: 20, current_page: 1, total_count: 2572514, total_page: 128626, has_more: 1 },
    })
    const fetchImpl = fakeFetch([['/c/s/searchpost', json]])
    const api = makeApiClient({ userAgent: 'UA', timeoutMs: 5000, fetchImpl })
    const items = await api.search('抽卡', '', 20)
    assert.equal(items.length, 2)
    assert.equal(items[0].forumName, '原神')
    assert.equal(items[0].author, 'u1')
    assert.equal(items[0].abstract, '摘要一')
    assert.equal(items[0].url, 'https://tieba.baidu.com/p/1')
    assert.equal(items[1].author, 'u2')
    // 不带 forum 时不应有 kw 参数
    assert.ok(!fetchImpl.calls[0].includes('kw='))
  })

  it('search 带 forum 时加 kw 参数', async () => {
    const json = JSON.stringify({ error_code: 0, post_list: [] })
    const fetchImpl = fakeFetch([['/c/s/searchpost', json]])
    const api = makeApiClient({ userAgent: 'UA', timeoutMs: 5000, fetchImpl })
    const items = await api.search('强度', '原神', 20)
    assert.equal(items.length, 0)
    assert.ok(fetchImpl.calls[0].includes('kw='))
  })

  it('未配置 BDUSS 时不带 Cookie 头', async () => {
    const json = JSON.stringify({ error_code: 0, page_data: { feed_list: [] } })
    let seen
    const api = makeApiClient({
      userAgent: 'UA', timeoutMs: 5000,
      fetchImpl: (async (_url, init) => { seen = init; return new Response(json) }),
    })
    await api.forumThreads('原神', 1, 'default', 5)
    assert.equal(seen.headers.Cookie, undefined)
  })

  it('配置了 BDUSS 时带 Cookie 头', async () => {
    const json = JSON.stringify({ error_code: 0, page_data: { feed_list: [] } })
    let seen
    const api = makeApiClient({
      bduss: 'FAKEBDUSS', userAgent: 'UA', timeoutMs: 5000,
      fetchImpl: (async (_url, init) => { seen = init; return new Response(json) }),
    })
    await api.forumThreads('原神', 1, 'default', 5)
    assert.equal(seen.headers.Cookie, 'BDUSS=FAKEBDUSS')
  })

  it('非 JSON 响应抛出可读错误', async () => {
    const api = makeApiClient({
      userAgent: 'UA', timeoutMs: 5000,
      fetchImpl: (async () => new Response('<html>验证码</html>')),
    })
    await assert.rejects(() => api.forumThreads('原神', 1, 'default', 5), /不是 JSON/)
  })

  // proxyUrl 曾经是「文档写了但代码没接线」的死配置，这组是回归防线。
  it('未配置 proxyUrl 时不加载代理、请求不带 dispatcher', async () => {
    const json = JSON.stringify({ error_code: 0, page_data: { feed_list: [] } })
    let seen
    let loaded = 0
    const api = makeApiClient({
      userAgent: 'UA', timeoutMs: 5000, proxyUrl: '',
      proxyDispatcherFactory: async () => { loaded += 1; return {} },
      fetchImpl: (async (_url, init) => { seen = init; return new Response(json) }),
    })
    await api.forumThreads('原神', 1, 'default', 5)
    assert.equal(loaded, 0, '没配 proxyUrl 就不该去加载 undici')
    assert.equal(seen.dispatcher, undefined)
  })

  it('配置 proxyUrl 时把 dispatcher 注入请求', async () => {
    const json = JSON.stringify({ error_code: 0, page_data: { feed_list: [] } })
    const calls = []
    let seen
    const api = makeApiClient({
      userAgent: 'UA', timeoutMs: 5000, proxyUrl: 'http://127.0.0.1:7890',
      proxyDispatcherFactory: async (uri) => { calls.push(uri); return { proxy: uri } },
      fetchImpl: (async (_url, init) => { seen = init; return new Response(json) }),
    })
    await api.forumThreads('原神', 1, 'default', 5)
    assert.deepEqual(calls, ['http://127.0.0.1:7890'])
    assert.deepEqual(seen.dispatcher, { proxy: 'http://127.0.0.1:7890' })
  })

  it('proxyUrl 前后空白被忽略（不误判为已配置）', async () => {
    const json = JSON.stringify({ error_code: 0, page_data: { feed_list: [] } })
    let loaded = 0
    let seen
    const api = makeApiClient({
      userAgent: 'UA', timeoutMs: 5000, proxyUrl: '   ',
      proxyDispatcherFactory: async () => { loaded += 1; return {} },
      fetchImpl: (async (_url, init) => { seen = init; return new Response(json) }),
    })
    await api.forumThreads('原神', 1, 'default', 5)
    assert.equal(loaded, 0)
    assert.equal(seen.dispatcher, undefined)
  })

  it('代理 dispatcher 只建一次（多个请求共用连接池）', async () => {
    const json = JSON.stringify({ error_code: 0, page_data: { feed_list: [] } })
    let built = 0
    const api = makeApiClient({
      userAgent: 'UA', timeoutMs: 5000, proxyUrl: 'http://127.0.0.1:7890',
      proxyDispatcherFactory: async () => { built += 1; return {} },
      fetchImpl: (async () => new Response(json)),
    })
    await api.forumThreads('原神', 1, 'default', 5)
    await api.forumThreads('原神', 2, 'default', 5)
    assert.equal(built, 1)
  })

  it('代理工厂抛错时向调用方传播（不被吞掉）', async () => {
    const api = makeApiClient({
      userAgent: 'UA', timeoutMs: 5000, proxyUrl: 'http://127.0.0.1:7890',
      proxyDispatcherFactory: async () => { throw new Error('boom') },
      fetchImpl: (async () => new Response('{}')),
    })
    await assert.rejects(() => api.forumThreads('原神', 1, 'default', 5), /boom/)
  })

  // 真实默认路径（不注入工厂）：本机插件目录没有 undici，必须给出可读的中文指引，
  // 而不是一个光秃秃的 ERR_MODULE_NOT_FOUND。
  it('默认代理路径在加载不到 undici 时给出可读指引', async (t) => {
    const require = createRequire(import.meta.url)
    let hasUndici = true
    try {
      require.resolve('undici')
    } catch {
      hasUndici = false
    }
    if (hasUndici) {
      t.skip('本机插件目录能解析 undici，跳过「加载不到」分支')
      return
    }
    const api = makeApiClient({
      userAgent: 'UA', timeoutMs: 5000, proxyUrl: 'http://127.0.0.1:7890',
      fetchImpl: (async () => new Response('{}')),
    })
    await assert.rejects(
      () => api.forumThreads('原神', 1, 'default', 5),
      /加载不到 undici[\s\S]*proxyUrl/,
    )
  })
})

describe('presentationMeta 与浏览器端校验的往返契约', () => {
  // 这一组是楼层卡片静默退化的回归防线：tool.ts 产出的 meta 必须能被
  // 客户端 tiebaMetaFrom 接受，否则 Toolview 会无声退化到纯文本回退。
  const config = {
    bduss: '', userAgent: 'UA', timeoutMs: 5000, proxyUrl: '',
    maxThreads: 30, maxFloors: 30, maxSearch: 20,
  }
  const byName = (name) => {
    const t = tiebaTools(config).find((x) => x.name === name)
    assert.ok(t, `tool ${name} not registered`)
    return t
  }

  it('四个工具都注册了 presentationMeta', () => {
    assert.equal(tiebaTools(config).length, 4)
    for (const t of tiebaTools(config)) {
      assert.equal(typeof t.output?.presentationMeta, 'function', `${t.name} presentationMeta`)
    }
  })

  it('tieba_forum_threads 的 meta 可被客户端接受', () => {
    const t = byName('tieba_forum_threads')
    const value = { text: 'x', items: [{ tid: '1', title: 'A', author: 'u', replyNum: 3, isTop: false, url: 'u', abstract: '' }] }
    const meta = t.output.presentationMeta({ forum: '原神', sort: 'new' }, value)
    assert.equal(meta.kind, 'tieba-threads')
    assert.equal(tiebaMetaFrom(meta)?.kind, 'tieba-threads')
  })

  it('tieba_thread_detail 的 meta 可被客户端接受（floors 字段）', () => {
    const t = byName('tieba_thread_detail')
    const value = { text: 'x', items: [{ floor: 1, author: 'u', content: 'c', imageCount: 0, replyNum: 0, time: 0, pid: 'p', title: '标题', forum: '原神', totalFloor: 57 }] }
    const meta = t.output.presentationMeta({ tid: '111' }, value)
    assert.equal(meta.kind, 'tieba-floors')
    assert.deepEqual(meta.floors, value.items)
    assert.equal(meta.title, '标题')
    assert.equal(meta.forum, '原神')
    assert.equal(meta.totalFloor, 57)
    // 关键断言：客户端校验必须通过（回归点）
    assert.equal(tiebaMetaFrom(meta)?.kind, 'tieba-floors')
    // items 为空时不应崩，且仍可被接受
    const empty = t.output.presentationMeta({ tid: '111' }, { text: 'x', items: [] })
    assert.equal(tiebaMetaFrom(empty)?.kind, 'tieba-floors')
  })

  it('tieba_thread_replies / tieba_forum_search 的 meta 可被客户端接受', () => {
    const r = byName('tieba_thread_replies').output.presentationMeta(
      { tid: '1', pid: 'p' }, { text: 'x', items: [{ author: 'u', content: 'c', time: 0 }] })
    assert.equal(tiebaMetaFrom(r)?.kind, 'tieba-replies')
    const s = byName('tieba_forum_search').output.presentationMeta(
      { word: 'w' }, { text: 'x', items: [{ tid: '1', title: 't', forumName: '原神', author: 'u', url: 'u', abstract: '' }] })
    assert.equal(tiebaMetaFrom(s)?.kind, 'tieba-search')
  })
})

describe('插件装载契约：没有 config 也必须能挂上', () => {
  // 这一组是「插件装了、文件在位、也没有 skip 警告，但模型工具列表里没有
  // tieba_*」那个静默失效的回归防线。
  //
  // 真凶：cordis 的 resolveConfig()（lib/index.js:956-962）是
  //   if (!runtime.Config) return config       // 没有 schema 就原样透传
  // 而 runtime.Config 取自 plugin.Config（lib/index.js:1631）。
  // 我们的 cordis.patch.yml insert 条目没有 `config:` 字段 → 透传进来 undefined；
  // 一旦产物没导出 Config，apply(ctx, undefined) 读 config.bduss 就抛，
  // 异常发生在 ctx.effect 回调里会被 cordis 吞掉 → 四个工具一个都不注册。
  const req = createRequire(import.meta.url)
  // createRequire().resolve() 返回 Windows 绝对路径，动态 import 必须转成 file:// URL。
  const cordisUrl = pathToFileURL(req.resolve('@deepseek-ai/cordis')).href

  it('产物必须重新导出 Config（cordis 默认值注入的唯一入口）', async () => {
    const mod = await import('../lib/index.mjs')
    assert.ok(mod.Config, 'artifact does not export Config')
    assert.equal(typeof mod.Config['~standard']?.validate, 'function',
      'Config is not a schemastery schema (no ~standard.validate)')
  })

  it('产物导出的 apply / inject / name 三件套形状正确', async () => {
    const mod = await import('../lib/index.mjs')
    assert.equal(typeof mod.apply, 'function')
    assert.ok(Array.isArray(mod.inject))
    for (const s of ['tools', 'skills', 'systemPrompt']) {
      assert.ok(mod.inject.includes(s), `inject missing ${s}`)
    }
  })

  it('apply(ctx) 在没有 config 时仍注册四个工具（真 cordis 装载）', async () => {
    const cordis = await import(cordisUrl)
    const mod = await import('../lib/index.mjs')
    const names = []
    const ctx = new cordis.Context()
    ctx.provide('tools', { register: (t) => { names.push(t.name); return () => {} } })
    ctx.provide('skills', { registerProvider: () => () => {} })
    ctx.provide('systemPrompt', { section: () => () => {} })
    ctx.plugin(mod, undefined)
    await new Promise((r) => setTimeout(r, 60))
    assert.deepEqual(names.slice().sort(), [
      'tieba_forum_search', 'tieba_forum_threads', 'tieba_thread_detail', 'tieba_thread_replies',
    ])
  })

  it('apply 对 undefined / null / {} / 部分字段都能规范化出完整配置', async () => {
    const mod = await import('../lib/index.mjs')
    const { Context } = await import(cordisUrl)
    for (const raw of [undefined, null, {}, { bduss: 'x' }, { maxThreads: 5 }]) {
      const names = []
      const ctx = new Context()
      ctx.provide('tools', { register: (t) => { names.push(t.name); return () => {} } })
      ctx.provide('skills', { registerProvider: () => () => {} })
      ctx.provide('systemPrompt', { section: () => () => {} })
      ctx.plugin(mod, raw)
      await new Promise((r) => setTimeout(r, 40))
      assert.equal(names.length, 4, `config=${JSON.stringify(raw)} registered ${names.length}`)
    }
  })
})
