import{G as B,K as D,T,b as I,j as Y}from"./main-BXxz4Mq1.js";import{t as Z}from"./pdf-decrypt-RBfmPCdL.js";var E=null,$=null;function m(e){return document.getElementById(e)}function O(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function ee(){let e=m("password-modal");return e||(e=document.createElement("div"),e.id="password-modal",e.className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] hidden items-center justify-center p-4",e.innerHTML=`
    <div class="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl max-w-md w-full overflow-hidden">
      <div class="p-6">
        <div class="flex items-start gap-4 mb-4">
          <div class="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-500/10 flex-shrink-0">
            <i data-lucide="lock" class="w-6 h-6 text-indigo-400"></i>
          </div>
          <div class="flex-1">
            <h3 id="password-modal-title" class="text-xl font-bold text-white mb-1">Password Required</h3>
            <p id="password-modal-subtitle" class="text-gray-400 text-sm truncate"></p>
          </div>
        </div>
        <div class="mt-4">
          <div class="relative">
            <input type="password" id="password-modal-input"
              class="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter password" autocomplete="off" />
            <button id="password-modal-toggle" type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
          </div>
          <p id="password-modal-error" class="text-xs text-red-400 mt-2 hidden"></p>
          <p id="password-modal-progress" class="text-xs text-gray-400 mt-2 hidden"></p>
        </div>
      </div>
      <div class="flex gap-3 p-4 border-t border-gray-700">
        <button id="password-modal-cancel"
          class="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">
          Skip
        </button>
        <button id="password-modal-submit"
          class="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
          Unlock
        </button>
      </div>
    </div>`,document.body.appendChild(e),e)}function te(){let e=m("password-batch-modal");return e||(e=document.createElement("div"),e.id="password-batch-modal",e.className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] hidden items-center justify-center p-4",e.innerHTML=`
    <div class="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
      <div class="p-6 overflow-y-auto flex-1 min-h-0">
        <div class="flex items-start gap-4 mb-4">
          <div class="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-500/10 flex-shrink-0">
            <i data-lucide="lock" class="w-6 h-6 text-indigo-400"></i>
          </div>
          <div class="flex-1">
            <h3 id="batch-modal-title" class="text-xl font-bold text-white mb-1"></h3>
            <p class="text-gray-400 text-sm">Enter passwords for each encrypted file</p>
          </div>
        </div>
        <div class="flex items-center gap-2 mt-3 mb-3">
          <input type="checkbox" id="batch-modal-same-pw" checked
            class="w-4 h-4 rounded bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer" />
          <label for="batch-modal-same-pw" class="text-sm text-gray-300 cursor-pointer select-none">Use same password for all files</label>
        </div>
        <div id="batch-modal-shared" class="mb-3">
          <div class="relative">
            <input type="password" id="batch-modal-shared-input"
              class="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Password for all files" autocomplete="off" />
            <button id="batch-modal-shared-toggle" type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <div id="batch-modal-filelist" class="space-y-2 hidden"></div>
        <p id="batch-modal-error" class="text-xs text-red-400 mt-2 hidden"></p>
        <p id="batch-modal-progress" class="text-xs text-gray-400 mt-2 hidden"></p>
      </div>
      <div class="flex gap-3 p-4 border-t border-gray-700 flex-shrink-0">
        <button id="batch-modal-cancel"
          class="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">
          Skip All
        </button>
        <button id="batch-modal-submit"
          class="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
          Unlock All
        </button>
      </div>
    </div>`,document.body.appendChild(e),e)}function U(e,d){return new Promise(a=>{let t=!1;const l=I({data:e.slice(0),password:d});l.onPassword=(n,r)=>{t||(t=!0,a(r!==Y.INCORRECT_PASSWORD),l.destroy().catch(()=>{}))},l.promise.then(n=>{n.destroy(),t||(t=!0,a(!0))}).catch(()=>{t||(t=!0,a(!1))})})}async function se(e){const d=await T(e);return new Promise(a=>{let t=!1;const l=I({data:d.slice(0)});l.onPassword=()=>{t||(t=!0,a(!0),l.destroy().catch(()=>{}))},l.promise.then(n=>{n.destroy(),t||(t=!0,a(!1))}).catch(()=>{t||(t=!0,a(!1))})})}async function j(e,d){const a=await T(e),t=await Z(new Uint8Array(a),d);return new File([new Uint8Array(t.bytes)],e.name,{type:"application/pdf"})}async function G(e){$&&await $;const d=await T(e);if(E)if(await U(d,E))try{return await j(e,E)}catch{E=null}else E=null;const a=ee(),t=m("password-modal-input"),l=m("password-modal-title"),n=m("password-modal-subtitle"),r=m("password-modal-error"),h=m("password-modal-progress"),u=m("password-modal-submit"),v=m("password-modal-cancel"),g=m("password-modal-toggle");if(!t||!u||!v)return null;l&&(l.textContent="Password Required"),n&&(n.textContent=e.name),r&&(r.textContent="",r.classList.add("hidden")),h&&(h.textContent="",h.classList.add("hidden")),t.value="",t.type="password",u.disabled=!1,u.textContent="Unlock",u.dataset.originalText="Unlock",v.disabled=!1,v.textContent="Skip",a.classList.remove("hidden"),a.classList.add("flex"),B({icons:D}),setTimeout(()=>t.focus(),100);const b=new Promise(S=>{let w=!1,k=!1;function F(){a.classList.add("hidden"),a.classList.remove("flex"),u.removeEventListener("click",f),v.removeEventListener("click",P),t.removeEventListener("keydown",L),g&&g.removeEventListener("click",C)}function y(x){w||(w=!0,F(),S(x))}async function f(){if(k)return;const x=t.value;if(!x){r&&(r.textContent="Please enter a password",r.classList.remove("hidden"));return}if(r&&r.classList.add("hidden"),k=!0,u.disabled=!0,v.disabled=!0,h&&(h.textContent="Validating...",h.classList.remove("hidden")),!await U(d,x)){k=!1,u.disabled=!1,v.disabled=!1,h&&h.classList.add("hidden"),t.value="",t.focus(),r&&(r.textContent="Incorrect password. Please try again.",r.classList.remove("hidden"));return}h&&(h.textContent="Decrypting...");try{const q=await j(e,x);E=x,h&&h.classList.add("hidden"),y(q)}catch{k=!1,u.disabled=!1,v.disabled=!1,h&&h.classList.add("hidden"),r&&(r.textContent="Failed to decrypt. Try the Decrypt tool instead.",r.classList.remove("hidden"))}}function P(){k||y(null)}function L(x){x.key==="Enter"?(x.preventDefault(),f()):x.key==="Escape"&&(x.preventDefault(),P())}function C(){const x=t.type==="password";t.type=x?"text":"password";const q=g?.querySelector("i[data-lucide]");q&&q.setAttribute("data-lucide",x?"eye-off":"eye"),B({icons:D})}u.addEventListener("click",f),v.addEventListener("click",P),t.addEventListener("keydown",L),g&&g.addEventListener("click",C)});return $=b,b.finally(()=>{$===b&&($=null)}),b}async function ae(e,d){$&&await $;const a=new Map;if(d.length===0)return a;if(d.length===1){const y=d[0],f=await G(e[y]);return f&&a.set(y,f),a}if(E){let y=!0;for(const f of d)if(!await U(await T(e[f]),E)){y=!1,E=null;break}if(y&&E){const f=new Map;let P=!0;for(const L of d)try{f.set(L,await j(e[L],E))}catch{E=null,P=!1;break}if(P&&f.size===d.length){for(const[L,C]of f)a.set(L,C);return a}}}const t=d.map(y=>e[y].name),l=te(),n=m("batch-modal-title"),r=m("batch-modal-same-pw"),h=m("batch-modal-shared"),u=m("batch-modal-shared-input"),v=m("batch-modal-shared-toggle"),g=m("batch-modal-filelist"),b=m("batch-modal-error"),S=m("batch-modal-progress"),w=m("batch-modal-submit"),k=m("batch-modal-cancel");if(!w||!k||!r||!u||!g)return a;n&&(n.textContent=`${t.length} Files Need a Password`),r.checked=!0,u.value="",u.type="password",h&&h.classList.remove("hidden"),g.classList.add("hidden"),g.innerHTML=t.map((y,f)=>`<div class="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg transition-all" data-file-idx="${f}">
          <i data-lucide="file-lock" class="w-4 h-4 text-indigo-400 flex-shrink-0" data-icon-idx="${f}"></i>
          <span class="text-sm text-gray-300 truncate flex-1" title="${O(y)}">${O(y)}</span>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <input type="password" data-pw-idx="${f}" placeholder="Password"
              class="w-32 bg-gray-600 border border-gray-500 text-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-transparent" autocomplete="off" />
            <button type="button" data-skip-idx="${f}" title="Skip this file"
              class="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-gray-600 transition-colors">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>`).join(""),b&&(b.textContent="",b.classList.add("hidden")),S&&(S.textContent="",S.classList.add("hidden")),w.disabled=!1,w.textContent="Unlock All",w.dataset.originalText="Unlock All",k.disabled=!1,l.classList.remove("hidden"),l.classList.add("flex"),B({icons:D}),setTimeout(()=>u.focus(),100);const F=new Promise(y=>{let f=!1,P=!1;const L=new Set,C=new Set;function x(){let i=0;for(let s=0;s<t.length;s++)!L.has(s)&&!C.has(s)&&i++;return i}function q(i=!1){const s=C.size>0;k.textContent=s?"Skip Remaining":"Skip All";const c=x();if(i&&c===0){R(a);return}s&&(w.textContent=`Unlock Remaining (${c})`,w.dataset.originalText=w.textContent)}function z(){const i=r.checked;if(h&&h.classList.toggle("hidden",!i),g.classList.toggle("hidden",i),i)setTimeout(()=>u.focus(),50);else{const s=g.querySelector("input[data-pw-idx]:not(:disabled)");s&&setTimeout(()=>s.focus(),50)}}function J(i){C.add(i);const s=g.querySelector(`[data-file-idx="${i}"]`);if(!s)return;s.classList.remove("border","border-red-500/50"),s.classList.add("opacity-50","border","border-green-500/50");const c=s.querySelector("input[data-pw-idx]");c&&(c.disabled=!0);const o=s.querySelector("[data-skip-idx]");o&&o.classList.add("hidden");const p=s.querySelector(`[data-icon-idx="${i}"]`);p&&(p.setAttribute("data-lucide","check-circle"),p.classList.remove("text-indigo-400"),p.classList.add("text-green-400")),B({icons:D})}function H(i){const s=g.querySelector(`[data-file-idx="${i}"]`);if(!s)return;s.classList.remove("border-green-500/50"),s.classList.add("border","border-red-500/50");const c=s.querySelector("input[data-pw-idx]");c&&(c.value="",c.focus(),c.classList.add("border-red-500"),setTimeout(()=>c.classList.remove("border-red-500"),2e3))}function K(i){if(P)return;const s=i.target.closest("[data-skip-idx]");if(!s||s.dataset.skipIdx===void 0)return;const c=parseInt(s.dataset.skipIdx,10);if(isNaN(c)||C.has(c))return;const o=g.querySelector(`[data-file-idx="${c}"]`);if(o){if(L.has(c)){L.delete(c),o.classList.remove("opacity-40");const p=o.querySelector("input[data-pw-idx]");p&&(p.disabled=!1),s.title="Skip this file"}else{L.add(c),o.classList.add("opacity-40"),o.classList.remove("border","border-red-500/50");const p=o.querySelector("input[data-pw-idx]");p&&(p.disabled=!0),s.title="Include this file"}q(!0)}}function Q(){l.classList.add("hidden"),l.classList.remove("flex"),w.removeEventListener("click",N),k.removeEventListener("click",W),r.removeEventListener("change",z),g.removeEventListener("click",K),v&&v.removeEventListener("click",_),u.removeEventListener("keydown",V)}function R(i){f||(f=!0,Q(),y(i))}async function N(){if(P)return;const i=r.checked,s=[];for(let o=0;o<t.length;o++){if(L.has(o)||C.has(o))continue;let p;if(i?p=u.value:p=g.querySelector(`input[data-pw-idx="${o}"]`)?.value||"",!p){if(b){const M=i?"Please enter a password":`Please enter a password for ${t[o]} or skip it`;b.textContent=M,b.classList.remove("hidden")}return}s.push({localIdx:o,password:p})}if(s.length===0){R(a);return}b&&b.classList.add("hidden"),P=!0,w.disabled=!0,k.disabled=!0;const c=[];for(let o=0;o<s.length;o++){const{localIdx:p,password:M}=s[o],A=d[p];if(S&&(S.textContent=`Validating ${o+1} of ${s.length}: ${e[A].name}`,S.classList.remove("hidden")),!await U(await T(e[A]),M)){c.push(e[A].name),H(p);continue}S&&(S.textContent=`Decrypting ${o+1} of ${s.length}: ${e[A].name}`);try{const X=await j(e[A],M);a.set(A,X),J(p)}catch{c.push(e[A].name),H(p)}}if(S&&S.classList.add("hidden"),P=!1,w.disabled=!1,k.disabled=!1,c.length>0){if(b&&(b.textContent=`Wrong password for: ${c.join(", ")}`,b.classList.remove("hidden")),r.checked)u.value="",u.focus();else{const o=g.querySelector("input[data-pw-idx]:not(:disabled)");o&&o.focus()}q(),w.textContent="Retry Failed";return}i&&s.length>0&&(E=s[0].password),q(),f||R(a)}function W(){P||R(a)}function V(i){i.key==="Enter"?(i.preventDefault(),N()):i.key==="Escape"&&(i.preventDefault(),W())}function _(){const i=u.type==="password";u.type=i?"text":"password";const s=v?.querySelector("i[data-lucide]");s&&s.setAttribute("data-lucide",i?"eye-off":"eye"),B({icons:D})}r.addEventListener("change",z),w.addEventListener("click",N),k.addEventListener("click",W),g.addEventListener("click",K),u.addEventListener("keydown",V),v&&v.addEventListener("click",_)});return $=F,F.finally(()=>{$===F&&($=null)}),F}async function re(e,d,a){let t=await T(e),l=e;try{return{pdf:await I(t.slice(0)).promise,bytes:t,file:l}}catch(n){if(n&&typeof n=="object"&&"name"in n&&n.name==="PasswordException"){const r=await G(l);return r?(l=r,d&&a!==void 0&&(d[a]=r),t=await T(r),{pdf:await I(t.slice(0)).promise,bytes:t,file:l}):null}throw n}}async function oe(e){const d=[];for(let n=0;n<e.length;n++)await se(e[n])&&d.push(n);if(d.length===0)return[...e];const a=await ae(e,d),t=new Set(d.filter(n=>!a.has(n))),l=[];for(let n=0;n<e.length;n++)t.has(n)||l.push(a.get(n)??e[n]);return l}export{re as n,oe as t};
