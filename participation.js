(function () {
  const api = (window.YUANTA_PARTICIPATION.apiUrl || '').trim();
  const labels = ['① 자료 취합 (여러 경로로 흩어진 원자료 수집 지연)', '② 요청 내용 재확인 (요청 범위나 기준이 모호해 다시 질문)', '③ 검토 대기 (검토 단계에서 병목 또는 우선순위 혼선)', '④ 수정·재보고 (근거 누락이나 양식 불일치로 반려·재작업)', '⑤ 후속조치 확인 (회의나 보고 이후 실행 완료 여부 파악 어려움)'];
  let id;
  try {
    id = sessionStorage.getItem('yuanta-workshop-id');
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('yuanta-workshop-id', id); }
  } catch (_) { id = crypto.randomUUID(); }
  function message(text) {
    document.querySelectorAll('[data-save-status]').forEach(e => e.textContent = text);
    if (typeof showToast === 'function') showToast(text, true);
    else alert(text);
  }
  async function post(data) {
    if (!api) throw new Error('구글 저장 연결이 아직 설정되지 않았습니다.');
    const response = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || '저장 실패');
    return result;
  }
  window.submitPoll = async function (choice) {
    updateField('poll05', labels[choice - 1]);
    try { await post({ action: 'vote', id, choice }); message('설문 응답이 저장되었습니다.'); await refreshPoll(); }
    catch (e) { message('설문 전송 실패: ' + e.message); }
  };
  window.refreshPoll = async function () {
    const nodes = document.querySelectorAll('[data-poll-status]');
    if (!nodes.length) return;
    if (!api) { nodes.forEach(e => e.textContent = '설문 서버 연결 전'); return; }
    try {
      const res = await fetch(api + '?action=counts&t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || '집계 오류');
      document.querySelectorAll('[data-poll-count]').forEach(e => { const n = data.counts[Number(e.dataset.pollCount) - 1] || 0; e.textContent = n + '명'; });
      nodes.forEach(e => e.textContent = '총 ' + data.total + '명 참여 · 집계 갱신');
    } catch (_) { nodes.forEach(e => e.textContent = '집계 연결 실패 · 다시 시도해 주세요'); }
  };
  const fields = ['taskName','taskPain','taskStart','taskEnd','asIsStep1','asIsStep2','asIsStep3','asIsStep4','review13'];
  let timer, dirty = false, saving = false;
  function saveStatus(text) {
    document.querySelectorAll('[data-save-status]').forEach(el => { el.textContent = text; });
  }
  window.scheduleWorkshopSave = function (key) {
    if (!fields.includes(key)) return;
    dirty = true;
    clearTimeout(timer);
    saveStatus('입력 내용을 저장 중입니다.');
    timer = setTimeout(() => { timer = null; flushWorkshop(); }, 1800);
  };
  async function flushWorkshop() {
    if (!dirty || saving) return;
    saving = true;
    dirty = false;
    const values = Object.fromEntries(fields.map(k => [k, userState[k] || '']));
    values.prompt12 = buildPrompt12();
    try {
      await post({ action: 'workshop', id, values });
      if (!dirty) saveStatus('입력 내용이 저장되었습니다.');
    } catch (e) {
      dirty = true;
      saveStatus('저장 연결을 확인하고 있습니다. 창을 닫지 말아 주세요.');
      clearTimeout(timer);
      timer = setTimeout(() => { timer = null; flushWorkshop(); }, 8000);
    } finally {
      saving = false;
    }
    if (dirty && !timer) timer = setTimeout(() => { timer = null; flushWorkshop(); }, 1800);
  }
  window.addEventListener('beforeunload', e => {
    if (dirty || saving) { e.preventDefault(); e.returnValue = ''; }
  });
  setInterval(refreshPoll, window.YUANTA_PARTICIPATION.refreshMs || 8000);
  setTimeout(refreshPoll, 500);
})();

