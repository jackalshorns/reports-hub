/* Morning Brief — hosted JS (v1)
   Loaded by every brief via <script src="/assets/v1/morning-brief.js"></script>
   Expects window.BRIEF_CONFIG set by an inline <script> before this file loads. */
(function() {
  'use strict';
  var cfg = window.BRIEF_CONFIG || {};
  var BRIEF_DATE = new Date(cfg.date);
  var BRIEF_LOOKBACK_DAYS = cfg.lookbackDays || 1;
  var TODAY_DATE_STR = cfg.date;
  var LB_LABELS = {
    1:  { tab: '\uD83D\uDCFC Yesterday',     hdr: '\uD83D\uDCFC ' + cfg.yesterdayDisplay },
    7:  { tab: '\uD83D\uDCFC Last 7 Days',   hdr: '\uD83D\uDCFC ' + cfg.sevenDayStart + ' \u2013 ' + cfg.yesterdayDisplay + ' \u00B7 Last 7 Days' },
    30: { tab: '\uD83D\uDCFC Last 30 Days',  hdr: '\uD83D\uDCFC ' + cfg.thirtyDayStart + ' \u2013 ' + cfg.yesterdayDisplay + ' \u00B7 Last 30 Days' }
  };
  window.switchTab = function(n) {
    document.querySelectorAll('.tab-content').forEach(function(el) { el.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(el) { el.classList.remove('active'); });
    var tab = document.getElementById('tab-' + n); if (tab) tab.classList.add('active');
    var btns = document.querySelectorAll('.tab-btn'); if (btns[n]) btns[n].classList.add('active');
  };
  window.toggleMtg = function(h) { h.closest('.collapsible-mtg').classList.toggle('collapsed'); };
  window.toggleAttn = function(h) { h.closest('.attn-card').classList.toggle('collapsed'); };
  window.navDate = function(dir) {
    var m = window.location.pathname.match(/(\d{4})-(\d{2})-(\d{2})/); if (!m) return;
    var d = new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3]));
    d.setDate(d.getDate() + dir);
    var y = d.getFullYear(), mo = String(d.getMonth()+1).padStart(2,'0'), da = String(d.getDate()).padStart(2,'0');
    window.location.href = 'https://reports-hub.pages.dev/briefs/' + y + '-' + mo + '-' + da + '.html';
  };
  (function() {
    var m = window.location.pathname.match(/(\d{4}-\d{2}-\d{2})/);
    if (m) {
      var today = new Date().toISOString().split('T')[0];
      if (m[1] >= today) { document.addEventListener('DOMContentLoaded', function() { var btn = document.getElementById('date-nav-next'); if (btn) btn.disabled = true; }); }
    }
  })();
  window.setLookback = function(days, btn) {
    document.querySelectorAll('.lb-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var cutoff = new Date(BRIEF_DATE); cutoff.setDate(cutoff.getDate() - days);
    var cutoffStr = cutoff.toISOString().split('T')[0];
    document.querySelectorAll('[data-date]').forEach(function(el) { el.style.display = (el.dataset.date >= cutoffStr) ? '' : 'none'; });
    var tabBtn = document.getElementById('tab-btn-yesterday'); var secHdr = document.getElementById('tab2-date-hdr');
    if (LB_LABELS[days]) { if (tabBtn) tabBtn.textContent = LB_LABELS[days].tab; if (secHdr) secHdr.textContent = LB_LABELS[days].hdr; }
    var notice = document.getElementById('lookback-notice');
    if (notice) {
      if (days > BRIEF_LOOKBACK_DAYS) {
        var d = days === 7 ? '7 days' : '30 days';
        notice.textContent = '\u26A0\uFE0F This brief captured ' + BRIEF_LOOKBACK_DAYS + ' day' + (BRIEF_LOOKBACK_DAYS !== 1 ? 's' : '') + ' of data. Showing all available. Ask Claude to regenerate for a full ' + d + ' window.';
        notice.style.display = 'block';
      } else { notice.style.display = 'none'; }
    }
  };
  document.addEventListener('DOMContentLoaded', function() {
    var key = 'focus-topics-' + TODAY_DATE_STR;
    var el = document.getElementById('focus-topics-input');
    if (el) { var saved = localStorage.getItem(key); if (saved) el.value = saved; }
  });
  window.saveFocusTopics = function() {
    var key = 'focus-topics-' + TODAY_DATE_STR;
    var el = document.getElementById('focus-topics-input');
    if (el) localStorage.setItem(key, el.value);
  };
  function getStarred() { try { return JSON.parse(localStorage.getItem('hub_starred') || '[]'); } catch(e) { return []; } }
  function setStarredArr(a) { try { localStorage.setItem('hub_starred', JSON.stringify(a)); } catch(e) {} }
  function gid(e) { return (typeof e === 'string') ? e : e.id; }
  function isStarred(id) { return getStarred().some(function(e) { return gid(e) === id; }); }
  function toggleStar(id, meta) {
    var arr = getStarred(); var idx = -1;
    for (var i = 0; i < arr.length; i++) { if (gid(arr[i]) === id) { idx = i; break; } }
    if (idx !== -1) arr.splice(idx, 1); else arr.push(meta || id);
    setStarredArr(arr);
  }
  function makeStar(id, meta, extraCls) {
    var b = document.createElement('button');
    b.className = 'brief-star-btn' + (extraCls ? ' ' + extraCls : '') + (isStarred(id) ? ' starred' : '');
    b.title = 'Star'; b.textContent = '\u2B50';
    b.addEventListener('click', function(e) { e.stopPropagation(); toggleStar(id, meta); b.classList.toggle('starred'); });
    return b;
  }
  function initBriefStars() {
    var bd = TODAY_DATE_STR;
    var navWrap = document.querySelector('.date-nav-wrap');
    if (navWrap) {
      var hubBtn = document.createElement('a');
      hubBtn.href = 'https://reports-hub.pages.dev/'; hubBtn.className = 'brief-hub-btn'; hubBtn.title = 'Reports Hub'; hubBtn.textContent = '\u2600\uFE0F';
      navWrap.insertBefore(hubBtn, navWrap.firstChild);
      var briefId = 'brief:' + bd;
      navWrap.appendChild(makeStar(briefId, { id: briefId, title: 'Daily Brief ' + bd, tag: 'morning' }));
    }
    document.querySelectorAll('.mtg-card[id^="mtg-"]').forEach(function(c) {
      var sid = 'brief:' + bd + '#' + c.id; var title = c.getAttribute('data-mtg-title') || 'Meeting';
      var star = makeStar(sid, { id: sid, title: title, tag: 'morning' });
      var fr = c.querySelector('.mtg-card-header .flex-row');
      if (fr) fr.insertBefore(star, fr.querySelector('.mtg-chevron'));
    });
    document.querySelectorAll('.cal-row[id^="cal-"]').forEach(function(c) {
      var sid = 'brief:' + bd + '#' + c.id; var title = c.getAttribute('data-mtg-title') || 'Meeting';
      var t = c.querySelector('.cal-title'); if (t) t.appendChild(makeStar(sid, { id: sid, title: title, tag: 'morning' }));
    });
    document.querySelectorAll('.attn-card[id^="attn-"]').forEach(function(c) {
      var sid = 'brief:' + bd + '#' + c.id;
      var t = c.querySelector('.attn-card-title'); var title = t ? t.textContent.trim() : 'Attention';
      var hdr = c.querySelector('.attn-card-hdr'); if (hdr) hdr.appendChild(makeStar(sid, { id: sid, title: title, tag: 'morning' }));
    });
    document.querySelectorAll('.update-card[id^="update-"]').forEach(function(c) {
      var sid = 'brief:' + bd + '#' + c.id;
      var t = c.querySelector('.update-title'); var title = t ? t.textContent.trim() : 'Update';
      if (t) t.appendChild(makeStar(sid, { id: sid, title: title, tag: 'morning' }));
    });
    document.querySelectorAll('.drive-card[id^="drive-"]').forEach(function(c) {
      var sid = 'brief:' + bd + '#' + c.id;
      var t = c.querySelector('.drive-title'); var title = t ? t.textContent.trim() : 'File';
      c.appendChild(makeStar(sid, { id: sid, title: title, tag: 'morning' }));
    });
    document.querySelectorAll('.task-row[id^="task-"]').forEach(function(c) {
      var sid = 'brief:' + bd + '#' + c.id;
      var ed = c.querySelector('[data-editable]'); var title = ed ? ed.textContent.trim() : 'Task';
      var doneBtn = c.querySelector('.done-btn');
      var star = makeStar(sid, { id: sid, title: title, tag: 'morning' }, 'brief-star-btn-sm');
      if (doneBtn) c.insertBefore(star, doneBtn); else c.appendChild(star);
    });
  }
  document.addEventListener('DOMContentLoaded', initBriefStars);
})();
