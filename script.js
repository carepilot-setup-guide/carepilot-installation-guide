// Pause every <video> on the page (called whenever the visible section/tab changes,
// so a playing video doesn't keep running with audio once it's scrolled out of view)
function pauseAllVideos() {
  document.querySelectorAll('video').forEach(v => v.pause());
}

// Generic tab switcher: buttons with [data-attr] toggle sibling panels with [data-attr]
function setupTabs(tabsWrap, panelSelector, dataAttr) {
  if (!tabsWrap) return;
  const buttons = tabsWrap.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      pauseAllVideos();
      const value = btn.getAttribute(dataAttr);
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll(panelSelector).forEach(panel => {
        panel.classList.toggle('active', panel.getAttribute(dataAttr) === value);
      });
    });
  });
}

setupTabs(document.getElementById('videoTabs'), '.video-panel', 'data-video');
setupTabs(document.getElementById('docTabs'), '.doc-panel', 'data-doc');
setupTabs(document.getElementById('useVideoTabs'), '.video-wrap[data-use-video]', 'data-use-video');

// Custom "expand" button: enlarges the video in place using a fixed overlay
// instead of the browser Fullscreen API, which can be blocked when the page
// is embedded in an iframe (e.g. a published Artifact preview).
document.querySelectorAll('.video-expand-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const wrap = btn.closest('.video-wrap');
    const expanded = wrap.classList.toggle('video-expanded');
    btn.textContent = expanded ? '✕' : '⛶';
    btn.setAttribute('aria-label', expanded ? 'Collapse video' : 'Expand video');
    document.body.style.overflow = expanded ? 'hidden' : '';
  });
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.video-wrap.video-expanded').forEach(wrap => {
    wrap.classList.remove('video-expanded');
    const btn = wrap.querySelector('.video-expand-btn');
    if (btn) {
      btn.textContent = '⛶';
      btn.setAttribute('aria-label', 'Expand video');
    }
  });
  document.body.style.overflow = '';
});

// Step layout: vertical step list on the left switches the slide on the right
function setupStepLayout(layoutEl) {
  const stepLinks = layoutEl.querySelectorAll('.step-link');
  const slides = layoutEl.querySelectorAll('.slide');

  stepLinks.forEach((link, i) => {
    link.addEventListener('click', () => {
      stepLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      slides.forEach(s => s.classList.remove('active'));
      slides[i].classList.add('active');
    });
  });
}

document.querySelectorAll('.step-layout').forEach(setupStepLayout);

// Screenshot slider: prev/next + dots, paired with a lightbox for full-size viewing
function setupScreenshotSlider(sliderEl) {
  const controls = sliderEl.nextElementSibling;
  if (!controls || !controls.classList.contains('slider-controls')) return;

  const slides = sliderEl.querySelectorAll('.screenshot-slide');
  const dotsWrap = controls.querySelector('.slider-dots');
  const prevBtn = controls.querySelector('.prev-slide');
  const nextBtn = controls.querySelector('.next-slide');
  let current = 0;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to step ' + (i + 1));
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  function goTo(index) {
    slides[current].classList.remove('active');
    dotsWrap.children[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dotsWrap.children[current].classList.add('active');
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
}

document.querySelectorAll('.screenshot-slider').forEach(setupScreenshotSlider);

// Lightbox: click any screenshot to view it full-size
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt || '';
  lightbox.hidden = false;
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImg.src = '';
}

document.querySelectorAll('.screenshot-frame').forEach(frame => {
  frame.addEventListener('click', () => {
    openLightbox(frame.querySelector('img').src, frame.dataset.alt);
  });
});

if (lightbox) {
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });
}

// FAQ accordion
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    trigger.parentElement.classList.toggle('open');
  });
});

// FAQ search
const faqSearch = document.getElementById('faqSearch');
const faqAccordion = document.getElementById('faqAccordion');
const faqNoResults = document.getElementById('faqNoResults');

if (faqSearch && faqAccordion) {
  faqSearch.addEventListener('input', () => {
    const query = faqSearch.value.trim().toLowerCase();
    let visibleCount = 0;
    let currentCategory = null;
    let categoryHasMatch = false;

    Array.from(faqAccordion.children).forEach(el => {
      if (el.classList.contains('accordion-category')) {
        if (currentCategory) currentCategory.classList.toggle('faq-hidden', !categoryHasMatch);
        currentCategory = el;
        categoryHasMatch = false;
        return;
      }
      const text = el.textContent.toLowerCase();
      const matches = text.includes(query);
      el.classList.toggle('faq-hidden', !matches);
      el.classList.toggle('open', matches && query.length > 0);
      if (matches) {
        visibleCount++;
        categoryHasMatch = true;
      }
    });
    if (currentCategory) currentCategory.classList.toggle('faq-hidden', !categoryHasMatch);

    faqNoResults.hidden = visibleCount > 0;
  });
}

// Sidebar navigation: switch which top-level section is visible
const sidebarLinks = document.querySelectorAll('.sidebar-link');
const topSections = document.querySelectorAll('.content > .section');

sidebarLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    pauseAllVideos();
    const targetId = link.getAttribute('href').slice(1);

    sidebarLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    topSections.forEach(section => {
      section.classList.toggle('active', section.id === targetId);
    });

    document.body.dataset.activeSection = targetId;

    window.scrollTo({ top: 0, behavior: 'auto' });
  });
});

// Set the initial background tint to match whichever section starts active
const initialSection = document.querySelector('.content > .section.active');
if (initialSection) {
  document.body.dataset.activeSection = initialSection.id;
}
