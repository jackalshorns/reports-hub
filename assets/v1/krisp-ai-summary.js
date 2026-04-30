/* Krisp AI Summary — hosted JS (v1) */
(function() {
  'use strict';
  /* Hardcoded fallback — used only if prompts.json fetch fails. Keep minimal. */
  var KRISP_PROMPTS = {
    generic: { icon: '\uD83D\uDCDD', name: 'Generic', desc: 'Basic meeting summary (fallback)', text: 'Summarize this meeting. Structure: **Key Points**, **Decisions**, **Action Items** (owner + deadline), **Open Questions**. Be specific \u2014 quote or paraphrase precisely, do not invent details.' }
  };
  var ORDER = ['generic'];
  var PROMPTS_URL = 'https://reports-hub.pages.dev/assets/v1/prompts.json';
  function loadPrompts() {
    return fetch(PROMPTS_URL, { cache: 'no-cache' })
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(list) {
        if (!Array.isArray(list) || !list.length) throw new Error('empty');
        var map = {}, order = [];
        list.forEach(function(p) { if (p && p.key && p.text) { map[p.key] = { icon: p.icon || '', name: p.name || p.key, desc: p.desc || '', text: p.text }; order.push(p.key); } });
        if (order.length) { KRISP_PROMPTS = map; ORDER = order; }
      })
      .catch(function() { /* fall back to hardcoded Generic */ });
  }
  function storageKey() {
    var f = document.querySelector('.mtg-card[data-date]');
    var d = f ? f.getAttribute('data-date') : new Date().toISOString().slice(0,10);
    return 'mb-summaries-' + d;
  }
  function load() { try { return JSON.parse(localStorage.getItem(storageKey()) || '{}'); } catch(e) { return {}; } }
  function save(mid, text) { var s = load(); s[mid] = { text: text, savedAt: new Date().toISOString() }; localStorage.setItem(storageKey(), JSON.stringify(s)); }
  function initKrisp() {
    var saved = load();
    document.querySelectorAll('.krisp-ai-section[data-for-mtg]').forEach(function(sec) {
      var mid = sec.getAttribute('data-for-mtg');
      var card = document.getElementById(mid); if (!card) return;
      var kid = card.getAttribute('data-krisp-id') || ''; if (!kid) return;
      var type = card.getAttribute('data-mtg-type') || 'client';
      var h = '<div class="krisp-ai-bar">';
      h += '<button class="krisp-ai-btn" data-action="get-summary" data-mtg="'+mid+'">\uD83D\uDCAC Get AI Summary</button>';
      h += '<button class="krisp-ai-btn paste-btn" data-action="paste-summary" data-mtg="'+mid+'">\uD83D\uDCCB Paste Summary</button>';
      h += '<button class="krisp-ai-btn publish-btn" data-action="publish-copper" data-mtg="'+mid+'">\uD83D\uDD36 Publish to Copper</button>';
      h += '<span class="krisp-ai-status" id="kai-status-'+mid+'"></span></div>';
      h += '<div class="krisp-prompt-selector" id="kai-prompts-'+mid+'">';
      h += '<div style="font-size:11px;color:#6b7280;margin:4px 0 6px;">Choose a prompt:</div>';
      ORDER.forEach(function(k) {
        var p = KRISP_PROMPTS[k]; var rec = (k === type);
        h += '<div class="krisp-prompt-option'+(rec?' recommended':'')+'" data-action="copy-prompt" data-mtg="'+mid+'" data-prompt-type="'+k+'" data-krisp-id="'+kid+'">';
        h += '<span style="font-size:16px;">'+p.icon+'</span>';
        h += '<div><div style="font-size:13px;font-weight:600;color:#e5e7eb;">'+p.name+(rec?' <span style="font-size:9px;background:rgba(167,139,250,0.2);color:#c084fc;padding:1px 6px;border-radius:99px;">recommended</span>':'')+'</div>';
        h += '<div style="font-size:12px;color:#6b7280;">'+p.desc+'</div></div></div>';
      });
      h += '</div>';
      h += '<div class="krisp-paste-panel" id="kai-paste-'+mid+'">';
      h += '<textarea class="krisp-paste-area" id="kai-text-'+mid+'" placeholder="Paste Krisp AI summary here..."></textarea>';
      h += '<div class="krisp-paste-actions"><button class="krisp-paste-save" data-action="save-summary" data-mtg="'+mid+'">\u2705 Save</button>';
      h += '<button class="krisp-paste-cancel" data-action="cancel-paste" data-mtg="'+mid+'">Cancel</button></div></div>';
      h += '<div class="krisp-ai-saved" id="kai-saved-'+mid+'"><span class="krisp-badge">\u2728 Krisp AI Summary</span><div class="krisp-text" id="kai-savedtext-'+mid+'"></div></div>';
      sec.innerHTML = h;
      if (saved[mid] && saved[mid].text) showSaved(mid, saved[mid].text);
    });
    document.addEventListener('click', handleClick);
  }
  function handleClick(e) {
    var b = e.target.closest('[data-action]'); if (!b) return;
    var a = b.getAttribute('data-action'); var mid = b.getAttribute('data-mtg');
    if (a === 'get-summary') { var el = document.getElementById('kai-prompts-'+mid); if (el) el.classList.toggle('visible'); }
    else if (a === 'copy-prompt') {
      var p = KRISP_PROMPTS[b.getAttribute('data-prompt-type')]; var kid = b.getAttribute('data-krisp-id');
      navigator.clipboard.writeText(p.text).then(function() {
        setStatus(mid, '\uD83D\uDCCB Prompt copied \u2014 opening Krisp', '#c084fc');
        if (kid) window.open('https://app.krisp.ai/t/'+kid, '_blank');
        var el = document.getElementById('kai-prompts-'+mid); if (el) el.classList.remove('visible');
      });
    }
    else if (a === 'paste-summary') { var p = document.getElementById('kai-paste-'+mid); if (p) { p.classList.toggle('visible'); var t = document.getElementById('kai-text-'+mid); if (t && p.classList.contains('visible')) t.focus(); } }
    else if (a === 'save-summary') {
      var ta = document.getElementById('kai-text-'+mid); var txt = ta ? ta.value.trim() : '';
      if (!txt) return;
      save(mid, txt); showSaved(mid, txt);
      var p = document.getElementById('kai-paste-'+mid); if (p) p.classList.remove('visible');
      setStatus(mid, '\u2713 Summary saved', '#4ade80');
    }
    else if (a === 'cancel-paste') { var p = document.getElementById('kai-paste-'+mid); if (p) p.classList.remove('visible'); }
    else if (a === 'publish-copper') {
      var card = document.getElementById(mid); if (!card) return;
      var title = card.getAttribute('data-mtg-title') || ''; var date = card.getAttribute('data-date') || ''; var parts = card.getAttribute('data-mtg-participants') || '';
      var s = load(); var has = s[mid] && s[mid].text; var sum = has ? s[mid].text : '(no summary yet)';
      var payload = 'KRISP-TO-COPPER\nTitle: '+title+'\nDate: '+date+'\nParticipants: '+parts+'\nSource: '+(has?'Krisp AI summary':'No summary')+'\n\nSummary:\n'+sum;
      navigator.clipboard.writeText(payload).then(function() { setStatus(mid, '\uD83D\uDCCB Copper payload copied', '#fbbf24'); });
    }
  }
  function showSaved(mid, text) {
    var s = document.getElementById('kai-saved-'+mid); var t = document.getElementById('kai-savedtext-'+mid);
    if (s && t) { t.textContent = text; s.classList.add('visible'); }
  }
  function setStatus(mid, msg, color) { var el = document.getElementById('kai-status-'+mid); if (el) { el.textContent = msg; el.style.color = color || '#6b7280'; } }
  document.addEventListener('DOMContentLoaded', function() { loadPrompts().then(initKrisp); });
})();
