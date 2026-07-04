// ========== 1. GENERATE 100 FRAME STYLES ==========
const frameStyles = [];
const colors = ['#fff', '#f5e6ca', '#2c3e50', '#8e44ad', '#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#e67e22', '#1abc9c'];
const filters = ['none', 'sepia(0.5)', 'grayscale(0.4)', 'contrast(1.2)', 'brightness(1.1)'];
const clips = ['none', 'circle(50%)', 'inset(10% round 30px)', 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', 'inset(0% round 50% 0%)'];

for (let i = 0; i < 100; i++) {
  const c = colors[i % colors.length];
  const f = filters[i % filters.length];
  const cl = clips[i % clips.length];
  const pad = 10 + (i % 20);
  const rot = (i % 7) - 3;
  const shadow = i % 3 === 0 ? '0 8px 30px rgba(0,0,0,0.6)' : 'none';
  const borderW = 4 + (i % 8);
  
  frameStyles.push({
    id: i,
    css: `
      .frame-${i} {
        padding: ${pad}px;
        background: ${c};
        border: ${borderW}px solid ${i % 2 === 0 ? '#000' : c};
        box-shadow: ${shadow};
        transform: rotate(${rot}deg);
        filter: ${f};
        clip-path: ${cl};
        border-radius: ${i % 5 === 0 ? '50%' : '4px'};
        transition: all 0.3s ease;
      }
      /* extra polaroid bottom for some */
      ${i % 8 === 0 ? `.frame-${i} { padding-bottom: 50px; position: relative; }
        .frame-${i}::after { content: "✦ ${i}"; position: absolute; bottom: 12px; left: 0; right: 0; text-align: center; font-size: 14px; color: #888; }` : ''}
    `
  });
}

// Inject frame CSS into head
const styleTag = document.createElement('style');
styleTag.textContent = frameStyles.map(f => f.css).join('\n');
document.head.appendChild(styleTag);

// ========== 2. GENERATE 50 TRANSITIONS (using Swiper Creative Effect) ==========
const transitionConfigs = [];
for (let i = 0; i < 50; i++) {
  const t = i / 50;
  const rotateVal = (i % 7) * 20;
  const translateVal = 100 + (i % 5) * 50;
  transitionConfigs.push({
    name: `Transition ${i+1}`,
    effect: 'creative',
    creativeEffect: {
      prev: {
        translate: [0, 0, -translateVal],
        rotate: [0, 0, rotateVal],
        opacity: 0.3,
      },
      next: {
        translate: [translateVal * 0.6, 0, 0],
        rotate: [0, rotateVal * 0.5, 0],
        opacity: 0.2,
      },
      shadow: true,
    }
  });
}
// Add the native Swiper effects as the first 4 options
transitionConfigs.unshift(
  { name: 'Slide', effect: 'slide' },
  { name: 'Fade', effect: 'fade' },
  { name: 'Cube', effect: 'cube' },
  { name: 'Flip', effect: 'flip' },
  { name: 'Coverflow', effect: 'coverflow' },
  { name: 'Cards', effect: 'cards' }
);

// ========== 3. STATE & DOM REFS ==========
let currentSlideIndex = 0;
let photoFiles = []; // Stores File objects
let slideData = []; // Stores { imgUrl, frameId, text }
let swiperInstance = null;
let currentTransitionIndex = 0;

const slidesWrapper = document.getElementById('slidesWrapper');
const photoInput = document.getElementById('photoInput');
const addBtn = document.getElementById('addPhotosBtn');
const frameSlider = document.getElementById('frameSlider');
const frameNameDisplay = document.getElementById('frameNameDisplay');
const toggleFrameBtn = document.getElementById('toggleFrameBtn');
const toggleTransitionBtn = document.getElementById('toggleTransitionBtn');
const toggleTextBtn = document.getElementById('toggleTextBtn');
const musicBtn = document.getElementById('musicBtn');
const exportBtn = document.getElementById('exportBtn');

const frameSelector = document.getElementById('frameSelector');
const textEditor = document.getElementById('textEditor');
const musicPlayer = document.getElementById('musicPlayer');
const textInput = document.getElementById('textInput');
const textColor = document.getElementById('textColor');
const textFont = document.getElementById('textFont');
const musicInput = document.getElementById('musicInput');
const playMusicBtn = document.getElementById('playMusicBtn');
const stopMusicBtn = document.getElementById('stopMusicBtn');
const bgAudio = document.getElementById('bgAudio');

// ========== 4. CORE FUNCTIONS ==========

// Build Swiper instance
function initSwiper() {
  if (swiperInstance) swiperInstance.destroy(true, true);
  const config = transitionConfigs[currentTransitionIndex] || transitionConfigs[0];
  swiperInstance = new Swiper('#mainSwiper', {
    effect: config.effect,
    creativeEffect: config.creativeEffect || undefined,
    cubeEffect: config.effect === 'cube' ? { shadow: true } : undefined,
    flipEffect: config.effect === 'flip' ? { slideShadows: true } : undefined,
    coverflowEffect: config.effect === 'coverflow' ? { rotate: 50, depth: 100, modifier: 1 } : undefined,
    cardsEffect: config.effect === 'cards' ? { slideShadows: true } : undefined,
    grabCursor: true,
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    on: {
      slideChange: function () {
        currentSlideIndex = this.activeIndex;
        updateFrameSlider();
        updateTextEditor();
      }
    }
  });
}

// Render slides from photoFiles
function renderSlides() {
  if (photoFiles.length === 0) {
    slidesWrapper.innerHTML = `<div class="swiper-slide"><div style="color:#555;font-size:22px;">📸 Tap "Add Photos" to start your photobook</div></div>`;
    initSwiper();
    return;
  }

  slidesWrapper.innerHTML = '';
  photoFiles.forEach((file, index) => {
    const url = URL.createObjectURL(file);
    const frameId = slideData[index]?.frameId ?? (index % 100);
    const text = slideData[index]?.text || '';

    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    slide.innerHTML = `
      <div class="photo-card">
        <img src="${url}" class="frame-${frameId}" alt="photo" />
        <div class="photo-text" id="text-${index}" style="color:${slideData[index]?.textColor || '#ffffff'}; font-family:${slideData[index]?.font || 'Arial'};">${text}</div>
      </div>
    `;
    slidesWrapper.appendChild(slide);
  });

  // Store references
  if (!slideData.length) {
    slideData = photoFiles.map((_, i) => ({ frameId: i % 100, text: '', textColor: '#ffffff', font: 'Arial' }));
  }
  initSwiper();
}

// Update frame on current slide
function updateCurrentFrame(frameId) {
  if (!swiperInstance) return;
  const activeSlide = swiperInstance.slides[swiperInstance.activeIndex];
  if (!activeSlide) return;
  const img = activeSlide.querySelector('img');
  if (!img) return;
  // Remove all frame classes
  img.className = '';
  img.classList.add(`frame-${frameId}`);
  // Update data
  const idx = swiperInstance.activeIndex;
  if (slideData[idx]) slideData[idx].frameId = frameId;
  frameNameDisplay.textContent = `Frame ${frameId+1}/100`;
}

// Update text on current slide
function updateTextOnSlide(text, color, font) {
  if (!swiperInstance) return;
  const idx = swiperInstance.activeIndex;
  const slide = swiperInstance.slides[idx];
  if (!slide) return;
  const textDiv = slide.querySelector('.photo-text');
  if (textDiv) {
    textDiv.textContent = text || '';
    textDiv.style.color = color || '#ffffff';
    textDiv.style.fontFamily = font || 'Arial';
  }
  if (slideData[idx]) {
    slideData[idx].text = text || '';
    slideData[idx].textColor = color || '#ffffff';
    slideData[idx].font = font || 'Arial';
  }
}

function updateFrameSlider() {
  if (!swiperInstance) return;
  const idx = swiperInstance.activeIndex;
  const data = slideData[idx];
  if (data) {
    frameSlider.value = data.frameId || 0;
    frameNameDisplay.textContent = `Frame ${(data.frameId || 0)+1}/100`;
  }
}
function updateTextEditor() {
  if (!swiperInstance) return;
  const idx = swiperInstance.activeIndex;
  const data = slideData[idx];
  if (data) {
    textInput.value = data.text || '';
    textColor.value = data.textColor || '#ffffff';
    textFont.value = data.font || 'Arial';
  }
}

// ========== 5. EXPORT (Download & Share) ==========
async function exportCurrentSlide() {
  if (!swiperInstance) return;
  const slide = swiperInstance.slides[swiperInstance.activeIndex];
  if (!slide) return;
  const card = slide.querySelector('.photo-card');
  if (!card) return;

  try {
    const canvas = await html2canvas(card, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#1a1a1a',
      allowTaint: false,
    });
    const link = document.createElement('a');
    link.download = `photobook-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    // Share if supported
    if (navigator.share) {
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'photobook.png', { type: 'image/png' });
        try {
          await navigator.share({ title: 'My PhotoBook', files: [file] });
        } catch (e) { /* user cancelled */ }
      });
    }
  } catch (e) {
    alert('Export failed, but download should work.');
    console.error(e);
  }
}

