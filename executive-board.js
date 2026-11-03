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
  const examples = {
    1: {question:'2026년 상반기 세 회사의 수익성과 재무 규모는 어떻게 다르며, 어떤 원인을 추가로 확인해야 하는가?', facts:'[작성 구조 예시] 연결 영업이익·당기순이익과 자산·자본을 비교합니다. 회사별 실제 수치와 차이는 원문 확인 필요.', followup:'부문별 수익 기여, 일회성 손익과 연결 범위 차이가 비교 결과에 미친 영향은 확인 필요.', source:'2026년 6월 유안타증권·한화투자증권·대신증권 반기보고서 핵심발췌본의 연결 재무제표. 수치별 원문 페이지는 확인 필요.'},
    2: {audience:'경영진·임원회의 참석자', purpose:'세 회사의 상반기 실적 차이와 추가 확인 과제를 한눈에 파악', sections:'핵심 질문·3사 비교표·확인된 사실·해석과 확인 필요 사항·후속 질문·출처', feature:'확인 필요 항목을 노란색 배지로 강조', display:'큰 글씨·간결한 카드 배치·2026년 상반기와 금액 단위 명시'}
  };
  window.applyBoardExample = step => {
    const example = examples[step];
    if (!example) return;
    Object.assign(values, example);
    document.querySelectorAll('[data-board-field]').forEach(input => {
      if (Object.hasOwn(example, input.dataset.boardField)) input.value = values[input.dataset.boardField];
    });
    try { localStorage.setItem(key, JSON.stringify(values)); } catch (_) {}
    document.querySelectorAll('[data-board-prompt]').forEach(node => node.textContent = buildBoardPrompt());
    document.querySelectorAll('[data-board-example-status]').forEach(node => node.textContent = '작성예시를 적용했습니다. 내용을 수정한 뒤 3단계에서 프롬프트를 확인하세요.');
  };
  document.addEventListener('input', event => {
    const name = event.target.dataset.boardField;
    if (!Object.hasOwn(defaults, name)) return;
    values[name] = event.target.value;
    try { localStorage.setItem(key, JSON.stringify(values)); } catch (_) {}
    document.querySelectorAll('[data-board-prompt]').forEach(node => node.textContent = buildBoardPrompt());
  });
})();
