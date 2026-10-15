var y = class {
	diff(e, t, n = {}) {
		let r;
		typeof n == "function" ? (r = n, n = {}) : "callback" in n && (r = n.callback);
		const s = this.castInput(e, n), o = this.castInput(t, n), l = this.removeEmpty(this.tokenize(s, n)), a = this.removeEmpty(this.tokenize(o, n));
		return this.diffWithOptionsObj(l, a, n, r);
	}
	diffWithOptionsObj(e, t, n, r) {
		var s;
		const o = (d) => {
			if (d = this.postProcess(d, n), r) {
				setTimeout(function() {
					r(d);
				}, 0);
				return;
			} else return d;
		}, l = t.length, a = e.length;
		let i = 1, c = l + a;
		n.maxEditLength != null && (c = Math.min(c, n.maxEditLength));
		const f = (s = n.timeout) !== null && s !== void 0 ? s : Infinity, u = Date.now() + f, h = [{
			oldPos: -1,
			lastComponent: void 0
		}];
		let g = this.extractCommon(h[0], t, e, 0, n);
		if (h[0].oldPos + 1 >= a && g + 1 >= l) return o(this.buildValues(h[0].lastComponent, t, e));
		let x = -Infinity, v = Infinity;
		const p = () => {
			for (let d = Math.max(x, -i); d <= Math.min(v, i); d += 2) {
				let m;
				const C = h[d - 1], T = h[d + 1];
				C && (h[d - 1] = void 0);
				let R = !1;
				if (T) {
					const b = T.oldPos - d;
					R = T && 0 <= b && b < l;
				}
				const L = C && C.oldPos + 1 < a;
				if (!R && !L) {
					h[d] = void 0;
					continue;
				}
				if (!L || R && C.oldPos < T.oldPos ? m = this.addToPath(T, !0, !1, 0, n) : m = this.addToPath(C, !1, !0, 1, n), g = this.extractCommon(m, t, e, d, n), m.oldPos + 1 >= a && g + 1 >= l) return o(this.buildValues(m.lastComponent, t, e)) || !0;
				h[d] = m, m.oldPos + 1 >= a && (v = Math.min(v, d - 1)), g + 1 >= l && (x = Math.max(x, d + 1));
			}
			i++;
		};
		if (r) (function d() {
			setTimeout(function() {
				if (i > c || Date.now() > u) return r(void 0);
				p() || d();
			}, 0);
		})();
		else for (; i <= c && Date.now() <= u;) {
			const d = p();
			if (d) return d;
		}
	}
	addToPath(e, t, n, r, s) {
		const o = e.lastComponent;
		return o && !s.oneChangePerToken && o.added === t && o.removed === n ? {
			oldPos: e.oldPos + r,
			lastComponent: {
				count: o.count + 1,
				added: t,
				removed: n,
				previousComponent: o.previousComponent
			}
		} : {
			oldPos: e.oldPos + r,
			lastComponent: {
				count: 1,
				added: t,
				removed: n,
				previousComponent: o
			}
		};
	}
	extractCommon(e, t, n, r, s) {
		const o = t.length, l = n.length;
		let a = e.oldPos, i = a - r, c = 0;
		for (; i + 1 < o && a + 1 < l && this.equals(n[a + 1], t[i + 1], s);) i++, a++, c++, s.oneChangePerToken && (e.lastComponent = {
			count: 1,
			previousComponent: e.lastComponent,
			added: !1,
			removed: !1
		});
		return c && !s.oneChangePerToken && (e.lastComponent = {
			count: c,
			previousComponent: e.lastComponent,
			added: !1,
			removed: !1
		}), e.oldPos = a, i;
	}
	equals(e, t, n) {
		return n.comparator ? n.comparator(e, t) : e === t || !!n.ignoreCase && e.toLowerCase() === t.toLowerCase();
	}
	removeEmpty(e) {
		const t = [];
		for (let n = 0; n < e.length; n++) e[n] && t.push(e[n]);
		return t;
	}
	castInput(e, t) {
		return e;
	}
	tokenize(e, t) {
		return Array.from(e);
	}
	join(e) {
		return e.join("");
	}
	postProcess(e, t) {
		return e;
	}
	get useLongestToken() {
		return !1;
	}
	buildValues(e, t, n) {
		const r = [];
		let s;
		for (; e;) r.push(e), s = e.previousComponent, delete e.previousComponent, e = s;
		r.reverse();
		const o = r.length;
		let l = 0, a = 0, i = 0;
		for (; l < o; l++) {
			const c = r[l];
			if (c.removed) c.value = this.join(n.slice(i, i + c.count)), i += c.count;
			else {
				if (!c.added && this.useLongestToken) {
					let f = t.slice(a, a + c.count);
					f = f.map(function(u, h) {
						const g = n[i + h];
						return g.length > u.length ? g : u;
					}), c.value = this.join(f);
				} else c.value = this.join(t.slice(a, a + c.count));
				a += c.count, c.added || (i += c.count);
			}
		}
		return r;
	}
}, X = class extends y {};
new X();
function D(e, t) {
	let n;
	for (n = 0; n < e.length && n < t.length; n++) if (e[n] != t[n]) return e.slice(0, n);
	return e.slice(0, n);
}
function _(e, t) {
	let n;
	if (!e || !t || e[e.length - 1] != t[t.length - 1]) return "";
	for (n = 0; n < e.length && n < t.length; n++) if (e[e.length - (n + 1)] != t[t.length - (n + 1)]) return e.slice(-n);
	return e.slice(-n);
}
function W(e, t, n) {
	if (e.slice(0, t.length) != t) throw Error(`string ${JSON.stringify(e)} doesn't start with prefix ${JSON.stringify(t)}; this is a bug`);
	return n + e.slice(t.length);
}
function P(e, t, n) {
	if (!t) return e + n;
	if (e.slice(-t.length) != t) throw Error(`string ${JSON.stringify(e)} doesn't end with suffix ${JSON.stringify(t)}; this is a bug`);
	return e.slice(0, -t.length) + n;
}
function S(e, t) {
	return W(e, t, "");
}
function N(e, t) {
	return P(e, t, "");
}
function $(e, t) {
	return t.slice(0, Z(e, t));
}
function Z(e, t) {
	let n = 0;
	e.length > t.length && (n = e.length - t.length);
	let r = t.length;
	e.length < t.length && (r = e.length);
	const s = Array(r);
	let o = 0;
	s[0] = 0;
	for (let l = 1; l < r; l++) {
		for (t[l] == t[o] ? s[l] = s[o] : s[l] = o; o > 0 && t[l] != t[o];) o = s[o];
		t[l] == t[o] && o++;
	}
	o = 0;
	for (let l = n; l < e.length; l++) {
		for (; o > 0 && e[l] != t[o];) o = s[o];
		e[l] == t[o] && o++;
	}
	return o;
}
function E(e) {
	let t;
	for (t = e.length - 1; t >= 0 && e[t].match(/\s/); t--);
	return e.substring(t + 1);
}
function w(e) {
	const t = e.match(/^\s*/);
	return t ? t[0] : "";
}
const M = "a-zA-Z0-9_\\u{AD}\\u{C0}-\\u{D6}\\u{D8}-\\u{F6}\\u{F8}-\\u{2C6}\\u{2C8}-\\u{2D7}\\u{2DE}-\\u{2FF}\\u{1E00}-\\u{1EFF}", Q = new RegExp(`[${M}]+|\\s+|[^${M}]`, "ug");
var K = class extends y {
	equals(e, t, n) {
		return n.ignoreCase && (e = e.toLowerCase(), t = t.toLowerCase()), e.trim() === t.trim();
	}
	tokenize(e, t = {}) {
		let n;
		if (t.intlSegmenter) {
			const o = t.intlSegmenter;
			if (o.resolvedOptions().granularity != "word") throw new Error("The segmenter passed must have a granularity of \"word\"");
			n = [];
			for (const l of Array.from(o.segment(e))) {
				const a = l.segment;
				n.length && /\s/.test(n[n.length - 1]) && /\s/.test(a) ? n[n.length - 1] += a : n.push(a);
			}
		} else n = e.match(Q) || [];
		const r = [];
		let s = null;
		return n.forEach((o) => {
			/\s/.test(o) ? s == null ? r.push(o) : r.push(r.pop() + o) : s != null && /\s/.test(s) ? r[r.length - 1] == s ? r.push(r.pop() + o) : r.push(s + o) : r.push(o), s = o;
		}), r;
	}
	join(e) {
		return e.map((t, n) => n == 0 ? t : t.replace(/^\s+/, "")).join("");
	}
	postProcess(e, t) {
		if (!e || t.oneChangePerToken) return e;
		let n = null, r = null, s = null;
		return e.forEach((o) => {
			o.added ? r = o : o.removed ? s = o : ((r || s) && j(n, s, r, o), n = o, r = null, s = null);
		}), (r || s) && j(n, s, r, null), e;
	}
};
new K();
function j(e, t, n, r) {
	if (t && n) {
		const s = w(t.value), o = E(t.value), l = w(n.value), a = E(n.value);
		if (e) {
			const i = D(s, l);
			e.value = P(e.value, l, i), t.value = S(t.value, i), n.value = S(n.value, i);
		}
		if (r) {
			const i = _(o, a);
			r.value = W(r.value, a, i), t.value = N(t.value, i), n.value = N(n.value, i);
		}
	} else if (n) {
		if (e) {
			const s = w(n.value);
			n.value = n.value.substring(s.length);
		}
		if (r) {
			const s = w(r.value);
			r.value = r.value.substring(s.length);
		}
	} else if (e && r) {
		const s = w(r.value), o = w(t.value), l = E(t.value), a = D(s, o);
		t.value = S(t.value, a);
		const i = _(S(s, a), l);
		t.value = N(t.value, i), r.value = W(r.value, s, i), e.value = P(e.value, s, s.slice(0, s.length - i.length));
	} else if (r) {
		const s = w(r.value), o = $(E(t.value), s);
		t.value = N(t.value, o);
	} else if (e) {
		const s = $(E(e.value), w(t.value));
		t.value = S(t.value, s);
	}
}
var ee = class extends y {
	tokenize(e) {
		const t = new RegExp(`(\\r?\\n)|[${M}]+|[^\\S\\n\\r]+|[^${M}]`, "ug");
		return e.match(t) || [];
	}
};
new ee();
var te = class extends y {
	constructor() {
		super(...arguments), this.tokenize = U;
	}
	equals(e, t, n) {
		return n.ignoreWhitespace ? ((!n.newlineIsToken || !e.includes(`
`)) && (e = e.trim()), (!n.newlineIsToken || !t.includes(`
`)) && (t = t.trim())) : n.ignoreNewlineAtEof && !n.newlineIsToken && (e.endsWith(`
`) && (e = e.slice(0, -1)), t.endsWith(`
`) && (t = t.slice(0, -1))), super.equals(e, t, n);
	}
};
new te();
function U(e, t) {
	t.stripTrailingCr && (e = e.replace(/\r\n/g, `
`));
	const n = [], r = e.split(/(\n|\r\n)/);
	r[r.length - 1] || r.pop();
	for (let s = 0; s < r.length; s++) {
		const o = r[s];
		s % 2 && !t.newlineIsToken ? n[n.length - 1] += o : n.push(o);
	}
	return n;
}
function ne(e) {
	return e == "." || e == "!" || e == "?";
}
var oe = class extends y {
	tokenize(e) {
		var t;
		const n = [];
		let r = 0;
		for (let s = 0; s < e.length; s++) {
			if (s == e.length - 1) {
				n.push(e.slice(r));
				break;
			}
			if (ne(e[s]) && e[s + 1].match(/\s/)) {
				for (n.push(e.slice(r, s + 1)), s = r = s + 1; !((t = e[s + 1]) === null || t === void 0) && t.match(/\s/);) s++;
				n.push(e.slice(r, s + 1)), r = s + 1;
			}
		}
		return n;
	}
};
new oe();
var re = class extends y {
	tokenize(e) {
		return e.split(/([{}:;,]|\s+)/);
	}
};
new re();
var se = class extends y {
	constructor() {
		super(...arguments), this.tokenize = U;
	}
	get useLongestToken() {
		return !0;
	}
	castInput(e, t) {
		const { undefinedReplacement: n, stringifyReplacer: r = (s, o) => typeof o > "u" ? n : o } = t;
		return typeof e == "string" ? e : JSON.stringify(O(e, null, null, r), null, "  ");
	}
	equals(e, t, n) {
		return super.equals(e.replace(/,([\r\n])/g, "$1"), t.replace(/,([\r\n])/g, "$1"), n);
	}
};
new se();
function O(e, t, n, r, s) {
	t = t || [], n = n || [], r && (e = r(s === void 0 ? "" : s, e));
	let o;
	for (o = 0; o < t.length; o += 1) if (t[o] === e) return n[o];
	let l;
	if (Object.prototype.toString.call(e) === "[object Array]") {
		for (t.push(e), l = new Array(e.length), n.push(l), o = 0; o < e.length; o += 1) l[o] = O(e[o], t, n, r, String(o));
		return t.pop(), n.pop(), l;
	}
	if (e && e.toJSON && (e = e.toJSON()), typeof e == "object" && e !== null) {
		t.push(e), l = {}, n.push(l);
		const a = [];
		let i;
		for (i in e) Object.prototype.hasOwnProperty.call(e, i) && a.push(i);
		for (a.sort(), o = 0; o < a.length; o += 1) i = a[o], l[i] = O(e[i], t, n, r, i);
		t.pop(), n.pop();
	} else l = e;
	return l;
}
var ie = class extends y {
	tokenize(e) {
		return e.slice();
	}
	join(e) {
		return e;
	}
	removeEmpty(e) {
		return e;
	}
};
const le = new ie();
function ae(e, t, n) {
	return le.diff(e, t, n);
}
function ce(e) {
	return e.split(/\s+/).filter(Boolean);
}
function k(e) {
	return new Set(ce(e));
}
const fe = /[\u2E80-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F\u{20000}-\u{2FA1F}]/u;
function F(e) {
	return fe.test(e);
}
let I = null;
function ue() {
	return I || (typeof Intl < "u" && Intl.Segmenter ? (I = new Intl.Segmenter(void 0, { granularity: "word" }), I) : null);
}
function de(e) {
	const t = ue();
	return t ? [...t.segment(e)].filter((n) => n.isWordLike).map((n) => n.segment) : [e];
}
function he(e) {
	if (e.length === 0) return {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
	const t = Math.min(...e.map((o) => o.x)), n = Math.min(...e.map((o) => o.y)), r = Math.max(...e.map((o) => o.x + o.width)), s = Math.max(...e.map((o) => o.y + o.height));
	return {
		x: t,
		y: n,
		width: r - t,
		height: s - n
	};
}
const J = {
	LINE_TOLERANCE_FACTOR: .6,
	MIN_LINE_TOLERANCE: 4,
	FOCUS_REGION_PADDING: 40,
	FOCUS_REGION_MIN_WIDTH: 320,
	FOCUS_REGION_MIN_HEIGHT: 200
};
function me(e) {
	if (e.charMap && e.charMap.length === e.normalizedText.length) return e.charMap;
	const t = e.rect.width / Math.max(e.normalizedText.length, 1);
	return Array.from({ length: e.normalizedText.length }, (n, r) => ({
		x: e.rect.x + r * t,
		width: t
	}));
}
function q(e) {
	if (e.wordTokens && e.wordTokens.length > 0) {
		const o = e.wordTokens.map((l) => ({
			word: l.word,
			compareWord: l.compareWord,
			rect: l.rect,
			fontName: l.fontName,
			fontSize: l.fontSize
		}));
		return F(e.normalizedText) ? o.flatMap(B) : o;
	}
	const t = e.normalizedText.split(/\s+/).filter(Boolean);
	if (t.length === 0) return [];
	const n = me(e);
	let r = 0;
	const s = t.map((o) => {
		const l = e.normalizedText.indexOf(o, r), a = l + o.length - 1;
		r = l + o.length;
		const i = n[l], c = n[a];
		if (!i || !c) {
			const h = e.rect.width / Math.max(e.normalizedText.length, 1);
			return {
				word: o,
				compareWord: o.toLowerCase(),
				rect: {
					x: e.rect.x + l * h,
					y: e.rect.y,
					width: o.length * h,
					height: e.rect.height
				}
			};
		}
		const f = i.x, u = c.x + c.width - i.x;
		return {
			word: o,
			compareWord: o.toLowerCase(),
			rect: {
				x: f,
				y: e.rect.y,
				width: u,
				height: e.rect.height
			}
		};
	});
	return F(e.normalizedText) ? s.flatMap(B) : s;
}
function B(e) {
	if (!F(e.word)) return [e];
	const t = de(e.word);
	if (t.length <= 1) return [e];
	const n = e.word.length, r = e.rect.width / Math.max(n, 1);
	let s = 0;
	return t.map((o) => {
		const l = e.rect.x + s * r, a = o.length * r;
		return s += o.length, {
			word: o,
			compareWord: o.toLowerCase(),
			rect: {
				x: l,
				y: e.rect.y,
				width: a,
				height: e.rect.height
			}
		};
	});
}
function z(e) {
	if (e.length === 0) return [];
	const t = [...e].sort((r, s) => r.y - s.y || r.x - s.x), n = [[t[0]]];
	for (let r = 1; r < t.length; r++) {
		const s = n[n.length - 1], o = s[s.length - 1], l = t[r], a = Math.abs(l.y - o.y) < Math.max(o.height * J.LINE_TOLERANCE_FACTOR, J.MIN_LINE_TOLERANCE), i = l.x <= o.x + o.width + o.height * 2;
		a && i ? s.push(l) : n.push([l]);
	}
	return n.map((r) => he(r));
}
function G(e) {
	return e.map((t) => t.compareWord).join("");
}
function ge(e, t) {
	return e.length === 0 || t.length === 0 ? !1 : G(e) === G(t);
}
function A(e, t, n, r) {
	const s = n.map((c) => c.word).join(" "), o = r.map((c) => c.word).join(" ");
	if (!s && !o) return;
	const l = `${t}-${e.length}`, a = z(n.map((c) => c.rect)), i = z(r.map((c) => c.rect));
	t === "modified" ? e.push({
		id: l,
		type: t,
		category: "text",
		description: `Replaced "${s}" with "${o}"`,
		beforeText: s,
		afterText: o,
		beforeRects: a,
		afterRects: i
	}) : t === "removed" ? e.push({
		id: l,
		type: t,
		category: "text",
		description: `Removed "${s}"`,
		beforeText: s,
		afterText: "",
		beforeRects: a,
		afterRects: []
	}) : e.push({
		id: l,
		type: t,
		category: "text",
		description: `Added "${o}"`,
		beforeText: "",
		afterText: o,
		beforeRects: [],
		afterRects: i
	});
}
function pe(e) {
	return e.reduce((t, n) => (n.type === "added" && (t.added += 1), n.type === "removed" && (t.removed += 1), n.type === "modified" && (t.modified += 1), n.type === "moved" && (t.moved += 1), n.type === "style-changed" && (t.styleChanged += 1), t), {
		added: 0,
		removed: 0,
		modified: 0,
		moved: 0,
		styleChanged: 0
	});
}
function xe(e, t) {
	const n = e.flatMap(q), r = t.flatMap(q), s = ae(n.map((i) => i.compareWord), r.map((i) => i.compareWord)), o = [];
	let l = 0, a = 0;
	for (let i = 0; i < s.length; i++) {
		const c = s[i], f = c.value.length;
		if (c.removed) {
			const u = n.slice(l, l + f);
			l += f;
			const h = s[i + 1];
			if (h?.added) {
				const g = r.slice(a, a + h.value.length);
				if (a += h.value.length, ge(u, g)) {
					i++;
					continue;
				}
				A(o, "modified", u, g), i++;
			} else A(o, "removed", u, []);
			continue;
		}
		if (c.added) {
			const u = r.slice(a, a + f);
			a += f, A(o, "added", [], u);
			continue;
		}
		l += f, a += f;
	}
	return we(o, n, r, s), Se(o), {
		changes: o,
		summary: pe(o)
	};
}
function V(e) {
	return e.replace(/^g_d\d+_/, "g_d_");
}
function ve(e, t) {
	return !!(e.fontName && t.fontName && V(e.fontName) !== V(t.fontName) || e.fontSize && t.fontSize && Math.abs(e.fontSize - t.fontSize) > .5);
}
function we(e, t, n, r) {
	const s = [];
	let o = 0, l = 0;
	for (const i of r) {
		const c = i.value.length;
		if (i.removed) {
			o += c;
			continue;
		}
		if (i.added) {
			l += c;
			continue;
		}
		let f = -1;
		for (let u = 0; u < c; u++) {
			const h = t[o + u], g = n[l + u], x = ve(h, g);
			if (x && f < 0 && (f = u), (!x || u === c - 1) && f >= 0) {
				const v = x ? u + 1 : u, p = t.slice(o + f, o + v), d = n.slice(l + f, l + v);
				s.push({
					bFont: p[0].fontName ?? "unknown",
					aFont: d[0].fontName ?? "unknown",
					bSize: p[0].fontSize,
					aSize: d[0].fontSize,
					text: p.map((m) => m.word).join(" "),
					beforeRects: z(p.map((m) => m.rect)),
					afterRects: z(d.map((m) => m.rect))
				}), f = -1;
			}
		}
		o += c, l += c;
	}
	const a = /* @__PURE__ */ new Map();
	for (const i of s) {
		const c = `${i.bFont}→${i.aFont}|${i.bSize ?? ""}→${i.aSize ?? ""}`, f = a.get(c);
		f ? f.push(i) : a.set(c, [i]);
	}
	for (const i of a.values()) {
		const c = i[0].bFont, f = i[0].aFont, u = i[0].bSize, h = i[0].aSize, g = i.map((m) => m.text).join(" … "), x = i.flatMap((m) => m.beforeRects), v = i.flatMap((m) => m.afterRects);
		let p = `Style changed (${i.length} regions)`;
		const d = [];
		c !== f && d.push(`Font: ${c} → ${f}`), u && h && Math.abs(u - h) > .5 && d.push(`Font size: ${u} → ${h}`), d.length && (p += `
` + d.map((m) => `• ${m}`).join(`
`)), e.push({
			id: `style-changed-${e.length}`,
			type: "style-changed",
			category: "formatting",
			description: p,
			beforeText: g,
			afterText: g,
			beforeRects: x,
			afterRects: v
		});
	}
}
const ye = 3, Ce = .8;
function H(e) {
	return e.toLowerCase().replace(/\s+/g, " ").trim();
}
function Te(e, t) {
	if (e === t) return 1;
	if (!e || !t) return 0;
	const n = e.split(" "), r = t.split(" "), s = new Set(r);
	let o = 0;
	for (const l of n) s.has(l) && o++;
	return o / Math.max(n.length, r.length);
}
function Se(e) {
	const t = e.filter((o) => o.type === "removed"), n = e.filter((o) => o.type === "added");
	if (t.length === 0 || n.length === 0) return;
	const r = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
	for (const o of t) {
		const l = H(o.beforeText);
		if (l.split(" ").length < ye) continue;
		let a = null, i = Ce;
		for (const c of n) {
			if (s.has(c.id)) continue;
			const f = Te(l, H(c.afterText));
			f > i && (i = f, a = c);
		}
		a && (r.add(o.id), s.add(a.id), e.push({
			id: `moved-${e.length}`,
			type: "moved",
			category: "text",
			description: `Moved "${o.beforeText.slice(0, 80)}"`,
			beforeText: o.beforeText,
			afterText: a.afterText,
			beforeRects: o.beforeRects,
			afterRects: a.afterRects
		}));
	}
	for (let o = e.length - 1; o >= 0; o--) (r.has(e[o].id) || s.has(e[o].id)) && e.splice(o, 1);
}
function Y(e, t) {
	if (!e.hasText && !t.hasText) return e.pageNumber === t.pageNumber ? .7 : .35;
	if (!e.hasText || !t.hasText) return .08;
	const n = k(e.plainText), r = k(t.plainText), s = /* @__PURE__ */ new Set([...n, ...r]);
	let o = 0;
	n.forEach((i) => {
		r.has(i) && (o += 1);
	});
	const l = s.size === 0 ? 0 : o / s.size, a = e.pageNumber === t.pageNumber ? .1 : 0;
	return Math.min(l + a, 1);
}
function Ee(e, t) {
	const r = e.length + 1, s = t.length + 1, o = Array.from({ length: r }, () => Array(s).fill(0)), l = Array.from({ length: r }, () => Array(s).fill("match"));
	for (let f = 1; f < r; f += 1) o[f][0] = f * .8, l[f][0] = "left";
	for (let f = 1; f < s; f += 1) o[0][f] = f * .8, l[0][f] = "right";
	for (let f = 1; f < r; f += 1) for (let u = 1; u < s; u += 1) {
		const h = Y(e[f - 1], t[u - 1]), g = o[f - 1][u - 1] + (1 - h), x = o[f - 1][u] + .8, v = o[f][u - 1] + .8, p = Math.min(g, x, v);
		o[f][u] = p, p === g ? l[f][u] = "match" : p === x ? l[f][u] = "left" : l[f][u] = "right";
	}
	const a = [];
	let i = e.length, c = t.length;
	for (; i > 0 || c > 0;) {
		const f = l[i][c];
		if (i > 0 && c > 0 && f === "match") {
			const u = Y(e[i - 1], t[c - 1]);
			a.push({
				pairIndex: 0,
				leftPageNumber: e[i - 1].pageNumber,
				rightPageNumber: t[c - 1].pageNumber,
				confidence: u
			}), i -= 1, c -= 1;
			continue;
		}
		if (i > 0 && (c === 0 || f === "left")) {
			a.push({
				pairIndex: 0,
				leftPageNumber: e[i - 1].pageNumber,
				rightPageNumber: null,
				confidence: 0
			}), i -= 1;
			continue;
		}
		c > 0 && (a.push({
			pairIndex: 0,
			leftPageNumber: null,
			rightPageNumber: t[c - 1].pageNumber,
			confidence: 0
		}), c -= 1);
	}
	return a.reverse().map((f, u) => ({
		...f,
		pairIndex: u + 1
	}));
}
function Ne(e) {
	if (!e || typeof e != "object") return !1;
	const t = e;
	return typeof t.id != "number" ? !1 : t.type === "diff" ? Array.isArray(t.beforeItems) && Array.isArray(t.afterItems) : t.type === "pair" ? Array.isArray(t.leftPages) && Array.isArray(t.rightPages) : !1;
}
self.onmessage = function(e) {
	if (e.origin && e.origin !== "" && e.origin !== self.location.origin || !Ne(e.data)) return;
	const t = e.data;
	try {
		if (t.type === "diff") {
			const { changes: n, summary: r } = xe(t.beforeItems, t.afterItems), s = {
				type: "diff",
				id: t.id,
				changes: n,
				summary: r
			};
			self.postMessage(s);
		} else if (t.type === "pair") {
			const n = Ee(t.leftPages, t.rightPages), r = {
				type: "pair",
				id: t.id,
				pairs: n
			};
			self.postMessage(r);
		}
	} catch (n) {
		const r = {
			type: "error",
			id: t.id,
			message: n instanceof Error ? n.message : String(n)
		};
		self.postMessage(r);
	}
};
