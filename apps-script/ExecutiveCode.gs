// 임원 설문 서버. 마무리 응답만 익명 포스트잇으로 공개하며 실습기록은 공개하지 않습니다.
const VOTES = '임원설문응답';
const WORKSHOP = '실습기록';
const FIELDS = ['taskName','taskPain','taskStart','taskEnd','asIsStep1','asIsStep2','asIsStep3','asIsStep4','prompt12','review13'];

// 스프레드시트에 연결된 편집기에서 배포 전 한 번 실행합니다.
function setup() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error('스프레드시트에서 확장 프로그램 → Apps Script를 열어 실행하세요.');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', book.getId());
  SpreadsheetApp.openById(book.getId());
}
function sheet_(name, headers) {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('관리자가 setup 함수를 실행해야 합니다.');
  const book = SpreadsheetApp.openById(id);
  let sheet = book.getSheetByName(name);
  if (!sheet) { sheet = book.insertSheet(name); sheet.appendRow(headers); sheet.setFrozenRows(1); }
  return sheet;
}
function result_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function clean_(value, max) {
  let text = String(value == null ? '' : value).slice(0, max);
  // 시트에서 수식으로 실행되지 않도록 보호합니다.
  if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
  return text;
}
function upsert_(sheet, id, row) {
  const last = sheet.getLastRow();
  let target = 0;
  if (last > 1) {
    const ids = sheet.getRange(2, 1, last - 1, 1).getValues();
    const index = ids.findIndex(r => String(r[0]) === id);
    if (index >= 0) target = index + 2;
  }
  if (target) sheet.getRange(target, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);
}
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const body = JSON.parse(e.postData.contents);
    lock.waitLock(30000);
    try {
      if (body.action === 'resetReflections') {
        const password = PropertiesService.getScriptProperties().getProperty('POLL_RESET_PASSWORD');
        if (!password) throw new Error('강사용 초기화 비밀번호가 설정되지 않았습니다.');
        if (String(body.password || '') !== password) throw new Error('비밀번호가 맞지 않습니다.');
        const notes = sheet_('임원마무리응답', ['참여ID','수정시각','우선 확인할 업무','팀장에게 할 첫 질문']);
        const last = notes.getLastRow();
        if (last > 1) {
          const rows = notes.getRange(2,1,last-1,4).getValues().filter(r => r[0]);
          if (rows.length) {
            const archive = sheet_('임원마무리응답_보관', ['초기화 시각','참여ID','수정시각','우선 확인할 업무','팀장에게 할 첫 질문']);
            const now = new Date();
            archive.getRange(archive.getLastRow()+1,1,rows.length,5).setValues(rows.map(row => [now].concat(row)));
            SpreadsheetApp.flush();
          }
          notes.getRange(2,1,last-1,4).clearContent();
        }
        return result_({ok:true});
      }
      if (body.action === 'resetPoll') {
        const password = PropertiesService.getScriptProperties().getProperty('POLL_RESET_PASSWORD');
        if (!password) throw new Error('강사용 초기화 비밀번호가 설정되지 않았습니다.');
        if (String(body.password || '') !== password) throw new Error('비밀번호가 맞지 않습니다.');
        const votes = sheet_(VOTES, ['참여ID','수정시각','선택번호']);
        const last = votes.getLastRow();
        if (last > 1) {
          const rows = votes.getRange(2, 1, last - 1, 3).getValues();
          const archive = sheet_('임원설문응답_보관', ['초기화 시각','참여ID','수정시각','선택번호']);
          const now = new Date();
          archive.getRange(archive.getLastRow() + 1, 1, rows.length, 4).setValues(rows.map(row => [now].concat(row)));
          SpreadsheetApp.flush();
          votes.getRange(2, 1, last - 1, 3).clearContent();
        }
        return result_({ok:true});
      }
      const id = String(body.id || '');
      if (!/^[a-f0-9-]{20,50}$/i.test(id)) throw new Error('잘못된 참여 식별자');
      if (body.action === 'vote') {
        const choice = Number(body.choice);
        if (!Number.isInteger(choice) || choice < 1 || choice > 4) throw new Error('잘못된 선택');
        upsert_(sheet_(VOTES, ['참여ID','수정시각','선택번호']), id, [id, new Date(), choice]);
      } else if (body.action === 'reflection') {
        const work = String(body.work || '').trim(), question = String(body.question || '').trim();
        if (!work || !question) throw new Error('두 질문에 모두 답변해 주세요.');
        if (work.length > 400 || question.length > 400) throw new Error('각 답변은 400자 이내로 작성해 주세요.');
        upsert_(sheet_('임원마무리응답', ['참여ID','수정시각','우선 확인할 업무','팀장에게 할 첫 질문']), id, [id, new Date(), clean_(work,400), clean_(question,400)]);
      } else if (body.action === 'workshop') {
        const values = body.values || {};
        const headers = ['참여ID','수정시각','업무명','반복 어려움','시작','종료','1단계','2단계','3단계','4단계','분석 프롬프트','AI 결과 검토'];
        upsert_(sheet_(WORKSHOP, headers), id, [id, new Date()].concat(FIELDS.map(k => clean_(values[k], 8000))));
      } else throw new Error('지원하지 않는 요청');
      return result_({ok:true});
    } finally { lock.releaseLock(); }
  } catch (err) { return result_({ok:false,error:String(err.message || err)}); }
}
function doGet(e) {
  try {
    const lock = LockService.getScriptLock(); lock.waitLock(30000);
    try {
      if (e && e.parameter && e.parameter.action === 'reflections') {
        const notes = sheet_('임원마무리응답', ['참여ID','수정시각','우선 확인할 업무','팀장에게 할 첫 질문']);
        const lastNote = notes.getLastRow();
        const rows = lastNote > 1 ? notes.getRange(2,1,lastNote-1,4).getValues().filter(r => r[2] && r[3]) : [];
        rows.sort((a,b) => new Date(b[1]).getTime() - new Date(a[1]).getTime());
        return result_({ok:true, items:rows.map(r => ({work:String(r[2]),question:String(r[3])})), total:rows.length,reflectionResetAvailable:Boolean(PropertiesService.getScriptProperties().getProperty('POLL_RESET_PASSWORD'))});
      }
      const sheet = sheet_(VOTES, ['참여ID','수정시각','선택번호']);
      const counts = [0,0,0,0], last = sheet.getLastRow();
      if (last > 1) sheet.getRange(2, 3, last - 1, 1).getValues().forEach(r => { const i = Number(r[0]) - 1; if (i >= 0 && i < 4) counts[i]++; });
      const resetAvailable = Boolean(PropertiesService.getScriptProperties().getProperty('POLL_RESET_PASSWORD'));
      return result_({ok:true,counts:counts,total:counts.reduce((a,b)=>a+b,0),resetAvailable:resetAvailable});
    } finally { lock.releaseLock(); }
  } catch (err) { return result_({ok:false,error:String(err.message || err)}); }
}
