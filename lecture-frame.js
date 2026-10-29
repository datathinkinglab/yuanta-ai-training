// Shared presentation chrome, matching the executive deck. Content and popup handlers stay in each deck.
(() => {
  const team = document.body.dataset.course === 'team';
  const stage = team ? document.getElementById('slide-stage') : document.getElementById('presentation-wrapper');
  if (!team) {
    document.querySelector('body > header')?.remove();
    document.getElementById('read-all-wrapper').style.display = 'none';
  }
  const oldHeader = team && document.getElementById('slide-header');
  const oldBody = team && document.getElementById('slide-body');
  const oldFooter = team && document.getElementById('slide-footer');
  oldHeader && oldHeader.remove(); oldBody && oldBody.remove(); oldFooter && oldFooter.remove();
  if (!team) stage.replaceChildren();
  stage.className = 'unified-stage';
  stage.insertAdjacentHTML('afterbegin', '<div class="unified-slide"><header class="unified-header"></header><main class="unified-body"></main><footer class="unified-footer"></footer></div>');
  const frame = stage.querySelector('.unified-slide');
  const head = frame.querySelector('header'), body = frame.querySelector('main'), foot = frame.querySelector('footer');
  const reading = document.createElement('section');
  reading.className = 'unified-reading'; document.body.append(reading);
  let read = false;
  const index = () => team ? currentIndex : currentSlideIndex;
  const dark = s => team ? s.theme === 'navy' : ['cover','divider'].includes(s.type);
  const title = s => team ? getSlideShortTitle(s.page) : s.title;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function header(s) {
    const steps = team ? JOURNEY_STEPS : ['질문','분석','제작','코칭','실행'];
    return `<div class="unified-module"><b>${esc(team ? s.module : s.module.split('.')[0])}</b><span>${esc(team ? s.moduleTitle : s.module)}</span></div><div class="unified-journey">${steps.map(st => `<span class="${st === s.journey ? 'active' : ''}">${esc(st)}</span>`).join('<i>›</i>')}</div>`;
  }
  const originalBuild = !team && buildSlideHTML;
  function content(s) {
    if (team) return s.render();
    if (dark(s) || s.type === 'break') {
      const temp = document.createElement('div'); temp.innerHTML = originalBuild(s);
      const root = temp.firstElementChild;
      root.firstElementChild?.remove(); root.lastElementChild?.remove();
      root.style.height = '100%';
      return root.outerHTML;
    }
    return `<div class="unified-title"><h2>${esc(s.title)}</h2><p>${esc(s.body)}</p></div><div class="unified-content">${s.renderContent ? s.renderContent() : ''}</div>${s.footerNote ? `<div class="unified-note">💡 ${esc(s.footerNote)}</div>` : ''}`;
  }
  function render() {
    const s = SLIDES[index()];
    stage.classList.toggle('unified-dark', dark(s));
    head.hidden = dark(s); head.innerHTML = header(s);
    body.innerHTML = content(s); body.scrollTop = 0;
    foot.innerHTML = `<div class="unified-left"><button onclick="lectureFrame.toc()">☰ 목차 · 모듈 이동</button><button onclick="lectureFrame.print()">🖨️ PDF 출력</button><button class="unified-fullscreen" onclick="lectureFrame.fullscreen()">${document.fullscreenElement ? '🗗 전체화면 종료' : '⛶ 전체화면 보기'}</button><button onclick="lectureFrame.read()">전체 읽기</button></div><div class="unified-copyright">© 2026 Data Thinking Lab. All rights reserved</div><div class="unified-right"><button id="btn-prev" onclick="lectureFrame.move(-1)" ${index() === 0 ? 'disabled' : ''}>◀ 이전</button><span id="page-indicator"><strong>${String(index()+1).padStart(2,'0')}</strong> / ${SLIDES.length}</span><button id="btn-next" onclick="lectureFrame.move(1)" ${index() === SLIDES.length-1 ? 'disabled' : ''}>다음 ▶</button></div>`;
    if (team) foot.querySelector('.unified-left').insertAdjacentHTML('beforeend','<button onclick="openPopup(\'commonData\')">공통 자료</button>');
  }
  function scale() {
    stage.style.setProperty('--stage-scale', Math.min(innerWidth / 1600, innerHeight / 900) * .98);
  }
  function showReading(printing = false) {
    reading.innerHTML = `<div class="reading-toolbar"><button onclick="lectureFrame.read()">슬라이드로 돌아가기</button></div>` + SLIDES.map((s,i) => `<article class="reading-slide ${dark(s) ? 'unified-dark' : ''}" data-page="${i}">${dark(s) ? '' : `<header class="unified-header">${header(s)}</header>`}<main class="unified-body">${content(s)}</main><div class="reading-page">${i+1} / ${SLIDES.length}</div></article>`).join('');
    document.body.classList.add('unified-read'); read = true;
    if (!printing) reading.querySelector(`[data-page="${index()}"]`).scrollIntoView();
  }
  window.lectureFrame = {
    move(delta) { team ? (delta < 0 ? prevSlide() : nextSlide()) : changeSlide(delta); },
    toc() { team ? openToc() : (initTocGrid(), openModal('modal-toc',document.activeElement)); },
    fullscreen() { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); },
    read() { if (read) { read = false; document.body.classList.remove('unified-read'); reading.replaceChildren(); render(); } else showReading(); },
    print() { showReading(true); window.print(); }
  };
  if (team) renderSlide = render; else renderCurrentSlide = render;
  window.addEventListener('resize', scale);
  document.addEventListener('fullscreenchange', () => { const b = foot.querySelector('.unified-fullscreen'); if(b) b.textContent = document.fullscreenElement ? '🗗 전체화면 종료' : '⛶ 전체화면 보기'; });
  window.addEventListener('keydown', e => {
    if (read && ['ArrowLeft','ArrowRight','PageUp','PageDown'].includes(e.key)) e.stopImmediatePropagation();
    if (read && e.key === 'Escape') { lectureFrame.read(); e.stopImmediatePropagation(); }
  }, true);
  window.addEventListener('beforeprint', () => { if (!read) showReading(true); });
  window.addEventListener('afterprint', () => { if (read) lectureFrame.read(); });
  scale(); render();
})();
