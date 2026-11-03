(() => {
  const config = window.YUANTA_EXECUTIVE_POLL;
  window.refreshExecutivePoll = async () => {
    const statuses = document.querySelectorAll('[data-exec-status]');
    if (!statuses.length) return;
    if (!config.apiUrl.trim()) { statuses.forEach(e => e.textContent = '설문 서버 연결 준비 중'); return; }
    try {
      const response = await fetch(config.apiUrl + '?action=counts&t=' + Date.now(), {cache:'no-store'});
      const data = await response.json();
      if (!data.ok || !Array.isArray(data.counts) || data.counts.length !== 4) throw Error('집계 오류');
      document.querySelectorAll('[data-exec-count]').forEach(e => { const n = data.counts[Number(e.dataset.execCount)-1] || 0; e.textContent = n + '명 · ' + (data.total ? Math.round(n/data.total*100) : 0) + '%'; });
      document.querySelectorAll('[data-exec-bar]').forEach(e => { const n = data.counts[Number(e.dataset.execBar)-1] || 0; e.style.width = (data.total ? n/data.total*100 : 0) + '%'; });
      document.querySelectorAll('[data-exec-reset]').forEach(e => { e.disabled = data.resetAvailable !== true; e.title = e.disabled ? '강사 초기화 비밀번호 설정 후 사용' : '강사용 비밀번호로 초기화'; });
      statuses.forEach(e => e.textContent = '총 ' + data.total + '명 참여 · 자동 갱신');
    } catch (_) { statuses.forEach(e => e.textContent = '집계 연결 실패 · 다시 시도해 주세요'); }
  };
  window.resetExecutivePoll = async () => {
    if (!confirm('모든 설문 집계를 초기화하시겠습니까? 기존 응답은 보관 시트로 이동합니다.')) return;
    const password = prompt('강사용 초기화 비밀번호를 입력해 주세요.');
    if (!password) return;
    try {
      const response = await fetch(config.apiUrl, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({action:'resetPoll', password})});
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || '초기화 실패');
      await window.refreshExecutivePoll();
      alert('설문 집계를 초기화했습니다.');
    } catch (error) { alert('초기화하지 못했습니다: ' + error.message); }
  };
  setInterval(window.refreshExecutivePoll, config.refreshMs || 8000);
})();