// ========== 6. EVENT LISTENERS ==========

// Add Photos
addBtn.addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', function(e) {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;
  photoFiles = photoFiles.concat(files);
  // Initialize slideData for new files
  const newData = files.map(() => ({ frameId: Math.floor(Math.random()*100), text: '', textColor: '#ffffff', font: 'Arial' }));
  slideData = slideData.concat(newData);
  renderSlides();
  this.value = ''; // reset
});

// Frame Controls
toggleFrameBtn.addEventListener('click', () => {
  frameSelector.style.display = frameSelector.style.display === 'none' ? 'flex' : 'none';
  textEditor.style.display = 'none';
  musicPlayer.style.display = 'none';
});
frameSlider.addEventListener('input', function() {
  const val = parseInt(this.value);
  frameNameDisplay.textContent = `Frame ${val+1}/100`;
  updateCurrentFrame(val);
});

// Transition Controls
toggleTransitionBtn.addEventListener('click', function() {
  currentTransitionIndex = (currentTransitionIndex + 1) % transitionConfigs.length;
  this.textContent = `✨ ${transitionConfigs[currentTransitionIndex].name}`;
  // Re-init swiper with new transition
  if (swiperInstance) {
    const activeIdx = swiperInstance.activeIndex;
    swiperInstance.destroy(true, true);
    initSwiper();
    swiperInstance.slideTo(activeIdx, 0);
  }
});

// Text Controls
toggleTextBtn.addEventListener('click', () => {
  textEditor.style.display = textEditor.style.display === 'none' ? 'flex' : 'none';
  frameSelector.style.display = 'none';
  musicPlayer.style.display = 'none';
  updateTextEditor();
});
textInput.addEventListener('input', function() {
  updateTextOnSlide(this.value, textColor.value, textFont.value);
});
textColor.addEventListener('input', function() {
  updateTextOnSlide(textInput.value, this.value, textFont.value);
});
textFont.addEventListener('change', function() {
  updateTextOnSlide(textInput.value, textColor.value, this.value);
});

// Music Controls
musicBtn.addEventListener('click', () => {
  musicPlayer.style.display = musicPlayer.style.display === 'none' ? 'flex' : 'none';
  frameSelector.style.display = 'none';
  textEditor.style.display = 'none';
});
musicInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    bgAudio.src = url;
  }
});
playMusicBtn.addEventListener('click', () => bgAudio.play());
stopMusicBtn.addEventListener('click', () => { bgAudio.pause(); bgAudio.currentTime = 0; });

// Export
exportBtn.addEventListener('click', exportCurrentSlide);

// ========== 7. INITIAL LOAD ==========
// Show placeholder
renderSlides();
