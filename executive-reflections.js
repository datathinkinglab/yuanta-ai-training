(() => {
  let busy = false;
  let requestId = 0;
  window.refreshExecutiveReflections = async () => {
    const wall = document.querySelector('[data-reflection-wall]');
    if (!wall || busy) return;
    const current = ++requestId;
    const status = document.querySelector('[data-reflection-status]');
    const api = (window.YUANTA_EXECUTIVE_POLL?.apiUrl || '').trim();
    if (!api) { status.textContent = '설문 서버 연결 준비 중'; return; }
    busy = true;
    try {
      const response = await fetch(api + '?action=reflections&t=' + Date.now(), {cache:'no-store'});
      const data = await response.json();
      if (!data.ok || !Array.isArray(data.items)) throw Error('마무리 설문 서버 업데이트가 필요합니다.');
      if (current !== requestId || !wall.isConnected) return;
      status.textContent = '총 ' + data.total + '개 응답 · 자동 갱신';
      wall.replaceChildren();
      if (!data.items.length) { const empty = document.createElement('p'); empty.textContent = 'QR로 두 질문에 답하면 이곳에 포스트잇이 나타납니다.'; empty.style.cssText = 'grid-column:1/-1;color:var(--gray-600);font-size:20px;padding:24px;'; wall.append(empty); }
      const colors = ['#FFF1AC','#D9F4ED','#FCE1E9','#E5E6FF'];
      data.items.forEach((item,index) => {
        const note = document.createElement('article');
        note.style.cssText = 'background:'+colors[index%colors.length]+';padding:20px;border-radius:4px 4px 18px 4px;box-shadow:2px 5px 12px #101d3518;border-top:6px solid #ffffff88;min-width:0;overflow-wrap:anywhere;white-space:pre-wrap;';
        const tag = document.createElement('div'); tag.textContent = '우선 확인할 업무'; tag.style.cssText='font-size:14px;font-weight:800;color:#4b5563;margin-bottom:8px;';
        const work = document.createElement('div'); work.textContent = String(item.work || ''); work.style.cssText='font-size:21px;font-weight:800;line-height:1.5;color:#101d35;';
        const label = document.createElement('div'); label.textContent = '팀장에게 할 첫 질문'; label.style.cssText='font-size:14px;font-weight:800;color:#4b5563;margin-top:18px;margin-bottom:8px;';
        const question = document.createElement('div'); question.textContent = String(item.question || ''); question.style.cssText='font-size:19px;line-height:1.55;color:#101d35;';
        note.append(tag,work,label,question);wall.append(note);
      });
    } catch(error) { if(wall.isConnected) status.textContent = error.message.includes('업데이트') ? error.message : '응답을 불러오지 못했습니다. 새로고침해 주세요.'; }
    finally { busy = false; }
  };
  const container = document.getElementById('slide-container');
  if (container) new MutationObserver(() => { if(container.querySelector('[data-reflection-wall]')) refreshExecutiveReflections(); }).observe(container,{childList:true});
  setInterval(refreshExecutiveReflections,8000);
  refreshExecutiveReflections();
})();