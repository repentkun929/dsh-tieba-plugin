import { defineTool } from "@deepseek-ai/dsh-tools";
import { BUNDLED_SKILL_RANK } from "@deepseek-ai/dsh-skill";

//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esmMin = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __exportAll = (all, symbols) => {
	let target = {};
	for (var name$1 in all) {
		__defProp(target, name$1, {
			get: all[name$1],
			enumerable: true
		});
	}
	if (symbols) {
		__defProp(target, Symbol.toStringTag, { value: "Module" });
	}
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) {
				__defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __toCommonJS = (mod) => __hasOwnProp.call(mod, "module.exports") ? mod["module.exports"] : __copyProps(__defProp({}, "__esModule", { value: true }), mod);

//#endregion
//#region node_modules/.pnpm/@deepseek-ai+cosmokit@1.8.5/node_modules/@deepseek-ai/cosmokit/lib/index.js
var lib_exports = /* @__PURE__ */ __exportAll({
	Binary: () => Binary,
	Time: () => Time,
	arrayBufferToBase64: () => arrayBufferToBase64,
	arrayBufferToHex: () => arrayBufferToHex,
	base64ToArrayBuffer: () => base64ToArrayBuffer,
	camelCase: () => camelCase,
	camelize: () => camelize,
	capitalize: () => capitalize,
	clone: () => clone,
	contain: () => contain,
	createVolatile: () => createVolatile,
	deduplicate: () => deduplicate,
	deepEqual: () => deepEqual,
	defineProperty: () => defineProperty,
	difference: () => difference,
	filterKeys: () => filterKeys,
	formatProperty: () => formatProperty,
	hexToArrayBuffer: () => hexToArrayBuffer,
	hyphenate: () => hyphenate,
	intersection: () => intersection,
	is: () => is,
	isNonNullable: () => isNonNullable,
	isNullable: () => isNullable,
	isPlainObject: () => isPlainObject,
	isVolatile: () => isVolatile,
	makeArray: () => makeArray,
	mapValues: () => mapValues,
	noop: () => noop,
	omit: () => omit,
	paramCase: () => paramCase,
	pick: () => pick,
	remove: () => remove,
	sanitize: () => sanitize,
	snakeCase: () => snakeCase,
	trimSlash: () => trimSlash,
	uncapitalize: () => uncapitalize,
	union: () => union,
	updateVolatile: () => updateVolatile,
	valueMap: () => mapValues,
	volatileEntries: () => volatileEntries
});
/** No-op callback returning `undefined` at runtime and `any` at type level. */
function noop() {}
/** Return true when a value is `null` or `undefined`. */
function isNullable(value) {
	return value === null || value === void 0;
}
/** Return true when a value is neither `null` nor `undefined`. */
function isNonNullable(value) {
	return !isNullable(value);
}
/** Return true for non-array object values. */
function isPlainObject(data) {
	return data && typeof data === "object" && !Array.isArray(data);
}
/** Filter object entries and return a new object. */
function filterKeys(object, filter) {
	return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
}
/** Map object values while preserving the original key set. */
function mapValues(object, transform) {
	return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
}
/** Pick selected keys from an object, optionally including `undefined` values. */
function pick(source, keys, forced) {
	if (!keys) return { ...source };
	const result = {};
	for (const key of keys) if (forced || source[key] !== void 0) result[key] = source[key];
	return result;
}
/** Omit selected keys from a shallow object copy. */
function omit(source, keys) {
	if (!keys) return { ...source };
	const result = { ...source };
	for (const key of keys) Reflect.deleteProperty(result, key);
	return result;
}
/** Define a non-enumerable writable property and return the object. */
function defineProperty(object, key, value) {
	return Object.defineProperty(object, key, {
		writable: true,
		value,
		enumerable: false
	});
}
/** Return true when every item in `array2` is present in `array1`. */
function contain(array1, array2) {
	return array2.every((item) => array1.includes(item));
}
/** Return items that appear in both arrays. */
function intersection(array1, array2) {
	return array1.filter((item) => array2.includes(item));
}
/** Return items from `array1` that do not appear in `array2`. */
function difference(array1, array2) {
	return array1.filter((item) => !array2.includes(item));
}
/** Return the set-union of two arrays while preserving first occurrence order. */
function union(array1, array2) {
	return Array.from(new Set([...array1, ...array2]));
}
/** Remove duplicate values while preserving first occurrence order. */
function deduplicate(array) {
	return [...new Set(array)];
}
/** Remove one item from an array and report whether it was found. */
function remove(list, item) {
	const index = list?.indexOf(item);
	if (index >= 0) {
		list.splice(index, 1);
		return true;
	} else return false;
}
/** Normalize nullish, scalar, or array input to an array. */
function makeArray(source) {
	return Array.isArray(source) ? source : isNullable(source) ? [] : [source];
}
function snapshot(value, ancestors = /* @__PURE__ */ new Set()) {
	if (typeof value === "function") throw new TypeError("volatile config cannot contain functions");
	if (value === null || typeof value !== "object") return value;
	if (ancestors.has(value)) throw new TypeError("volatile config cannot contain cycles");
	ancestors.add(value);
	try {
		if (Array.isArray(value)) return Object.freeze(value.map((item) => snapshot(item, ancestors)));
		if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new TypeError("volatile config objects must be plain objects or arrays");
		return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshot(item, ancestors)])));
	} finally {
		ancestors.delete(value);
	}
}
/**
* Create a detached reference containing an immutable copy of the supplied data.
* @param value - validated config data; class instances and functions are unsupported.
* @returns a reference whose value is updated only by its owning runtime.
*/
function createVolatile(value) {
	let current = snapshot(value);
	return Object.freeze({
		get: () => current,
		[write]: (value$1) => {
			current = value$1;
		}
	});
}
/**
* Identify references across ESM/CJS copies of the shared library.
* @param value - a parsed config value.
* @returns whether the value implements the shared reference protocol.
*/
function isVolatile(value) {
	return typeof value === "object" && value !== null && write in value;
}
/**
* Collect config references without descending into their snapshots or opaque objects.
* @internal
* @param value - parsed config; cyclic ordinary fields are visited once per path.
* @returns references and their object-key paths, including an empty path for a root reference.
*/
function volatileEntries(value) {
	const ancestors = /* @__PURE__ */ new Set();
	function visit(value$1, path) {
		if (isVolatile(value$1)) return [{
			path,
			ref: value$1
		}];
		if (!value$1 || typeof value$1 !== "object" || ancestors.has(value$1)) return [];
		if (!Array.isArray(value$1) && Object.getPrototypeOf(value$1) !== Object.prototype && Object.getPrototypeOf(value$1) !== null) return [];
		ancestors.add(value$1);
		try {
			return Object.entries(value$1).flatMap(([key, child]) => visit(child, [...path, key]));
		} finally {
			ancestors.delete(value$1);
		}
	}
	return visit(value, []);
}
/**
* Commit an already validated immutable snapshot from another reference.
* @internal
* @param target - the owning plugin's stable reference.
* @param source - a newly parsed candidate reference.
*/
function updateVolatile(target, source) {
	target[write](source.get());
}
/** Test values using `instanceof` with a `toStringTag` fallback. */
function is(type, value) {
	if (arguments.length === 1) return (value$1) => is(type, value$1);
	return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
}
function isArrayBufferLike(value) {
	return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
}
function isArrayBufferSource(value) {
	return isArrayBufferLike(value) || ArrayBuffer.isView(value);
}
/** Deep-clone common JavaScript values while preserving prototypes and cycles. */
function clone(source, refs = /* @__PURE__ */ new Map()) {
	if (!source || typeof source !== "object") return source;
	if (is("Date", source)) return new Date(source.valueOf());
	if (is("RegExp", source)) return new RegExp(source.source, source.flags);
	if (isArrayBufferLike(source)) return source.slice(0);
	if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
	const cached = refs.get(source);
	if (cached) return cached;
	if (Array.isArray(source)) {
		const result$1 = [];
		refs.set(source, result$1);
		source.forEach((value, index) => {
			result$1[index] = Reflect.apply(clone, null, [value, refs]);
		});
		return result$1;
	}
	const result = Object.create(Object.getPrototypeOf(source));
	refs.set(source, result);
	for (const key of Reflect.ownKeys(source)) {
		const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
		if ("value" in descriptor) descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
		Reflect.defineProperty(result, key, descriptor);
	}
	return result;
}
/**
* Compare values recursively, treating two volatile references as equal regardless of value.
* Strict comparison distinguishes null/undefined, treats opaque objects by identity,
* compares URLs by normalized href, treats array holes as undefined, and considers distinct cyclic structures unequal.
* @param a - first value.
* @param b - second value.
* @param strict - whether to require strict data equality outside volatile references.
* @returns whether the values compare equal.
*/
function deepEqual(a, b, strict) {
	const ancestors = /* @__PURE__ */ new Set();
	function compare(a$1, b$1) {
		if (a$1 === b$1) return true;
		if (isVolatile(a$1) || isVolatile(b$1)) return isVolatile(a$1) && isVolatile(b$1);
		if (!strict && isNullable(a$1) && isNullable(b$1)) return true;
		if (typeof a$1 !== typeof b$1 || typeof a$1 !== "object" || !a$1 || !b$1) return false;
		if (ancestors.has(a$1)) return false;
		function check(test, then) {
			return test(a$1) ? test(b$1) ? then(a$1, b$1) : false : test(b$1) ? false : void 0;
		}
		ancestors.add(a$1);
		try {
			return check(Array.isArray, (a$2, b$2) => {
				if (a$2.length !== b$2.length) return false;
				for (let index = 0; index < a$2.length; index++) if (!compare(a$2[index], b$2[index])) return false;
				return true;
			}) ?? check(is("Date"), (a$2, b$2) => a$2.valueOf() === b$2.valueOf()) ?? check(is("URL"), (a$2, b$2) => a$2.href === b$2.href) ?? check(is("RegExp"), (a$2, b$2) => a$2.source === b$2.source && a$2.flags === b$2.flags) ?? check(isArrayBufferLike, (a$2, b$2) => {
				if (a$2.byteLength !== b$2.byteLength) return false;
				const viewA = new Uint8Array(a$2);
				const viewB = new Uint8Array(b$2);
				for (let i = 0; i < viewA.length; i++) if (viewA[i] !== viewB[i]) return false;
				return true;
			}) ?? ((!strict || [a$1, b$1].every((value) => Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) && Object.keys({
				...a$1,
				...b$1
			}).every((key) => compare(a$1[key], b$1[key])));
		} finally {
			ancestors.delete(a$1);
		}
	}
	return compare(a, b);
}
/** Uppercase the first character of a string. */
function capitalize(source) {
	return source.charAt(0).toUpperCase() + source.slice(1);
}
/** Lowercase the first character of a string. */
function uncapitalize(source) {
	return source.charAt(0).toLowerCase() + source.slice(1);
}
/** Convert dash or underscore delimited text to camelCase. */
function camelCase(source) {
	return source.replace(/[_-][a-z]/g, (str$1) => str$1.slice(1).toUpperCase());
}
function tokenize(source, delimiters, delimiter) {
	const output = [];
	let state = 0;
	for (let i = 0; i < source.length; i++) {
		const code = source.charCodeAt(i);
		if (code >= 65 && code <= 90) {
			if (state === 1) {
				const next = source.charCodeAt(i + 1);
				if (next >= 97 && next <= 122) output.push(delimiter);
				output.push(code + 32);
			} else {
				if (state !== 0) output.push(delimiter);
				output.push(code + 32);
			}
			state = 1;
		} else if (code >= 97 && code <= 122) {
			output.push(code);
			state = 2;
		} else if (delimiters.includes(code)) {
			if (state !== 0) output.push(delimiter);
			state = 0;
		} else output.push(code);
	}
	return String.fromCharCode(...output);
}
/** Convert text to dash-delimited parameter case. */
function paramCase(source) {
	return tokenize(source, [45, 95], 45);
}
/** Convert text to underscore-delimited snake case. */
function snakeCase(source) {
	return tokenize(source, [45, 95], 95);
}
/** Format a property key as a JavaScript member access suffix. */
function formatProperty(key) {
	if (typeof key !== "string") return `[${key.toString()}]`;
	return /^[a-z_$][\w$]*$/i.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`;
}
/** Remove one trailing slash from a path string. */
function trimSlash(source) {
	return source.replace(/\/$/, "");
}
/** Ensure a path starts with `/` and has no trailing slash. */
function sanitize(source) {
	if (!source.startsWith("/")) source = "/" + source;
	return trimSlash(source);
}
var write, Binary, base64ToArrayBuffer, arrayBufferToBase64, hexToArrayBuffer, arrayBufferToHex, camelize, hyphenate, Time;
var init_lib = __esmMin((() => {
	write = Symbol.for("cosmokit.volatile.write");
	;
	(function(Binary$1) {
		Binary$1.is = isArrayBufferLike;
		Binary$1.isSource = isArrayBufferSource;
		function fromSource(source) {
			if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
			else return source;
		}
		Binary$1.fromSource = fromSource;
		function toBase64(source) {
			source = fromSource(source);
			if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
			let binary = "";
			const bytes = new Uint8Array(source);
			for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
			return btoa(binary);
		}
		Binary$1.toBase64 = toBase64;
		function fromBase64(source) {
			if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
			return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
		}
		Binary$1.fromBase64 = fromBase64;
		function toHex(source) {
			source = fromSource(source);
			if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
			return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
		}
		Binary$1.toHex = toHex;
		function fromHex(source) {
			if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
			const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
			const buffer = [];
			for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
			return Uint8Array.from(buffer).buffer;
		}
		Binary$1.fromHex = fromHex;
	})(Binary || (Binary = {}));
	base64ToArrayBuffer = Binary.fromBase64;
	arrayBufferToBase64 = Binary.toBase64;
	hexToArrayBuffer = Binary.fromHex;
	arrayBufferToHex = Binary.toHex;
	camelize = camelCase;
	hyphenate = paramCase;
	;
	(function(Time$1) {
		Time$1.millisecond = 1;
		Time$1.second = 1e3;
		Time$1.minute = Time$1.second * 60;
		Time$1.hour = Time$1.minute * 60;
		Time$1.day = Time$1.hour * 24;
		Time$1.week = Time$1.day * 7;
		let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
		function setTimezoneOffset(offset) {
			timezoneOffset = offset;
		}
		Time$1.setTimezoneOffset = setTimezoneOffset;
		function getTimezoneOffset() {
			return timezoneOffset;
		}
		Time$1.getTimezoneOffset = getTimezoneOffset;
		function getDateNumber(date = /* @__PURE__ */ new Date(), offset) {
			if (typeof date === "number") date = new Date(date);
			if (offset === void 0) offset = timezoneOffset;
			return Math.floor((date.valueOf() / Time$1.minute - offset) / 1440);
		}
		Time$1.getDateNumber = getDateNumber;
		function fromDateNumber(value, offset) {
			const date = new Date(value * Time$1.day);
			if (offset === void 0) offset = timezoneOffset;
			return new Date(+date + offset * Time$1.minute);
		}
		Time$1.fromDateNumber = fromDateNumber;
		const numeric = /\d+(?:\.\d+)?/.source;
		const timeRegExp = /* @__PURE__ */ new RegExp(`^${[
			"w(?:eek(?:s)?)?",
			"d(?:ay(?:s)?)?",
			"h(?:our(?:s)?)?",
			"m(?:in(?:ute)?(?:s)?)?",
			"s(?:ec(?:ond)?(?:s)?)?"
		].map((unit) => `(${numeric}${unit})?`).join("")}$`);
		function parseTime(source) {
			const capture = timeRegExp.exec(source);
			if (!capture) return 0;
			return (parseFloat(capture[1]) * Time$1.week || 0) + (parseFloat(capture[2]) * Time$1.day || 0) + (parseFloat(capture[3]) * Time$1.hour || 0) + (parseFloat(capture[4]) * Time$1.minute || 0) + (parseFloat(capture[5]) * Time$1.second || 0);
		}
		Time$1.parseTime = parseTime;
		function parseDate(date) {
			const parsed = parseTime(date);
			if (parsed) date = Date.now() + parsed;
			else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
			else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
			return date ? new Date(date) : /* @__PURE__ */ new Date();
		}
		Time$1.parseDate = parseDate;
		function format(ms) {
			const abs = Math.abs(ms);
			if (abs >= Time$1.day - Time$1.hour / 2) return Math.round(ms / Time$1.day) + "d";
			else if (abs >= Time$1.hour - Time$1.minute / 2) return Math.round(ms / Time$1.hour) + "h";
			else if (abs >= Time$1.minute - Time$1.second / 2) return Math.round(ms / Time$1.minute) + "m";
			else if (abs >= Time$1.second) return Math.round(ms / Time$1.second) + "s";
			return ms + "ms";
		}
		Time$1.format = format;
		function toDigits(source, length = 2) {
			return source.toString().padStart(length, "0");
		}
		Time$1.toDigits = toDigits;
		function template(template$1, time = /* @__PURE__ */ new Date()) {
			return template$1.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
		}
		Time$1.template = template;
	})(Time || (Time = {}));
}));

//#endregion
//#region node_modules/.pnpm/@deepseek-ai+schemastery@3.18.4/node_modules/@deepseek-ai/schemastery/lib/index.cjs
var require_lib = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let _deepseek_ai_cosmokit = (init_lib(), __toCommonJS(lib_exports));
	const kSchema = Symbol.for("schemastery");
	const kValidationError = Symbol.for("ValidationError");
	globalThis.__schemastery_index__ ??= 0;
	globalThis.__schemastery_refs__ = void 0;
	var ValidationError = class extends TypeError {
		options;
		name = "ValidationError";
		constructor(message, options) {
			let prefix = "$";
			for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
			else if (typeof segment === "number") prefix += "[" + segment + "]";
			else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
			if (prefix.startsWith(".")) prefix = prefix.slice(1);
			super((prefix === "$" ? "" : `${prefix} `) + message);
			this.options = options;
		}
		static is(error) {
			return !!error?.[kValidationError];
		}
	};
	Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
	const Schema = function(options) {
		const schema = function(data, options$1 = {}) {
			return Schema.resolve(data, schema, options$1)[0];
		};
		if (options.refs) {
			const refs = (0, _deepseek_ai_cosmokit.valueMap)(options.refs, (options$1) => new Schema(options$1));
			const getRef = (uid) => refs[uid];
			for (const key in refs) {
				const options$1 = refs[key];
				options$1.sKey = getRef(options$1.sKey);
				options$1.inner = getRef(options$1.inner);
				options$1.list = options$1.list && options$1.list.map(getRef);
				options$1.dict = options$1.dict && (0, _deepseek_ai_cosmokit.valueMap)(options$1.dict, getRef);
			}
			return refs[options.uid];
		}
		Object.assign(schema, options);
		if (typeof schema.callback === "string") try {
			schema.callback = new Function("return " + schema.callback)();
		} catch {}
		Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
		Object.setPrototypeOf(schema, Schema.prototype);
		schema.meta ||= {};
		schema.toString = schema.toString.bind(schema);
		return schema;
	};
	Schema.prototype = Object.create(Function.prototype);
	Schema.prototype[kSchema] = true;
	Object.defineProperty(Schema.prototype, "~standard", { get() {
		return {
			version: 1,
			vendor: "schemastery",
			validate: (value) => {
				try {
					return { value: Schema.resolve(value, this, {})[0] };
				} catch (error) {
					if (ValidationError.is(error)) return { issues: [{
						message: error.message,
						path: error.options.path
					}] };
					throw error;
				}
			}
		};
	} });
	Schema.ValidationError = ValidationError;
	Schema.prototype.toJSON = function toJSON() {
		if (globalThis.__schemastery_refs__) {
			globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
			return this.uid;
		}
		globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
		globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
		const result = {
			uid: this.uid,
			refs: globalThis.__schemastery_refs__
		};
		globalThis.__schemastery_refs__ = void 0;
		return result;
	};
	Schema.prototype.set = function set(key, value) {
		this.dict[key] = value;
		return this;
	};
	Schema.prototype.push = function push(value) {
		this.list.push(value);
		return this;
	};
	function mergeDesc(original, messages) {
		const result = typeof original === "string" ? { "": original } : { ...original };
		for (const locale in messages) {
			const value = messages[locale];
			if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
			else if (typeof value === "string") result[locale] = value;
		}
		return result;
	}
	function getInner(value) {
		return value?.$value ?? value?.$inner;
	}
	function extractKeys(data) {
		return (0, _deepseek_ai_cosmokit.filterKeys)(data ?? {}, (key) => !key.startsWith("$"));
	}
	Schema.prototype.i18n = function i18n(messages) {
		const schema = Schema(this);
		const desc = mergeDesc(schema.meta.description, messages);
		if (Object.keys(desc).length) schema.meta.description = desc;
		if (schema.dict) schema.dict = (0, _deepseek_ai_cosmokit.valueMap)(schema.dict, (inner, key) => {
			return inner.i18n((0, _deepseek_ai_cosmokit.valueMap)(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
		});
		if (schema.list) schema.list = schema.list.map((inner, index) => {
			return inner.i18n((0, _deepseek_ai_cosmokit.valueMap)(messages, (data = {}) => {
				if (Array.isArray(getInner(data))) return getInner(data)[index];
				if (Array.isArray(data)) return data[index];
				return extractKeys(data);
			}));
		});
		if (schema.inner) schema.inner = schema.inner.i18n((0, _deepseek_ai_cosmokit.valueMap)(messages, (data) => {
			if (getInner(data)) return getInner(data);
			return extractKeys(data);
		}));
		if (schema.sKey) schema.sKey = schema.sKey.i18n((0, _deepseek_ai_cosmokit.valueMap)(messages, (data) => data?.$key));
		return schema;
	};
	Schema.prototype.extra = function extra(key, value) {
		const schema = Schema(this);
		schema.meta = {
			...schema.meta,
			[key]: value
		};
		return schema;
	};
	for (const key of [
		"required",
		"disabled",
		"collapse",
		"hidden",
		"loose"
	]) Object.assign(Schema.prototype, { [key](value = true) {
		const schema = Schema(this);
		schema.meta = {
			...schema.meta,
			[key]: value
		};
		return schema;
	} });
	Schema.prototype.deprecated = function deprecated() {
		const schema = Schema(this);
		schema.meta.badges ||= [];
		schema.meta.badges.push({
			text: "deprecated",
			type: "danger"
		});
		return schema;
	};
	Schema.prototype.experimental = function experimental() {
		const schema = Schema(this);
		schema.meta.badges ||= [];
		schema.meta.badges.push({
			text: "experimental",
			type: "warning"
		});
		return schema;
	};
	Schema.prototype.pattern = function pattern(regexp) {
		const schema = Schema(this);
		const pattern$1 = (0, _deepseek_ai_cosmokit.pick)(regexp, ["source", "flags"]);
		schema.meta = {
			...schema.meta,
			pattern: pattern$1
		};
		return schema;
	};
	Schema.prototype.simplify = function simplify(value) {
		if ((0, _deepseek_ai_cosmokit.isVolatile)(value)) value = value.get();
		if ((0, _deepseek_ai_cosmokit.deepEqual)(value, this.meta.default, this.type === "dict")) return null;
		if ((0, _deepseek_ai_cosmokit.isNullable)(value)) return value;
		if (this.type === "object" || this.type === "dict") {
			const result = {};
			for (const key in value) {
				const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
				if (this.type === "dict" || !(0, _deepseek_ai_cosmokit.isNullable)(item)) result[key] = item;
			}
			if ((0, _deepseek_ai_cosmokit.deepEqual)(result, this.meta.default, this.type === "dict")) return null;
			return result;
		} else if (this.type === "array" || this.type === "tuple") {
			const result = [];
			value.forEach((value$1, index) => {
				const schema = this.type === "array" ? this.inner : this.list[index];
				const item = schema ? schema.simplify(value$1) : value$1;
				result.push(item);
			});
			return result;
		} else if (this.type === "intersect") {
			const result = {};
			for (const item of this.list) Object.assign(result, item.simplify(value));
			return result;
		} else if (this.type === "union") for (const schema of this.list) try {
			Schema.resolve(value, schema, {});
			return schema.simplify(value);
		} catch {}
		return value;
	};
	Schema.prototype.toString = function toString(inline) {
		return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
	};
	Schema.prototype.role = function role(role$1, extra) {
		const schema = Schema(this);
		schema.meta = {
			...schema.meta,
			role: role$1,
			extra
		};
		return schema;
	};
	for (const key of [
		"default",
		"link",
		"comment",
		"description",
		"max",
		"min",
		"step"
	]) Object.assign(Schema.prototype, { [key](value) {
		const schema = Schema(this);
		schema.meta = {
			...schema.meta,
			[key]: value
		};
		return schema;
	} });
	Schema.prototype.volatile = function volatile() {
		if (this.meta.volatile) throw new TypeError("volatile schema is already wrapped");
		return this.extra("volatile", true);
	};
	const resolvers = {};
	const checkedVolatile = Symbol("checked-volatile-schema");
	function validateVolatileSchema(schema, path = [], blocked = false, seen = /* @__PURE__ */ new Map()) {
		const states = seen.get(schema) ?? /* @__PURE__ */ new Set();
		if (states.has(blocked)) return;
		states.add(blocked);
		seen.set(schema, states);
		if (schema.meta?.volatile && blocked) throw new ValidationError("volatile fields require a fixed object path without an enclosing volatile field", { path });
		const nested = blocked || !!schema.meta?.volatile;
		if (schema.dict) for (const [key, child] of Object.entries(schema.dict)) validateVolatileSchema(child, [...path, key], nested, seen);
		if (schema.sKey) validateVolatileSchema(schema.sKey, [...path, "<key>"], true, seen);
		if (schema.inner && (schema.type !== "lazy" || schema.inner[kSchema])) validateVolatileSchema(schema.inner, [...path, "*"], true, seen);
		if (schema.list) for (let index = 0; index < schema.list.length; index++) validateVolatileSchema(schema.list[index], [...path, String(index)], true, seen);
	}
	Schema.extend = function extend(type, resolve) {
		resolvers[type] = resolve;
	};
	Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
		if (!schema) return [data];
		if (!options[checkedVolatile]) {
			validateVolatileSchema(schema, options.path);
			options = {
				...options,
				[checkedVolatile]: true
			};
		}
		if (schema.meta?.volatile) {
			const inner = Schema(schema);
			inner.meta = {
				...schema.meta,
				volatile: false
			};
			const [value, adapted] = Schema.resolve(data, inner, options, strict);
			try {
				return [(0, _deepseek_ai_cosmokit.createVolatile)(value), adapted];
			} catch (error) {
				throw new ValidationError(error instanceof Error ? error.message : String(error), options);
			}
		}
		if (options.ignore?.(data, schema)) return [data];
		if ((0, _deepseek_ai_cosmokit.isNullable)(data) && schema.type !== "lazy") {
			if (schema.meta.required) throw new ValidationError(`missing required value`, options);
			let current = schema;
			let fallback = schema.meta.default;
			while (current?.type === "intersect" && (0, _deepseek_ai_cosmokit.isNullable)(fallback)) {
				current = current.list[0];
				fallback = current?.meta.default;
			}
			if ((0, _deepseek_ai_cosmokit.isNullable)(fallback)) return [data];
			data = (0, _deepseek_ai_cosmokit.clone)(fallback);
		}
		const callback = resolvers[schema.type];
		if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
		try {
			return callback(data, schema, options, strict);
		} catch (error) {
			if (!schema.meta.loose) throw error;
			return [schema.meta.default];
		}
	};
	Schema.from = function from(source) {
		if ((0, _deepseek_ai_cosmokit.isNullable)(source)) return Schema.any();
		else if ([
			"string",
			"number",
			"boolean"
		].includes(typeof source)) return Schema.const(source).required();
		else if (source[kSchema]) return source;
		else if (typeof source === "function") switch (source) {
			case String: return Schema.string().required();
			case Number: return Schema.number().required();
			case Boolean: return Schema.boolean().required();
			case Function: return Schema.function().required();
			default: return Schema.is(source).required();
		}
		else throw new TypeError(`cannot infer schema from ${source}`);
	};
	Schema.lazy = function lazy(builder) {
		const toJSON = () => {
			if (!schema.inner[kSchema]) {
				schema.inner = schema.builder();
				schema.inner.meta = {
					...schema.meta,
					...schema.inner.meta
				};
			}
			return schema.inner.toJSON();
		};
		const schema = new Schema({
			type: "lazy",
			builder,
			inner: { toJSON }
		});
		return schema;
	};
	Schema.natural = function natural() {
		return Schema.number().step(1).min(0);
	};
	Schema.percent = function percent() {
		return Schema.number().step(.01).min(0).max(1).role("slider");
	};
	Schema.date = function date() {
		return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
			const date$1 = new Date(value);
			if (isNaN(+date$1)) throw new ValidationError(`invalid date "${value}"`, options);
			return date$1;
		}, true)]);
	};
	Schema.regExp = function regExp(flag = "") {
		return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
			try {
				return new RegExp(value, flag);
			} catch (e) {
				throw new ValidationError(e.message, options);
			}
		}, true)]);
	};
	Schema.arrayBuffer = function arrayBuffer(encoding) {
		return Schema.union([
			Schema.is(ArrayBuffer),
			Schema.is(SharedArrayBuffer),
			Schema.transform(Schema.any(), (value, options) => {
				if (_deepseek_ai_cosmokit.Binary.isSource(value)) return _deepseek_ai_cosmokit.Binary.fromSource(value);
				throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
			}, true),
			...encoding ? [Schema.transform(Schema.string(), (value, options) => {
				try {
					return encoding === "base64" ? _deepseek_ai_cosmokit.Binary.fromBase64(value) : _deepseek_ai_cosmokit.Binary.fromHex(value);
				} catch (e) {
					throw new ValidationError(e.message, options);
				}
			}, true)] : []
		]);
	};
	Schema.extend("lazy", (data, schema, options, strict) => {
		if (!schema.inner[kSchema]) {
			schema.inner = schema.builder();
			schema.inner.meta = {
				...schema.meta,
				...schema.inner.meta
			};
			validateVolatileSchema(schema.inner, options.path, true);
		}
		return Schema.resolve(data, schema.inner, options, strict);
	});
	Schema.extend("any", (data) => {
		return [data];
	});
	Schema.extend("never", (data, _, options) => {
		throw new ValidationError(`expected nullable but got ${data}`, options);
	});
	Schema.extend("const", (data, { value }, options) => {
		if ((0, _deepseek_ai_cosmokit.deepEqual)(data, value)) return [value];
		throw new ValidationError(`expected ${value} but got ${data}`, options);
	});
	function checkWithinRange(data, meta, description, options, skipMin = false) {
		const { max = Infinity, min = -Infinity } = meta;
		if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
		if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
	}
	Schema.extend("string", (data, { meta }, options) => {
		if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
		if (meta.pattern) {
			const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
			if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
		}
		checkWithinRange(data.length, meta, "string length", options);
		return [data];
	});
	function decimalShift(data, digits) {
		const str$1 = data.toString();
		if (str$1.includes("e")) return data * Math.pow(10, digits);
		const index = str$1.indexOf(".");
		if (index === -1) return data * Math.pow(10, digits);
		const frac = str$1.slice(index + 1);
		const integer = str$1.slice(0, index);
		if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
		return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
	}
	function isMultipleOf(data, min, step) {
		step = Math.abs(step);
		if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
		const index = step.toString().indexOf(".");
		const digits = step.toString().slice(index + 1).length;
		return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
	}
	Schema.extend("number", (data, { meta }, options) => {
		if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
		checkWithinRange(data, meta, "number", options);
		const { step } = meta;
		if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
		return [data];
	});
	Schema.extend("boolean", (data, _, options) => {
		if (typeof data === "boolean") return [data];
		throw new ValidationError(`expected boolean but got ${data}`, options);
	});
	Schema.extend("bitset", (data, { bits, meta }, options) => {
		let value = 0, keys = [];
		if (typeof data === "number") {
			value = data;
			for (const key in bits) if (data & bits[key]) keys.push(key);
		} else if (Array.isArray(data)) {
			keys = data;
			for (const key of keys) {
				if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
				if (key in bits) value |= bits[key];
			}
		} else throw new ValidationError(`expected number or array but got ${data}`, options);
		if (value === meta.default) return [value];
		return [value, keys];
	});
	Schema.extend("function", (data, _, options) => {
		if (typeof data === "function") return [data];
		throw new ValidationError(`expected function but got ${data}`, options);
	});
	Schema.extend("is", (data, { constructor }, options) => {
		if (typeof constructor === "function") {
			if (data instanceof constructor) return [data];
			throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
		} else {
			if ((0, _deepseek_ai_cosmokit.isNullable)(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
			let prototype = Object.getPrototypeOf(data);
			while (prototype) {
				if (prototype.constructor?.name === constructor) return [data];
				prototype = Object.getPrototypeOf(prototype);
			}
			throw new ValidationError(`expected ${constructor} but got ${data}`, options);
		}
	});
	function property(data, key, schema, options) {
		try {
			const [value, adapted] = Schema.resolve(data[key], schema, {
				...options,
				path: [...options.path || [], key]
			});
			if (adapted !== void 0) data[key] = adapted;
			return value;
		} catch (e) {
			if (!options?.autofix) throw e;
			delete data[key];
			return schema.meta.volatile ? (0, _deepseek_ai_cosmokit.createVolatile)(schema.meta.default) : schema.meta.default;
		}
	}
	Schema.extend("array", (data, { inner, meta }, options) => {
		if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
		checkWithinRange(data.length, meta, "array length", options, !(0, _deepseek_ai_cosmokit.isNullable)(inner.meta.default));
		return [data.map((_, index) => property(data, index, inner, options))];
	});
	Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
		if (!(0, _deepseek_ai_cosmokit.isPlainObject)(data)) throw new ValidationError(`expected object but got ${data}`, options);
		const result = {};
		for (const key in data) {
			let rKey;
			try {
				rKey = Schema.resolve(key, sKey, options)[0];
			} catch (error) {
				if (strict) continue;
				throw error;
			}
			result[rKey] = property(data, key, inner, options);
			data[rKey] = data[key];
			if (key !== rKey) delete data[key];
		}
		return [result];
	});
	Schema.extend("tuple", (data, { list }, options, strict) => {
		if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
		const result = list.map((inner, index) => property(data, index, inner, options));
		if (strict) return [result];
		result.push(...data.slice(list.length));
		return [result];
	});
	function merge(result, data) {
		for (const key in data) {
			if (key in result) continue;
			result[key] = data[key];
		}
	}
	Schema.extend("object", (data, { dict }, options, strict) => {
		if (!(0, _deepseek_ai_cosmokit.isPlainObject)(data)) throw new ValidationError(`expected object but got ${data}`, options);
		const result = {};
		for (const key in dict) {
			const value = property(data, key, dict[key], options);
			if (!(0, _deepseek_ai_cosmokit.isNullable)(value) || key in data) result[key] = value;
		}
		if (!strict) merge(result, data);
		return [result];
	});
	Schema.extend("union", (data, { list, toString }, options, strict) => {
		const messages = [];
		for (const inner of list) try {
			return Schema.resolve(data, inner, options, strict);
		} catch (error) {
			messages.push(error);
		}
		throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
	});
	Schema.extend("intersect", (data, { list, toString }, options, strict) => {
		if (!list.length) return [data];
		let result;
		for (const inner of list) {
			const value = Schema.resolve(data, inner, options, true)[0];
			if ((0, _deepseek_ai_cosmokit.isNullable)(value)) continue;
			if ((0, _deepseek_ai_cosmokit.isNullable)(result)) result = value;
			else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
			else if (typeof value === "object") merge(result ??= {}, value);
			else if (result !== value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
		}
		if (!strict && (0, _deepseek_ai_cosmokit.isPlainObject)(data)) merge(result, data);
		return [result];
	});
	Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
		const [result, adapted = data] = Schema.resolve(data, inner, options, true);
		if (preserve) return [callback(result)];
		else return [callback(result), callback(adapted)];
	});
	const formatters = {};
	function defineMethod(name$1, keys, format) {
		formatters[name$1] = format;
		Object.assign(Schema, { [name$1](...args) {
			const schema = new Schema({ type: name$1 });
			keys.forEach((key, index) => {
				switch (key) {
					case "sKey":
						schema.sKey = args[index] ?? Schema.string();
						break;
					case "inner":
						schema.inner = Schema.from(args[index]);
						break;
					case "list":
						schema.list = args[index].map(Schema.from);
						break;
					case "dict":
						schema.dict = (0, _deepseek_ai_cosmokit.valueMap)(args[index], Schema.from);
						break;
					case "bits":
						schema.bits = {};
						for (const key$1 in args[index]) {
							if (typeof args[index][key$1] !== "number") continue;
							schema.bits[key$1] = args[index][key$1];
						}
						break;
					case "callback": {
						const callback = schema.callback = args[index];
						callback["toJSON"] ||= () => callback.toString();
						break;
					}
					case "constructor": {
						const constructor = schema.constructor = args[index];
						if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
						break;
					}
					default: schema[key] = args[index];
				}
			});
			if (name$1 === "object" || name$1 === "dict") schema.meta.default = {};
			else if (name$1 === "array" || name$1 === "tuple") schema.meta.default = [];
			else if (name$1 === "bitset") schema.meta.default = 0;
			return schema;
		} });
	}
	defineMethod("is", ["constructor"], ({ constructor }) => {
		if (typeof constructor === "function") return constructor.name;
		else return constructor;
	});
	defineMethod("any", [], () => "any");
	defineMethod("never", [], () => "never");
	defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
	defineMethod("string", [], () => "string");
	defineMethod("number", [], () => "number");
	defineMethod("boolean", [], () => "boolean");
	defineMethod("bitset", ["bits"], () => "bitset");
	defineMethod("function", [], () => "function");
	defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
	defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
	defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
	defineMethod("object", ["dict"], ({ dict }) => {
		if (Object.keys(dict).length === 0) return "{}";
		return `{ ${Object.entries(dict).map(([key, inner]) => {
			return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
		}).join(", ")} }`;
	});
	defineMethod("union", ["list"], ({ list }, inline) => {
		const result = list.map(({ toString: format }) => format()).join(" | ");
		return inline ? `(${result})` : result;
	});
	defineMethod("intersect", ["list"], ({ list }) => {
		return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
	});
	defineMethod("transform", [
		"inner",
		"callback",
		"preserve"
	], ({ inner }, isInner) => inner.toString(isInner));
	module.exports = Schema;
}));

//#endregion
//#region src/config.ts
var import_lib = /* @__PURE__ */ __toESM(require_lib(), 1);
const z = import_lib.default;
/** 插件配置：用户可在 profile/补丁层覆盖，无需改代码。 */
const Config = z.object({
	bduss: z.string().role("secret").default("").description("贴吧 BDUSS（Cookie 值），可选。公开帖子/吧/搜索匿名即可读取；填了能扩大可见范围。"),
	userAgent: z.string().default("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36").description("User-Agent"),
	timeoutMs: z.number().default(15e3).description("单次请求超时（毫秒）"),
	proxyUrl: z.string().default("").description("HTTP 代理地址，如 http://127.0.0.1:7890；空 = 直连"),
	maxThreads: z.number().default(30).description("吧内列表单次最多返回条数"),
	maxFloors: z.number().default(30).description("帖子详情单次最多返回楼层数"),
	maxSearch: z.number().default(20).description("搜索单次最多返回条数")
});

//#endregion
//#region src/fragment.ts
/** 结构化数据 -> 可持久化的 JSON 对象（供 presentationMeta 投影，满足 JsonValue 约束）。 */
function toJsonObjects(list) {
	return list;
}
/** 楼层结构化 content -> 纯文本（跳过表情 type 2，保留文字 type 0）。 */
function contentToText(content) {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";
	const parts = [];
	for (const x of content) if (x && typeof x === "object" && x.type === 0) {
		const t = x.text;
		if (typeof t === "string") parts.push(t);
	}
	return parts.join("");
}
/** 楼层结构化 content -> 图片数量（type 3）。 */
function contentImageCount(content) {
	if (!Array.isArray(content)) return 0;
	let n = 0;
	for (const x of content) if (x && typeof x === "object" && x.type === 3) n += 1;
	return n;
}
function threadUrl(tid) {
	return `https://tieba.baidu.com/p/${tid}`;
}

//#endregion
//#region src/api.ts
const BASE = "https://tieba.baidu.com";
/** 贴吧 APP_SALT：与 aiotieba helper/crypto/const.py 的 APP_SALT 一致。 */
const SALT = "tiebaclient!!!";
/**
* 计算贴吧客户端 API 的 sign。
*
* 定案事实（tools/verify_anon*.mjs 实测）：
* - sign = md5(参数按 key 的 codepoint 序拼接成无分隔符 `k=v` 串 + "tiebaclient!!!")
* - JS `Array.prototype.sort()` 默认就是 codepoint 序，等价于 .NET 的 StringComparer.Ordinal
*   （PowerShell 的 `Sort-Object Name` 是 culture-aware 排序，会算错 sign）
* - sign 必须在所有参数确定之后算一次，之后不得再往参数集里加键（加了就 110001）
*/
function calcSign(params) {
	return syncMd5(Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("") + SALT);
}
/**
* 同步 MD5。
*
* 这里**不用** node:crypto 的 import，而是手写一个纯 JS 的 MD5：
* - calcSign 是同步函数，同步 import 在 ESM 里做不到；
* - 用 require() 会让 tsdown 把 node:crypto 打进产物，且 ESM 下 require 不存在；
* - 手写实现零依赖、Node/浏览器/测试三端都能跑，也让 calcSign 可被契约测试直接钉死。
*/
function syncMd5(input) {
	return md5Hex(input);
}
const MD5_K = new Int32Array([
	3614090360,
	3905402710,
	606105819,
	3250441966,
	4118548399,
	1200080426,
	2821735955,
	4249261313,
	1770035416,
	2336552879,
	4294925233,
	2304563134,
	1804603682,
	4254626195,
	2792965006,
	1236535329,
	4129170786,
	3225465664,
	643717713,
	3921069994,
	3593408605,
	38016083,
	3634488961,
	3889429448,
	568446438,
	3275163606,
	4107603335,
	1163531501,
	2850285829,
	4243563512,
	1735328473,
	2368359562,
	4294588738,
	2272392833,
	1839030562,
	4259657740,
	2763975236,
	1272893353,
	4139469664,
	3200236656,
	681279174,
	3936430074,
	3572445317,
	76029189,
	3654602809,
	3873151461,
	530742520,
	3299628645,
	4096336452,
	1126891415,
	2878612391,
	4237533241,
	1700485571,
	2399980690,
	4293915773,
	2240044497,
	1873313359,
	4264355552,
	2734768916,
	1309151649,
	4149444226,
	3174756917,
	718787259,
	3951481745
]);
const MD5_S = new Int32Array([
	7,
	12,
	17,
	22,
	7,
	12,
	17,
	22,
	7,
	12,
	17,
	22,
	7,
	12,
	17,
	22,
	5,
	9,
	14,
	20,
	5,
	9,
	14,
	20,
	5,
	9,
	14,
	20,
	5,
	9,
	14,
	20,
	4,
	11,
	16,
	23,
	4,
	11,
	16,
	23,
	4,
	11,
	16,
	23,
	4,
	11,
	16,
	23,
	6,
	10,
	15,
	21,
	6,
	10,
	15,
	21,
	6,
	10,
	15,
	21,
	6,
	10,
	15,
	21
]);
/** UTF-8 编码（走 TextEncoder，Node/浏览器都有）。 */
function utf8Bytes(str$1) {
	return new TextEncoder().encode(str$1);
}
function rotl(x, c) {
	return x << c | x >>> 32 - c;
}
function md5Hex(input) {
	const msg = utf8Bytes(input);
	const bitLen = msg.length * 8;
	const withPad = new Uint8Array((msg.length + 8 >> 6) + 1 << 6);
	withPad.set(msg);
	withPad[msg.length] = 128;
	const dv = new DataView(withPad.buffer);
	dv.setUint32(withPad.length - 8, bitLen >>> 0, true);
	dv.setUint32(withPad.length - 4, Math.floor(bitLen / 4294967296), true);
	let a0 = 1732584193;
	let b0 = 4023233417;
	let c0 = 2562383102;
	let d0 = 271733878;
	const M = new Int32Array(16);
	for (let i = 0; i < withPad.length; i += 64) {
		for (let j = 0; j < 16; j++) M[j] = dv.getInt32(i + j * 4, true);
		let A = a0, B = b0, C = c0, D = d0;
		for (let j = 0; j < 64; j++) {
			let F;
			let g;
			if (j < 16) {
				F = B & C | ~B & D;
				g = j;
			} else if (j < 32) {
				F = D & B | ~D & C;
				g = (5 * j + 1) % 16;
			} else if (j < 48) {
				F = B ^ C ^ D;
				g = (3 * j + 5) % 16;
			} else {
				F = C ^ (B | ~D);
				g = 7 * j % 16;
			}
			F = F + A + MD5_K[j] + M[g] | 0;
			A = D;
			D = C;
			C = B;
			B = B + rotl(F, MD5_S[j]) | 0;
		}
		a0 = a0 + A | 0;
		b0 = b0 + B | 0;
		c0 = c0 + C | 0;
		d0 = d0 + D | 0;
	}
	const out = new Uint8Array(16);
	const odv = new DataView(out.buffer);
	odv.setInt32(0, a0, true);
	odv.setInt32(4, b0, true);
	odv.setInt32(8, c0, true);
	odv.setInt32(12, d0, true);
	let hex = "";
	for (const b of out) hex += b.toString(16).padStart(2, "0");
	return hex;
}
function str(v, fallback = "") {
	return typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? String(v) : fallback;
}
function num(v, fallback = 0) {
	return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
/** 从 feed_head / author 这类结构里取显示名（优先 name_show）。 */
function nameOfAuthor(v) {
	if (typeof v === "string") return v;
	if (!v || typeof v !== "object") return "";
	const o = v;
	for (const k of [
		"name_show",
		"name",
		"user_name",
		"un",
		"show_nickname"
	]) if (typeof o[k] === "string" && o[k]) return o[k];
	const main = o.main_data;
	if (Array.isArray(main)) for (const m of main) {
		const t = m?.text;
		if (t && typeof t.text === "string" && t.text) return t.text;
	}
	return "";
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
const UNDICI_SPECIFIER = "undici";
/** 默认 dispatcher 工厂：动态加载 undici 的 ProxyAgent（懒加载 + 只在配了 proxyUrl 时才调用）。 */
async function defaultDispatcherFactory(uri) {
	let mod;
	try {
		mod = await import(UNDICI_SPECIFIER);
	} catch (e) {
		const why = e instanceof Error ? e.message : String(e);
		throw new Error(`配置了 proxyUrl 但当前环境加载不到 undici（${why}）。请在插件所在 profile 里安装 undici，或清空 proxyUrl 改为直连。`);
	}
	if (typeof mod.ProxyAgent !== "function") throw new Error("配置了 proxyUrl 但当前 undici 没有导出 ProxyAgent，请升级 undici 或清空 proxyUrl。");
	return new mod.ProxyAgent({ uri });
}
function makeApiClient(opts) {
	const fetchImpl = opts.fetchImpl ?? fetch;
	const userAgent = opts.userAgent || "curl/8.0";
	const proxyUrl = (opts.proxyUrl ?? "").trim();
	/** 代理 dispatcher 缓存：整个生命周期只建一次（ProxyAgent 持有连接池）。 */
	let dispatcher;
	function getDispatcher() {
		if (!dispatcher) dispatcher = (opts.proxyDispatcherFactory ?? defaultDispatcherFactory)(proxyUrl);
		return dispatcher;
	}
	/** 带 sign 的 GET。sign 必须在所有参数确定后算一次。 */
	async function signedGet(path, params) {
		const raw = {};
		for (const [k, v] of Object.entries(params)) raw[k] = String(v);
		raw.sign = calcSign(raw);
		const url = `${BASE}${path}?${Object.entries(raw).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")}`;
		const init = { method: "GET" };
		if (proxyUrl) init.dispatcher = await getDispatcher();
		const ac = new AbortController();
		const timer = setTimeout(() => ac.abort(), opts.timeoutMs);
		try {
			const headers = {
				"User-Agent": userAgent,
				"Accept": "application/json, text/plain, */*"
			};
			if (opts.bduss) headers["Cookie"] = `BDUSS=${opts.bduss}`;
			init.headers = headers;
			init.signal = ac.signal;
			const res = await fetchImpl(url, init);
			const text = await res.text();
			let j;
			try {
				j = JSON.parse(text);
			} catch {
				throw new Error(`响应不是 JSON（HTTP ${res.status}，${text.length} 字节）`);
			}
			const o = j;
			const ec = typeof o.error_code === "number" ? o.error_code : 0;
			if (ec !== 0) {
				if (ec === 110001) throw new Error("签名校验失败（sign 与参数集不匹配）");
				if (ec === 210009) throw new Error("参数错误（接口返回 210009）");
				throw new Error(`接口返回 error_code=${ec}${o.error_msg ? `：${str(o.error_msg)}` : ""}`);
			}
			return j;
		} finally {
			clearTimeout(timer);
		}
	}
	return {
		async forumThreads(forum, page, sort, limit) {
			const params = {
				kw: forum,
				pn: page,
				rn: Math.max(1, limit)
			};
			if (sort === "new") params.sort_type = "1";
			const pageData = (await signedGet("/c/f/frs/page_pc", params)).page_data ?? {};
			const list = Array.isArray(pageData.feed_list) ? pageData.feed_list : [];
			const items = [];
			for (const entry of list) {
				if (!entry || typeof entry !== "object") continue;
				const e = entry;
				if (e.layout === "frs_top_thread_card") {
					const card = e.frs_top_thread_card ?? {};
					const comps$1 = Array.isArray(card.components) ? card.components : [];
					for (const c of comps$1) {
						const co = c ?? {};
						if (co.component !== "frs_top_thread") continue;
						const tt = co.frs_top_thread ?? {};
						const social$1 = tt.author_social ?? {};
						const tid$1 = str(social$1.tid);
						if (!tid$1) continue;
						const picAbstract = tt.pic_abstract ?? {};
						items.push({
							tid: tid$1,
							title: textOfRich(tt.title),
							author: nameOfAuthor(tt.author_social),
							replyNum: num(social$1.comment_num),
							isTop: true,
							url: `https://tieba.baidu.com/p/${tid$1}`,
							abstract: textOfRich(picAbstract.abstract)
						});
					}
					continue;
				}
				if (e.layout !== "feed") continue;
				const feed = e.feed ?? {};
				const comps = {};
				for (const c of Array.isArray(feed.components) ? feed.components : []) {
					const co = c ?? {};
					if (typeof co.component === "string") comps[co.component] = co;
				}
				const social = comps.feed_social?.feed_social ?? {};
				const tid = str(social.tid);
				if (!tid) continue;
				const titleComp = comps.feed_title?.feed_title ?? {};
				const absComp = comps.feed_abstract?.feed_abstract ?? {};
				items.push({
					tid,
					title: textOfRich(titleComp.data),
					author: nameOfAuthor(comps.feed_head?.feed_head),
					replyNum: num(social.comment_num),
					isTop: false,
					url: `https://tieba.baidu.com/p/${tid}`,
					abstract: textOfRich(absComp.data).slice(0, 120)
				});
			}
			return {
				forumName: forum,
				items: items.slice(0, Math.max(1, limit))
			};
		},
		async threadFloors(tid, limit) {
			const d = await signedGet("/c/f/pb/page_pc", {
				kz: tid,
				pn: "1"
			});
			const thread = d.thread ?? {};
			const forum = d.forum ?? d.display_forum ?? {};
			const page = d.page ?? {};
			const floors = [];
			const first = d.first_floor;
			if (first && typeof first === "object" && !Array.isArray(first)) floors.push(toFloor(first, userMap(d)));
			for (const p of Array.isArray(d.post_list) ? d.post_list : []) {
				if (!p || typeof p !== "object") continue;
				floors.push(toFloor(p, userMap(d)));
			}
			floors.sort((a, b) => a.floor - b.floor);
			const capped = floors.slice(0, Math.max(1, limit));
			return {
				forum: str(forum.name),
				title: str(thread.title),
				floors: capped,
				totalFloor: num(thread.reply_num),
				totalPage: num(page.total_page, 1)
			};
		},
		async threadReplies(tid, pid, limit) {
			const out = [];
			const cap = Math.max(1, limit);
			const pages = Math.max(1, Math.min(20, Math.ceil(cap / 14) + 1));
			const wanted = String(pid);
			let users = null;
			for (let pn = 1; pn <= pages; pn++) {
				const d = await signedGet("/c/f/pb/page_pc", {
					kz: tid,
					pn
				});
				if (!users) users = userMap(d);
				const posts = Array.isArray(d.post_list) ? d.post_list : [];
				for (const p of posts) {
					if (!p || typeof p !== "object") continue;
					const o = p;
					if (str(o.id) !== wanted) continue;
					const sub = o.sub_post_list ?? {};
					for (const s of Array.isArray(sub.sub_post_list) ? sub.sub_post_list : []) {
						if (!s || typeof s !== "object") continue;
						const so = s;
						const aid = str(so.author_id);
						out.push({
							author: aid && users.get(aid) || `uid_${aid || "?"}`,
							content: contentToText(so.content),
							time: num(so.time)
						});
					}
					return out.slice(0, cap);
				}
				if (num((d.page ?? {}).total_page, 1) <= pn) break;
			}
			return out;
		},
		async search(word, forum, limit) {
			const params = {
				word,
				pn: "1",
				rn: Math.max(1, limit)
			};
			if (forum) params.kw = forum;
			const d = await signedGet("/c/s/searchpost", params);
			const list = Array.isArray(d.post_list) ? d.post_list : [];
			const items = [];
			for (const p of list) {
				if (!p || typeof p !== "object") continue;
				const o = p;
				const tid = str(o.tid ?? o.id);
				if (!tid) continue;
				items.push({
					tid,
					title: str(o.title),
					forumName: str(o.fname),
					author: nameOfAuthor(o.author),
					url: `https://tieba.baidu.com/p/${tid}`,
					abstract: str(o.content).slice(0, 120)
				});
			}
			return items.slice(0, Math.max(1, limit));
		}
	};
}
/** 楼主/楼层作者名从 user_list（按 author_id 索引）里取。 */
function userMap(d) {
	const m = /* @__PURE__ */ new Map();
	const list = Array.isArray(d.user_list) ? d.user_list : [];
	for (const u of list) {
		if (!u || typeof u !== "object") continue;
		const o = u;
		const id = str(o.id);
		const name$1 = nameOfAuthor(o);
		if (id && name$1) m.set(id, name$1);
	}
	return m;
}
function toFloor(o, users) {
	const aid = str(o.author_id);
	return {
		floor: num(o.floor),
		author: users.get(aid) || `uid_${aid || "?"}`,
		content: contentToText(o.content),
		imageCount: contentImageCount(o.content),
		replyNum: num(o.sub_post_number),
		time: num(o.time),
		pid: str(o.id ?? o.pid)
	};
}
/** 贴吧富文本结构（title/abstract）-> 纯文本：取 text_info.text，跳过 type 2（表情）。 */
function textOfRich(v) {
	if (typeof v === "string") return v;
	if (!Array.isArray(v)) return "";
	const parts = [];
	for (const x of v) {
		if (!x || typeof x !== "object") continue;
		const o = x;
		if (o.type === 2) continue;
		const t = o.text_info;
		if (t && typeof t.text === "string") parts.push(t.text);
	}
	return parts.join("");
}

//#endregion
//#region src/tool.ts
const OUTPUT_SCHEMA = {
	type: "object",
	additionalProperties: false,
	properties: {
		text: {
			type: "string",
			required: true
		},
		items: {
			type: "array",
			required: true,
			items: {
				type: "object",
				additionalProperties: true
			}
		}
	}
};
/** execute 返回值必须与 OUTPUT_SCHEMA 完全一致（additionalProperties:false），额外字段一律走 presentationMeta。 */
function ok(text, items) {
	return {
		text,
		items: toJsonObjects(items)
	};
}
function fail(text) {
	return {
		text,
		items: []
	};
}
function tiebaTools(config) {
	const api = makeApiClient({
		bduss: config.bduss,
		userAgent: config.userAgent,
		timeoutMs: config.timeoutMs,
		proxyUrl: config.proxyUrl || void 0
	});
	return [
		defineTool({
			name: "tieba_forum_threads",
			description: "读取贴吧某个吧的帖子列表（标题/作者/回复数/摘要）。当用户想了解某个吧在聊什么、要最新或最热的帖子时使用。注意：不需要登录；吧名不带「吧」字，如「原神」而不是「原神吧」。",
			parameters: {
				forum: {
					type: "string",
					required: true,
					description: "吧名，不带「吧」字，如 原神"
				},
				page: {
					type: "number",
					description: "页码，从 1 开始，默认 1"
				},
				sort: {
					type: "string",
					enum: ["default", "new"],
					description: "排序：default=默认（算法推荐，置顶在前），new=按发帖时间倒序"
				}
			},
			output: {
				schema: OUTPUT_SCHEMA,
				render: (_args, value) => [{
					type: "text",
					text: value.text
				}],
				presentationMeta: (args, value) => ({
					kind: "tieba-threads",
					forum: args.forum,
					sort: args.sort ?? "default",
					items: value.items
				})
			},
			isConcurrencySafe: () => true,
			async execute(args) {
				const forum = typeof args.forum === "string" ? args.forum.trim() : "";
				if (!forum) throw new Error("tieba_forum_threads: forum 是必填参数");
				const page = typeof args.page === "number" && args.page > 0 ? Math.floor(args.page) : 1;
				const sort = args.sort === "new" ? "new" : "default";
				const limit = Math.max(1, Math.min(50, config.maxThreads));
				try {
					const { items } = await api.forumThreads(forum, page, sort, limit);
					if (items.length === 0) return fail(`吧「${forum}」第 ${page} 页没有取到帖子（吧名是否正确？是否已翻到底？）`);
					const lines = items.map((t, i) => `${i + 1}. ${t.title}${t.isTop ? " [置顶]" : ""} · ${t.author || "未知"} · ${t.replyNum} 回复`);
					return ok([`贴吧「${forum}」${sort === "new" ? "按发帖时间倒序" : "默认排序"} 第 ${page} 页，共 ${items.length} 帖：`, ...lines].join("\n"), items);
				} catch (e) {
					return fail(`读取贴吧「${forum}」失败：${e.message}`);
				}
			},
			presentCall: () => ({
				card: "generic",
				title: "贴吧列表",
				kind: "other"
			}),
			presentResult(_args, result) {
				if (result.isError) return void 0;
				const meta = result.meta;
				return {
					card: "generic",
					title: `贴吧列表 · ${Array.isArray(meta?.items) ? meta.items.length : 0} 帖`,
					kind: "other"
				};
			}
		}),
		defineTool({
			name: "tieba_thread_detail",
			description: "读取一个贴吧帖子的楼层内容（正文/图片数/回复数）。当用户给了帖子链接、或已知 tid 想看帖子内容时使用。注意：单页只返回前若干楼（接口 14 楼/页，超长帖请在回复中说明只取到前 N 楼）。",
			parameters: { tid: {
				type: "string",
				required: true,
				description: "帖子 id，或 https://tieba.baidu.com/p/<tid> 形式的完整链接"
			} },
			output: {
				schema: OUTPUT_SCHEMA,
				render: (_args, value) => [{
					type: "text",
					text: value.text
				}],
				presentationMeta: (args, value) => {
					const first = Array.isArray(value.items) && value.items.length > 0 ? value.items[0] : {};
					return {
						kind: "tieba-floors",
						tid: args.tid,
						title: typeof first.title === "string" ? first.title : "",
						forum: typeof first.forum === "string" ? first.forum : "",
						floors: value.items,
						totalFloor: typeof first.totalFloor === "number" ? first.totalFloor : 0
					};
				}
			},
			isConcurrencySafe: () => true,
			async execute(args) {
				const tid = extractTid(typeof args.tid === "string" ? args.tid.trim() : "");
				if (!tid) throw new Error("tieba_thread_detail: tid 是必填参数（帖子 id 或 p/<tid> 链接）");
				const limit = Math.max(1, Math.min(50, config.maxFloors));
				try {
					const { title, forum, floors, totalFloor } = await api.threadFloors(tid, limit);
					if (floors.length === 0) return fail(`帖子 ${tid} 没有取到楼层（可能已被删除或仅登录可见）`);
					const lines = floors.map((f) => `${f.floor}楼 · ${f.author}：${f.content.slice(0, 200)}${f.imageCount ? ` [图 ${f.imageCount}]` : ""}`);
					return ok([
						`帖子《${title || tid}》（${forum ? forum + "吧 · " : ""}${threadUrl(tid)}）`,
						`仅取前 ${floors.length} 楼（全帖共约 ${totalFloor} 楼）：`,
						...lines
					].join("\n"), floors.map((f) => ({
						...f,
						title,
						forum,
						totalFloor
					})));
				} catch (e) {
					return fail(`读取帖子 ${tid} 失败：${e.message}`);
				}
			},
			presentCall: () => ({
				card: "generic",
				title: "贴吧楼层",
				kind: "other"
			}),
			presentResult(_args, result) {
				if (result.isError) return void 0;
				const meta = result.meta;
				return {
					card: "generic",
					title: `贴吧楼层 · ${Array.isArray(meta?.floors) ? meta.floors.length : 0} 楼`,
					kind: "other"
				};
			}
		}),
		defineTool({
			name: "tieba_thread_replies",
			description: "读取贴吧帖子某一层的楼中楼回复。当帖子楼层里出现「查看回复/xxx 条回复」、或用户想看某条评论下的讨论时使用。注意：楼中楼是楼层内联数据，最多返回该楼层已加载的那几条（接口限制）。",
			parameters: {
				tid: {
					type: "string",
					required: true,
					description: "帖子 id 或 p/<tid> 链接"
				},
				pid: {
					type: "string",
					required: true,
					description: "楼层 id（tieba_thread_detail 返回的 pid）"
				}
			},
			output: {
				schema: OUTPUT_SCHEMA,
				render: (_args, value) => [{
					type: "text",
					text: value.text
				}],
				presentationMeta: (args, value) => ({
					kind: "tieba-replies",
					tid: args.tid,
					items: value.items
				})
			},
			isConcurrencySafe: () => true,
			async execute(args) {
				const tid = extractTid(typeof args.tid === "string" ? args.tid.trim() : "");
				const pid = typeof args.pid === "string" ? args.pid.trim() : "";
				if (!tid) throw new Error("tieba_thread_replies: tid 是必填参数");
				if (!pid) throw new Error("tieba_thread_replies: pid 是必填参数");
				try {
					const items = await api.threadReplies(tid, pid, Math.max(1, Math.min(20, config.maxFloors)));
					if (items.length === 0) return fail(`楼层 ${pid} 没有楼中楼回复（或取不到）`);
					const lines = items.map((r, i) => `${i + 1}. ${r.author}：${r.content.slice(0, 200)}`);
					return ok(`帖子 ${tid} 楼层 ${pid} 的楼中楼回复（${items.length} 条）：\n${lines.join("\n")}`, items);
				} catch (e) {
					return fail(`读取楼中楼失败：${e.message}`);
				}
			},
			presentCall: () => ({
				card: "generic",
				title: "楼中楼",
				kind: "other"
			}),
			presentResult(_args, result) {
				if (result.isError) return void 0;
				const meta = result.meta;
				return {
					card: "generic",
					title: `楼中楼 · ${Array.isArray(meta?.items) ? meta.items.length : 0} 条`,
					kind: "other"
				};
			}
		}),
		defineTool({
			name: "tieba_forum_search",
			description: "在贴吧全站或指定吧内搜索含关键词的帖子。当用户想找某个话题/人物/事件的贴吧讨论时使用。注意：结果可能跨吧，可用 forum 参数限定吧名。",
			parameters: {
				word: {
					type: "string",
					required: true,
					description: "搜索关键词"
				},
				forum: {
					type: "string",
					description: "限定吧名（不带「吧」字），可留空表示全站搜索"
				}
			},
			output: {
				schema: OUTPUT_SCHEMA,
				render: (_args, value) => [{
					type: "text",
					text: value.text
				}],
				presentationMeta: (args, value) => ({
					kind: "tieba-search",
					word: args.word,
					forum: args.forum ?? "",
					items: value.items
				})
			},
			isConcurrencySafe: () => true,
			async execute(args) {
				const word = typeof args.word === "string" ? args.word.trim() : "";
				if (!word) throw new Error("tieba_forum_search: word 是必填参数");
				const forum = typeof args.forum === "string" ? args.forum.trim() : "";
				const limit = Math.max(1, Math.min(30, config.maxSearch));
				try {
					const items = await api.search(word, forum, limit);
					if (items.length === 0) return fail(fallbackSearchFail(word, forum));
					const lines = items.map((t, i) => `${i + 1}. [${t.forumName || "贴吧"}] ${t.title}${t.abstract ? ` — ${t.abstract.slice(0, 60)}` : ""}`);
					return ok([`贴吧搜索「${word}」${forum ? `（限 ${forum}吧）` : ""} 前 ${items.length} 条：`, ...lines].join("\n"), items);
				} catch (e) {
					return fail(`搜索「${word}」失败：${e.message}`);
				}
			},
			presentCall: () => ({
				card: "generic",
				title: "贴吧搜索",
				kind: "other"
			}),
			presentResult(_args, result) {
				if (result.isError) return void 0;
				const meta = result.meta;
				return {
					card: "generic",
					title: `贴吧搜索 · ${Array.isArray(meta?.items) ? meta.items.length : 0} 条`,
					kind: "other"
				};
			}
		})
	];
}
function fallbackSearchFail(word, forum) {
	return forum ? `在「${forum}」吧没有搜到与「${word}」相关的帖子（可去掉 forum 参数全站搜）` : `没有搜到与「${word}」相关的帖子（换个更短的关键词试试）`;
}
/** 从用户/模型给的 tid 参数里提取纯数字 tid（支持 p/<tid> 链接）。 */
function extractTid(raw) {
	if (!raw) return "";
	const m = /\/p\/(\d+)/.exec(raw);
	if (m) return m[1];
	return raw.match(/^\d{5,}$/) ? raw : "";
}

//#endregion
//#region src/skill.ts
const PROVIDER_NAME = "dsh-tieba-plugin";
const CANDIDATES = [{
	name: "tieba-briefing",
	description: "播报贴吧数据时使用：规定贴吧工具结果的汇报格式（先报吧名与帖数、每条一行带原帖链接、只依据工具数据不编造、超长帖说明只取前 N 楼）。",
	invocation: {
		modelInvocable: true,
		userInvocable: true
	},
	provider: PROVIDER_NAME,
	source: "bundled",
	rank: BUNDLED_SKILL_RANK,
	locator: "tieba-briefing"
}];
const BODY = `# 贴吧播报规范（tieba-briefing）

调用贴吧工具（tieba_forum_threads / tieba_thread_detail / tieba_thread_replies /
tieba_forum_search）拿到数据后，按本规范组织回复。

## 结构契约（按顺序）
1. **先报定位**：一句话说清「哪个吧 / 哪个帖子 / 搜索什么词」，以及拿到多少条。
2. **列表逐条一行**：每条 = \`[标题](原帖链接) · 作者 · N 回复\`。
   （匿名通道不提供发帖/最后回复时间，别写不存在的时间。）
3. **楼层正文**：按楼层顺序摘录，每楼标注楼层号与作者；长正文只摘关键句并说明「已截断」。
4. **结尾一句**：需要更深的楼中楼/下一页时，提示可以继续调 tieba_thread_replies 或翻 page。

## 必含要素
- 原帖链接必须给（用户要能点回原贴）：\`https://tieba.baidu.com/p/<tid>\`。
- 置顶帖要标注（工具返回 is_top）；精品标记匿名通道拿不到，不要臆造。
- 数据条数要说清（例：「共 27 帖」），不要让用户猜。

## 格式契约
- 中文回复；列表用 markdown 列表；一条帖子一行，不写成长段落。
- 有摘要就带上，没有就不写。

## 边界（不做什么）
- **只依据工具返回的数据**，不编造标题、作者、回复数、时间。
- 工具返回空/失败时，直接说失败原因（吧名写错 / 帖子被删 / 接口变化），不要用训练记忆填空。
- 超过工具上限的楼层必须明确说明「只取到前 N 楼，其余未读」。
- 不要整段复制楼层正文（版权），摘录关键句即可。
`;
const tiebaBriefingProvider = {
	name: PROVIDER_NAME,
	list: () => Promise.resolve(CANDIDATES),
	async get(candidate) {
		return {
			name: candidate.name,
			description: candidate.description,
			invocation: candidate.invocation,
			provider: PROVIDER_NAME,
			source: "bundled",
			content: BODY
		};
	}
};

//#endregion
//#region src/index.ts
const name = "dsh-tieba-plugin";
const inject = [
	"tools",
	"skills",
	"systemPrompt"
];
const PROMPT = `## Query tieba (tieba)
用户询问贴吧内容时，使用贴吧工具族（读公开数据，匿名即可，不需要登录）：
- \`tieba_forum_threads\`：某个吧的帖子列表（forum 不带「吧」字，如「原神」）。
- \`tieba_thread_detail\`：一个帖子的楼层；用户给的是 \`https://tieba.baidu.com/p/<tid>\` 链接时，
  直接把链接填进 tid 参数。
- \`tieba_thread_replies\`：楼层下的楼中楼回复，需要 tid + pid（pid 来自 tieba_thread_detail）。
- \`tieba_forum_search\`：按关键词搜帖子，可用 forum 限定吧。
拿到数据后按 tieba-briefing 技能规范播报。接口每页固定条数、楼层/楼中楼有上限，
汇报时如实说明只取到前 N 楼。`;
/**
* 兜底：即使 cordis 没走到 schema（例如宿主行为变化、或有人直接调 apply），
* 也不能让 config 是 undefined —— 否则 `config.bduss` 会抛进 ctx.effect 里，
* 被 cordis 静默吞掉，表现为「工具全没了但没有任何报错」。
*/
function normalizeConfig(config) {
	const result = Config["~standard"].validate(config ?? {});
	if ("issues" in result) throw new Error(`tieba 插件配置无效：${JSON.stringify(result.issues)}`);
	return result.value;
}
function apply(ctx, rawConfig) {
	const config = normalizeConfig(rawConfig);
	ctx.effect(() => {
		const disposers = tiebaTools(config).map((tool) => ctx.tools.register(tool));
		return () => disposers.forEach((d) => d());
	}, "dsh-tieba-plugin.tools");
	ctx.effect(() => ctx.skills.registerProvider(() => tiebaBriefingProvider), "dsh-tieba-plugin.skill");
	ctx.effect(() => ctx.systemPrompt.section({
		name: "tool:tieba",
		order: 117,
		text: PROMPT
	}), "dsh-tieba-plugin.prompt");
}

//#endregion
export { Config, apply, inject, name };