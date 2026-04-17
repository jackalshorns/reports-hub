/* Inline Edit — hosted JS (v1) */
(function() {
  'use strict';
  window.pendingEdits = []; window.doneItems = [];
  function initInlineEdit() {
    document.querySelectorAll('[data-editable="true"]').forEach(function(el) {
      el.addEventListener('click', function() {
        if (el.querySelector('textarea')) return;
        var original = el.textContent.trim();
        var rt = el.dataset.recordType || 'unknown', rid = el.dataset.recordId || 'unknown';
        var esc = original.replace(/'/g, "\\'");
        el.innerHTML = '<textarea class="edit-textarea">' + original + '</textarea>' +
          '<div class="edit-actions"><button class="edit-save" onclick="event.stopPropagation();window.saveEdit(this,\'' + rt + '\',\'' + rid + '\',\'' + esc + '\')">\uD83D\uDCBE Save</button>' +
          '<button class="edit-cancel" onclick="event.stopPropagation();window.cancelEdit(this,\'' + esc + '\')">\u274C Cancel</button></div>';
        el.querySelector('textarea').focus();
      });
    });
    document.querySelectorAll('[data-done-target]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var target = document.querySelector(btn.dataset.doneTarget);
        if (target) {
          var inner = target.querySelector('[data-record-type]');
          var rt = inner ? inner.dataset.recordType : 'unknown';
          var rid = inner ? inner.dataset.recordId : 'unknown';
          var title = target.textContent.trim();
          target.style.display = 'none';
          window.doneItems.push({ rt: rt, rid: rid, title: title });
          updateSync();
        }
      });
    });
  }
  window.saveEdit = function(btn, rt, rid, original) {
    var c = btn.closest('[data-editable="true"]');
    var ta = c.querySelector('textarea');
    var t = ta ? ta.value.trim() : original;
    c.textContent = t;
    window.pendingEdits.push({ rt: rt, rid: rid, original: original, newText: t });
    updateSync();
  };
  window.cancelEdit = function(btn, original) { btn.closest('[data-editable="true"]').textContent = original; };
  function updateSync() {
    var total = window.pendingEdits.length + window.doneItems.length;
    var b = document.getElementById('sync-float-btn');
    if (!b) {
      b = document.createElement('button'); b.id = 'sync-float-btn';
      b.onclick = copySync; document.body.appendChild(b);
    }
    b.textContent = '\uD83D\uDD04 Sync ' + total + ' change' + (total !== 1 ? 's' : '');
    b.style.display = total > 0 ? 'block' : 'none';
  }
  function copySync() {
    var p = 'Please sync the following changes from my morning brief:\n\n';
    if (window.pendingEdits.length) { p += 'EDITS:\n'; window.pendingEdits.forEach(function(e) { p += '- [' + e.rt + ' id:' + e.rid + '] Updated: "' + e.newText + '"\n'; }); }
    if (window.doneItems.length) { p += '\nDONE:\n'; window.doneItems.forEach(function(d) { p += '- [' + d.rt + ' id:' + d.rid + '] Mark complete\n'; }); }
    p += '\nRun these updates now.';
    navigator.clipboard.writeText(p).then(function() { showToast('\uD83D\uDCCB Sync prompt copied'); });
  }
  function showToast(msg) {
    var t = document.getElementById('sync-toast');
    if (!t) { t = document.createElement('div'); t.id = 'sync-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.style.opacity = '1';
    setTimeout(function() { t.style.opacity = '0'; }, 3000);
  }
  document.addEventListener('DOMContentLoaded', initInlineEdit);
})();
