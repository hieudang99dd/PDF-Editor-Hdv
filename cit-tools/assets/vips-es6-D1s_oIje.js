async function Vips(moduleArg = {}) {
	var moduleRtn, n = moduleArg, aa = !!globalThis.window, ba = !!globalThis.WorkerGlobalScope, da = !!globalThis.Deno;
	aa ||= da;
	var t = ba && globalThis.name == "em-pthread";
	n.dynamicLibraries = n.dynamicLibraries || ["vips-jxl.wasm", "vips-heif.wasm"];
	var ea = [], fa = "./this.program", ha = import.meta.url, ia = "";
	function ja(i) {
		return n.locateFile ? n.locateFile(i, ia) : ia + i;
	}
	var ka, la;
	if (aa || ba) {
		try {
			ia = new URL(".", ha).href;
		} catch {}
		ba && (la = (i) => {
			var o = new XMLHttpRequest();
			return o.open("GET", i, !1), o.responseType = "arraybuffer", o.send(null), new Uint8Array(o.response);
		}), ka = async (i) => {
			if (i = await fetch(i, { credentials: "same-origin" }), i.ok) return i.arrayBuffer();
			throw Error(i.status + " : " + i.url);
		};
	}
	var ma = console.log.bind(console), v = console.error.bind(console), na = [], oa, pa, qa = !1, ra;
	class w extends Error {}
	class sa extends w {}
	class ta extends w {
		constructor(o) {
			super(o), this.ha = o, o = ua(o instanceof ta ? o.ha : o), this.name = o[0], this.message = o[1];
		}
	}
	var va, wa, xa = {}, ya;
	if (t) {
		let i = function(o) {
			try {
				var s = o.data, _ = s.W;
				if (_ === "load") {
					let $ = [];
					self.onmessage = (j) => $.push(j), ya = () => {
						postMessage({ W: "loaded" });
						for (let j of $) i(j);
						self.onmessage = i;
					}, na = s.Hb, xa = s.qc;
					for (const j of s.Tb) (!n[j] || n[j].proxy) && (n[j] = (..._e) => {
						postMessage({
							W: "callHandler",
							Sb: j,
							Bb: _e
						});
					}, j == "print" && (ma = n[j]), j == "printErr" && (v = n[j]));
					Ba = s.wc, Ca(), pa = s.xc, Da(), Ea();
				} else if (_ === "run") {
					Fa(s.Y), Ga(s.Y, 0, 0, 1, 0, 0), Ha(), Ia(s.Y), za || (Ja(), za = !0);
					try {
						Ka(s.tc, s.Fa);
					} catch ($) {
						if ($ != "unwind") throw $;
					}
				} else s.target !== "setimmediate" && (_ === "checkMailbox" ? za && La() : _ && (v(`worker: received unknown command ${_}`), v(s)));
			} catch ($) {
				throw Na(), $;
			}
		};
		var za = !1;
		self.onunhandledrejection = (o) => {
			throw o.reason || o;
		}, self.onmessage = i;
	}
	var x, y, z, B, C, E, Oa, Pa, F, Qa, Ra = !1, Sa = !1;
	function Ca() {
		var i = Ba.buffer;
		x = new Int8Array(i), z = new Int16Array(i), y = new Uint8Array(i), B = new Uint16Array(i), C = new Int32Array(i), E = new Uint32Array(i), Oa = new Float32Array(i), Pa = new Float64Array(i), F = new BigInt64Array(i), Qa = new BigUint64Array(i);
	}
	var Ta = [];
	function Ua() {
		Ra = !0, t ? ya() : (Va(Ta), n.noFSInit || FS.Ja || FS.init(), Wa.__wasm_call_ctors(), Va(Xa), FS.gb = !1);
	}
	function J(i) {
		throw n.onAbort?.(i), i = "Aborted(" + i + ")", v(i), qa = !0, i = new WebAssembly.RuntimeError(i + ". Build with -sASSERTIONS for more info."), wa?.(i), i;
	}
	var Ya;
	async function Za(i) {
		if (!oa) try {
			var o = await ka(i);
			return new Uint8Array(o);
		} catch {}
		if (i == Ya && oa) i = new Uint8Array(oa);
		else if (la) i = la(i);
		else throw "both async and sync fetching of the wasm failed";
		return i;
	}
	async function $a(i, o) {
		try {
			var s = await Za(i);
			return await WebAssembly.instantiate(s, o);
		} catch (_) {
			v(`failed to asynchronously prepare wasm: ${_}`), J(_);
		}
	}
	async function ab(i) {
		var o = Ya;
		if (!oa) try {
			var s = fetch(o, { credentials: "same-origin" });
			return await WebAssembly.instantiateStreaming(s, i);
		} catch (_) {
			v(`wasm streaming compile failed: ${_}`), v("falling back to ArrayBuffer instantiation");
		}
		return $a(o, i);
	}
	function bb() {
		K = {
			__assert_fail: cb,
			__call_sighandler: db,
			__cxa_begin_catch: eb,
			__cxa_end_catch: gb,
			__cxa_find_matching_catch_2: hb,
			__cxa_find_matching_catch_3: ib,
			__cxa_rethrow: jb,
			__cxa_throw: kb,
			__cxa_uncaught_exceptions: lb,
			__lsan_ignore_object: mb,
			__pthread_create_js: nb,
			__resumeException: ob,
			__syscall_dup: pb,
			__syscall_faccessat: qb,
			__syscall_fcntl64: rb,
			__syscall_fstat64: sb,
			__syscall_ftruncate64: tb,
			__syscall_getcwd: ub,
			__syscall_ioctl: vb,
			__syscall_lstat64: wb,
			__syscall_newfstatat: xb,
			__syscall_openat: yb,
			__syscall_poll: zb,
			__syscall_rmdir: Ab,
			__syscall_stat64: Bb,
			__syscall_unlinkat: Cb,
			_abort_js: Db,
			_dlopen_js: Gb,
			_dlsym_catchup_js: Hb,
			_dlsym_js: Ib,
			_embind_finalize_value_object: Jb,
			_embind_register_arithmetic_vector: Kb,
			_embind_register_bigint: Lb,
			_embind_register_bool: Mb,
			_embind_register_class: Nb,
			_embind_register_class_class_function: Ob,
			_embind_register_class_constructor: Pb,
			_embind_register_class_function: Qb,
			_embind_register_class_property: Rb,
			_embind_register_emval: Sb,
			_embind_register_enum: Tb,
			_embind_register_enum_value: Ub,
			_embind_register_float: Vb,
			_embind_register_function: Wb,
			_embind_register_integer: Xb,
			_embind_register_iterable: Yb,
			_embind_register_memory_view: Zb,
			_embind_register_optional: $b,
			_embind_register_std_string: ac,
			_embind_register_std_wstring: bc,
			_embind_register_value_object: cc,
			_embind_register_value_object_field: dc,
			_embind_register_void: ec,
			_emscripten_dlopen_js: fc,
			_emscripten_dlsync_threads: gc,
			_emscripten_get_dynamic_libraries_js: hc,
			_emscripten_init_main_thread_js: ic,
			_emscripten_notify_mailbox_postmessage: jc,
			_emscripten_receive_on_main_thread_js: kc,
			_emscripten_runtime_keepalive_clear: lc,
			_emscripten_thread_cleanup: mc,
			_emscripten_thread_exit_joinable: nc,
			_emscripten_thread_mailbox_await: Ia,
			_emscripten_thread_set_strongref: oc,
			_emscripten_throw_longjmp: pc,
			_emval_array_to_memory_view: qc,
			_emval_create_invoker: rc,
			_emval_decref: sc,
			_emval_get_global: tc,
			_emval_get_module_property: uc,
			_emval_get_property: vc,
			_emval_incref: wc,
			_emval_instanceof: xc,
			_emval_invoke: yc,
			_emval_is_number: zc,
			_emval_is_string: Ac,
			_emval_new_cstring: Bc,
			_emval_run_destructors: Cc,
			_emval_set_property: Dc,
			_emval_typeof: Ec,
			_gmtime_js: Fc,
			_localtime_js: Gc,
			_mmap_js: Hc,
			_munmap_js: Ic,
			_tzset_js: Jc,
			clock_time_get: Kc,
			emscripten_check_blocking_allowed: Lc,
			emscripten_date_now: Mc,
			emscripten_err: Nc,
			emscripten_exit_with_live_runtime: Oc,
			emscripten_get_heap_max: Pc,
			emscripten_get_now: Qc,
			emscripten_num_logical_cores: Rc,
			emscripten_promise_destroy: Sc,
			emscripten_promise_resolve: Tc,
			emscripten_resize_heap: Uc,
			environ_get: Vc,
			environ_sizes_get: Wc,
			exit: Xc,
			fd_close: Yc,
			fd_fdstat_get: Zc,
			fd_read: $c,
			fd_seek: ad,
			fd_write: bd,
			ffi_call_js: cd,
			heif_color_conversion_options_ext_copy: dd,
			heif_color_conversion_options_ext_free: ed,
			heif_encoding_options_alloc: fd,
			heif_encoding_options_free: gd,
			heif_error_success: hd,
			heif_image_get_plane_readonly2: jd,
			heif_image_release: kd,
			heif_nclx_color_profile_alloc: ld,
			heif_nclx_color_profile_free: md,
			heif_tai_clock_info_copy: nd,
			heif_tai_clock_info_release: od,
			heif_tai_timestamp_packet_copy: pd,
			heif_tai_timestamp_packet_release: qd,
			invoke_di: rd,
			invoke_dii: sd,
			invoke_diii: td,
			invoke_diiiii: ud,
			invoke_ff: vd,
			invoke_fi: wd,
			invoke_fii: xd,
			invoke_fiii: yd,
			invoke_i: zd,
			invoke_ii: Ad,
			invoke_iii: Bd,
			invoke_iiid: Cd,
			invoke_iiii: Dd,
			invoke_iiiii: Ed,
			invoke_iiiiid: Fd,
			invoke_iiiiii: Gd,
			invoke_iiiiiidii: Hd,
			invoke_iiiiiififff: Id,
			invoke_iiiiiii: Jd,
			invoke_iiiiiiii: Kd,
			invoke_iiiiiiiii: Ld,
			invoke_iiiiiiiiii: Md,
			invoke_iiiiiiiiiii: Nd,
			invoke_iiiiiiiiiiii: Od,
			invoke_iiiiiiiiiiiii: Pd,
			invoke_iiiiij: Qd,
			invoke_ji: Rd,
			invoke_jiiii: Sd,
			invoke_v: Td,
			invoke_vi: Ud,
			invoke_vid: Vd,
			invoke_viddi: Wd,
			invoke_vifff: Xd,
			invoke_vii: Yd,
			invoke_viid: Zd,
			invoke_viidd: $d,
			invoke_viiddi: ae,
			invoke_viidi: be,
			invoke_viii: ce,
			invoke_viiid: de,
			invoke_viiidddddi: ee,
			invoke_viiiddddi: fe,
			invoke_viiidddi: ge,
			invoke_viiiddi: he,
			invoke_viiidi: ie,
			invoke_viiii: je,
			invoke_viiiii: ke,
			invoke_viiiiii: le,
			invoke_viiiiiii: me,
			invoke_viiiiiiidd: ne,
			invoke_viiiiiiii: oe,
			invoke_viiiiiiiii: pe,
			invoke_viiiiiiiiii: qe,
			invoke_viiiiiiiiiii: re,
			invoke_viiiiiiiiiiii: se,
			invoke_viiiiiiiiiiiii: te,
			invoke_viiiiiiiiiiiiiii: ue,
			memory: Ba,
			proc_exit: ve,
			random_get: we
		};
		var i = new Proxy(/* @__PURE__ */ new Set(["__lsan_ignore_object"]), xe);
		return {
			env: K,
			wasi_snapshot_preview1: K,
			"GOT.mem": i,
			"GOT.func": i
		};
	}
	async function Da() {
		function i(s, _) {
			var $ = Wa = s.exports;
			ye(Wa);
			var j = ze(_);
			return Ae(Wa._emscripten_tls_init, s.exports, j), s = Wa, Be = s.pthread_self, Ce = s.malloc, n._main = s.main, L = s.free, De = s.fflush, Ee = s.calloc, n.__ZnamSt11align_val_t = s._ZnamSt11align_val_t, Fe = s.__getTypeName, Ja = s._embind_initialize_bindings, n._emscripten_builtin_free = s.emscripten_builtin_free, Ge = s.emscripten_builtin_memalign, n._emscripten_builtin_malloc = s.emscripten_builtin_malloc, He = s.__funcs_on_exit, n.___libc_calloc = s.__libc_calloc, n.___libc_free = s.__libc_free, n.___libc_malloc = s.__libc_malloc, Ie = s.__dl_seterr, Je = s._emscripten_dlsync_self_async, Ke = s._emscripten_dlsync_self, Le = s._emscripten_proxy_dlsync_async, Me = s._emscripten_proxy_dlsync, Ne = s._emscripten_find_dylib, Ga = s._emscripten_thread_init, Na = s._emscripten_thread_crashed, Oe = s._emscripten_run_js_on_main_thread_done, Pe = s._emscripten_run_js_on_main_thread, Qe = s._emscripten_thread_free_data, Re = s._emscripten_thread_exit, n._strndup = s.strndup, Se = s._emscripten_check_mailbox, n.__ZdaPvm = s._ZdaPvm, n.___libc_realloc = s.__libc_realloc, n._emscripten_builtin_calloc = s.emscripten_builtin_calloc, n._emscripten_builtin_realloc = s.emscripten_builtin_realloc, n._malloc_size = s.malloc_size, n._malloc_usable_size = s.malloc_usable_size, n._reallocf = s.reallocf, Te = s.emscripten_get_sbrk_ptr, M = s.setThrew, Ue = s._emscripten_tempret_set, Ve = s.emscripten_stack_set_limits, N = s._emscripten_stack_restore, We = s._emscripten_stack_alloc, O = s.emscripten_stack_get_current, Xe = s.__cxa_decrement_exception_refcount, Ye = s.__cxa_increment_exception_refcount, Ze = s.__get_exception_message, $e = s.__cxa_can_catch, af = s.__cxa_get_exception_ptr, bf = s.__indirect_function_table, cf = s.__heap_base.value, df($), ef("__main__", 0, K), ff(), pa = _, Wa;
		}
		var o = bb();
		return n.instantiateWasm ? new Promise((s) => {
			n.instantiateWasm(o, (_, $) => {
				s(i(_, $));
			});
		}) : t ? i(new WebAssembly.Instance(pa, bb()), pa) : (Ya ??= n.locateFile ? ja("vips.wasm") : new URL("" + new URL("vips-C9VSaDuC.wasm", import.meta.url).href, "" + import.meta.url).href, (function(s) {
			return i(s.instance, s.module);
		})(await ab(o)));
	}
	var hf = (i) => {
		if (!(i instanceof gf || i == "unwind")) throw i;
	};
	class gf {
		name = "ExitStatus";
		constructor(o) {
			this.message = `Program terminated with exit(${o})`, this.status = o;
		}
	}
	var jf = 0, kf = (i) => {
		i.terminate(), i.onmessage = () => {};
	}, qf = (i) => {
		var o = lf[i];
		mf.delete(i), i in nf && nf[i].resolve(), i = o.Y, delete lf[i], of.push(o), pf.splice(pf.indexOf(o), 1), o.Y = 0, Qe(i);
	}, Va = (i) => {
		for (; 0 < i.length;) i.shift()(n);
	}, rf = [], sf = (i) => {
		mf.add(i), i in nf && nf[i].resolve();
	}, tf = 0, uf = null, vf = () => {
		if (tf--, n.monitorRunDependencies?.(tf), tf == 0 && uf) {
			var i = uf;
			uf = null, i();
		}
	}, wf = () => {
		tf++, n.monitorRunDependencies?.(tf);
	}, zf = (i) => {
		of.length == 0 && (xf(), yf(of[0]));
		var o = of.pop();
		return o ? (pf.push(o), lf[i.Y] = o, o.Y = i.Y, o.postMessage({
			W: "run",
			tc: i.sc,
			Fa: i.Fa,
			Y: i.Y
		}, i.ub), 0) : 6;
	}, of = [], pf = [], Af = [], lf = {};
	function Bf() {
		for (var i = 6 < navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 6; i--;) xf();
		rf.push(async () => {
			var o = Cf();
			wf("loading-workers"), await o, vf("loading-workers");
		}), nf = {}, mf = /* @__PURE__ */ new Set();
	}
	var Df = () => {
		for (var i of pf) kf(i);
		for (i of of) kf(i);
		of = [], pf = [], lf = {};
	};
	function Ha() {
		Af.forEach((i) => i());
	}
	var yf = (i) => new Promise((o) => {
		i.onmessage = (j) => {
			var _e = j.data;
			if (j = _e.W, _e.Ea && _e.Ea != Be()) {
				var er = lf[_e.Ea];
				er ? er.postMessage(_e, _e.ub) : v(`Internal error! Worker sent a message "${j}" to target pthread ${_e.Ea}, but that thread no longer exists!`);
			} else j === "checkMailbox" ? La() : j === "spawnThread" ? zf(_e) : j === "cleanupThread" ? Ef(() => qf(_e.Va)) : j === "markAsFinished" ? sf(_e.Va) : j === "loaded" ? (i.loaded = !0, o(i)) : _e.target === "setimmediate" ? i.postMessage(_e) : j === "callHandler" ? n[_e.Sb](..._e.Bb) : j && v(`worker sent an unknown command ${j}`);
		}, i.onerror = (j) => {
			throw v(`worker sent an error! ${j.filename}:${j.lineno}: ${j.message}`), j;
		};
		var s = [], _ = [
			"onExit",
			"onAbort",
			"print",
			"printErr"
		], $;
		for ($ of _) n.propertyIsEnumerable($) && s.push($);
		i.postMessage({
			W: "load",
			Tb: s,
			wc: Ba,
			xc: pa,
			Hb: na,
			qc: xa
		});
	});
	async function Cf() {
		if (!t) return Promise.all(of.map(yf));
	}
	function xf() {
		if (n.mainScriptUrlOrBlob) {
			var i = n.mainScriptUrlOrBlob;
			typeof i != "string" && (i = URL.createObjectURL(i)), i = new Worker(i, {
				type: "module",
				name: "em-pthread"
			});
		} else i = new Worker(self.location.href, {
			type: "module",
			name: "em-pthread"
		});
		of.push(i);
	}
	var mf, nf, Ff, P = (i, o, ...s) => {
		var _ = 16 * s.length, $ = O(), j = We(_), _e = j >> 3, er;
		for (er of s) typeof er == "bigint" ? (F[_e++] = 1n, F[_e++] = er) : (F[_e++] = 0n, Pa[_e++] = er);
		return i = Pe(i, 0, _, j, o), N($), i;
	};
	function ve(i) {
		if (t) return P(0, 1, i);
		throw ra = i, Gf || 0 < jf || (Df(), n.onExit?.(i), qa = !0), new gf(i);
	}
	ve.g = "vi";
	function Hf(i) {
		if (t) return P(1, 0, i);
		Xc(i);
	}
	var Xc = (i) => {
		if (ra = i, t) throw Hf(i), "unwind";
		if (!(Gf || 0 < jf || t)) {
			He(), FS.Ja = !1, De(0);
			for (var o of FS.streams) o && FS.close(o);
			Df(), Sa = !0;
		}
		ve(i);
	};
	Xc.g = "vi";
	var Ef = (i) => {
		if (!Sa && !qa) try {
			return i();
		} catch (o) {
			hf(o);
		} finally {
			if (!(Sa || Gf || 0 < jf)) try {
				t ? Be() && Re(ra) : Xc(ra);
			} catch (o) {
				hf(o);
			}
		}
	}, If = (i) => {
		jf += 1, setTimeout(() => {
			--jf, Ef(i);
		}, 1e4);
	}, Jf = [], Kf = {}, Lf = !1;
	function Mf() {
		function i() {
			Lf = document.pointerLockElement === n.canvas;
		}
		if (!Nf) {
			Nf = !0, Jf.push({
				canHandle: (s) => !n.noImageDecoding && /\.(jpg|jpeg|png|bmp|webp)$/i.test(s),
				handle: async (s, _) => {
					var $ = new Blob([s], { type: Of(_) });
					$.size !== s.length && ($ = new Blob([new Uint8Array(s).buffer], { type: Of(_) }));
					var j = URL.createObjectURL($);
					return new Promise((_e, er) => {
						var rr = new Image();
						rr.onload = () => {
							var tr = document.createElement("canvas");
							tr.width = rr.width, tr.height = rr.height, tr.getContext("2d").drawImage(rr, 0, 0), URL.revokeObjectURL(j), _e(s);
						}, rr.onerror = () => {
							v(`Image ${j} could not be decoded`), er();
						}, rr.src = j;
					});
				}
			}), Jf.push({
				canHandle: (s) => !n.noAudioDecoding && s.slice(-4) in {
					".ogg": 1,
					".wav": 1,
					".mp3": 1
				},
				handle: async (s, _) => new Promise(($) => {
					function j() {
						_e || (_e = !0, $(s));
					}
					var _e = !1, er = URL.createObjectURL(new Blob([s], { type: Of(_) })), rr = new Audio();
					rr.addEventListener("canplaythrough", () => j(rr), !1), rr.onerror = () => {
						if (!_e) {
							v(`warning: browser could not fully decode audio ${_}, trying slower base64 approach`);
							for (var tr = "", nr = 0, ir = 0, or = 0; or < s.length; or++) for (nr = nr << 8 | s[or], ir += 8; 6 <= ir;) {
								var ar = nr >> ir - 6 & 63;
								ir -= 6, tr += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[ar];
							}
							ir == 2 ? (tr += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(nr & 3) << 4], tr += "==") : ir == 4 && (tr += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(nr & 15) << 2], tr += "="), rr.src = "data:audio/x-" + _.slice(-3) + ";base64," + tr, j(rr);
						}
					}, rr.src = er, If(() => {
						j(rr);
					});
				})
			});
			var o = n.canvas;
			o && (document.addEventListener("pointerlockchange", i, !1), n.elementPointerLock && o.addEventListener("click", (s) => {
				!Lf && n.canvas.requestPointerLock && (n.canvas.requestPointerLock(), s.preventDefault());
			}, !1));
		}
	}
	function Of(i) {
		return {
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			bmp: "image/bmp",
			ogg: "audio/ogg",
			wav: "audio/wav",
			mp3: "audio/mpeg"
		}[i.slice(i.lastIndexOf(".") + 1)];
	}
	var Pf = {}, Nf, Qf = {}, xe = { get(i, o) {
		var s = Qf[o];
		return s ||= Qf[o] = new WebAssembly.Global({
			value: "i32",
			mutable: !0
		}, -1), i.has(o) || (s.required = !0), s;
	} }, Rf = [];
	function Fa(i) {
		var o = E[i + 52 >> 2];
		Ve(o, o - E[i + 56 >> 2]), N(o);
	}
	var Sf = new TextDecoder(), Tf = (i, o, s, _) => {
		if (s = o + s, _) return s;
		for (; i[o] && !(o >= s);) ++o;
		return o;
	}, Uf = (i, o = 0, s) => (s = Tf(i, o, s), Sf.decode(i.buffer ? i.buffer instanceof ArrayBuffer ? i.subarray(o, s) : i.slice(o, s) : new Uint8Array(i.slice(o, s)))), ze = (i) => {
		function o() {
			for (var ir = 0, or = 1;;) {
				var ar = i[j++];
				if (ir += (ar & 127) * or, or *= 128, !(ar & 128)) break;
			}
			return ir;
		}
		function s() {
			var ir = o();
			return j += ir, Uf(i, j - ir, ir);
		}
		function _() {
			for (var ir = o(), or = []; ir--;) or.push(s());
			return or;
		}
		function $(ir, or) {
			if (ir) throw Error(or);
		}
		var j = 0, _e = 0;
		if (i instanceof WebAssembly.Module) _e = WebAssembly.Module.customSections(i, "dylink.0"), $(_e.length === 0, "need dylink section"), i = new Uint8Array(_e[0]), _e = i.length;
		else {
			_e = new Uint32Array(new Uint8Array(i.subarray(0, 24)).buffer)[0] == 1836278016, $(!_e, "need to see wasm magic number"), $(i[8] !== 0, "need the dylink section to be first"), j = 9, _e = o(), _e = j + _e;
			var er = s();
			$(er !== "dylink.0");
		}
		for (er = {
			Pa: [],
			tb: /* @__PURE__ */ new Set(),
			wb: /* @__PURE__ */ new Set(),
			qb: []
		}; j < _e;) {
			var rr = i[j++], tr = o();
			if (rr === 1) er.Oa = o(), er.ac = o(), er.va = o(), er.Rc = o();
			else if (rr === 2) er.Pa = _();
			else if (rr === 3) for (rr = o(); rr--;) {
				tr = s();
				var nr = o();
				nr & 256 && er.tb.add(tr);
			}
			else if (rr === 4) for (rr = o(); rr--;) s(), tr = s(), nr = o(), (nr & 3) == 1 && er.wb.add(tr);
			else rr === 5 ? er.qb = _() : j += tr;
		}
		return er;
	}, Vf = [], Q = (i) => {
		var o = Vf[i];
		return o || (Vf[i] = o = bf.get(i)), o;
	}, Ka = (i, o) => {
		Gf = jf = 0, Ke(), i = Q(i)(o), Gf || 0 < jf ? ra = i : Re(i);
	}, ef = (i, o, s) => (s = {
		Ca: Infinity,
		name: i,
		exports: s,
		global: !0
	}, Wf[i] = s, o != null && (Xf[o] = s), s), Wf = {}, Xf = {}, Yf = (i, o) => Math.ceil(i / o) * o, Zf = (i) => {
		if (Ra) return Ee(i, 1);
		var o = cf;
		if (cf = i = o + 16 * Math.ceil(i / 16), !t) {
			var s = Te();
			E[s >> 2] = i;
		}
		return o;
	}, ag = (i, o) => {
		if ($f) for (var s = i; s < i + o; s++) {
			var _ = Q(s);
			_ && $f.set(_, s);
		}
	}, $f, bg = (i) => ($f || ($f = /* @__PURE__ */ new WeakMap(), ag(0, bf.length)), $f.get(i) || 0), cg = [], dg = (i) => {
		const o = i.length;
		return [
			o % 128 | 128,
			o >> 7,
			...i
		];
	}, eg = {
		i: 127,
		p: 127,
		j: 126,
		f: 125,
		d: 124,
		e: 111
	}, fg = (i) => dg(Array.from(i, (o) => eg[o])), gg = (i, o) => {
		var s = bg(i);
		if (s) return s;
		s = cg.length ? cg.pop() : bf.grow(1);
		try {
			bf.set(s, i), Vf[s] = bf.get(s);
		} catch (_) {
			if (!(_ instanceof TypeError)) throw _;
			o = Uint8Array.of(0, 97, 115, 109, 1, 0, 0, 0, 1, ...dg([
				1,
				96,
				...fg(o.slice(1)),
				...fg(o[0] === "v" ? "" : o[0])
			]), 2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0), o = new WebAssembly.Module(o), o = new WebAssembly.Instance(o, { e: { f: i } }).exports.f, bf.set(s, o), Vf[s] = bf.get(s);
		}
		return $f.set(i, s), s;
	}, df = (i, o) => {
		for (var s in i) {
			var _ = s;
			if (!"memory __memory_base __table_base __stack_pointer __indirect_function_table __cpp_exception __c_longjmp __wasm_apply_data_relocs __dso_handle __tls_size __tls_align __set_stack_limits _emscripten_tls_init __wasm_init_tls __wasm_call_ctors __start_em_asm __stop_em_asm __start_em_js __stop_em_js".split(" ").includes(_) && !_.startsWith("__em_js__")) {
				_ = i[s];
				var $ = Qf[s] && Qf[s].value != -1;
				if (o || !$) {
					if (typeof _ == "function") _ = gg(_);
					else if (typeof _.value != "number") continue;
					let j;
					Qf[j = s] ?? (Qf[j] = new WebAssembly.Global({
						value: "i32",
						mutable: !0
					})), Qf[s].value = _;
				}
			}
		}
	}, hg = (i, o = 0) => {
		var s = {}, _;
		for (_ in i) {
			var $ = _, j = i[_];
			e: {
				if (j instanceof WebAssembly.Global) try {
					j.value = j.value;
				} catch {
					var _e = !0;
					break e;
				}
				_e = !1;
			}
			j = _e ? new WebAssembly.Global({ value: "i32" }, j.value + o) : j, s[$] = j;
		}
		return s;
	}, ig = (i) => (i = K[i], !(!i || i.J)), jg = (i, o) => Object.defineProperty(o, "name", { value: i }), kg = (i, o = []) => Q(i)(...o), lg = (i) => (o, ...s) => {
		var _ = O();
		try {
			return kg(o, s);
		} catch ($) {
			if (N(_), !($ instanceof w)) throw $;
			if (M(1, 0), i[0] == "j") return 0n;
		}
	}, ng = (i) => {
		var o;
		return ig(i) ? o = K[i] : i.startsWith("invoke_") ? o = K[i] = jg(i, lg(i.split("_")[1])) : i.startsWith("__cxa_find_matching_catch_") && (o = K[i] = jg(i, (...s) => mg(s))), {
			Ua: o,
			name: i
		};
	}, Xa = [], S = (i, o, s) => i ? Sf.decode(y.slice(i, Tf(y, i, o, s))) : "", sg = (a, b, c, d, e) => {
		function f() {
			function k(G, D) {
				function H(Aa, ca) {
					Aa = [];
					for (var Eb = 0;; Eb++) {
						var fb = "$" + Eb;
						if (!ca.includes(fb)) break;
						Aa.push(fb);
					}
					Aa = Aa.join(","), og[I] = eval(`(${Aa}) => { ${ca} };`);
				}
				function R(Aa, ca, Eb) {
					var fb = [];
					if (ca = ca.slice(1, -1), ca != "void") {
						ca = ca.split(",");
						for (var ki of ca) ca = ki.split(" ").pop(), fb.push(ca.replaceAll("*", ""));
					}
					q[Aa] = eval(`(${fb}) => ${Eb};`);
				}
				if (!t && c && (xa[c] = G), ag(r, g.va), q = hg(D.exports, p), df(q), b.Ab || pg(), "__start_em_asm" in q) {
					var I = q.__start_em_asm.value;
					for (G = q.__stop_em_asm.value; I < G;) {
						var Ma = S(I);
						H(I, Ma), I = y.indexOf(0, I) + 1;
					}
				}
				for (var Fb in q) if (Fb.startsWith("__em_js__")) {
					I = q[Fb].value, Ma = S(I);
					var [li, mi] = Ma.split("<::>");
					R(Fb.replace("__em_js__", ""), li, mi), delete q[Fb];
				}
				return Ae(q._emscripten_tls_init, D.exports, g), l && ((D = q.__wasm_apply_data_relocs) && (Ra ? D() : Ta.push(D)), (D = q.__wasm_call_ctors) && (Ra ? D() : Xa.push(D))), q;
			}
			var l = !e || !x[e + 8];
			if (l) {
				var m = Math.pow(2, g.ac), p = g.Oa ? Yf(Zf(g.Oa + m), m) : 0, r = g.va ? bf.length : 0;
				e && (x[e + 8] = 1, E[e + 12 >> 2] = p, C[e + 16 >> 2] = g.Oa, E[e + 20 >> 2] = r, C[e + 24 >> 2] = g.va);
			} else p = E[e + 12 >> 2], r = E[e + 20 >> 2];
			g.va && bf.grow(g.va);
			var q;
			m = new Proxy({}, { get(i, o) {
				switch (o) {
					case "__memory_base": return p;
					case "__table_base": return r;
				}
				if (o in K && !K[o].J) return K[o];
				if (!(o in i)) {
					var s;
					i[o] = (..._) => {
						if (!s) {
							var $ = ng(o).Ua;
							!$ && d && ($ = d[o]), $ ||= q[o], s = $;
						}
						return s(..._);
					};
				}
				return i[o];
			} });
			var u = new Proxy(g.wb, xe), A = {
				"GOT.mem": u,
				"GOT.func": u,
				env: m,
				wasi_snapshot_preview1: m
			};
			return b.I ? (async () => {
				var i;
				return a instanceof WebAssembly.Module ? i = new WebAssembly.Instance(a, A) : {module: a, instance: i} = await WebAssembly.instantiate(a, A), k(a, i);
			})() : (m = a instanceof WebAssembly.Module ? a : new WebAssembly.Module(a), u = new WebAssembly.Instance(m, A), k(m, u));
		}
		var g = ze(a);
		if (b = {
			...b,
			Ta: {
				fc: c,
				jc: g.qb
			}
		}, b.I) return g.Pa.reduce((i, o) => i.then(() => (o = qg(o, b.Ta) ?? o, rg(o, b, d))), Promise.resolve()).then(f);
		for (var h of g.Pa) h = qg(h, b.Ta) ?? h, rg(h, b, d);
		return f();
	}, ye = (i) => {
		var o, s;
		for ([o, s] of Object.entries(i)) ig(o) || (K[o] = s);
	}, tg = async (i) => (i = await ka(i), new Uint8Array(i)), ug = (i, o) => {
		for (var s = 0, _ = i.length - 1; 0 <= _; _--) {
			var $ = i[_];
			$ === "." ? i.splice(_, 1) : $ === ".." ? (i.splice(_, 1), s++) : s && (i.splice(_, 1), s--);
		}
		if (o) for (; s; s--) i.unshift("..");
		return i;
	}, vg = (i) => {
		var o = i.charAt(0) === "/", s = i.slice(-1) === "/";
		return (i = ug(i.split("/").filter((_) => !!_), !o).join("/")) || o || (i = "."), i && s && (i += "/"), (o ? "/" : "") + i;
	}, wg = (i) => {
		var o = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(i).slice(1);
		return i = o[0], o = o[1], !i && !o ? "." : (o &&= o.slice(0, -1), i + o);
	}, xg = (i) => i && i.match(/([^\/]+|\/)\/*$/)[1], yg = (i, o) => vg(i + "/" + o), zg = (i) => {
		var o = O();
		return i = i(), N(o), i;
	}, Ag = (i) => {
		for (var o = 0, s = 0; s < i.length; ++s) {
			var _ = i.charCodeAt(s);
			127 >= _ ? o++ : 2047 >= _ ? o += 2 : 55296 <= _ && 57343 >= _ ? (o += 4, ++s) : o += 3;
		}
		return o;
	}, Bg = (i, o, s, _) => {
		if (!(0 < _)) return 0;
		var $ = s;
		_ = s + _ - 1;
		for (var j = 0; j < i.length; ++j) {
			var _e = i.codePointAt(j);
			if (127 >= _e) {
				if (s >= _) break;
				o[s++] = _e;
			} else if (2047 >= _e) {
				if (s + 1 >= _) break;
				o[s++] = 192 | _e >> 6, o[s++] = 128 | _e & 63;
			} else if (65535 >= _e) {
				if (s + 2 >= _) break;
				o[s++] = 224 | _e >> 12, o[s++] = 128 | _e >> 6 & 63, o[s++] = 128 | _e & 63;
			} else {
				if (s + 3 >= _) break;
				o[s++] = 240 | _e >> 18, o[s++] = 128 | _e >> 12 & 63, o[s++] = 128 | _e >> 6 & 63, o[s++] = 128 | _e & 63, j++;
			}
		}
		return o[s] = 0, s - $;
	}, Cg = (i) => {
		var o = Ag(i) + 1, s = We(o);
		return Bg(i, y, s, o), s;
	}, Dg = () => (i) => i.set(crypto.getRandomValues(new Uint8Array(i.byteLength))), Eg = (i) => {
		(Eg = Dg())(i);
	}, Fg = (...i) => {
		for (var o = "", s = !1, _ = i.length - 1; -1 <= _ && !s; _--) {
			if (s = 0 <= _ ? i[_] : FS.cwd(), typeof s != "string") throw new TypeError("Arguments to path.resolve must be strings");
			if (!s) return "";
			o = s + "/" + o, s = s.charAt(0) === "/";
		}
		return o = ug(o.split("/").filter(($) => !!$), !s).join("/"), (s ? "/" : "") + o || ".";
	}, Gg = (i, o) => {
		function s(_e) {
			for (var er = 0; er < _e.length && _e[er] === ""; er++);
			for (var rr = _e.length - 1; 0 <= rr && _e[rr] === ""; rr--);
			return er > rr ? [] : _e.slice(er, rr - er + 1);
		}
		i = Fg(i).slice(1), o = Fg(o).slice(1), i = s(i.split("/")), o = s(o.split("/"));
		for (var _ = Math.min(i.length, o.length), $ = _, j = 0; j < _; j++) if (i[j] !== o[j]) {
			$ = j;
			break;
		}
		for (_ = [], j = $; j < i.length; j++) _.push("..");
		return _ = _.concat(o.slice($)), _.join("/");
	}, Hg = [], Ig = (i) => {
		var o = Array(Ag(i) + 1);
		return i = Bg(i, o, 0, o.length), o.length = i, o;
	}, Jg = [];
	function Kg(i, o) {
		Jg[i] = {
			input: [],
			output: [],
			fa: o
		}, FS.registerDevice(i, Lg);
	}
	var Lg = {
		open(i) {
			var o = Jg[i.node.ta];
			if (!o) throw new FS.h(43);
			i.C = o, i.seekable = !1;
		},
		close(i) {
			i.C.fa.za(i.C);
		},
		za(i) {
			i.C.fa.za(i.C);
		},
		read(i, o, s, _) {
			if (!i.C || !i.C.fa.fb) throw new FS.h(60);
			for (var $ = 0, j = 0; j < _; j++) {
				try {
					var _e = i.C.fa.fb(i.C);
				} catch {
					throw new FS.h(29);
				}
				if (_e === void 0 && $ === 0) throw new FS.h(6);
				if (_e == null) break;
				$++, o[s + j] = _e;
			}
			return $ && (i.node.aa = Date.now()), $;
		},
		write(i, o, s, _) {
			if (!i.C || !i.C.fa.Ra) throw new FS.h(60);
			try {
				for (var $ = 0; $ < _; $++) i.C.fa.Ra(i.C, o[s + $]);
			} catch {
				throw new FS.h(29);
			}
			return _ && (i.node.P = i.node.O = Date.now()), $;
		}
	}, Mg = {
		fb() {
			e: {
				if (!Hg.length) {
					var i = null;
					if (globalThis.window?.prompt && (i = window.prompt("Input: "), i !== null && (i += `
`)), !i) {
						i = null;
						break e;
					}
					Hg = Ig(i);
				}
				i = Hg.shift();
			}
			return i;
		},
		Ra(i, o) {
			o === null || o === 10 ? (ma(Uf(i.output)), i.output = []) : o != 0 && i.output.push(o);
		},
		za(i) {
			0 < i.output?.length && (ma(Uf(i.output)), i.output = []);
		},
		Wb() {
			return {
				Dc: 25856,
				Fc: 5,
				Cc: 191,
				Ec: 35387,
				Bc: [
					3,
					28,
					127,
					21,
					4,
					0,
					1,
					0,
					17,
					19,
					26,
					0,
					18,
					15,
					23,
					22,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]
			};
		},
		Xb() {
			return 0;
		},
		Yb() {
			return [24, 80];
		}
	}, Ng = {
		Ra(i, o) {
			o === null || o === 10 ? (v(Uf(i.output)), i.output = []) : o != 0 && i.output.push(o);
		},
		za(i) {
			0 < i.output?.length && (v(Uf(i.output)), i.output = []);
		}
	}, Og = (i) => {
		i = 65536 * Math.ceil(i / 65536);
		var o = Ge(65536, i);
		return o && y.fill(0, o, o + i), o;
	}, T = {
		X: null,
		mount() {
			return T.createNode(null, "/", 16895, 0);
		},
		createNode(i, o, s, _) {
			var $;
			if (($ = FS.isBlkdev(s)) || ($ = (s & 61440) === 4096), $) throw new FS.h(63);
			return T.X || (T.X = {
				dir: {
					node: {
						T: T.m.T,
						V: T.m.V,
						ka: T.m.ka,
						da: T.m.da,
						rename: T.m.rename,
						unlink: T.m.unlink,
						rmdir: T.m.rmdir,
						ua: T.m.ua,
						symlink: T.m.symlink
					},
					stream: { llseek: T.o.llseek }
				},
				file: {
					node: {
						T: T.m.T,
						V: T.m.V
					},
					stream: {
						llseek: T.o.llseek,
						read: T.o.read,
						write: T.o.write,
						la: T.o.la,
						na: T.o.na
					}
				},
				link: {
					node: {
						T: T.m.T,
						V: T.m.V,
						readlink: T.m.readlink
					},
					stream: {}
				},
				Xa: {
					node: {
						T: T.m.T,
						V: T.m.V
					},
					stream: FS.Db
				}
			}), s = FS.createNode(i, o, s, _), FS.isDir(s.mode) ? (s.m = T.X.dir.node, s.o = T.X.dir.stream, s.v = {}) : FS.isFile(s.mode) ? (s.m = T.X.file.node, s.o = T.X.file.stream, s.M = 0, s.v = T.Ib ?? (T.Ib = /* @__PURE__ */ new Uint8Array(0))) : FS.isLink(s.mode) ? (s.m = T.X.link.node, s.o = T.X.link.stream) : FS.isChrdev(s.mode) && (s.m = T.X.Xa.node, s.o = T.X.Xa.stream), s.aa = s.P = s.O = Date.now(), i && (i.v[o] = s, i.aa = i.P = i.O = s.aa), s;
		},
		m: {
			T(i) {
				var o = {};
				return o.Fb = FS.isChrdev(i.mode) ? i.id : 1, o.Vb = i.id, o.mode = i.mode, o.bc = 1, o.uid = 0, o.Rb = 0, o.ta = i.ta, FS.isDir(i.mode) ? o.size = 4096 : FS.isFile(i.mode) ? o.size = i.M : FS.isLink(i.mode) ? o.size = i.link.length : o.size = 0, o.aa = new Date(i.aa), o.P = new Date(i.P), o.O = new Date(i.O), o.Cb = 4096, o.Wa = Math.ceil(o.size / o.Cb), o;
			},
			V(i, o) {
				for (var s of [
					"mode",
					"atime",
					"mtime",
					"ctime"
				]) o[s] != null && (i[s] = o[s]);
				o.size !== void 0 && (o = o.size, i.M != o && (s = i.v, i.v = new Uint8Array(o), i.v.set(s.subarray(0, Math.min(o, i.M))), i.M = o));
			},
			ka() {
				throw T.Ga || (T.Ga = new FS.h(44), T.Ga.stack = "<generic error, no stack>"), T.Ga;
			},
			da(i, o, s, _) {
				return T.createNode(i, o, s, _);
			},
			rename(i, o, s) {
				try {
					var _ = Pg(o, s);
				} catch {}
				if (_) {
					if (FS.isDir(i.mode)) for (var $ in _.v) throw new FS.h(55);
					Qg(_);
				}
				delete i.parent.v[i.name], o.v[s] = i, i.name = s, o.O = o.P = i.parent.O = i.parent.P = Date.now();
			},
			unlink(i, o) {
				delete i.v[o], i.O = i.P = Date.now();
			},
			rmdir(i, o) {
				var s = Pg(i, o), _;
				for (_ in s.v) throw new FS.h(55);
				delete i.v[o], i.O = i.P = Date.now();
			},
			ua(i) {
				return [
					".",
					"..",
					...Object.keys(i.v)
				];
			},
			symlink(i, o, s) {
				return i = T.createNode(i, o, 41471, 0), i.link = s, i;
			},
			readlink(i) {
				if (!FS.isLink(i.mode)) throw new FS.h(28);
				return i.link;
			}
		},
		o: {
			read(i, o, s, _, $) {
				return $ >= i.node.M ? 0 : (_ = Math.min(i.node.M - $, _), o.set(i.node.v.subarray($, $ + _), s), _);
			},
			write(i, o, s, _, $, j) {
				if (!_) return 0;
				if (i = i.node, i.P = i.O = Date.now(), j) i.v = o.subarray(s, s + _), i.M = _;
				else if (i.M === 0 && $ === 0) i.v = o.slice(s, s + _), i.M = _;
				else {
					j = $ + _;
					var _e = i.v.length;
					_e >= j || (j = Math.max(j, _e * (1048576 > _e ? 2 : 1.125) >>> 0), _e && (j = Math.max(j, 256)), _e = i.v.subarray(0, i.M), i.v = new Uint8Array(j), i.v.set(_e)), i.v.set(o.subarray(s, s + _), $), i.M = Math.max(i.M, $ + _);
				}
				return _;
			},
			llseek(i, o, s) {
				if (s === 1 ? o += i.position : s === 2 && FS.isFile(i.node.mode) && (o += i.node.M), 0 > o) throw new FS.h(28);
				return o;
			},
			la(i, o, s, _, $) {
				if (!FS.isFile(i.node.mode)) throw new FS.h(43);
				if (i = i.node.v, $ & 2 || i.buffer !== x.buffer) {
					if (_ = !0, $ = Og(o), !$) throw new FS.h(48);
					i && ((0 < s || s + o < i.length) && (i.subarray ? i = i.subarray(s, s + o) : i = Array.prototype.slice.call(i, s, s + o)), x.set(i, $));
				} else _ = !1, $ = i.byteOffset;
				return {
					s: $,
					ga: _
				};
			},
			na(i, o, s, _) {
				return T.o.write(i, o, 0, _, s, !1), 0;
			}
		}
	}, Rg = (i) => (typeof i == "string" && (i = Ig(i)), i.subarray || (i = new Uint8Array(i)), i), Sg = (i, o) => {
		var s = 0;
		return i && (s |= 365), o && (s |= 146), s;
	}, Tg = async (i, o) => {
		typeof Pf < "u" && Mf();
		for (var s of Jf) if (s.canHandle(o)) return s.handle(i, o);
		return i;
	}, Ug = async (i, o, s, _, $, j, _e, er) => {
		var rr = o ? Fg(vg(i + "/" + o)) : i, tr = `cp ${rr}`;
		wf(tr);
		try {
			var nr = s;
			typeof s == "string" && (nr = await tg(s)), nr = await Tg(nr, rr), er?.(), j || FS.createDataFile(i, o, nr, _, $, _e);
		} finally {
			vf(tr);
		}
	};
	function Pg(i, o) {
		var s = FS.isDir(i.mode) ? (s = Vg(i, "x")) ? s : i.m.ka ? 0 : 2 : 54;
		if (s) throw new FS.h(s);
		for (s = FS.ea[Wg(i.id, o)]; s; s = s.ma) {
			var _ = s.name;
			if (s.parent.id === i.id && _ === o) return s;
		}
		return FS.ka(i, o);
	}
	function Qg(i) {
		var o = Wg(i.parent.id, i.name);
		if (FS.ea[o] === i) FS.ea[o] = i.ma;
		else for (o = FS.ea[o]; o;) {
			if (o.ma === i) {
				o.ma = i.ma;
				break;
			}
			o = o.ma;
		}
	}
	function Wg(i, o) {
		for (var s = 0, _ = 0; _ < o.length; _++) s = (s << 5) - s + o.charCodeAt(_) | 0;
		return (i + s >>> 0) % FS.ea.length;
	}
	function Xg(i) {
		var o = Wg(i.parent.id, i.name);
		i.ma = FS.ea[o], FS.ea[o] = i;
	}
	function Vg(i, o) {
		return FS.gb ? 0 : o.includes("r") && !(i.mode & 292) || o.includes("w") && !(i.mode & 146) || o.includes("x") && !(i.mode & 73) ? 2 : 0;
	}
	function Yg(i, o) {
		if (!FS.isDir(i.mode)) return 54;
		try {
			return Pg(i, o), 20;
		} catch {}
		return Vg(i, "wx");
	}
	function Zg(i, o, s) {
		try {
			var _ = Pg(i, o);
		} catch ($) {
			return $.A;
		}
		if (i = Vg(i, "wx")) return i;
		if (s) {
			if (!FS.isDir(_.mode)) return 54;
			if (FS.pa(_) || FS.getPath(_) === FS.cwd()) return 10;
		} else if (FS.isDir(_.mode)) return 31;
		return 0;
	}
	function $g(i, o) {
		if (!i) throw new FS.h(o);
		return i;
	}
	function U(i) {
		if (i = FS.eb(i), !i) throw new FS.h(8);
		return i;
	}
	function ah(i, o = -1) {
		if (i = Object.assign(new FS.yb(), i), o == -1) e: {
			for (o = 0; o <= FS.zb; o++) if (!FS.streams[o]) break e;
			throw new FS.h(33);
		}
		return i.ba = o, FS.streams[o] = i;
	}
	function bh(i, o = -1) {
		return i = ah(i, o), i.o?.Hc?.(i), i;
	}
	function ch(i, o, s) {
		var _ = i?.o.V;
		i = _ ? i : o, _ ??= o.m.V, $g(_, 63), _(i, s);
	}
	function dh(i) {
		var o = [];
		for (i = [i]; i.length;) {
			var s = i.pop();
			o.push(s), i.push(...s.qa);
		}
		return o;
	}
	function eh(i) {
		var o = {
			Ac: 4096,
			Kc: 4096,
			Wa: 1e6,
			zc: 5e5,
			yc: 5e5,
			files: FS.Qa,
			Ic: FS.Qa - 1,
			Lc: 42,
			flags: 2,
			Oc: 255
		};
		return i.m.sb && Object.assign(o, i.m.sb(i.mount.dc.root)), o;
	}
	function fh(i, o, s, _) {
		ch(i, o, {
			mode: s & 4095 | o.mode & -4096,
			O: Date.now(),
			ab: _
		});
	}
	function gh(i, o, s) {
		if (FS.isDir(o.mode)) throw new FS.h(31);
		if (!FS.isFile(o.mode)) throw new FS.h(28);
		var _ = Vg(o, "w");
		if (_) throw new FS.h(_);
		ch(i, o, {
			size: s,
			timestamp: Date.now()
		});
	}
	function hh(i, o, s, _) {
		return i = typeof i == "string" ? i : FS.getPath(i), o = vg(i + "/" + o), FS.create(o, Sg(s, _));
	}
	function ih(i) {
		if (!(i.Zb || i.$b || i.link || i.v)) if (globalThis.XMLHttpRequest) J("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
		else try {
			i.v = la(i.url);
		} catch {
			throw new FS.h(29);
		}
	}
	var FS = {
		root: null,
		qa: [],
		$a: {},
		streams: [],
		Qa: 1,
		ea: null,
		Ya: "/",
		Ja: !1,
		gb: !0,
		Lb: null,
		Da: 0,
		h: class {
			name = "ErrnoError";
			constructor(i) {
				this.A = i;
			}
		},
		yb: class {
			R = {};
			node = null;
			get object() {
				return this.node;
			}
			set object(i) {
				this.node = i;
			}
			get flags() {
				return this.R.flags;
			}
			set flags(i) {
				this.R.flags = i;
			}
			get position() {
				return this.R.position;
			}
			set position(i) {
				this.R.position = i;
			}
		},
		xb: class {
			m = {};
			o = {};
			U = null;
			constructor(i, o, s, _) {
				i ||= this, this.parent = i, this.mount = i.mount, this.id = FS.Qa++, this.name = o, this.mode = s, this.ta = _, this.aa = this.P = this.O = Date.now();
			}
			get read() {
				return (this.mode & 365) === 365;
			}
			set read(i) {
				i ? this.mode |= 365 : this.mode &= -366;
			}
			get write() {
				return (this.mode & 146) === 146;
			}
			set write(i) {
				i ? this.mode |= 146 : this.mode &= -147;
			}
			get $b() {
				return FS.isDir(this.mode);
			}
			get Zb() {
				return FS.isChrdev(this.mode);
			}
		},
		lookupPath(i, o = {}) {
			if (!i) throw new FS.h(44);
			o.ya ?? (o.ya = !0), i.charAt(0) === "/" || (i = FS.cwd() + "/" + i);
			var s = 0;
			e: for (; 40 > s; s++) {
				i = i.split("/").filter((er) => !!er);
				for (var _ = FS.root, $ = "/", j = 0; j < i.length; j++) {
					var _e = j === i.length - 1;
					if (_e && o.parent) break;
					if (i[j] !== ".") if (i[j] === "..") if ($ = wg($), FS.pa(_)) {
						i = $ + "/" + i.slice(j + 1).join("/"), s--;
						continue e;
					} else _ = _.parent;
					else {
						$ = vg($ + "/" + i[j]);
						try {
							_ = Pg(_, i[j]);
						} catch (er) {
							if (er?.A === 44 && _e && o.cc) return { path: $ };
							throw er;
						}
						if (!_.U || _e && !o.ya || (_ = _.U.root), FS.isLink(_.mode) && (!_e || o.follow)) {
							if (!_.m.readlink) throw new FS.h(52);
							_ = _.m.readlink(_), _.charAt(0) === "/" || (_ = wg($) + "/" + _), i = _ + "/" + i.slice(j + 1).join("/");
							continue e;
						}
					}
				}
				return {
					path: $,
					node: _
				};
			}
			throw new FS.h(32);
		},
		getPath(i) {
			for (var o;;) {
				if (FS.pa(i)) return i = i.mount.kb, o ? i[i.length - 1] !== "/" ? `${i}/${o}` : i + o : i;
				o = o ? `${i.name}/${o}` : i.name, i = i.parent;
			}
		},
		createNode(i, o, s, _) {
			return i = new FS.xb(i, o, s, _), Xg(i), i;
		},
		pa(i) {
			return i === i.parent;
		},
		isFile(i) {
			return (i & 61440) === 32768;
		},
		isDir(i) {
			return (i & 61440) === 16384;
		},
		isLink(i) {
			return (i & 61440) === 40960;
		},
		isChrdev(i) {
			return (i & 61440) === 8192;
		},
		isBlkdev(i) {
			return (i & 61440) === 24576;
		},
		isSocket(i) {
			return (i & 49152) === 49152;
		},
		zb: 4096,
		eb: (i) => FS.streams[i],
		Db: {
			open(i) {
				i.o = FS.Nb(i.node.ta).o, i.o.open?.(i);
			},
			llseek() {
				throw new FS.h(70);
			}
		},
		Na: (i) => i >> 8,
		Mc: (i) => i & 255,
		makedev: (i, o) => i << 8 | o,
		registerDevice(i, o) {
			FS.$a[i] = { o };
		},
		Nb: (i) => FS.$a[i],
		syncfs(i, o) {
			function s(er) {
				return FS.Da--, o(er);
			}
			function _(er) {
				if (er) {
					if (!_.Jb) return _.Jb = !0, s(er);
				} else ++j >= $.length && s(null);
			}
			typeof i == "function" && (o = i, i = !1), FS.Da++, 1 < FS.Da && v(`warning: ${FS.Da} FS.syncfs operations in flight at once, probably just doing extra work`);
			var $ = dh(FS.root.mount), j = 0, _e;
			for (_e of $) _e.type.syncfs ? _e.type.syncfs(_e, i, _) : _(null);
		},
		mount(i, o, s) {
			var _ = s === "/";
			if (_ && FS.root) throw new FS.h(10);
			if (!_ && s) {
				var $ = FS.lookupPath(s, { ya: !1 });
				if (s = $.path, $ = $.node, $.U) throw new FS.h(10);
				if (!FS.isDir($.mode)) throw new FS.h(54);
			}
			return o = {
				type: i,
				dc: o,
				kb: s,
				qa: []
			}, i = i.mount(o), i.mount = o, o.root = i, _ ? FS.root = i : $ && ($.U = o, $.mount && $.mount.qa.push(o)), i;
		},
		unmount(i) {
			if (i = FS.lookupPath(i, { ya: !1 }), !i.node.U) throw new FS.h(28);
			i = i.node;
			var o = i.U, s = dh(o);
			for ([, $] of Object.entries(FS.ea)) for (; $;) {
				var _ = $.ma;
				s.includes($.mount) && Qg($);
				var $ = _;
			}
			i.U = null, i.mount.qa.splice(i.mount.qa.indexOf(o), 1);
		},
		ka(i, o) {
			return i.m.ka(i, o);
		},
		da(i, o, s) {
			var _ = FS.lookupPath(i, { parent: !0 }).node;
			if (i = xg(i), !i) throw new FS.h(28);
			if (i === "." || i === "..") throw new FS.h(20);
			var $ = Yg(_, i);
			if ($) throw new FS.h($);
			if (!_.m.da) throw new FS.h(63);
			return _.m.da(_, i, o, s);
		},
		sb(i) {
			return eh(FS.lookupPath(i, { follow: !0 }).node);
		},
		Qc(i) {
			return eh(i.node);
		},
		create(i, o = 438) {
			return FS.da(i, o & 4095 | 32768, 0);
		},
		mkdir(i, o = 511) {
			return FS.da(i, o & 1023 | 16384, 0);
		},
		Nc(i, o) {
			var s = i.split("/"), _ = "", $;
			for ($ of s) if ($) {
				(_ || i.charAt(0) === "/") && (_ += "/"), _ += $;
				try {
					FS.mkdir(_, o);
				} catch (j) {
					if (j.A != 20) throw j;
				}
			}
		},
		mkdev(i, o, s) {
			return typeof s > "u" && (s = o, o = 438), FS.da(i, o | 8192, s);
		},
		symlink(i, o) {
			if (!Fg(i)) throw new FS.h(44);
			var s = FS.lookupPath(o, { parent: !0 }).node;
			if (!s) throw new FS.h(44);
			o = xg(o);
			var _ = Yg(s, o);
			if (_) throw new FS.h(_);
			if (!s.m.symlink) throw new FS.h(63);
			return s.m.symlink(s, o, i);
		},
		rename(i, o) {
			var s = wg(i), _ = wg(o), $ = xg(i), j = xg(o), _e = FS.lookupPath(i, { parent: !0 }), er = _e.node;
			if (_e = FS.lookupPath(o, { parent: !0 }), _e = _e.node, !er || !_e) throw new FS.h(44);
			if (er.mount !== _e.mount) throw new FS.h(75);
			var rr = Pg(er, $);
			if (i = Gg(i, _), i.charAt(0) !== ".") throw new FS.h(28);
			if (i = Gg(o, s), i.charAt(0) !== ".") throw new FS.h(55);
			try {
				var tr = Pg(_e, j);
			} catch {}
			if (rr !== tr) {
				if (o = FS.isDir(rr.mode), $ = Zg(er, $, o)) throw new FS.h($);
				if ($ = tr ? Zg(_e, j, o) : Yg(_e, j)) throw new FS.h($);
				if (!er.m.rename) throw new FS.h(63);
				if (rr.U || tr && tr.U) throw new FS.h(10);
				if (_e !== er && ($ = Vg(er, "w"))) throw new FS.h($);
				Qg(rr);
				try {
					er.m.rename(rr, _e, j), rr.parent = _e;
				} catch (nr) {
					throw nr;
				} finally {
					Xg(rr);
				}
			}
		},
		rmdir(i) {
			var o = FS.lookupPath(i, { parent: !0 }).node;
			i = xg(i);
			var s = Pg(o, i), _ = Zg(o, i, !0);
			if (_) throw new FS.h(_);
			if (!o.m.rmdir) throw new FS.h(63);
			if (s.U) throw new FS.h(10);
			o.m.rmdir(o, i), Qg(s);
		},
		ua(i) {
			return i = FS.lookupPath(i, { follow: !0 }).node, $g(i.m.ua, 54)(i);
		},
		unlink(i) {
			var o = FS.lookupPath(i, { parent: !0 }).node;
			if (!o) throw new FS.h(44);
			i = xg(i);
			var s = Pg(o, i), _ = Zg(o, i, !1);
			if (_) throw new FS.h(_);
			if (!o.m.unlink) throw new FS.h(63);
			if (s.U) throw new FS.h(10);
			o.m.unlink(o, i), Qg(s);
		},
		readlink(i) {
			if (i = FS.lookupPath(i).node, !i) throw new FS.h(44);
			if (!i.m.readlink) throw new FS.h(28);
			return i.m.readlink(i);
		},
		stat(i, o) {
			return i = FS.lookupPath(i, { follow: !o }).node, $g(i.m.T, 63)(i);
		},
		lstat(i) {
			return FS.stat(i, !0);
		},
		chmod(i, o, s) {
			i = typeof i == "string" ? FS.lookupPath(i, { follow: !s }).node : i, fh(null, i, o, s);
		},
		lchmod(i, o) {
			FS.chmod(i, o, !0);
		},
		fchmod(i, o) {
			i = U(i), fh(i, i.node, o, !1);
		},
		chown(i, o, s, _) {
			i = typeof i == "string" ? FS.lookupPath(i, { follow: !_ }).node : i, ch(null, i, {
				timestamp: Date.now(),
				ab: _
			});
		},
		lchown(i, o, s) {
			FS.chown(i, o, s, !0);
		},
		fchown(i) {
			i = U(i), ch(i, i.node, {
				timestamp: Date.now(),
				ab: !1
			});
		},
		truncate(i, o) {
			if (0 > o) throw new FS.h(28);
			i = typeof i == "string" ? FS.lookupPath(i, { follow: !0 }).node : i, gh(null, i, o);
		},
		ftruncate(i, o) {
			if (i = U(i), 0 > o || (i.flags & 2097155) === 0) throw new FS.h(28);
			gh(i, i.node, o);
		},
		utime(i, o, s) {
			i = FS.lookupPath(i, { follow: !0 }).node, $g(i.m.V, 63)(i, {
				aa: o,
				P: s
			});
		},
		open(i, o, s = 438) {
			if (i === "") throw new FS.h(44);
			if (typeof o == "string") {
				var _ = {
					r: 0,
					"r+": 2,
					w: 577,
					"w+": 578,
					a: 1089,
					"a+": 1090
				}[o];
				if (typeof _ > "u") throw Error(`Unknown file open mode: ${o}`);
				o = _;
			}
			if (s = o & 64 ? s & 4095 | 32768 : 0, typeof i == "object") _ = i;
			else {
				var $ = i.endsWith("/"), j = FS.lookupPath(i, {
					follow: !(o & 131072),
					cc: !0
				});
				_ = j.node, i = j.path;
			}
			if (j = !1, o & 64) if (_) {
				if (o & 128) throw new FS.h(20);
			} else {
				if ($) throw new FS.h(31);
				_ = FS.da(i, s | 511, 0), j = !0;
			}
			if (!_) throw new FS.h(44);
			if (FS.isChrdev(_.mode) && (o &= -513), o & 65536 && !FS.isDir(_.mode)) throw new FS.h(54);
			if (!j) {
				if ($ = _, i = o, $) if (FS.isLink($.mode)) $ = 32;
				else {
					var _e = [
						"r",
						"w",
						"rw"
					][i & 3];
					i & 512 && (_e += "w"), $ = FS.isDir($.mode) && (_e !== "r" || i & 576) ? 31 : Vg($, _e);
				}
				else $ = 44;
				if ($) throw new FS.h($);
			}
			return o & 512 && !j && FS.truncate(_, 0), o &= -131713, o = ah({
				node: _,
				path: FS.getPath(_),
				flags: o,
				seekable: !0,
				position: 0,
				o: _.o,
				vc: [],
				error: !1
			}), o.o.open && o.o.open(o), j && FS.chmod(_, s & 511), o;
		},
		close(i) {
			if (i.ba === null) throw new FS.h(8);
			i.Ha && (i.Ha = null);
			try {
				i.o.close && i.o.close(i);
			} catch (o) {
				throw o;
			} finally {
				FS.streams[i.ba] = null;
			}
			i.ba = null;
		},
		llseek(i, o, s) {
			if (i.ba === null) throw new FS.h(8);
			if (!i.seekable || !i.o.llseek) throw new FS.h(70);
			if (s != 0 && s != 1 && s != 2) throw new FS.h(28);
			return i.position = i.o.llseek(i, o, s), i.vc = [], i.position;
		},
		read(i, o, s, _, $) {
			if (0 > _ || 0 > $) throw new FS.h(28);
			if (i.ba === null) throw new FS.h(8);
			if ((i.flags & 2097155) === 1) throw new FS.h(8);
			if (FS.isDir(i.node.mode)) throw new FS.h(31);
			if (!i.o.read) throw new FS.h(28);
			var j = typeof $ < "u";
			if (!j) $ = i.position;
			else if (!i.seekable) throw new FS.h(70);
			return o = i.o.read(i, o, s, _, $), j || (i.position += o), o;
		},
		write(i, o, s, _, $, j) {
			if (0 > _ || 0 > $) throw new FS.h(28);
			if (i.ba === null) throw new FS.h(8);
			if ((i.flags & 2097155) === 0) throw new FS.h(8);
			if (FS.isDir(i.node.mode)) throw new FS.h(31);
			if (!i.o.write) throw new FS.h(28);
			i.seekable && i.flags & 1024 && FS.llseek(i, 0, 2);
			var _e = typeof $ < "u";
			if (!_e) $ = i.position;
			else if (!i.seekable) throw new FS.h(70);
			return o = i.o.write(i, o, s, _, $, j), _e || (i.position += o), o;
		},
		la(i, o, s, _, $) {
			if ((_ & 2) !== 0 && ($ & 2) === 0 && (i.flags & 2097155) !== 2) throw new FS.h(2);
			if ((i.flags & 2097155) === 1) throw new FS.h(2);
			if (!i.o.la) throw new FS.h(43);
			if (!o) throw new FS.h(28);
			return i.o.la(i, o, s, _, $);
		},
		na(i, o, s, _, $) {
			return i.o.na ? i.o.na(i, o, s, _, $) : 0;
		},
		Ka(i, o, s) {
			if (!i.o.Ka) throw new FS.h(59);
			return i.o.Ka(i, o, s);
		},
		readFile(i, o = {}) {
			o.flags = o.flags || 0, o.encoding = o.encoding || "binary", o.encoding !== "utf8" && o.encoding !== "binary" && J(`Invalid encoding type "${o.encoding}"`);
			var s = FS.open(i, o.flags);
			i = FS.stat(i).size;
			var _ = new Uint8Array(i);
			return FS.read(s, _, 0, i, 0), o.encoding === "utf8" && (_ = Uf(_)), FS.close(s), _;
		},
		writeFile(i, o, s = {}) {
			s.flags = s.flags || 577, i = FS.open(i, s.flags, s.mode), o = Rg(o), FS.write(i, o, 0, o.byteLength, void 0, s.Gc), FS.close(i);
		},
		cwd: () => FS.Ya,
		chdir(i) {
			if (i = FS.lookupPath(i, { follow: !0 }), i.node === null) throw new FS.h(44);
			if (!FS.isDir(i.node.mode)) throw new FS.h(54);
			var o = Vg(i.node, "x");
			if (o) throw new FS.h(o);
			FS.Ya = i.path;
		},
		init(i, o, s) {
			FS.Ja = !0, i ??= n.stdin, o ??= n.stdout, s ??= n.stderr, i ? FS.createDevice("/dev", "stdin", i) : FS.symlink("/dev/tty", "/dev/stdin"), o ? FS.createDevice("/dev", "stdout", null, o) : FS.symlink("/dev/tty", "/dev/stdout"), s ? FS.createDevice("/dev", "stderr", null, s) : FS.symlink("/dev/tty1", "/dev/stderr"), FS.open("/dev/stdin", 0), FS.open("/dev/stdout", 1), FS.open("/dev/stderr", 1);
		},
		Jc(i, o) {
			return i = FS.analyzePath(i, o), i.bb ? i.object : null;
		},
		analyzePath(i, o) {
			try {
				var s = FS.lookupPath(i, { follow: !o });
				i = s.path;
			} catch {}
			var _ = {
				pa: !1,
				bb: !1,
				error: 0,
				name: null,
				path: null,
				object: null,
				ec: !1,
				ic: null,
				hc: null
			};
			try {
				s = FS.lookupPath(i, { parent: !0 }), _.ec = !0, _.ic = s.path, _.hc = s.node, _.name = xg(i), s = FS.lookupPath(i, { follow: !o }), _.bb = !0, _.path = s.path, _.object = s.node, _.name = s.node.name, _.pa = s.path === "/";
			} catch ($) {
				_.error = $.A;
			}
			return _;
		},
		createPath(i, o) {
			for (i = typeof i == "string" ? i : FS.getPath(i), o = o.split("/").reverse(); o.length;) {
				var s = o.pop();
				if (s) {
					var _ = vg(i + "/" + s);
					try {
						FS.mkdir(_);
					} catch ($) {
						if ($.A != 20) throw $;
					}
					i = _;
				}
			}
			return _;
		},
		createDataFile(i, o, s, _, $, j) {
			var _e = o;
			i && (i = typeof i == "string" ? i : FS.getPath(i), _e = o ? vg(i + "/" + o) : i), i = Sg(_, $), _e = FS.create(_e, i), s && (s = Rg(s), FS.chmod(_e, i | 146), o = FS.open(_e, 577), FS.write(o, s, 0, s.length, 0, j), FS.close(o), FS.chmod(_e, i));
		},
		createDevice(i, o, s, _) {
			i = yg(typeof i == "string" ? i : FS.getPath(i), o), o = Sg(!!s, !!_);
			var $;
			return ($ = FS.createDevice).Na ?? ($.Na = 64), $ = FS.makedev(FS.createDevice.Na++, 0), FS.registerDevice($, {
				open(j) {
					j.seekable = !1;
				},
				close() {
					_?.buffer?.length && _(10);
				},
				read(j, _e, er, rr) {
					for (var tr = 0, nr = 0; nr < rr; nr++) {
						try {
							var ir = s();
						} catch {
							throw new FS.h(29);
						}
						if (ir === void 0 && tr === 0) throw new FS.h(6);
						if (ir == null) break;
						tr++, _e[er + nr] = ir;
					}
					return tr && (j.node.aa = Date.now()), tr;
				},
				write(j, _e, er, rr) {
					for (var tr = 0; tr < rr; tr++) try {
						_(_e[er + tr]);
					} catch {
						throw new FS.h(29);
					}
					return rr && (j.node.P = j.node.O = Date.now()), tr;
				}
			}), FS.mkdev(i, o, $);
		},
		createLazyFile(i, o, s, _, $) {
			function j(nr, ir, or, ar, sr) {
				if (nr = nr.node.v, sr >= nr.length) return 0;
				if (ar = Math.min(nr.length - sr, ar), nr.slice) for (var fr = 0; fr < ar; fr++) ir[or + fr] = nr[sr + fr];
				else for (fr = 0; fr < ar; fr++) ir[or + fr] = nr.get(sr + fr);
				return ar;
			}
			class _e {
				Ia = !1;
				R = [];
				oa = void 0;
				jb = 0;
				ib = 0;
				get(ir) {
					if (!(ir > this.length - 1 || 0 > ir)) {
						var or = ir % this.rb;
						return this.oa(ir / this.rb | 0)[or];
					}
				}
				uc(ir) {
					this.oa = ir;
				}
				lb() {
					var ir = new XMLHttpRequest();
					ir.open("HEAD", s, !1), ir.send(null), 200 <= ir.status && 300 > ir.status || ir.status === 304 || J("Couldn't load " + s + ". Status: " + ir.status);
					var or = Number(ir.getResponseHeader("Content-length")), ar, sr = (ar = ir.getResponseHeader("Accept-Ranges")) && ar === "bytes";
					ir = (ar = ir.getResponseHeader("Content-Encoding")) && ar === "gzip";
					var fr = 1048576;
					sr || (fr = or);
					var lr = this;
					lr.uc((cr) => {
						var ur = cr * fr, hr = (cr + 1) * fr - 1;
						if (hr = Math.min(hr, or - 1), typeof lr.R[cr] > "u") {
							var vr = lr.R;
							ur > hr && J("invalid range (" + ur + ", " + hr + ") or no bytes requested!"), hr > or - 1 && J("only " + or + " bytes available! programmer error!");
							var pr = new XMLHttpRequest();
							pr.open("GET", s, !1), or !== fr && pr.setRequestHeader("Range", "bytes=" + ur + "-" + hr), pr.responseType = "arraybuffer", pr.overrideMimeType && pr.overrideMimeType("text/plain; charset=x-user-defined"), pr.send(null), 200 <= pr.status && 300 > pr.status || pr.status === 304 || J("Couldn't load " + s + ". Status: " + pr.status), ur = pr.response !== void 0 ? new Uint8Array(pr.response || []) : Ig(pr.responseText || ""), vr[cr] = ur;
						}
						return typeof lr.R[cr] > "u" && J("doXHR failed!"), lr.R[cr];
					}), (ir || !or) && (fr = or = 1, fr = or = this.oa(0).length, ma("LazyFiles on gzip forces download of the whole file when length is accessed")), this.jb = or, this.ib = fr, this.Ia = !0;
				}
				get length() {
					return this.Ia || this.lb(), this.jb;
				}
				get rb() {
					return this.Ia || this.lb(), this.ib;
				}
			}
			if (globalThis.XMLHttpRequest) {
				ba || J("Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc");
				var er = new _e(), rr = void 0;
			} else rr = s, er = void 0;
			var tr = hh(i, o, _, $);
			er ? tr.v = er : rr && (tr.v = null, tr.url = rr), Object.defineProperties(tr, { M: { get: function() {
				return this.v.length;
			} } }), i = {};
			for (const [nr, ir] of Object.entries(tr.o)) i[nr] = (...or) => (ih(tr), ir(...or));
			return i.read = (nr, ir, or, ar, sr) => (ih(tr), j(nr, ir, or, ar, sr)), i.la = (nr, ir, or) => {
				ih(tr);
				var ar = Og(ir);
				if (!ar) throw new FS.h(48);
				return j(nr, x, ar, ir, or), {
					s: ar,
					ga: !0
				};
			}, tr.o = i, tr;
		}
	}, qg = (i, o) => {
		if (Ra) {
			if (i.charAt(0) === "/") try {
				return FS.lookupPath(i), i;
			} catch {
				return;
			}
			var s = (o?.jc || []).map((_) => {
				var $ = o?.fc;
				return _.startsWith("$ORIGIN") ? _.replace("$ORIGIN", wg($)) : _;
			});
			return zg(() => {
				var _ = We(512), $ = Cg(s.join(":")), j = Cg(i);
				return (_ = Ne(_, $, j, 512)) ? S(_) : void 0;
			});
		}
	};
	function rg(i, o = {
		global: !0,
		ra: !0
	}, s, _) {
		function $() {
			var rr = xa[i];
			if (rr) return o.I ? Promise.resolve(rr) : rr;
			if (_) {
				rr = E[_ + 28 >> 2];
				var tr = E[_ + 32 >> 2];
				if (rr && tr) return rr = x.slice(rr, rr + tr), o.I ? Promise.resolve(rr) : rr;
			}
			if (rr = qg(i, o.Ta)) return rr = FS.readFile(rr, { encoding: "binary" }), o.I ? Promise.resolve(rr) : rr;
			if (rr = ja(i), o.I) return tg(rr);
			if (!la) throw Error(`${rr}: file not found, and synchronous loading of external files is not available`);
			return la(rr);
		}
		function j() {
			var rr = Kf[i];
			return rr ? o.I ? Promise.resolve(rr) : rr : o.I ? $().then((tr) => sg(tr, o, i, s, _)) : sg($(), o, i, s, _);
		}
		function _e(rr) {
			er.global ? ye(rr) : s && Object.assign(s, rr), er.exports = rr;
		}
		var er = Wf[i];
		return er ? (o.global ? er.global || (er.global = !0, ye(er.exports)) : s && Object.assign(s, er.exports), o.ra && er.Ca !== Infinity && (er.Ca = Infinity), er.Ca++, _ && (Xf[_] = er), o.I ? Promise.resolve(!0) : !0) : (er = ef(i, _, "loading"), er.Ca = o.ra ? Infinity : 1, er.global = o.global, o.I ? j().then((rr) => (_e(rr), !0)) : (_e(j()), !0));
	}
	var pg = () => {
		var i, o;
		for ([i, o] of Object.entries(Qf)) if (o.value == -1) {
			var s = ng(i).Ua;
			if (s || o.required) if (typeof s == "function") o.value = gg(s, s.g);
			else if (typeof s == "number") o.value = s;
			else if (typeof s.value == "number") o.value = s;
			else throw Error(`bad export type for '${i}': ${typeof s} (${s})`);
			else o.value = 0;
		}
	}, ff = async () => {
		if (na.length) {
			wf("loadDylibs");
			for (var i of na) await rg(i, {
				I: !0,
				global: !0,
				ra: !0,
				Ab: !0
			});
			pg(), vf("loadDylibs");
		} else pg();
	}, Gf = !1, Ae = (i, o, s) => {
		function _() {
			var $ = i();
			if ($) {
				var j = {};
				s.tb.forEach((_e) => j[_e] = o[_e]), df(hg(j, $), !0);
			}
		}
		Af.push(_), Ra && _();
	}, Ba, cb = (i, o, s, _) => J(`Assertion failed: ${S(i)}, at: ` + [
		o ? S(o) : "unknown filename",
		s,
		_ ? S(_) : "unknown function"
	]);
	cb.g = "vppip";
	var db = (i, o) => Q(i)(o);
	db.g = "vpi";
	var jh = [], kh = 0, eb = (i) => {
		var o = new lh(i);
		return x[o.s + 12] == 0 && (x[o.s + 12] = 1, kh--), x[o.s + 13] = 0, jh.push(o), af(i);
	};
	eb.g = "pp";
	var mh = 0, gb = () => {
		M(0, 0);
		var i = jh.pop();
		Xe(i.ha), mh = 0;
	};
	gb.g = "v";
	class lh {
		constructor(o) {
			this.ha = o, this.s = o - 24;
		}
		init(o, s) {
			E[this.s + 16 >> 2] = 0, E[this.s + 4 >> 2] = o, E[this.s + 8 >> 2] = s;
		}
	}
	var mg = (i) => {
		var o = mh?.ha;
		if (!o) return Ue(0), 0;
		var s = new lh(o);
		E[s.s + 16 >> 2] = o;
		var _ = E[s.s + 4 >> 2];
		if (!_) return Ue(0), o;
		for (var $ of i) {
			if ($ === 0 || $ === _) break;
			if ($e($, _, s.s + 16)) return Ue($), o;
		}
		return Ue(_), o;
	}, hb = () => mg([]);
	hb.g = "p";
	var ib = (i) => mg([i]);
	ib.g = "pp";
	var jb = () => {
		var i = jh.pop();
		i || J("no exception to throw");
		var o = i.ha;
		throw x[i.s + 13] == 0 && (jh.push(i), x[i.s + 13] = 1, x[i.s + 12] = 0, kh++), Ye(o), mh = new ta(o), mh;
	};
	jb.g = "v";
	var kb = (i, o, s) => {
		throw new lh(i).init(o, s), Ye(i), mh = new ta(i), kh++, mh;
	};
	kb.g = "vppp";
	var lb = () => kh;
	lb.g = "i";
	function mb(...i) {
		return K.__lsan_ignore_object(...i);
	}
	mb.J = !0;
	function nh(i, o, s, _) {
		return t ? P(2, 1, i, o, s, _) : nb(i, o, s, _);
	}
	var nb = (i, o, s, _) => {
		if (!globalThis.SharedArrayBuffer) return 6;
		var $ = [];
		return t && $.length === 0 ? nh(i, o, s, _) : (i = {
			sc: s,
			Y: i,
			Fa: _,
			ub: $
		}, t ? (i.W = "spawnThread", postMessage(i, $), 0) : zf(i));
	};
	nb.g = "ipppp";
	var ob = (i) => {
		throw mh ||= new ta(i), mh;
	};
	ob.g = "vp";
	function oh(i, o, s) {
		if (o.charAt(0) === "/") return o;
		if (i = i === -100 ? FS.cwd() : U(i).path, o.length == 0) {
			if (!s) throw new FS.h(44);
			return i;
		}
		return i + "/" + o;
	}
	function ph(i, o) {
		E[i >> 2] = o.Fb, E[i + 4 >> 2] = o.mode, E[i + 8 >> 2] = o.bc, E[i + 12 >> 2] = o.uid, E[i + 16 >> 2] = o.Rb, E[i + 20 >> 2] = o.ta, F[i + 24 >> 3] = BigInt(o.size), C[i + 32 >> 2] = 4096, C[i + 36 >> 2] = o.Wa;
		var s = o.aa.getTime(), _ = o.P.getTime(), $ = o.O.getTime();
		return F[i + 40 >> 3] = BigInt(Math.floor(s / 1e3)), E[i + 48 >> 2] = s % 1e3 * 1e6, F[i + 56 >> 3] = BigInt(Math.floor(_ / 1e3)), E[i + 64 >> 2] = _ % 1e3 * 1e6, F[i + 72 >> 3] = BigInt(Math.floor($ / 1e3)), E[i + 80 >> 2] = $ % 1e3 * 1e6, F[i + 88 >> 3] = BigInt(o.Vb), 0;
	}
	var qh = void 0;
	function pb(i) {
		if (t) return P(3, 1, i);
		try {
			return bh(U(i)).ba;
		} catch (o) {
			if (typeof FS > "u" || o.name !== "ErrnoError") throw o;
			return -o.A;
		}
	}
	pb.g = "ii";
	function qb(i, o, s, _) {
		if (t) return P(4, 1, i, o, s, _);
		try {
			if (o = S(o), o = oh(i, o), s & -8) return -28;
			var $ = FS.lookupPath(o, { follow: !0 }).node;
			return $ ? (i = "", s & 4 && (i += "r"), s & 2 && (i += "w"), s & 1 && (i += "x"), i && Vg($, i) ? -2 : 0) : -44;
		} catch (j) {
			if (typeof FS > "u" || j.name !== "ErrnoError") throw j;
			return -j.A;
		}
	}
	qb.g = "iipii";
	var rh = () => {
		var i = C[+qh >> 2];
		return qh += 4, i;
	};
	function rb(i, o, s) {
		if (t) return P(5, 1, i, o, s);
		qh = s;
		try {
			var _ = U(i);
			switch (o) {
				case 0:
					var $ = rh();
					if (0 > $) break;
					for (; FS.streams[$];) $++;
					return bh(_, $).ba;
				case 1:
				case 2: return 0;
				case 3: return _.flags;
				case 4: return $ = rh(), _.flags |= $, 0;
				case 12: return $ = rh(), z[$ + 0 >> 1] = 2, 0;
				case 13:
				case 14: return 0;
			}
			return -28;
		} catch (j) {
			if (typeof FS > "u" || j.name !== "ErrnoError") throw j;
			return -j.A;
		}
	}
	rb.g = "iiip";
	function sb(i, o) {
		if (t) return P(6, 1, i, o);
		try {
			var s = U(i), _ = s.node, $ = s.o.T;
			return i = $ ? s : _, $ ??= _.m.T, $g($, 63), ph(o, $(i));
		} catch (j) {
			if (typeof FS > "u" || j.name !== "ErrnoError") throw j;
			return -j.A;
		}
	}
	sb.g = "iip";
	function tb(i, o) {
		if (t) return P(7, 1, i, o);
		o = -9007199254740992 > o || 9007199254740992 < o ? NaN : Number(o);
		try {
			return isNaN(o) ? -61 : (FS.ftruncate(i, o), 0);
		} catch (s) {
			if (typeof FS > "u" || s.name !== "ErrnoError") throw s;
			return -s.A;
		}
	}
	tb.g = "iij";
	function ub(i, o) {
		if (t) return P(8, 1, i, o);
		try {
			if (o === 0) return -28;
			var s = FS.cwd(), _ = Ag(s) + 1;
			return o < _ ? -68 : (Bg(s, y, i, o), _);
		} catch ($) {
			if (typeof FS > "u" || $.name !== "ErrnoError") throw $;
			return -$.A;
		}
	}
	ub.g = "ipp";
	function vb(i, o, s) {
		if (t) return P(9, 1, i, o, s);
		qh = s;
		try {
			var _ = U(i);
			switch (o) {
				case 21509: return _.C ? 0 : -59;
				case 21505:
					if (!_.C) return -59;
					if (_.C.fa.Wb) {
						i = [
							3,
							28,
							127,
							21,
							4,
							0,
							1,
							0,
							17,
							19,
							26,
							0,
							18,
							15,
							23,
							22,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0
						];
						var $ = rh();
						C[$ >> 2] = 25856, C[$ + 4 >> 2] = 5, C[$ + 8 >> 2] = 191, C[$ + 12 >> 2] = 35387;
						for (var j = 0; 32 > j; j++) x[$ + j + 17] = i[j] || 0;
					}
					return 0;
				case 21510:
				case 21511:
				case 21512: return _.C ? 0 : -59;
				case 21506:
				case 21507:
				case 21508:
					if (!_.C) return -59;
					if (_.C.fa.Xb) for ($ = rh(), i = [], j = 0; 32 > j; j++) i.push(x[$ + j + 17]);
					return 0;
				case 21519: return _.C ? ($ = rh(), C[$ >> 2] = 0) : -59;
				case 21520: return _.C ? -28 : -59;
				case 21537:
				case 21531: return $ = rh(), FS.Ka(_, o, $);
				case 21523: return _.C ? (_.C.fa.Yb && (j = [24, 80], $ = rh(), z[$ >> 1] = j[0], z[$ + 2 >> 1] = j[1]), 0) : -59;
				case 21524: return _.C ? 0 : -59;
				case 21515: return _.C ? 0 : -59;
				default: return -28;
			}
		} catch (_e) {
			if (typeof FS > "u" || _e.name !== "ErrnoError") throw _e;
			return -_e.A;
		}
	}
	vb.g = "iiip";
	function wb(i, o) {
		if (t) return P(10, 1, i, o);
		try {
			return i = S(i), ph(o, FS.lstat(i));
		} catch (s) {
			if (typeof FS > "u" || s.name !== "ErrnoError") throw s;
			return -s.A;
		}
	}
	wb.g = "ipp";
	function xb(i, o, s, _) {
		if (t) return P(11, 1, i, o, s, _);
		try {
			o = S(o);
			var $ = _ & 256;
			return o = oh(i, o, _ & 4096), ph(s, $ ? FS.lstat(o) : FS.stat(o));
		} catch (j) {
			if (typeof FS > "u" || j.name !== "ErrnoError") throw j;
			return -j.A;
		}
	}
	xb.g = "iippi";
	function yb(i, o, s, _) {
		if (t) return P(12, 1, i, o, s, _);
		qh = _;
		try {
			o = S(o), o = oh(i, o);
			var $ = _ ? rh() : 0;
			return FS.open(o, s, $).ba;
		} catch (j) {
			if (typeof FS > "u" || j.name !== "ErrnoError") throw j;
			return -j.A;
		}
	}
	yb.g = "iipip";
	function zb(i, o, s) {
		if (t) return P(13, 2, i, o, s);
		try {
			let fr = function(cr) {
				_e || (_e = !0, j.forEach((ur) => ur()), _(cr));
			}, lr = function(cr, ur) {
				return (hr) => {
					_e || (hr &= z[ur + 4 >> 1] | 24, z[ur + 6 >> 1] = hr, fr(1));
				};
			};
			const sr = Ff;
			var _, $ = new Promise((cr) => {
				_ = cr;
			}), j = [], _e = !1;
			if (sr && 0 < s) {
				var er = setTimeout(() => {
					fr(0);
				}, s);
				j.push(() => clearTimeout(er));
			}
			for (var rr = 0, tr = 0; tr < o; tr++) {
				var nr = i + 8 * tr, ir = z[nr + 4 >> 1], or = 32, ar = FS.eb(C[nr >> 2]);
				ar && (ar.o.mb ? or = sr && s ? ar.o.mb(ar, s, lr(ar, nr)) : ar.o.mb(ar, -1) : or = 5), (or &= ir | 24) && rr++, z[nr + 6 >> 1] = or;
			}
			return sr ? (!rr && s || fr(rr), $) : rr;
		} catch (sr) {
			if (typeof FS > "u" || sr.name !== "ErrnoError") throw sr;
			return -sr.A;
		}
	}
	zb.g = "ipii";
	function Ab(i) {
		if (t) return P(14, 1, i);
		try {
			return i = S(i), FS.rmdir(i), 0;
		} catch (o) {
			if (typeof FS > "u" || o.name !== "ErrnoError") throw o;
			return -o.A;
		}
	}
	Ab.g = "ip";
	function Bb(i, o) {
		if (t) return P(15, 1, i, o);
		try {
			return i = S(i), ph(o, FS.stat(i));
		} catch (s) {
			if (typeof FS > "u" || s.name !== "ErrnoError") throw s;
			return -s.A;
		}
	}
	Bb.g = "ipp";
	function Cb(i, o, s) {
		if (t) return P(16, 1, i, o, s);
		try {
			if (o = S(o), o = oh(i, o), s) if (s === 512) FS.rmdir(o);
			else return -28;
			else FS.unlink(o);
			return 0;
		} catch (_) {
			if (typeof FS > "u" || _.name !== "ErrnoError") throw _;
			return -_.A;
		}
	}
	Cb.g = "iipi";
	var Db = () => J("");
	Db.g = "v";
	var sh = (i) => {
		var o = O();
		i = Cg(i), Ie(i, 0), N(o);
	}, th = (i, o) => {
		var s = S(i + 36), _ = C[i + 4 >> 2];
		s = vg(s);
		var $ = !!(_ & 256), j = $ ? null : {};
		if (_ = {
			global: $,
			ra: !!(_ & 4096),
			I: o.I
		}, o.I) return rg(s, _, j, i);
		try {
			return rg(s, _, j, i);
		} catch (_e) {
			return sh(`could not load dynamic lib: ${s}
${_e}`), 0;
		}
	}, Gb = (i) => th(i, { I: !1 });
	Gb.g = "pp";
	var Hb = (i, o) => (i = Xf[i].exports, o = Object.keys(i)[o], o = i[o], gg(o, o.g));
	Hb.g = "ppi";
	var Ib = (i, o, s) => {
		o = S(o);
		var _ = Xf[i];
		return i = Object.keys(_.exports).indexOf(o), i == -1 || _.exports[o].J ? (sh(`Tried to lookup unknown symbol "${o}" in dynamic lib: ${_.name}`), 0) : (o = _.exports[o], typeof o == "function" && ((_ = bg(o)) ? o = _ : (o = gg(o, o.g), E[s >> 2] = i)), o);
	};
	Ib.g = "pppp";
	var uh = {}, vh = (i) => {
		for (; i.length;) {
			var o = i.pop();
			i.pop()(o);
		}
	};
	function wh(i) {
		return this.B(E[i >> 2]);
	}
	var xh = {}, yh = {}, zh = {}, Ah = class extends Error {
		constructor(i) {
			super(i), this.name = "InternalError";
		}
	}, Bh = (i, o, s) => {
		function _(er) {
			if (er = s(er), er.length !== i.length) throw new Ah("Mismatched type converter count");
			for (var rr = 0; rr < i.length; ++rr) V(i[rr], er[rr]);
		}
		i.forEach((er) => zh[er] = o);
		var $ = Array(o.length), j = [], _e = 0;
		for (let [er, rr] of o.entries()) yh.hasOwnProperty(rr) ? $[er] = yh[rr] : (j.push(rr), xh.hasOwnProperty(rr) || (xh[rr] = []), xh[rr].push(() => {
			$[er] = yh[rr], ++_e, _e === j.length && _($);
		}));
		j.length === 0 && _($);
	}, Jb = (i) => {
		var o = uh[i];
		delete uh[i];
		var s = o.Sa, _ = o.Z, $ = o.cb, j = $.map((_e) => _e.Qb).concat($.map((_e) => _e.oc));
		Bh([i], j, (_e) => {
			var er = {}, rr, tr;
			for ([rr, tr] of $.entries()) {
				const nr = _e[rr], ir = tr.oa, or = tr.Pb, ar = _e[rr + $.length], sr = tr.nc, fr = tr.pc;
				er[tr.Kb] = {
					read: (lr) => nr.B(ir(or, lr)),
					write: (lr, cr) => {
						var ur = [];
						sr(fr, lr, ar.F(ur, cr)), vh(ur);
					},
					optional: nr.optional
				};
			}
			return [{
				name: o.name,
				B: (nr) => {
					var ir = {}, or;
					for (or in er) ir[or] = er[or].read(nr);
					return _(nr), ir;
				},
				F: (nr, ir) => {
					for (var or in er) if (!(or in ir || er[or].optional)) throw new TypeError(`Missing field: "${or}"`);
					var ar = s();
					for (or in er) er[or].write(ar, ir[or]);
					return nr !== null && nr.push(_, ar), ar;
				},
				L: wh,
				H: _
			}];
		});
	};
	Jb.g = "vp";
	var W = (i) => {
		for (var o = "";;) {
			var s = y[i++];
			if (!s) return o;
			o += String.fromCharCode(s);
		}
	}, X = class extends Error {
		constructor(i) {
			super(i), this.name = "BindingError";
		}
	}, Ch = (i) => {
		throw new X(i);
	};
	function Dh(i, o, s = {}) {
		var _ = o.name;
		if (!i) throw new X(`type "${_}" must have a positive integer typeid pointer`);
		if (yh.hasOwnProperty(i)) {
			if (s.Ub) return;
			throw new X(`Cannot register type '${_}' twice`);
		}
		yh[i] = o, delete zh[i], xh.hasOwnProperty(i) && (o = xh[i], delete xh[i], o.forEach(($) => $()));
	}
	function V(i, o, s = {}) {
		return Dh(i, o, s);
	}
	var Kb = (i, o, s, _, $) => {
		if (o = W(o), _) e: switch (s) {
			case 4:
				_ = Oa;
				break e;
			case 8:
				_ = Pa;
				break e;
			default: throw new TypeError(`invalid float width (${s}): ${o}`);
		}
		else e: switch (s) {
			case 1:
				_ = $ ? x : y;
				break e;
			case 2:
				_ = $ ? z : B;
				break e;
			case 4:
				_ = $ ? C : E;
				break e;
			case 8:
				_ = $ ? F : Qa;
				break e;
			default: throw new TypeError(`invalid integer width (${s}): ${o}`);
		}
		var j = _, _e = Math.log2(s);
		V(i, {
			name: o,
			B: (er) => {
				var rr = er + Math.max(4, s) >> _e;
				return rr = Array.from(j.subarray(rr, rr + E[er >> 2])), L(er), rr;
			},
			F: (er, rr) => {
				if (typeof rr == "number" && (rr = [rr]), !Array.isArray(rr)) throw new X(`Cannot pass non-array to C++ vector type ${o}`);
				rr = Array.prototype.concat.apply([], rr);
				var tr = rr.length, nr = Math.max(4, s), ir = Ce(nr + tr * s);
				return nr = ir + nr >> _e, E[ir >> 2] = tr, j.set(rr, nr), er !== null && er.push(L, ir), ir;
			},
			L: wh,
			H(er) {
				L(er);
			}
		});
	};
	Kb.g = "vpppii";
	var Eh = (i, o, s) => {
		switch (o) {
			case 1: return s ? (_) => x[_] : (_) => y[_];
			case 2: return s ? (_) => z[_ >> 1] : (_) => B[_ >> 1];
			case 4: return s ? (_) => C[_ >> 2] : (_) => E[_ >> 2];
			case 8: return s ? (_) => F[_ >> 3] : (_) => Qa[_ >> 3];
			default: throw new TypeError(`invalid integer width (${o}): ${i}`);
		}
	}, Lb = (i, o, s, _, $) => {
		o = W(o), _ = _ === 0n;
		let j = (_e) => _e;
		if (_) {
			const _e = 8 * s;
			j = (er) => BigInt.asUintN(_e, er), $ = j($);
		}
		V(i, {
			name: o,
			B: j,
			F: (_e, er) => (typeof er == "number" && (er = BigInt(er)), er),
			L: Eh(o, s, !_),
			H: null
		});
	};
	Lb.g = "vpppjj";
	var Mb = (i, o, s, _) => {
		o = W(o), V(i, {
			name: o,
			B: function($) {
				return !!$;
			},
			F: function($, j) {
				return j ? s : _;
			},
			L: function($) {
				return this.B(y[$]);
			},
			H: null
		});
	};
	Mb.g = "vppii";
	var Fh = (i) => {
		throw new X(i.l.D.u.name + " instance already deleted");
	}, Gh = !1, Hh = !1, Ih = () => {}, Jh = (i) => Gh ? (Jh = (o) => o.deleteLater(), Jh(i)) : globalThis.FinalizationRegistry ? (Hh = new FinalizationRegistry((o) => {
		o = o.l, --o.count.value, o.count.value === 0 && (o.K ? o.S.Z(o.K) : o.D.u.Z(o.s));
	}), Jh = (o) => {
		var s = o.l;
		return s.K && Hh.register(o, { l: s }, o), o;
	}, Ih = (o) => {
		Hh.unregister(o);
	}, Jh(i)) : (Jh = (o) => o, i), Kh = [], Lh = () => {
		for (; Kh.length;) {
			var i = Kh.pop();
			i.l.ja = !1, i.delete();
		}
	}, Mh;
	function Nh() {}
	var Oh = {}, Ph = (i, o, s) => {
		if (i[o].G === void 0) {
			var _ = i[o];
			i[o] = function(...$) {
				if (!i[o].G.hasOwnProperty($.length)) throw new X(`Function '${s}' called with an invalid number of arguments (${$.length}) - expects one of (${i[o].G})!`);
				return i[o].G[$.length].apply(this, $);
			}, i[o].G = [], i[o].G[_.$] = _;
		}
	}, Qh = (i, o, s) => {
		if (n.hasOwnProperty(i)) {
			if (s === void 0 || n[i].G !== void 0 && n[i].G[s] !== void 0) throw new X(`Cannot register public name '${i}' twice`);
			if (Ph(n, i, i), n[i].G.hasOwnProperty(s)) throw new X(`Cannot register multiple overloads of a function with the same number of arguments (${s})!`);
			n[i].G[s] = o;
		} else n[i] = o, n[i].$ = s;
	}, Rh = (i) => {
		i = i.replace(/[^a-zA-Z0-9_]/g, "$");
		var o = i.charCodeAt(0);
		return 48 <= o && 57 >= o ? `_${i}` : i;
	};
	function Sh(i, o, s, _, $, j, _e, er) {
		this.name = i, this.constructor = o, this.ca = s, this.Z = _, this.N = $, this.Mb = j, this.wa = _e, this.Gb = er, this.lc = [];
	}
	var Th = (i, o, s) => {
		for (; o !== s;) {
			if (!o.wa) throw new X(`Expected null or instance of ${s.name}, got an instance of ${o.name}`);
			i = o.wa(i), o = o.N;
		}
		return i;
	}, Uh = (i) => {
		if (i === null) return "null";
		var o = typeof i;
		return o === "object" || o === "array" || o === "function" ? i.toString() : "" + i;
	};
	function Vh(i, o) {
		if (o === null) {
			if (this.La) throw new X(`null is not a valid ${this.name}`);
			return 0;
		}
		if (!o.l) throw new X(`Cannot pass "${Uh(o)}" as a ${this.name}`);
		if (!o.l.s) throw new X(`Cannot pass deleted object as a pointer of type ${this.name}`);
		return Th(o.l.s, o.l.D.u, this.u);
	}
	function Wh(i, o) {
		if (o === null) {
			if (this.La) throw new X(`null is not a valid ${this.name}`);
			if (this.Ba) {
				var s = this.Sa();
				return i !== null && i.push(this.Z, s), s;
			}
			return 0;
		}
		if (!o || !o.l) throw new X(`Cannot pass "${Uh(o)}" as a ${this.name}`);
		if (!o.l.s) throw new X(`Cannot pass deleted object as a pointer of type ${this.name}`);
		if (!this.Aa && o.l.D.Aa) throw new X(`Cannot convert argument of type ${o.l.S ? o.l.S.name : o.l.D.name} to parameter type ${this.name}`);
		if (s = Th(o.l.s, o.l.D.u, this.u), this.Ba) {
			if (o.l.K === void 0) throw new X("Passing raw pointer to smart pointer is illegal");
			switch (this.rc) {
				case 0:
					if (o.l.S === this) s = o.l.K;
					else throw new X(`Cannot convert argument of type ${o.l.S ? o.l.S.name : o.l.D.name} to parameter type ${this.name}`);
					break;
				case 1:
					s = o.l.K;
					break;
				case 2:
					if (o.l.S === this) s = o.l.K;
					else {
						var _ = o.clone();
						s = this.mc(s, Xh(() => _.delete())), i !== null && i.push(this.Z, s);
					}
					break;
				default: throw new X("Unsupported sharing policy");
			}
		}
		return s;
	}
	function Yh(i, o) {
		if (o === null) {
			if (this.La) throw new X(`null is not a valid ${this.name}`);
			return 0;
		}
		if (!o.l) throw new X(`Cannot pass "${Uh(o)}" as a ${this.name}`);
		if (!o.l.s) throw new X(`Cannot pass deleted object as a pointer of type ${this.name}`);
		if (o.l.D.Aa) throw new X(`Cannot convert argument of type ${o.l.D.name} to parameter type ${this.name}`);
		return Th(o.l.s, o.l.D.u, this.u);
	}
	var Zh = (i, o, s) => o === s ? i : s.N === void 0 ? null : (i = Zh(i, o, s.N), i === null ? null : s.Gb(i)), $h = {}, ai = (i, o) => {
		if (o === void 0) throw new X("ptr should not be undefined");
		for (; i.N;) o = i.wa(o), i = i.N;
		return $h[o];
	}, bi = (i, o) => {
		if (!o.D || !o.s) throw new Ah("makeClassHandle requires ptr and ptrType");
		if (!!o.S != !!o.K) throw new Ah("Both smartPtrType and smartPtr must be specified");
		return o.count = { value: 1 }, Jh(Object.create(i, { l: {
			value: o,
			writable: !0
		} }));
	};
	function ci(i, o, s, _, $, j, _e, er, rr, tr, nr) {
		this.name = i, this.u = o, this.La = s, this.Aa = _, this.Ba = $, this.kc = j, this.rc = _e, this.ob = er, this.Sa = rr, this.mc = tr, this.Z = nr, $ || o.N !== void 0 ? this.F = Wh : (this.F = _ ? Vh : Yh, this.H = null);
	}
	var di = (i, o, s) => {
		if (!n.hasOwnProperty(i)) throw new Ah("Replacing nonexistent public symbol");
		n[i].G !== void 0 && s !== void 0 ? n[i].G[s] = o : (n[i] = o, n[i].$ = s);
	}, Y = (i, o) => {
		i = W(i);
		var s = Q(o);
		if (typeof s != "function") throw new X(`unknown function pointer with signature ${i}: ${o}`);
		return s;
	};
	class ei extends Error {}
	var fi = (i) => {
		i = Fe(i);
		var o = W(i);
		return L(i), o;
	}, gi = (i, o) => {
		function s(j) {
			$[j] || yh[j] || (zh[j] ? zh[j].forEach(s) : (_.push(j), $[j] = !0));
		}
		var _ = [], $ = {};
		throw o.forEach(s), new ei(`${i}: ` + _.map(fi).join([", "]));
	}, Nb = (i, o, s, _, $, j, _e, er, rr, tr, nr, ir, or) => {
		nr = W(nr), j = Y($, j), er &&= Y(_e, er), tr &&= Y(rr, tr), or = Y(ir, or);
		var ar = Rh(nr);
		Qh(ar, function() {
			gi(`Cannot construct ${nr} due to unbound types`, [_]);
		}), Bh([
			i,
			o,
			s
		], _ ? [_] : [], (sr) => {
			if (sr = sr[0], _) var fr = sr.u, lr = fr.ca;
			else lr = Nh.prototype;
			sr = jg(nr, function(...vr) {
				if (Object.getPrototypeOf(this) !== cr) throw new X(`Use 'new' to construct ${nr}`);
				if (ur.ia === void 0) throw new X(`${nr} has no accessible constructor`);
				var pr = ur.ia[vr.length];
				if (pr === void 0) throw new X(`Tried to invoke ctor of ${nr} with invalid number of parameters (${vr.length}) - expected (${Object.keys(ur.ia).toString()}) parameters instead!`);
				return pr.apply(this, vr);
			});
			var cr = Object.create(lr, { constructor: { value: sr } });
			sr.prototype = cr;
			var ur = new Sh(nr, sr, cr, or, fr, j, er, tr);
			if (ur.N) {
				var hr;
				(hr = ur.N).xa ?? (hr.xa = []), ur.N.xa.push(ur);
			}
			return fr = new ci(nr, ur, !0, !1, !1), hr = new ci(nr + "*", ur, !1, !1, !1), lr = new ci(nr + " const*", ur, !1, !0, !1), Oh[i] = {
				pointerType: hr,
				Eb: lr
			}, di(ar, sr), [
				fr,
				hr,
				lr
			];
		});
	};
	Nb.g = "vppppppppppppp";
	function hi(i) {
		for (var o = 1; o < i.length; ++o) if (i[o] !== null && i[o].H === void 0) return !0;
		return !1;
	}
	function ii(i, o, s, _, $, j) {
		var _e = o.length;
		if (2 > _e) throw new X("argTypes array size mismatch! Must at least get return value and 'this' types!");
		var er = o[1] !== null && s !== null, rr = hi(o);
		s = !o[0].hb;
		var tr = o[0], nr = o[1];
		for (_ = [
			i,
			Ch,
			_,
			$,
			vh,
			tr.B.bind(tr),
			nr?.F.bind(nr)
		], $ = 2; $ < _e; ++$) tr = o[$], _.push(tr.F.bind(tr));
		if (!rr) for ($ = er ? 1 : 2; $ < o.length; ++$) o[$].H !== null && _.push(o[$].H);
		for (rr = hi(o), $ = o.length - 2, nr = [], tr = ["fn"], er && tr.push("thisWired"), _e = 0; _e < $; ++_e) nr.push(`arg${_e}`), tr.push(`arg${_e}Wired`);
		nr = nr.join(","), tr = tr.join(","), nr = `return function (${nr}) {
`, rr && (nr += `var destructors = [];
`);
		var ir = rr ? "destructors" : "null", or = "humanName throwBindingError invoker fn runDestructors fromRetWire toClassParamWire".split(" ");
		for (er && (nr += `var thisWired = toClassParamWire(${ir}, this);
`), _e = 0; _e < $; ++_e) {
			var ar = `toArg${_e}Wire`;
			nr += `var arg${_e}Wired = ${ar}(${ir}, arg${_e});
`, or.push(ar);
		}
		if (nr += (s || j ? "var rv = " : "") + `invoker(${tr});
`, rr) nr += `runDestructors(destructors);
`;
		else for (_e = er ? 1 : 2; _e < o.length; ++_e) j = _e === 1 ? "thisWired" : "arg" + (_e - 2) + "Wired", o[_e].H !== null && (nr += `${j}_dtor(${j});
`, or.push(`${j}_dtor`));
		return s && (nr += `var ret = fromRetWire(rv);
return ret;
`), o = new Function(or, nr + `}
`)(..._), jg(i, o);
	}
	var ji = (i, o) => {
		for (var s = [], _ = 0; _ < i; _++) s.push(E[o + 4 * _ >> 2]);
		return s;
	}, ni = (i) => {
		i = i.trim();
		const o = i.indexOf("(");
		return o === -1 ? i : i.slice(0, o);
	}, Ob = (i, o, s, _, $, j, _e, er) => {
		var rr = ji(s, _);
		o = W(o), o = ni(o), j = Y($, j), Bh([], [i], (tr) => {
			function nr() {
				gi(`Cannot call ${ir} due to unbound types`, rr);
			}
			tr = tr[0];
			var ir = `${tr.name}.${o}`;
			o.startsWith("@@") && (o = Symbol[o.substring(2)]);
			var or = tr.u.constructor;
			return or[o] === void 0 ? (nr.$ = s - 1, or[o] = nr) : (Ph(or, o, ir), or[o].G[s - 1] = nr), Bh([], rr, (ar) => {
				if (ar = ii(ir, [ar[0], null].concat(ar.slice(1)), null, j, _e, er), or[o].G === void 0 ? (ar.$ = s - 1, or[o] = ar) : or[o].G[s - 1] = ar, tr.u.xa) for (const sr of tr.u.xa) sr.constructor.hasOwnProperty(o) || (sr.constructor[o] = ar);
				return [];
			}), [];
		});
	};
	Ob.g = "vppippppii";
	var Pb = (i, o, s, _, $, j) => {
		var _e = ji(o, s);
		$ = Y(_, $), Bh([], [i], (er) => {
			er = er[0];
			var rr = `constructor ${er.name}`;
			if (er.u.ia === void 0 && (er.u.ia = []), er.u.ia[o - 1] !== void 0) throw new X(`Cannot register multiple constructors with identical number of parameters (${o - 1}) for class '${er.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`);
			return er.u.ia[o - 1] = () => {
				gi(`Cannot construct ${er.name} due to unbound types`, _e);
			}, Bh([], _e, (tr) => (tr.splice(1, 0, null), er.u.ia[o - 1] = ii(rr, tr, null, $, j), [])), [];
		});
	};
	Pb.g = "vpipppp";
	var Qb = (i, o, s, _, $, j, _e, er, rr) => {
		var tr = ji(s, _);
		o = W(o), o = ni(o), j = Y($, j), Bh([], [i], (nr) => {
			function ir() {
				gi(`Cannot call ${or} due to unbound types`, tr);
			}
			nr = nr[0];
			var or = `${nr.name}.${o}`;
			o.startsWith("@@") && (o = Symbol[o.substring(2)]), er && nr.u.lc.push(o);
			var ar = nr.u.ca, sr = ar[o];
			return sr === void 0 || sr.G === void 0 && sr.className !== nr.name && sr.$ === s - 2 ? (ir.$ = s - 2, ir.className = nr.name, ar[o] = ir) : (Ph(ar, o, or), ar[o].G[s - 2] = ir), Bh([], tr, (fr) => (fr = ii(or, fr, nr, j, _e, rr), ar[o].G === void 0 ? (fr.$ = s - 2, ar[o] = fr) : ar[o].G[s - 2] = fr, [])), [];
		});
	};
	Qb.g = "vppippppiii";
	var oi = (i, o, s) => {
		if (!(i instanceof Object)) throw new X(`${s} with invalid "this": ${i}`);
		if (!(i instanceof o.u.constructor)) throw new X(`${s} incompatible with "this" of type ${i.constructor.name}`);
		if (!i.l.s) throw new X(`cannot call emscripten binding method ${s} on deleted object`);
		return Th(i.l.s, i.l.D.u, o.u);
	}, Rb = (i, o, s, _, $, j, _e, er, rr, tr) => {
		o = W(o), $ = Y(_, $), Bh([], [i], (nr) => {
			nr = nr[0];
			var ir = `${nr.name}.${o}`, or = {
				get() {
					gi(`Cannot access ${ir} due to unbound types`, [s, _e]);
				},
				enumerable: !0,
				configurable: !0
			};
			return or.set = rr ? () => gi(`Cannot access ${ir} due to unbound types`, [s, _e]) : () => {
				throw new X(ir + " is a read-only property");
			}, Object.defineProperty(nr.u.ca, o, or), Bh([], rr ? [s, _e] : [s], (ar) => {
				var sr = ar[0], fr = {
					get() {
						var cr = oi(this, nr, ir + " getter");
						return sr.B($(j, cr));
					},
					enumerable: !0
				};
				if (rr) {
					rr = Y(er, rr);
					var lr = ar[1];
					fr.set = function(cr) {
						var ur = oi(this, nr, ir + " setter"), hr = [];
						rr(tr, ur, lr.F(hr, cr)), vh(hr);
					};
				}
				return Object.defineProperty(nr.u.ca, o, fr), [];
			}), [];
		});
	};
	Rb.g = "vpppppppppp";
	var pi = [], qi = [
		0,
		1,
		,
		1,
		null,
		1,
		!0,
		1,
		!1,
		1
	], sc = (i) => {
		9 < i && --qi[i + 1] === 0 && (qi[i] = void 0, pi.push(i));
	};
	sc.g = "vp";
	var Z = (i) => {
		if (!i) throw new X(`Cannot use deleted val. handle = ${i}`);
		return qi[i];
	}, Xh = (i) => {
		switch (i) {
			case void 0: return 2;
			case null: return 4;
			case !0: return 6;
			case !1: return 8;
			default:
				const o = pi.pop() || qi.length;
				return qi[o] = i, qi[o + 1] = 1, o;
		}
	}, ri = {
		name: "emscripten::val",
		B: (i) => {
			var o = Z(i);
			return sc(i), o;
		},
		F: (i, o) => Xh(o),
		L: wh,
		H: null
	}, Sb = (i) => V(i, ri);
	Sb.g = "vp";
	var si = (i, o, s) => {
		switch (o) {
			case 1: return s ? function(_) {
				return this.B(x[_]);
			} : function(_) {
				return this.B(y[_]);
			};
			case 2: return s ? function(_) {
				return this.B(z[_ >> 1]);
			} : function(_) {
				return this.B(B[_ >> 1]);
			};
			case 4: return s ? function(_) {
				return this.B(C[_ >> 2]);
			} : function(_) {
				return this.B(E[_ >> 2]);
			};
			default: throw new TypeError(`invalid integer width (${o}): ${i}`);
		}
	}, Tb = (i, o, s, _, $) => {
		switch (o = W(o), $ = $ === 0 ? "object" : $ === 1 ? "number" : "string", $) {
			case "object":
				let _e = function() {};
				_e.values = {}, V(i, {
					name: o,
					constructor: _e,
					valueType: $,
					B: function(er) {
						return this.constructor.values[er];
					},
					F: (er, rr) => rr.value,
					L: si(o, s, _),
					H: null
				}), Qh(o, _e);
				break;
			case "number":
				var j = {};
				V(i, {
					name: o,
					Ma: j,
					valueType: $,
					B: (er) => er,
					F: (er, rr) => rr,
					L: si(o, s, _),
					H: null
				}), Qh(o, j), delete n[o].$;
				break;
			case "string": j = {}, V(i, {
				name: o,
				vb: {},
				pb: {},
				Ma: j,
				valueType: $,
				B: function(er) {
					return this.pb[er];
				},
				F: function(er, rr) {
					return this.vb[rr];
				},
				L: si(o, s, _),
				H: null
			}), Qh(o, j), delete n[o].$;
		}
	};
	Tb.g = "vpppii";
	var ti = (i, o) => {
		var s = yh[i];
		if (s === void 0) throw i = `${o} has unknown type ${fi(i)}`, new X(i);
		return s;
	}, Ub = (i, o, s) => {
		var _ = ti(i, "enum");
		switch (o = W(o), _.valueType) {
			case "object":
				i = _.constructor, _ = Object.create(_.constructor.prototype, {
					value: { value: s },
					constructor: { value: jg(`${_.name}_${o}`, function() {}) }
				}), i.values[s] = _, i[o] = _;
				break;
			case "number":
				_.Ma[o] = s;
				break;
			case "string": _.vb[o] = s, _.pb[s] = o, _.Ma[o] = o;
		}
	};
	Ub.g = "vppi";
	var ui = (i, o) => {
		switch (o) {
			case 4: return function(s) {
				return this.B(Oa[s >> 2]);
			};
			case 8: return function(s) {
				return this.B(Pa[s >> 3]);
			};
			default: throw new TypeError(`invalid float width (${o}): ${i}`);
		}
	}, Vb = (i, o, s) => {
		o = W(o), V(i, {
			name: o,
			B: (_) => _,
			F: (_, $) => $,
			L: ui(o, s),
			H: null
		});
	};
	Vb.g = "vppp";
	var Wb = (i, o, s, _, $, j, _e) => {
		var er = ji(o, s);
		i = W(i), i = ni(i), $ = Y(_, $), Qh(i, function() {
			gi(`Cannot call ${i} due to unbound types`, er);
		}, o - 1), Bh([], er, (rr) => (di(i, ii(i, [rr[0], null].concat(rr.slice(1)), null, $, j, _e), o - 1), []));
	};
	Wb.g = "vpippppii";
	var Xb = (i, o, s, _, $) => {
		o = W(o);
		let j = (er) => er;
		if (_ === 0) {
			var _e = 32 - 8 * s;
			j = (er) => er << _e >>> _e, $ = j($);
		}
		V(i, {
			name: o,
			B: j,
			F: (er, rr) => rr,
			L: Eh(o, s, _ !== 0),
			H: null
		});
	};
	Xb.g = "vpppii";
	var vi = (i, o, s) => {
		const _ = ($, j) => {
			let _e = 0;
			return {
				next() {
					if (_e >= $) return { done: !0 };
					const er = _e;
					return _e++, {
						value: j(er),
						done: !1
					};
				},
				[Symbol.iterator]() {
					return this;
				}
			};
		};
		i[Symbol.iterator] || (i[Symbol.iterator] = function() {
			const $ = this[o]();
			return _($, (j) => this[s](j));
		});
	}, Yb = (i, o, s, _) => {
		s = W(s), _ = W(_), Bh([], [i, o], ($) => (vi($[0].u.ca, s, _), []));
	};
	Yb.g = "vpppp";
	var Zb = (i, o, s) => {
		function _(j) {
			return new $(x.buffer, E[j + 4 >> 2], E[j >> 2]);
		}
		var $ = [
			Int8Array,
			Uint8Array,
			Int16Array,
			Uint16Array,
			Int32Array,
			Uint32Array,
			Float32Array,
			Float64Array,
			BigInt64Array,
			BigUint64Array
		][o];
		s = W(s), V(i, {
			name: s,
			B: _,
			L: _
		}, { Ub: !0 });
	};
	Zb.g = "vpip";
	var wi = Object.assign({ optional: !0 }, ri), $b = (i) => {
		V(i, wi);
	};
	$b.g = "vpp";
	var ac = (i, o) => {
		o = W(o), V(i, {
			name: o,
			B(s) {
				var _ = S(s + 4, E[s >> 2], !0);
				return L(s), _;
			},
			F(s, _) {
				_ instanceof ArrayBuffer && (_ = new Uint8Array(_));
				var $ = typeof _ == "string";
				if (!($ || ArrayBuffer.isView(_) && _.BYTES_PER_ELEMENT == 1)) throw new X("Cannot pass non-string to std::string");
				var j = $ ? Ag(_) : _.length, _e = Ce(4 + j + 1), er = _e + 4;
				return E[_e >> 2] = j, $ ? Bg(_, y, er, j + 1) : y.set(_, er), s !== null && s.push(L, _e), _e;
			},
			L: wh,
			H(s) {
				L(s);
			}
		});
	};
	ac.g = "vpp";
	var xi = new TextDecoder("utf-16le"), yi = (i, o, s) => (i >>= 1, xi.decode(B.slice(i, Tf(B, i, o / 2, s)))), zi = (i, o, s) => {
		if (s ??= 2147483647, 2 > s) return 0;
		s -= 2;
		var _ = o;
		s = s < 2 * i.length ? s / 2 : i.length;
		for (var $ = 0; $ < s; ++$) z[o >> 1] = i.charCodeAt($), o += 2;
		return z[o >> 1] = 0, o - _;
	}, Ai = (i) => 2 * i.length, Bi = (i, o, s) => {
		var _ = "";
		i >>= 2;
		for (var $ = 0; !($ >= o / 4); $++) {
			var j = E[i + $];
			if (!j && !s) break;
			_ += String.fromCodePoint(j);
		}
		return _;
	}, Ci = (i, o, s) => {
		if (s ??= 2147483647, 4 > s) return 0;
		var _ = o;
		s = _ + s - 4;
		for (var $ = 0; $ < i.length; ++$) {
			var j = i.codePointAt($);
			if (65535 < j && $++, C[o >> 2] = j, o += 4, o + 4 > s) break;
		}
		return C[o >> 2] = 0, o - _;
	}, Di = (i) => {
		for (var o = 0, s = 0; s < i.length; ++s) 65535 < i.codePointAt(s) && s++, o += 4;
		return o;
	}, bc = (i, o, s) => {
		if (s = W(s), o === 2) var _ = yi, $ = zi, j = Ai;
		else _ = Bi, $ = Ci, j = Di;
		V(i, {
			name: s,
			B: (_e) => {
				var er = _(_e + 4, E[_e >> 2] * o, !0);
				return L(_e), er;
			},
			F: (_e, er) => {
				if (typeof er != "string") throw new X(`Cannot pass non-string to C++ string type ${s}`);
				var rr = j(er), tr = Ce(4 + rr + o);
				return E[tr >> 2] = rr / o, $(er, tr + 4, rr + o), _e !== null && _e.push(L, tr), tr;
			},
			L: wh,
			H(_e) {
				L(_e);
			}
		});
	};
	bc.g = "vppp";
	var cc = (i, o, s, _, $, j) => {
		uh[i] = {
			name: W(o),
			Sa: Y(s, _),
			Z: Y($, j),
			cb: []
		};
	};
	cc.g = "vpppppp";
	var dc = (i, o, s, _, $, j, _e, er, rr, tr) => {
		uh[i].cb.push({
			Kb: W(o),
			Qb: s,
			oa: Y(_, $),
			Pb: j,
			oc: _e,
			nc: Y(er, rr),
			pc: tr
		});
	};
	dc.g = "vpppppppppp";
	var ec = (i, o) => {
		o = W(o), V(i, {
			hb: !0,
			name: o,
			B: () => {},
			F: () => {}
		});
	};
	ec.g = "vpp";
	var fc = (i, o, s, _) => {
		function $(er) {
			sh(`'Could not load dynamic lib: ${S(i + 36)}
${er}`), --jf, Ef(() => Q(s)(i, _));
		}
		function j() {
			--jf, Ef(() => Q(o)(i, _));
		}
		jf += 1;
		var _e = th(i, { I: !0 });
		_e ? _e.then(j, $) : $();
	};
	fc.g = "vpppp";
	function Ei(i) {
		var o = Fi, s = o.R.pop() || o.ga.length;
		return o.ga[s] = i, s;
	}
	function Gi(i) {
		var o = Fi;
		o.ga[i] = void 0, o.R.push(i);
	}
	class Hi {
		ga = [void 0];
		R = [];
		get(o) {
			return this.ga[o];
		}
		has(o) {
			return this.ga[o] !== void 0;
		}
	}
	var Fi = new Hi(), Ii = () => {
		var i = {};
		return i.promise = new Promise((o, s) => {
			i.reject = s, i.resolve = o;
		}), i.id = Ei(i), i;
	}, Ji = async () => {
		const i = Ff, o = [];
		var s = Ii();
		o.push(s.promise), Je(s.id);
		for (const _ of Object.keys(lf)) {
			const $ = Number(_);
			$ === i || mf.has($) || (s = Ii(), Le($, s.id), nf[$] = s, o.push(s.promise));
		}
		await Promise.all(o), nf = {};
	};
	function gc() {
		if (t) return P(17, 2);
		if (Ff) return Ji();
		for (const i of Object.keys(lf)) {
			const o = Number(i);
			mf.has(o) || Me(o);
		}
	}
	gc.g = "v";
	function hc() {
		var i = Ce(4 * (na.length + 1)), o = i;
		return na.forEach((s) => {
			var _ = E, $ = o >> 2, j = Ag(s) + 1, _e = Ce(j);
			_e && Bg(s, y, _e, j), _[$] = _e, o += 4;
		}), E[o >> 2] = 0, i;
	}
	hc.g = "p";
	var ic = (i) => {
		Ga(i, !ba, 1, !aa, 262144, !1), Ha();
	};
	ic.g = "vp";
	var Ki = !Atomics.waitAsync || globalThis.navigator?.userAgent && 91 > Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./) || [])[2]), Ia = (i) => {
		Ki || (Atomics.waitAsync(C, i >> 2, i).value.then(La), Atomics.store(C, i + 128 >> 2, 1));
	};
	Ia.g = "vp";
	var La = () => Ef(() => {
		var i = Be();
		i && (Ia(i), Se());
	}), jc = (i, o) => {
		i == o ? setTimeout(La) : t ? postMessage({
			Ea: i,
			W: "checkMailbox"
		}) : (i = lf[i]) && i.postMessage({ W: "checkMailbox" });
	};
	jc.g = "vpp";
	var Li = [], kc = (i, o, s, _, $, j, _e) => {
		Li.length = 0;
		var er = $ >> 3;
		for (_ = $ + _ >> 3; er < _;) {
			var rr;
			F[er++] ? rr = F[er++] : rr = Pa[er++], Li.push(rr);
		}
		if (i = o ? og[o] : Mi[i], Ff = s, s = i(...Li), Ff = 0, j) s.then((tr) => Oe(j, _e, tr));
		else return s;
	};
	kc.g = "dippippp";
	var lc = () => {
		Gf = !1, jf = 0;
	};
	lc.g = "v";
	var mc = (i) => {
		t ? postMessage({
			W: "cleanupThread",
			Va: i
		}) : qf(i);
	};
	mc.g = "vp";
	var nc = (i) => {
		t ? postMessage({
			W: "markAsFinished",
			Va: i
		}) : sf(i);
	};
	nc.g = "vp";
	var oc = () => {};
	oc.g = "vp";
	var pc = () => {
		throw new sa();
	};
	pc.g = "v";
	var qc = (i, o) => {
		i = Z(i), o = Z(o), i.set(o);
	};
	qc.g = "vpp";
	var Ni = [], Oi = (i) => {
		var o = Ni.length;
		return Ni.push(i), o;
	}, Pi = (i, o) => {
		for (var s = Array(i), _ = 0; _ < i; ++_) s[_] = ti(E[o + 4 * _ >> 2], `parameter ${_}`);
		return s;
	}, Qi = (i, o, s) => {
		var _ = [];
		return i = i(_, s), _.length && (E[o >> 2] = Xh(_)), i;
	}, Ri = {}, Si = (i) => {
		var o = Ri[i];
		return o === void 0 ? W(i) : o;
	}, rc = (i, o, s) => {
		var [_, ...$] = Pi(i, o);
		o = _.F.bind(_);
		var j = $.map((rr) => rr.L.bind(rr));
		i--;
		var _e = { toValue: Z };
		switch (i = j.map((rr, tr) => {
			var nr = `argFromPtr${tr}`;
			return _e[nr] = rr, `${nr}(args${tr ? "+" + 8 * tr : ""})`;
		}), s) {
			case 0:
				var er = "toValue(handle)";
				break;
			case 2:
				er = "new (toValue(handle))";
				break;
			case 3:
				er = "";
				break;
			case 1: _e.getStringOrSymbol = Si, er = "toValue(handle)[getStringOrSymbol(methodName)]";
		}
		return er += `(${i})`, _.hb || (_e.toReturnWire = o, _e.emval_returnValue = Qi, er = `return emval_returnValue(toReturnWire, destructorsRef, ${er})`), er = `return function (handle, methodName, destructorsRef, args) {
${er}
}`, s = new Function(Object.keys(_e), er)(...Object.values(_e)), er = `methodCaller<(${$.map((rr) => rr.name)}) => ${_.name}>`, Oi(jg(er, s));
	};
	rc.g = "pipi";
	var tc = (i) => i ? (i = Si(i), Xh(globalThis[i])) : Xh(globalThis);
	tc.g = "pp";
	var uc = (i) => (i = Si(i), Xh(n[i]));
	uc.g = "pp";
	var vc = (i, o) => (i = Z(i), o = Z(o), Xh(i[o]));
	vc.g = "ppp";
	var wc = (i) => {
		9 < i && (qi[i + 1] += 1);
	};
	wc.g = "vp";
	var xc = (i, o) => (i = Z(i), o = Z(o), i instanceof o);
	xc.g = "ipp";
	var yc = (i, o, s, _, $) => Ni[i](o, s, _, $);
	yc.g = "dppppp";
	var zc = (i) => (i = Z(i), typeof i == "number");
	zc.g = "ip";
	var Ac = (i) => (i = Z(i), typeof i == "string");
	Ac.g = "ip";
	var Bc = (i) => Xh(Si(i));
	Bc.g = "pp";
	var Cc = (i) => {
		vh(Z(i)), sc(i);
	};
	Cc.g = "vp";
	var Dc = (i, o, s) => {
		i = Z(i), o = Z(o), s = Z(s), i[o] = s;
	};
	Dc.g = "vppp";
	var Ec = (i) => (i = Z(i), Xh(typeof i));
	Ec.g = "pp";
	function Fc(i, o) {
		i = -9007199254740992 > i || 9007199254740992 < i ? NaN : Number(i), i = /* @__PURE__ */ new Date(1e3 * i), C[o >> 2] = i.getUTCSeconds(), C[o + 4 >> 2] = i.getUTCMinutes(), C[o + 8 >> 2] = i.getUTCHours(), C[o + 12 >> 2] = i.getUTCDate(), C[o + 16 >> 2] = i.getUTCMonth(), C[o + 20 >> 2] = i.getUTCFullYear() - 1900, C[o + 24 >> 2] = i.getUTCDay(), C[o + 28 >> 2] = (i.getTime() - Date.UTC(i.getUTCFullYear(), 0, 1, 0, 0, 0, 0)) / 864e5 | 0;
	}
	Fc.g = "vjp";
	var Ti = [
		0,
		31,
		60,
		91,
		121,
		152,
		182,
		213,
		244,
		274,
		305,
		335
	], Ui = [
		0,
		31,
		59,
		90,
		120,
		151,
		181,
		212,
		243,
		273,
		304,
		334
	];
	function Gc(i, o) {
		i = -9007199254740992 > i || 9007199254740992 < i ? NaN : Number(i), i = /* @__PURE__ */ new Date(1e3 * i), C[o >> 2] = i.getSeconds(), C[o + 4 >> 2] = i.getMinutes(), C[o + 8 >> 2] = i.getHours(), C[o + 12 >> 2] = i.getDate(), C[o + 16 >> 2] = i.getMonth(), C[o + 20 >> 2] = i.getFullYear() - 1900, C[o + 24 >> 2] = i.getDay();
		var s = i.getFullYear();
		C[o + 28 >> 2] = (s % 4 !== 0 || s % 100 === 0 && s % 400 !== 0 ? Ui : Ti)[i.getMonth()] + i.getDate() - 1 | 0, C[o + 36 >> 2] = -(60 * i.getTimezoneOffset()), s = new Date(i.getFullYear(), 6, 1).getTimezoneOffset();
		var _ = new Date(i.getFullYear(), 0, 1).getTimezoneOffset();
		C[o + 32 >> 2] = (s != _ && i.getTimezoneOffset() == Math.min(_, s)) | 0;
	}
	Gc.g = "vjp";
	function Hc(i, o, s, _, $, j, _e) {
		if (t) return P(18, 1, i, o, s, _, $, j, _e);
		$ = -9007199254740992 > $ || 9007199254740992 < $ ? NaN : Number($);
		try {
			var er = U(_), rr = FS.la(er, i, $, o, s), tr = rr.s;
			return C[j >> 2] = rr.ga, E[_e >> 2] = tr, 0;
		} catch (nr) {
			if (typeof FS > "u" || nr.name !== "ErrnoError") throw nr;
			return -nr.A;
		}
	}
	Hc.g = "ipiiijpp";
	function Ic(i, o, s, _, $, j) {
		if (t) return P(19, 1, i, o, s, _, $, j);
		j = -9007199254740992 > j || 9007199254740992 < j ? NaN : Number(j);
		try {
			var _e = U($);
			if (s & 2) {
				if (s = j, !FS.isFile(_e.node.mode)) throw new FS.h(43);
				_ & 2 || FS.na(_e, y.slice(i, i + o), s, o, _);
			}
		} catch (er) {
			if (typeof FS > "u" || er.name !== "ErrnoError") throw er;
			return -er.A;
		}
	}
	Ic.g = "ippiiij";
	var Jc = (i, o, s, _) => {
		var $ = (/* @__PURE__ */ new Date()).getFullYear(), j = new Date($, 0, 1).getTimezoneOffset();
		$ = new Date($, 6, 1).getTimezoneOffset(), E[i >> 2] = 60 * Math.max(j, $), C[o >> 2] = +(j != $), o = (_e) => {
			var er = Math.abs(_e);
			return `UTC${0 <= _e ? "-" : "+"}${String(Math.floor(er / 60)).padStart(2, "0")}${String(er % 60).padStart(2, "0")}`;
		}, i = o(j), o = o($), $ < j ? (Bg(i, y, s, 17), Bg(o, y, _, 17)) : (Bg(i, y, _, 17), Bg(o, y, s, 17));
	};
	Jc.g = "vpppp";
	var Qc = () => performance.timeOrigin + performance.now();
	Qc.g = "d";
	var Mc = () => Date.now();
	Mc.g = "d";
	var Vi = 1;
	function Kc(i, o, s) {
		if (!(0 <= i && 3 >= i)) return 28;
		if (i === 0) i = Date.now();
		else if (Vi) i = performance.timeOrigin + performance.now();
		else return 52;
		return F[s >> 3] = BigInt(Math.round(1e6 * i)), 0;
	}
	Kc.g = "iijp";
	var Lc = () => {};
	Lc.g = "v";
	var Nc = (i) => v(S(i));
	Nc.g = "vp";
	var Oc = () => {
		throw jf += 1, "unwind";
	};
	Oc.g = "v";
	var Pc = () => y.length;
	Pc.g = "p";
	var Rc = () => navigator.hardwareConcurrency;
	Rc.g = "i";
	var Sc = (i) => {
		Gi(i);
	};
	Sc.g = "vp";
	var Tc = (i, o, s) => {
		switch (i = Fi.get(i), o) {
			case 0:
				i.resolve(s);
				break;
			case 1:
				i.resolve(Fi.get(s).promise);
				break;
			case 2:
				i.resolve(Fi.get(s).promise), Gi(s);
				break;
			case 3: i.reject(s);
		}
	};
	Tc.g = "vpip";
	var Uc = () => !1;
	Uc.g = "ip";
	var Wi = {}, Yi = () => {
		if (!Xi) {
			var i = {
				USER: "web_user",
				LOGNAME: "web_user",
				PATH: "/",
				PWD: "/",
				HOME: "/home/web_user",
				LANG: (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8",
				_: fa || "./this.program"
			}, o;
			for (o in Wi) Wi[o] === void 0 ? delete i[o] : i[o] = Wi[o];
			var s = [];
			for (o in i) s.push(`${o}=${i[o]}`);
			Xi = s;
		}
		return Xi;
	}, Xi;
	function Vc(i, o) {
		if (t) return P(20, 1, i, o);
		var s = 0, _ = 0, $;
		for ($ of Yi()) {
			var j = o + s;
			E[i + _ >> 2] = j, s += Bg($, y, j, Infinity) + 1, _ += 4;
		}
		return 0;
	}
	Vc.g = "ipp";
	function Wc(i, o) {
		if (t) return P(21, 1, i, o);
		var s = Yi();
		E[i >> 2] = s.length, i = 0;
		for (var _ of s) i += Ag(_) + 1;
		return E[o >> 2] = i, 0;
	}
	Wc.g = "ipp";
	function Yc(i) {
		if (t) return P(22, 1, i);
		try {
			var o = U(i);
			return FS.close(o), 0;
		} catch (s) {
			if (typeof FS > "u" || s.name !== "ErrnoError") throw s;
			return s.A;
		}
	}
	Yc.g = "ii";
	function Zc(i, o) {
		if (t) return P(23, 1, i, o);
		try {
			var s = U(i), _ = s.C ? 2 : FS.isDir(s.mode) ? 3 : FS.isLink(s.mode) ? 7 : 4;
			return x[o] = _, z[o + 2 >> 1] = 0, F[o + 8 >> 3] = BigInt(0), F[o + 16 >> 3] = BigInt(0), 0;
		} catch ($) {
			if (typeof FS > "u" || $.name !== "ErrnoError") throw $;
			return $.A;
		}
	}
	Zc.g = "iip";
	function $c(i, o, s, _) {
		if (t) return P(24, 1, i, o, s, _);
		try {
			e: {
				var $ = U(i);
				i = o;
				for (var j, _e = o = 0; _e < s; _e++) {
					var er = E[i >> 2], rr = E[i + 4 >> 2];
					i += 8;
					var tr = FS.read($, x, er, rr, j);
					if (0 > tr) {
						var nr = -1;
						break e;
					}
					if (o += tr, tr < rr) break;
					typeof j < "u" && (j += tr);
				}
				nr = o;
			}
			return E[_ >> 2] = nr, 0;
		} catch (ir) {
			if (typeof FS > "u" || ir.name !== "ErrnoError") throw ir;
			return ir.A;
		}
	}
	$c.g = "iippp";
	function ad(i, o, s, _) {
		if (t) return P(25, 1, i, o, s, _);
		o = -9007199254740992 > o || 9007199254740992 < o ? NaN : Number(o);
		try {
			if (isNaN(o)) return 61;
			var $ = U(i);
			return FS.llseek($, o, s), F[_ >> 3] = BigInt($.position), $.Ha && o === 0 && s === 0 && ($.Ha = null), 0;
		} catch (j) {
			if (typeof FS > "u" || j.name !== "ErrnoError") throw j;
			return j.A;
		}
	}
	ad.g = "iijip";
	function bd(i, o, s, _) {
		if (t) return P(26, 1, i, o, s, _);
		try {
			e: {
				var $ = U(i);
				i = o;
				for (var j, _e = o = 0; _e < s; _e++) {
					var er = E[i >> 2], rr = E[i + 4 >> 2];
					i += 8;
					var tr = FS.write($, x, er, rr, j);
					if (0 > tr) {
						var nr = -1;
						break e;
					}
					if (o += tr, tr < rr) break;
					typeof j < "u" && (j += tr);
				}
				nr = o;
			}
			return E[_ >> 2] = nr, 0;
		} catch (ir) {
			if (typeof FS > "u" || ir.name !== "ErrnoError") throw ir;
			return ir.A;
		}
	}
	bd.g = "iippp";
	function dd(...i) {
		return K.heif_color_conversion_options_ext_copy(...i);
	}
	dd.J = !0;
	function ed(...i) {
		return K.heif_color_conversion_options_ext_free(...i);
	}
	ed.J = !0;
	function fd(...i) {
		return K.heif_encoding_options_alloc(...i);
	}
	fd.J = !0;
	function gd(...i) {
		return K.heif_encoding_options_free(...i);
	}
	gd.J = !0;
	function hd(...i) {
		return K.heif_error_success(...i);
	}
	hd.J = !0;
	function jd(...i) {
		return K.heif_image_get_plane_readonly2(...i);
	}
	jd.J = !0;
	function kd(...i) {
		return K.heif_image_release(...i);
	}
	kd.J = !0;
	function ld(...i) {
		return K.heif_nclx_color_profile_alloc(...i);
	}
	ld.J = !0;
	function md(...i) {
		return K.heif_nclx_color_profile_free(...i);
	}
	md.J = !0;
	function nd(...i) {
		return K.heif_tai_clock_info_copy(...i);
	}
	nd.J = !0;
	function od(...i) {
		return K.heif_tai_clock_info_release(...i);
	}
	od.J = !0;
	function pd(...i) {
		return K.heif_tai_timestamp_packet_copy(...i);
	}
	pd.J = !0;
	function qd(...i) {
		return K.heif_tai_timestamp_packet_release(...i);
	}
	qd.J = !0;
	function we(i, o) {
		try {
			return Eg(y.subarray(i, i + o)), 0;
		} catch (s) {
			if (typeof FS > "u" || s.name !== "ErrnoError") throw s;
			return s.A;
		}
	}
	we.g = "ipp";
	var ua = (i) => {
		var o = O(), s = We(4), _ = We(4);
		if (Ze(i, s, _), i = E[s >> 2], _ = E[_ >> 2], s = S(i), L(i), _) {
			var $ = S(_);
			L(_);
		}
		return N(o), [s, $];
	};
	if (t || Bf(), (() => {
		var i = {
			nb: Promise.resolve(),
			canHandle: (o) => !n.noWasmDecoding && o.endsWith(".so"),
			handle: async (o, s) => i.nb = i.nb.then(async () => {
				try {
					var _ = await sg(o, {
						I: !0,
						ra: !0
					}, s, {});
				} catch ($) {
					throw Error(`failed to instantiate wasm: ${s}: ${$}`);
				}
				return Kf[s] = _, o;
			})
		};
		Jf.push(i);
	})(), FS.createPreloadedFile = (i, o, s, _, $, j, _e, er, rr, tr) => {
		Ug(i, o, s, _, $, er, rr, tr).then(j).catch(_e);
	}, FS.Pc = Ug, FS.ea = Array(4096), FS.mount(T, {}, "/"), FS.mkdir("/tmp"), FS.mkdir("/home"), FS.mkdir("/home/web_user"), (function() {
		FS.mkdir("/dev"), FS.registerDevice(FS.makedev(1, 3), {
			read: () => 0,
			write: (_, $, j, _e) => _e,
			llseek: () => 0
		}), FS.mkdev("/dev/null", FS.makedev(1, 3)), Kg(FS.makedev(5, 0), Mg), Kg(FS.makedev(6, 0), Ng), FS.mkdev("/dev/tty", FS.makedev(5, 0)), FS.mkdev("/dev/tty1", FS.makedev(6, 0));
		var i = /* @__PURE__ */ new Uint8Array(1024), o = 0, s = () => (o === 0 && (Eg(i), o = i.byteLength), i[--o]);
		FS.createDevice("/dev", "random", s), FS.createDevice("/dev", "urandom", s), FS.mkdir("/dev/shm"), FS.mkdir("/dev/shm/tmp");
	})(), (function() {
		FS.mkdir("/proc");
		var i = FS.mkdir("/proc/self");
		FS.mkdir("/proc/self/fd"), FS.mount({ mount() {
			var o = FS.createNode(i, "fd", 16895, 73);
			return o.o = { llseek: T.o.llseek }, o.m = {
				ka(s, _) {
					s = +_;
					var $ = U(s);
					return s = {
						parent: null,
						mount: { kb: "fake" },
						m: { readlink: () => $.path },
						id: s + 1
					}, s.parent = s;
				},
				ua() {
					return Array.from(FS.streams.entries()).filter(([, s]) => s).map(([s]) => s.toString());
				}
			}, o;
		} }, {}, "/proc/self/fd");
	})(), FS.Lb = { MEMFS: T }, (() => {
		let i = Nh.prototype;
		Object.assign(i, {
			isAliasOf: function(s) {
				if (!(this instanceof Nh && s instanceof Nh)) return !1;
				var _ = this.l.D.u, $ = this.l.s;
				s.l = s.l;
				var j = s.l.D.u;
				for (s = s.l.s; _.N;) $ = _.wa($), _ = _.N;
				for (; j.N;) s = j.wa(s), j = j.N;
				return _ === j && $ === s;
			},
			clone: function() {
				if (this.l.s || Fh(this), this.l.sa) return this.l.count.value += 1, this;
				var s = Jh, _ = Object, $ = _.create, j = Object.getPrototypeOf(this), _e = this.l;
				return s = s($.call(_, j, { l: { value: {
					count: _e.count,
					ja: _e.ja,
					sa: _e.sa,
					s: _e.s,
					D: _e.D,
					K: _e.K,
					S: _e.S
				} } })), s.l.count.value += 1, s.l.ja = !1, s;
			},
			delete() {
				if (this.l.s || Fh(this), this.l.ja && !this.l.sa) throw new X("Object already scheduled for deletion");
				Ih(this);
				var s = this.l;
				--s.count.value, s.count.value === 0 && (s.K ? s.S.Z(s.K) : s.D.u.Z(s.s)), this.l.sa || (this.l.K = void 0, this.l.s = void 0);
			},
			isDeleted: function() {
				return !this.l.s;
			},
			deleteLater: function() {
				if (this.l.s || Fh(this), this.l.ja && !this.l.sa) throw new X("Object already scheduled for deletion");
				return Kh.push(this), Kh.length === 1 && Mh && Mh(Lh), this.l.ja = !0, this;
			}
		});
		const o = Symbol.dispose;
		o && (i[o] = i.delete);
	})(), Object.assign(ci.prototype, {
		Ob(i) {
			return this.ob && (i = this.ob(i)), i;
		},
		Za(i) {
			this.Z?.(i);
		},
		L: wh,
		B: function(i) {
			function o() {
				return this.Ba ? bi(this.u.ca, {
					D: this.kc,
					s,
					S: this,
					K: i
				}) : bi(this.u.ca, {
					D: this,
					s: i
				});
			}
			var s = this.Ob(i);
			if (!s) return this.Za(i), null;
			var _ = ai(this.u, s);
			if (_ !== void 0) return _.l.count.value === 0 ? (_.l.s = s, _.l.K = i, _.clone()) : (_ = _.clone(), this.Za(i), _);
			if (_ = this.u.Mb(s), _ = Oh[_], !_) return o.call(this);
			_ = this.Aa ? _.Eb : _.pointerType;
			var $ = Zh(s, this.u, _.u);
			return $ === null ? o.call(this) : this.Ba ? bi(_.u.ca, {
				D: _,
				s: $,
				S: this,
				K: i
			}) : bi(_.u.ca, {
				D: _,
				s: $
			});
		}
	}), rf.push(() => {
		Wi.VIPS_MAX_THREADS = 6 < navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 6, Wi.VIPS_CONCURRENCY = 1;
	}), Xa.push(() => {
		const i = Object.getOwnPropertyDescriptor(n.SourceCustom.prototype, "onRead");
		Object.defineProperty(n.SourceCustom.prototype, "onRead", { set(s) {
			return i.set.call(this, (_) => Xh(s(_)));
		} });
		const o = Object.getOwnPropertyDescriptor(n.TargetCustom.prototype, "onWrite");
		Object.defineProperty(n.TargetCustom.prototype, "onWrite", { set(s) {
			return o.set.call(this, (_) => s(Z(_)));
		} });
	}), Object.assign(Nh.prototype, { preventAutoDelete: function() {
		const i = Kh.indexOf(this);
		return -1 < i && Kh.splice(i, 1), this.l.ja = !1, this;
	} }), !t) {
		if (n.wasmMemory) Ba = n.wasmMemory;
		else {
			var Zi = n.INITIAL_MEMORY || 1073741824;
			Ba = new WebAssembly.Memory({
				initial: Zi / 65536,
				maximum: Zi / 65536,
				shared: !0
			});
		}
		Ca();
	}
	if (n.preloadPlugins && (Jf = n.preloadPlugins), n.noExitRuntime && (Gf = n.noExitRuntime), n.print && (ma = n.print), n.printErr && (v = n.printErr), n.dynamicLibraries && (na = n.dynamicLibraries), n.wasmBinary && (oa = n.wasmBinary), n.arguments && (ea = n.arguments), n.thisProgram && (fa = n.thisProgram), n.preInit) for (typeof n.preInit == "function" && (n.preInit = [n.preInit]); 0 < n.preInit.length;) n.preInit.shift()();
	n.ENV = Wi, n.addRunDependency = wf, n.removeRunDependency = vf, n.addFunction = gg, n.FS_preloadFile = Ug, n.FS_unlink = (...i) => FS.unlink(...i), n.FS_createPath = (...i) => FS.createPath(...i), n.FS_createDevice = (...i) => FS.createDevice(...i), n.FS = FS, n.FS_createDataFile = (...i) => FS.createDataFile(...i), n.FS_createLazyFile = (...i) => FS.createLazyFile(...i), n.setAutoDeleteLater = (i) => {
		Gh = i;
	}, n.deletionQueue = Kh, n.setDelayFunction = (i) => {
		Mh = i, Kh.length && Mh && Mh(Lh);
	}, n.incrementExceptionRefcount = (i) => Ye(i instanceof ta ? i.ha : i), n.decrementExceptionRefcount = (i) => Xe(i instanceof ta ? i.ha : i), n.getExceptionMessage = (i) => ua(i instanceof ta ? i.ha : i);
	var Mi = [
		ve,
		Hf,
		nh,
		pb,
		qb,
		rb,
		sb,
		tb,
		ub,
		vb,
		wb,
		xb,
		yb,
		zb,
		Ab,
		Bb,
		Cb,
		gc,
		Hc,
		Ic,
		Vc,
		Wc,
		Yc,
		Zc,
		$c,
		ad,
		bd
	], og = {};
	function $i(i) {
		for (var o = B[i + 6 >> 1]; o === 13 && !(16 < E[i >> 2]);) {
			var s = E[i + 8 >> 2], _ = E[s >> 2];
			if (_ === 0) {
				o = 0;
				break;
			} else if (E[(s >> 2) + 1] === 0) i = _, o = B[_ + 6 >> 1];
			else break;
		}
		return [i, o];
	}
	function cd(i, o, s, _) {
		var $ = E[(i >> 2) + 1], j = E[(i >> 2) + 6], _e = E[(i >> 2) + 2], er = E[(i >> 2) + 5];
		i = $i(E[(i >> 2) + 3])[1];
		var rr = O(), tr = rr, nr = [], ir = !1;
		if (i === 15) throw Error("complex ret marshalling nyi");
		if (0 > i || 15 < i) throw Error("Unexpected rtype " + i);
		(i === 4 || i === 13) && (nr.push(s), ir = !0);
		for (var or = 0; or < j; or++) {
			var ar = E[(_ >> 2) + or], sr = $i(E[(_e >> 2) + or]), fr = sr[0];
			switch (sr = sr[1], sr) {
				case 1:
				case 10:
				case 9:
					nr.push(E[ar >> 2]);
					break;
				case 2:
					nr.push(Oa[ar >> 2]);
					break;
				case 3:
					nr.push(Pa[ar >> 3]);
					break;
				case 5:
					nr.push(y[ar]);
					break;
				case 6:
					nr.push(x[ar]);
					break;
				case 7:
					nr.push(B[ar >> 1]);
					break;
				case 8:
					nr.push(z[ar >> 1]);
					break;
				case 11:
				case 12:
					nr.push(Qa[ar >> 3]);
					break;
				case 4:
					nr.push(Qa[ar >> 3]), nr.push(Qa[(ar >> 3) + 1]);
					break;
				case 13:
					sr = E[fr >> 2], fr = B[fr + 4 >> 1], tr -= sr, tr &= ~(fr - 1), x.subarray(tr, tr + sr).set(x.subarray(ar, ar + sr)), nr.push(tr);
					break;
				case 14:
					nr.push(E[ar >> 2]);
					break;
				case 15: throw Error("complex marshalling nyi");
				default: throw Error("Unexpected type " + sr);
			}
		}
		if (er & 1) {
			for (er = [], or = $ - 1; or >= j; or--) switch (ar = E[(_ >> 2) + or], sr = $i(E[(_e >> 2) + or]), fr = sr[0], sr = sr[1], sr) {
				case 5:
				case 6:
					--tr, tr &= -1, y[tr] = y[ar];
					break;
				case 7:
				case 8:
					tr -= 2, tr &= -2, B[tr >> 1] = B[ar >> 1];
					break;
				case 1:
				case 9:
				case 10:
				case 2:
					tr -= 4, tr &= -4, E[tr >> 2] = E[ar >> 2];
					break;
				case 3:
				case 11:
				case 12:
					tr -= 8, tr &= -8, E[tr >> 2] = E[ar >> 2], E[(tr >> 2) + 1] = E[(ar >> 2) + 1];
					break;
				case 4:
					tr -= 16, tr &= -8, E[tr >> 2] = E[ar >> 2], E[(tr >> 2) + 1] = E[(ar >> 2) + 1], E[(tr >> 2) + 2] = E[(ar >> 2) + 2], E[(tr >> 2) + 3] = E[(ar >> 2) + 3];
					break;
				case 13:
					tr -= 4, tr &= -4, er.push([
						tr,
						ar,
						E[fr >> 2],
						B[fr + 4 >> 1]
					]);
					break;
				case 14:
					tr -= 4, tr &= -4, E[tr >> 2] = E[ar >> 2];
					break;
				case 15: throw Error("complex arg marshalling nyi");
				default: throw Error("Unexpected argtype " + sr);
			}
			for (nr.push(tr), or = 0; or < er.length; or++) $ = er[or], _ = $[0], ar = $[1], sr = $[2], fr = $[3], tr -= sr, tr &= ~(fr - 1), x.subarray(tr, tr + sr).set(x.subarray(ar, ar + sr)), E[_ >> 2] = tr;
		}
		if (N(tr), We(0), o = Q(o).apply(null, nr), N(rr), !ir) switch (i) {
			case 0: break;
			case 1:
			case 9:
			case 10:
				E[s >> 2] = o;
				break;
			case 2:
				Oa[s >> 2] = o;
				break;
			case 3:
				Pa[s >> 3] = o;
				break;
			case 5:
			case 6:
				y[s + 0] = o;
				break;
			case 7:
			case 8:
				B[s >> 1] = o;
				break;
			case 11:
			case 12:
				Qa[s >> 3] = o;
				break;
			case 14:
				E[s >> 2] = o;
				break;
			case 15: throw Error("complex ret marshalling nyi");
			default: throw Error("Unexpected rtype " + i);
		}
	}
	cd.g = "viiii";
	var Be, Ce, L, De, Ee, Fe, Ja, Ge, He, Ie, Je, Ke, Le, Me, Ne, Ga, Na, Oe, Pe, Qe, Re, Se, Te, M, Ue, Ve, N, We, O, Xe, Ye, Ze, $e, af, cf, bf, K;
	function Ud(i, o) {
		var s = O();
		try {
			Q(i)(o);
		} catch (_) {
			if (N(s), !(_ instanceof w)) throw _;
			M(1, 0);
		}
	}
	function ce(i, o, s, _) {
		var $ = O();
		try {
			Q(i)(o, s, _);
		} catch (j) {
			if (N($), !(j instanceof w)) throw j;
			M(1, 0);
		}
	}
	function Bd(i, o, s) {
		var _ = O();
		try {
			return Q(i)(o, s);
		} catch ($) {
			if (N(_), !($ instanceof w)) throw $;
			M(1, 0);
		}
	}
	function zd(i) {
		var o = O();
		try {
			return Q(i)();
		} catch (s) {
			if (N(o), !(s instanceof w)) throw s;
			M(1, 0);
		}
	}
	function Td(i) {
		var o = O();
		try {
			Q(i)();
		} catch (s) {
			if (N(o), !(s instanceof w)) throw s;
			M(1, 0);
		}
	}
	function Ad(i, o) {
		var s = O();
		try {
			return Q(i)(o);
		} catch (_) {
			if (N(s), !(_ instanceof w)) throw _;
			M(1, 0);
		}
	}
	function ke(i, o, s, _, $, j) {
		var _e = O();
		try {
			Q(i)(o, s, _, $, j);
		} catch (er) {
			if (N(_e), !(er instanceof w)) throw er;
			M(1, 0);
		}
	}
	function Dd(i, o, s, _) {
		var $ = O();
		try {
			return Q(i)(o, s, _);
		} catch (j) {
			if (N($), !(j instanceof w)) throw j;
			M(1, 0);
		}
	}
	function je(i, o, s, _, $) {
		var j = O();
		try {
			Q(i)(o, s, _, $);
		} catch (_e) {
			if (N(j), !(_e instanceof w)) throw _e;
			M(1, 0);
		}
	}
	function Gd(i, o, s, _, $, j) {
		var _e = O();
		try {
			return Q(i)(o, s, _, $, j);
		} catch (er) {
			if (N(_e), !(er instanceof w)) throw er;
			M(1, 0);
		}
	}
	function Yd(i, o, s) {
		var _ = O();
		try {
			Q(i)(o, s);
		} catch ($) {
			if (N(_), !($ instanceof w)) throw $;
			M(1, 0);
		}
	}
	function Jd(i, o, s, _, $, j, _e) {
		var er = O();
		try {
			return Q(i)(o, s, _, $, j, _e);
		} catch (rr) {
			if (N(er), !(rr instanceof w)) throw rr;
			M(1, 0);
		}
	}
	function ud(i, o, s, _, $, j) {
		var _e = O();
		try {
			return Q(i)(o, s, _, $, j);
		} catch (er) {
			if (N(_e), !(er instanceof w)) throw er;
			M(1, 0);
		}
	}
	function Ed(i, o, s, _, $) {
		var j = O();
		try {
			return Q(i)(o, s, _, $);
		} catch (_e) {
			if (N(j), !(_e instanceof w)) throw _e;
			M(1, 0);
		}
	}
	function td(i, o, s, _) {
		var $ = O();
		try {
			return Q(i)(o, s, _);
		} catch (j) {
			if (N($), !(j instanceof w)) throw j;
			M(1, 0);
		}
	}
	function Zd(i, o, s, _) {
		var $ = O();
		try {
			Q(i)(o, s, _);
		} catch (j) {
			if (N($), !(j instanceof w)) throw j;
			M(1, 0);
		}
	}
	function $d(i, o, s, _, $) {
		var j = O();
		try {
			Q(i)(o, s, _, $);
		} catch (_e) {
			if (N(j), !(_e instanceof w)) throw _e;
			M(1, 0);
		}
	}
	function Cd(i, o, s, _) {
		var $ = O();
		try {
			return Q(i)(o, s, _);
		} catch (j) {
			if (N($), !(j instanceof w)) throw j;
			M(1, 0);
		}
	}
	function Vd(i, o, s) {
		var _ = O();
		try {
			Q(i)(o, s);
		} catch ($) {
			if (N(_), !($ instanceof w)) throw $;
			M(1, 0);
		}
	}
	function rd(i, o) {
		var s = O();
		try {
			return Q(i)(o);
		} catch (_) {
			if (N(s), !(_ instanceof w)) throw _;
			M(1, 0);
		}
	}
	function qe(i, o, s, _, $, j, _e, er, rr, tr, nr) {
		var ir = O();
		try {
			Q(i)(o, s, _, $, j, _e, er, rr, tr, nr);
		} catch (or) {
			if (N(ir), !(or instanceof w)) throw or;
			M(1, 0);
		}
	}
	function le(i, o, s, _, $, j, _e) {
		var er = O();
		try {
			Q(i)(o, s, _, $, j, _e);
		} catch (rr) {
			if (N(er), !(rr instanceof w)) throw rr;
			M(1, 0);
		}
	}
	function me(i, o, s, _, $, j, _e, er) {
		var rr = O();
		try {
			Q(i)(o, s, _, $, j, _e, er);
		} catch (tr) {
			if (N(rr), !(tr instanceof w)) throw tr;
			M(1, 0);
		}
	}
	function sd(i, o, s) {
		var _ = O();
		try {
			return Q(i)(o, s);
		} catch ($) {
			if (N(_), !($ instanceof w)) throw $;
			M(1, 0);
		}
	}
	function be(i, o, s, _, $) {
		var j = O();
		try {
			Q(i)(o, s, _, $);
		} catch (_e) {
			if (N(j), !(_e instanceof w)) throw _e;
			M(1, 0);
		}
	}
	function de(i, o, s, _, $) {
		var j = O();
		try {
			Q(i)(o, s, _, $);
		} catch (_e) {
			if (N(j), !(_e instanceof w)) throw _e;
			M(1, 0);
		}
	}
	function Wd(i, o, s, _, $) {
		var j = O();
		try {
			Q(i)(o, s, _, $);
		} catch (_e) {
			if (N(j), !(_e instanceof w)) throw _e;
			M(1, 0);
		}
	}
	function ge(i, o, s, _, $, j, _e, er) {
		var rr = O();
		try {
			Q(i)(o, s, _, $, j, _e, er);
		} catch (tr) {
			if (N(rr), !(tr instanceof w)) throw tr;
			M(1, 0);
		}
	}
	function ee(i, o, s, _, $, j, _e, er, rr, tr) {
		var nr = O();
		try {
			Q(i)(o, s, _, $, j, _e, er, rr, tr);
		} catch (ir) {
			if (N(nr), !(ir instanceof w)) throw ir;
			M(1, 0);
		}
	}
	function fe(i, o, s, _, $, j, _e, er, rr) {
		var tr = O();
		try {
			Q(i)(o, s, _, $, j, _e, er, rr);
		} catch (nr) {
			if (N(tr), !(nr instanceof w)) throw nr;
			M(1, 0);
		}
	}
	function ie(i, o, s, _, $, j) {
		var _e = O();
		try {
			Q(i)(o, s, _, $, j);
		} catch (er) {
			if (N(_e), !(er instanceof w)) throw er;
			M(1, 0);
		}
	}
	function he(i, o, s, _, $, j, _e) {
		var er = O();
		try {
			Q(i)(o, s, _, $, j, _e);
		} catch (rr) {
			if (N(er), !(rr instanceof w)) throw rr;
			M(1, 0);
		}
	}
	function se(i, o, s, _, $, j, _e, er, rr, tr, nr, ir, or) {
		var ar = O();
		try {
			Q(i)(o, s, _, $, j, _e, er, rr, tr, nr, ir, or);
		} catch (sr) {
			if (N(ar), !(sr instanceof w)) throw sr;
			M(1, 0);
		}
	}
	function re(i, o, s, _, $, j, _e, er, rr, tr, nr, ir) {
		var or = O();
		try {
			Q(i)(o, s, _, $, j, _e, er, rr, tr, nr, ir);
		} catch (ar) {
			if (N(or), !(ar instanceof w)) throw ar;
			M(1, 0);
		}
	}
	function pe(i, o, s, _, $, j, _e, er, rr, tr) {
		var nr = O();
		try {
			Q(i)(o, s, _, $, j, _e, er, rr, tr);
		} catch (ir) {
			if (N(nr), !(ir instanceof w)) throw ir;
			M(1, 0);
		}
	}
	function oe(i, o, s, _, $, j, _e, er, rr) {
		var tr = O();
		try {
			Q(i)(o, s, _, $, j, _e, er, rr);
		} catch (nr) {
			if (N(tr), !(nr instanceof w)) throw nr;
			M(1, 0);
		}
	}
	function te(i, o, s, _, $, j, _e, er, rr, tr, nr, ir, or, ar) {
		var sr = O();
		try {
			Q(i)(o, s, _, $, j, _e, er, rr, tr, nr, ir, or, ar);
		} catch (fr) {
			if (N(sr), !(fr instanceof w)) throw fr;
			M(1, 0);
		}
	}
	function ae(i, o, s, _, $, j) {
		var _e = O();
		try {
			Q(i)(o, s, _, $, j);
		} catch (er) {
			if (N(_e), !(er instanceof w)) throw er;
			M(1, 0);
		}
	}
	function Kd(i, o, s, _, $, j, _e, er) {
		var rr = O();
		try {
			return Q(i)(o, s, _, $, j, _e, er);
		} catch (tr) {
			if (N(rr), !(tr instanceof w)) throw tr;
			M(1, 0);
		}
	}
	function Rd(i, o) {
		var s = O();
		try {
			return Q(i)(o);
		} catch (_) {
			if (N(s), !(_ instanceof w)) throw _;
			return M(1, 0), 0n;
		}
	}
	function Pd(i, o, s, _, $, j, _e, er, rr, tr, nr, ir, or) {
		var ar = O();
		try {
			return Q(i)(o, s, _, $, j, _e, er, rr, tr, nr, ir, or);
		} catch (sr) {
			if (N(ar), !(sr instanceof w)) throw sr;
			M(1, 0);
		}
	}
	function Md(i, o, s, _, $, j, _e, er, rr, tr) {
		var nr = O();
		try {
			return Q(i)(o, s, _, $, j, _e, er, rr, tr);
		} catch (ir) {
			if (N(nr), !(ir instanceof w)) throw ir;
			M(1, 0);
		}
	}
	function ne(i, o, s, _, $, j, _e, er, rr, tr) {
		var nr = O();
		try {
			Q(i)(o, s, _, $, j, _e, er, rr, tr);
		} catch (ir) {
			if (N(nr), !(ir instanceof w)) throw ir;
			M(1, 0);
		}
	}
	function Hd(i, o, s, _, $, j, _e, er, rr) {
		var tr = O();
		try {
			return Q(i)(o, s, _, $, j, _e, er, rr);
		} catch (nr) {
			if (N(tr), !(nr instanceof w)) throw nr;
			M(1, 0);
		}
	}
	function xd(i, o, s) {
		var _ = O();
		try {
			return Q(i)(o, s);
		} catch ($) {
			if (N(_), !($ instanceof w)) throw $;
			M(1, 0);
		}
	}
	function Ld(i, o, s, _, $, j, _e, er, rr) {
		var tr = O();
		try {
			return Q(i)(o, s, _, $, j, _e, er, rr);
		} catch (nr) {
			if (N(tr), !(nr instanceof w)) throw nr;
			M(1, 0);
		}
	}
	function Xd(i, o, s, _, $) {
		var j = O();
		try {
			Q(i)(o, s, _, $);
		} catch (_e) {
			if (N(j), !(_e instanceof w)) throw _e;
			M(1, 0);
		}
	}
	function vd(i, o) {
		var s = O();
		try {
			return Q(i)(o);
		} catch (_) {
			if (N(s), !(_ instanceof w)) throw _;
			M(1, 0);
		}
	}
	function wd(i, o) {
		var s = O();
		try {
			return Q(i)(o);
		} catch (_) {
			if (N(s), !(_ instanceof w)) throw _;
			M(1, 0);
		}
	}
	function Id(i, o, s, _, $, j, _e, er, rr, tr, nr) {
		var ir = O();
		try {
			return Q(i)(o, s, _, $, j, _e, er, rr, tr, nr);
		} catch (or) {
			if (N(ir), !(or instanceof w)) throw or;
			M(1, 0);
		}
	}
	function Qd(i, o, s, _, $, j) {
		var _e = O();
		try {
			return Q(i)(o, s, _, $, j);
		} catch (er) {
			if (N(_e), !(er instanceof w)) throw er;
			M(1, 0);
		}
	}
	function Fd(i, o, s, _, $, j) {
		var _e = O();
		try {
			return Q(i)(o, s, _, $, j);
		} catch (er) {
			if (N(_e), !(er instanceof w)) throw er;
			M(1, 0);
		}
	}
	function Nd(i, o, s, _, $, j, _e, er, rr, tr, nr) {
		var ir = O();
		try {
			return Q(i)(o, s, _, $, j, _e, er, rr, tr, nr);
		} catch (or) {
			if (N(ir), !(or instanceof w)) throw or;
			M(1, 0);
		}
	}
	function Sd(i, o, s, _, $) {
		var j = O();
		try {
			return Q(i)(o, s, _, $);
		} catch (_e) {
			if (N(j), !(_e instanceof w)) throw _e;
			return M(1, 0), 0n;
		}
	}
	function yd(i, o, s, _) {
		var $ = O();
		try {
			return Q(i)(o, s, _);
		} catch (j) {
			if (N($), !(j instanceof w)) throw j;
			M(1, 0);
		}
	}
	function Od(i, o, s, _, $, j, _e, er, rr, tr, nr, ir) {
		var or = O();
		try {
			return Q(i)(o, s, _, $, j, _e, er, rr, tr, nr, ir);
		} catch (ar) {
			if (N(or), !(ar instanceof w)) throw ar;
			M(1, 0);
		}
	}
	function ue(i, o, s, _, $, j, _e, er, rr, tr, nr, ir, or, ar, sr, fr) {
		var lr = O();
		try {
			Q(i)(o, s, _, $, j, _e, er, rr, tr, nr, ir, or, ar, sr, fr);
		} catch (cr) {
			if (N(lr), !(cr instanceof w)) throw cr;
			M(1, 0);
		}
	}
	function aj(i = []) {
		var o = ng("main").Ua;
		if (o) {
			i.unshift(fa);
			var s = i.length, _ = We(4 * (s + 1)), $ = _, j;
			for (j of i) E[$ >> 2] = Cg(j), $ += 4;
			E[$ >> 2] = 0;
			try {
				Xc(o(s, _), !0);
			} catch (_e) {
				hf(_e);
			}
		}
	}
	function Ea(i = ea) {
		function o() {
			if (n.calledRun = !0, !qa && (Ua(), va?.(n), n.onRuntimeInitialized?.(), n.noInitialRun || aj(i), !t)) {
				if (n.postRun) for (typeof n.postRun == "function" && (n.postRun = [n.postRun]); n.postRun.length;) {
					var s = n.postRun.shift();
					Rf.push(s);
				}
				Va(Rf);
			}
		}
		if (0 < tf) uf = Ea;
		else if (t) va?.(n), Ua();
		else {
			if (n.preRun) for (typeof n.preRun == "function" && (n.preRun = [n.preRun]); n.preRun.length;) rf.push(n.preRun.shift());
			Va(rf), 0 < tf ? uf = Ea : n.setStatus ? (n.setStatus("Running..."), setTimeout(() => {
				setTimeout(() => n.setStatus(""), 1), o();
			}, 1)) : o();
		}
	}
	var Wa;
	return t || (Wa = await Da(), Ea()), Ra ? moduleRtn = n : moduleRtn = new Promise((i, o) => {
		va = i, wa = o;
	}), moduleRtn;
}
var isPthread = globalThis.name == "em-pthread";
isPthread && Vips();
