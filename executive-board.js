(() => {
  const key = 'yuanta-executive-board-v1';
  const defaults = {question:'', facts:'', followup:'', source:'', audience:'경영진', purpose:'경쟁사 비교 사실 확인 및 후속 질문 점검', sections:'비교표·확인된 사실·추가 질문·출처', feature:'확인 필요 항목 강조 표시', display:'큰 글씨 · 기준일 명시'};
  let values = {...defaults};
  try { const saved = JSON.parse(localStorage.getItem(key) || '{}'); for (const name of Object.keys(defaults)) if (typeof saved[name] === 'string') values[name] = saved[name]; } catch (_) {}
  window.boardEscape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.boardValue = name => boardEscape(values[name] || '');
  window.buildBoardPrompt = () => {
    const content = [['핵심 경영 질문','question'],['반드시 보여줄 확인된 사실','facts'],['추가 확인 사항','followup'],['출처 (문서명·기준일·원문 위치)','source']];
    const requirements = [['사용자','audience'],['화면 목적','purpose'],['필수 영역','sections'],['원하는 기능','feature'],['표시 조건','display']];
    const rows = items => items.map(([label,name]) => label + ': ' + (values[name].trim() || '미입력 — 확인 필요')).join('\n');
    return '앞서 검토한 공시 비교 내용을 바탕으로 경영진용 브리핑 보드를 만들어 주세요. 아래에 작성한 내용과 화면 요구사항을 반영해 주세요.\n\n[1단계: 보드에 넣을 내용]\n' + rows(content) + '\n\n[2단계: 화면 요구사항]\n' + rows(requirements) + '\n\n[제작 원칙]\n브라우저에서 열 수 있는 단일 HTML 파일로 작성하고 외부 라이브러리·폰트·API 호출 없이 동작하게 해 주세요. 분석 질문과 기준일, 비교표, 확인된 사실, 해석과 확인 필요 사항, 경영 질문, 출처를 구분해 주세요. 입력한 사실과 출처를 임의로 바꾸지 말고 자료에 없는 수치나 원인을 만들지 마세요. 미입력 항목은 확인 필요로 표시하고 내용을 추정하지 마세요. HTML 코드 전체를 제공해 주세요.';
  };
  document.addEventListener('input', event => {
    const name = event.target.dataset.boardField;
    if (!Object.hasOwn(defaults, name)) return;
    values[name] = event.target.value;
    try { localStorage.setItem(key, JSON.stringify(values)); } catch (_) {}
    document.querySelectorAll('[data-board-prompt]').forEach(node => node.textContent = buildBoardPrompt());
  });
})();
