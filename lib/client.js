window.__ModuleLoader__.load({ id: "dsh-tieba-plugin", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
let react_jsx_runtime = require("react/jsx-runtime");

//#region src/fragment.ts
/** 每种 kind 承载列表的字段名（floors 用 `floors`，其余用 `items`）——必须与 tool.ts 的 presentationMeta 一致。 */
const META_LIST_FIELD = {
	"tieba-threads": "items",
	"tieba-floors": "floors",
	"tieba-replies": "items",
	"tieba-search": "items"
};
/** 从持久化 meta 还原结构化数据（浏览器端 Toolview 入口）。
*  校验规则跟随 META_LIST_FIELD：floors 类只认 `floors` 数组，其余类只认 `items` 数组
*  （此前统一要求 `items`，导致 tieba-floors 永远校验失败、楼层卡片静默退化为纯文本）。 */
function tiebaMetaFrom(meta) {
	if (!meta || typeof meta !== "object") return void 0;
	const m = meta;
	const kind = m.kind;
	if (typeof kind !== "string" || !kind.startsWith("tieba-")) return void 0;
	const field = META_LIST_FIELD[kind];
	if (field === void 0) return void 0;
	if (!Array.isArray(m[field])) return void 0;
	return m;
}

//#endregion
//#region src/client/index.tsx
const name = "dsh-tieba-plugin";
const inject = ["slots"];
const rowStyle = {
	padding: "4px 0",
	borderTop: "1px solid rgba(128,128,128,.2)"
};
function Loading() {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		style: {
			padding: 12,
			fontSize: 13,
			color: "var(--text-secondary, #888)"
		},
		children: "⏳ 正在读取贴吧…"
	});
}
function Fallback({ block }) {
	const c = block.content;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		style: {
			padding: 12,
			fontSize: 13,
			whiteSpace: "pre-wrap"
		},
		children: (Array.isArray(c) && c.length > 0 && typeof c[0] === "object" && c[0] !== null && "text" in c[0] ? String(c[0].text) : "") || "贴吧结果不可用"
	});
}
function ThreadsView({ meta }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: {
			padding: 12,
			fontSize: 13
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: {
				fontWeight: 600,
				marginBottom: 8
			},
			children: [
				meta.forum,
				"吧 · ",
				meta.sort === "new" ? "按发帖时间" : "默认排序",
				" · ",
				meta.items.length,
				" 帖"
			]
		}), meta.items.map((t) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: rowStyle,
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
					href: t.url,
					target: "_blank",
					rel: "noreferrer",
					children: t.title
				}),
				t.isTop ? " [置顶]" : "",
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: { opacity: .7 },
					children: [
						t.author || "未知",
						" · ",
						t.replyNum,
						" 回复"
					]
				}),
				t.abstract ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: {
						opacity: .55,
						marginTop: 2
					},
					children: t.abstract.slice(0, 100)
				}) : null
			]
		}, t.tid))]
	});
}
function FloorsView({ meta }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: {
			padding: 12,
			fontSize: 13
		},
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					fontWeight: 600,
					marginBottom: 8
				},
				children: [
					meta.title || meta.tid,
					meta.onlyLz ? " · 只看楼主" : "",
					" · ",
					meta.onlyLz ? `第 ${meta.page} 页 · ${meta.floors.length} 楼` : `第 ${meta.page}/${meta.totalPage} 页 · ${meta.floors.length} 楼（全帖约 ${meta.totalFloor} 楼）`
				]
			}),
			meta.floors.map((f) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: rowStyle,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("b", { children: [f.floor, "楼"] }),
					" ",
					f.author,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: { opacity: .9 },
						children: f.content.slice(0, 120)
					})
				]
			}, f.pid || f.floor)),
			meta.hasMore ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					marginTop: 8,
					opacity: .6
				},
				children: [
					"还有第 ",
					meta.page + 1,
					" 页可读"
				]
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: {
					marginTop: 8,
					opacity: .5
				},
				children: "已到最后一页"
			})
		]
	});
}
function RepliesView({ meta }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: {
			padding: 12,
			fontSize: 13
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: {
				fontWeight: 600,
				marginBottom: 8
			},
			children: [
				"楼中楼回复",
				meta.floor > 0 ? ` · 第 ${meta.floor} 楼` : "",
				" · 前 ",
				meta.items.length,
				" 条"
			]
		}), meta.items.map((r, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: rowStyle,
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: r.author || "匿名" }),
				"：",
				r.content
			]
		}, i))]
	});
}
function SearchView({ meta }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: {
			padding: 12,
			fontSize: 13
		},
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					fontWeight: 600,
					marginBottom: 8
				},
				children: [
					"搜索「",
					meta.word,
					"」",
					meta.forum ? `（${meta.forum}吧）` : "",
					" · 第 ",
					meta.page,
					" 页 · ",
					meta.items.length,
					" 条"
				]
			}),
			meta.items.map((t) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: rowStyle,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
						href: t.url,
						target: "_blank",
						rel: "noreferrer",
						children: t.title
					}),
					t.isFloor ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: { opacity: .7 },
						children: " [楼层]"
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: { opacity: .7 },
						children: [
							"[",
							t.forumName,
							"] · ",
							t.author
						]
					}),
					t.abstract ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							opacity: .55,
							marginTop: 2
						},
						children: t.abstract.slice(0, 100)
					}) : null
				]
			}, `${t.tid}-${t.pid}`)),
			meta.hasMore ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					marginTop: 8,
					opacity: .6
				},
				children: [
					"还有第 ",
					meta.page + 1,
					" 页可读"
				]
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: {
					marginTop: 8,
					opacity: .5
				},
				children: "已到最后一页"
			})
		]
	});
}
function TiebaView({ block }) {
	if (!("kind" in block)) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Loading, {});
	if (block.isError) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Fallback, { block });
	const meta = tiebaMetaFrom(block.meta);
	if (!meta) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Fallback, { block });
	if (meta.kind === "tieba-threads") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ThreadsView, { meta });
	if (meta.kind === "tieba-floors") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FloorsView, { meta });
	if (meta.kind === "tieba-replies") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RepliesView, { meta });
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SearchView, { meta });
}
function apply(ctx) {
	for (const key of [
		"tieba_forum_threads",
		"tieba_thread_detail",
		"tieba_thread_replies",
		"tieba_forum_search"
	]) ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
		name: "tool.call.toolview",
		key
	}, TiebaView));
}

//#endregion
exports.apply = apply;
exports.inject = inject;
exports.name = name;
return module.exports; } });