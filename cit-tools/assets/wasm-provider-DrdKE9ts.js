var u="bentopdf:wasm-providers",y={pymupdf:"https://cdn.jsdelivr.net/npm/@bentopdf/pymupdf-wasm@0.11.16/",ghostscript:"https://cdn.jsdelivr.net/npm/@bentopdf/gs-wasm@0.1.1/assets/",cpdf:"https://cdn.jsdelivr.net/npm/coherentpdf@2.5.5/dist/"},g=y;function p(e,t){return e||t}var l={pymupdf:p(void 0,g.pymupdf),ghostscript:p(void 0,g.ghostscript),cpdf:p(void 0,g.cpdf)};function f(e){try{const t=typeof location<"u"?location.origin:"http://localhost";return new URL(e,t).hostname}catch{return null}}function b(){const e=new Set;typeof location<"u"&&location.hostname&&e.add(location.hostname);for(const t of Object.values(y)){const r=f(t);r&&e.add(r)}for(const t of Object.values(l)){const r=f(t);r&&e.add(r)}return e}var m=b(),w=class{config;validationCache=new Map;trustedHosts=new Set(m);constructor(){this.config=this.loadConfig()}isTrustedUrl(e){const t=f(e);return!!t&&this.trustedHosts.has(t)}loadConfig(){try{const e=localStorage.getItem(u);if(!e)return{};const t=JSON.parse(e),r={};let n=!1;for(const s of["pymupdf","ghostscript","cpdf"]){const o=t[s];typeof o=="string"&&(this.isTrustedUrl(o)?r[s]=o:(n=!0,console.warn(`[WasmProvider] Ignoring untrusted stored URL for ${s}: ${o}. Reconfigure via Advanced Settings to re-enable.`)))}if(n)try{localStorage.setItem(u,JSON.stringify(r))}catch(s){console.error("[WasmProvider] Failed to scrub untrusted config from localStorage:",s)}return r}catch(e){console.warn("[WasmProvider] Failed to load config from localStorage:",e)}return{}}getEnvDefault(e){return l[e]}saveConfig(){try{localStorage.setItem(u,JSON.stringify(this.config))}catch(e){console.error("[WasmProvider] Failed to save config to localStorage:",e)}}getUrl(e){const t=this.config[e];if(t){if(this.isTrustedUrl(t))return t;console.warn(`[WasmProvider] Refusing to use untrusted URL for ${e}; falling back to env default.`)}{const r=e==="cpdf"?"./":"engines/"+e+(e==="ghostscript"?"/assets/":"/");return new URL(r,window.location.href).href}return this.getEnvDefault(e)}setUrl(e,t){const r=t.endsWith("/")?t:`${t}/`,n=f(r);if(!n)throw new Error("Invalid URL");this.trustedHosts.add(n),this.config[e]=r,this.validationCache.delete(e),this.saveConfig()}removeUrl(e){delete this.config[e],this.validationCache.delete(e),this.saveConfig()}isConfigured(e){return!!(this.config[e]||this.getEnvDefault(e))}isUserConfigured(e){return!!this.config[e]}hasEnvDefault(e){return!!this.getEnvDefault(e)}hasAnyProvider(){return Object.keys(this.config).length>0||Object.values(l).some(Boolean)}async validateUrl(e,t){const r=t||this.config[e];if(!r)return{valid:!1,error:"No URL configured"};try{const s=new URL(r);if(!["http:","https:"].includes(s.protocol))return{valid:!1,error:"URL must start with http:// or https://"}}catch{return{valid:!1,error:"Invalid URL format. Please enter a valid URL (e.g., https://example.com/wasm/)"}}const n=r.endsWith("/")?r:`${r}/`;try{const s={pymupdf:"dist/index.js",ghostscript:"gs.js",cpdf:"coherentpdf.browser.min.js"}[e],o=`${n}${s}`,d=new AbortController,h=setTimeout(()=>d.abort(),1e4),i=await fetch(o,{method:"GET",mode:"cors",signal:d.signal});if(clearTimeout(h),!i.ok)return{valid:!1,error:`Could not find ${s} at the specified URL (HTTP ${i.status}). Make sure the file exists.`};const a=i.body?.getReader();if(a)try{await a.read(),a.cancel()}catch{return{valid:!1,error:"File exists but could not be read. Check CORS configuration."}}const c=i.headers.get("content-type");return c&&!c.includes("javascript")&&!c.includes("application/octet-stream")&&!c.includes("text/")?{valid:!1,error:`The URL returned unexpected content type: ${c}. Expected a JavaScript file.`}:((!t||t===this.config[e])&&this.validationCache.set(e,!0),{valid:!0})}catch(s){const o=s instanceof Error?s.message:"Unknown error";return o.includes("Failed to fetch")||o.includes("NetworkError")?{valid:!1,error:"Network error: Could not connect to the URL. Check that the URL is correct and the server allows CORS requests."}:{valid:!1,error:`Network error: ${o}`}}}getAllProviders(){return{pymupdf:this.config.pymupdf||l.pymupdf,ghostscript:this.config.ghostscript||l.ghostscript,cpdf:this.config.cpdf||l.cpdf}}clearAll(){this.config={},this.validationCache.clear(),this.trustedHosts=new Set(m);try{localStorage.removeItem(u)}catch(e){console.error("[WasmProvider] Failed to clear localStorage:",e)}}resetToDefaults(){this.clearAll()}getPackageDisplayName(e){return{pymupdf:"PyMuPDF (Document Processing)",ghostscript:"Ghostscript (PDF/A Conversion)",cpdf:"CoherentPDF (Bookmarks & Metadata)"}[e]}getPackageFeatures(e){return{pymupdf:["PDF to Text","PDF to Markdown","PDF to SVG","PDF to Images (High Quality)","PDF to DOCX","PDF to Excel/CSV","Extract Images","Extract Tables","EPUB/MOBI/FB2/XPS/CBZ to PDF","Image Compression","Deskew PDF","PDF Layers"],ghostscript:["PDF/A Conversion","Font to Outline"],cpdf:["Merge PDF","Alternate Merge","Split by Bookmarks","Table of Contents","PDF to JSON","JSON to PDF","Add/Edit/Extract Attachments","Edit Bookmarks","PDF Metadata"]}[e]}},v=new w;function x(e,t){const r=v.getPackageDisplayName(e),n=v.getPackageFeatures(e),s=document.createElement("div");s.className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4",s.id="wasm-required-modal";const o=document.createElement("div");o.className="bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-700",o.innerHTML=`
    <div class="p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
          <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-white">Advanced Feature Required</h3>
          <p class="text-sm text-gray-400">External processing module needed</p>
        </div>
      </div>

      <p class="text-gray-300 mb-4">
        This feature requires <strong class="text-white">${r}</strong> to be configured.
      </p>

      <div class="bg-gray-700/50 rounded-lg p-4 mb-4">
        <p class="text-sm text-gray-400 mb-2">Features enabled by this module:</p>
        <ul class="text-sm text-gray-300 space-y-1">
          ${n.slice(0,4).map(a=>`<li class="flex items-center gap-2"><span class="text-green-400">✓</span> ${a}</li>`).join("")}
          ${n.length>4?`<li class="text-gray-500">+ ${n.length-4} more...</li>`:""}
        </ul>
      </div>

      <p class="text-xs text-gray-500 mb-4">
        This module is licensed under AGPL-3.0. By configuring it, you agree to its license terms.
      </p>
    </div>

    <div class="border-t border-gray-700 p-4 flex gap-3">
      <button id="wasm-modal-cancel" class="flex-1 px-4 py-2.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors font-medium">
        Cancel
      </button>
      <button id="wasm-modal-configure" class="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 transition-all font-medium">
        Configure
      </button>
    </div>
  `,s.appendChild(o),document.body.appendChild(s);const d=o.querySelector("#wasm-modal-cancel"),h=o.querySelector("#wasm-modal-configure"),i=()=>{s.remove()};d?.addEventListener("click",i),s.addEventListener("click",a=>{a.target===s&&i()}),h?.addEventListener("click",()=>{i(),t?t():window.location.href="./wasm-settings.html"})}export{x as n,v as t};
