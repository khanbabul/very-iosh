/**
 * Custom PDF Viewer - Core State Management & Component Controller Engine
 * Architecture Scope: Functional multi-tool selection, execution cancellation rendering loops.
 */

// Global App State Layer
const State = {
  pdfInstance: null,
  activePage: 1,
  totalPages: 0,
  zoomFactor: 1.0,
  rotationAngle: 0,
  viewMode: 'single',        // 'single' | 'double' | 'cover'
  transitionMode: 'page',    // 'page' | 'continuous'
  currentTool: 'default',    // 'default' | 'hand' | 'marquee'
  sidebarOpen: true,
  thumbnailSize: 100,        // Width px
  renderQueueTask: null      // Reference tracker to handle canvas race conditions
};

// DOM Registries Map
const DOM = {
  appContainer: document.getElementById('app-container'),
  btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
  sidebar: document.getElementById('sidebar'),
  sidebarThumbnails: document.getElementById('sidebar-thumbnails'),
  sliderThumbSize: document.getElementById('slider-thumb-size'),
  txtThumbSize: document.getElementById('txt-thumb-size'),
  btnPageSettings: document.getElementById('btn-page-settings'),
  dropdownPageSettings: document.getElementById('dropdown-page-settings'),
  btnZoomOut: document.getElementById('btn-zoom-out'),
  btnZoomIn: document.getElementById('btn-zoom-in'),
  btnZoomDropdown: document.getElementById('btn-zoom-dropdown'),
  txtZoomPercent: document.getElementById('txt-zoom-percent'),
  dropdownZoom: document.getElementById('dropdown-zoom'),
  btnMarqueeTrigger: document.getElementById('btn-marquee-trigger'),
  btnToolHand: document.getElementById('btn-tool-hand'),
  btnAppConfig: document.getElementById('btn-app-config'),
  dropdownAppConfig: document.getElementById('dropdown-app-config'),
  btnFullscreen: document.getElementById('btn-fullscreen'),
  viewport: document.getElementById('viewport'),
  canvasContainer: document.getElementById('canvas-container'),
  pdfCanvas: document.getElementById('pdf-render-canvas'),
  marqueeContainer: document.getElementById('marquee-container')
};

// A Demo Document Vector for validation and processing fallback
const DEMO_PDF_URL = 'https://very-iosh.vercel.app/Babal Dur Muhammad - IOSH Managing Safely - Certificate - devbabulkhan@gmail.com.pdf';

// Initialize System Runtime Hooks
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initEventListeners();
  loadPDFDocument(DEMO_PDF_URL);
});

/**
 * 1. PDF Core Engine Layer (Load & High-Performance Async Render Queue)
 */
async function loadPDFDocument(url) {
  try {
    const loadingTask = pdfjsLib.getDocument(url);
    State.pdfInstance = await loadingTask.promise;
    State.totalPages = State.pdfInstance.numPages;

    // Kickstart UI Rendering loops
    executeRenderPipeline();
    generateDocumentThumbnails();
  } catch (error) {
    console.error("Critical Error Executing PDF Engine Initialization Routine: ", error);
  }
}

function executeRenderPipeline() {
  // Cancel previous render lifecycle pipeline threads if existing to mitigate race conditions
  if (State.renderQueueTask) {
    State.renderQueueTask.cancel();
  }

  // Set structural components dynamically to lock memory states
  State.renderQueueTask = createRenderTask(State.activePage);
}

function createRenderTask(pageNumber) {
  let isCanceled = false;

  const executionPromise = (async () => {
    const page = await State.pdfInstance.getPage(pageNumber);
    if (isCanceled) return;

    // Viewport scaling logic matrix 
    const baseViewport = page.getViewport({ scale: State.zoomFactor, rotation: State.rotationAngle });

    const context = DOM.pdfCanvas.getContext('2d');

    // Pixel-Ratio oversampling factor adjustments for ultra high-res text displays
    const outputScale = window.devicePixelRatio || 1;
    DOM.pdfCanvas.width = Math.floor(baseViewport.width * outputScale);
    DOM.pdfCanvas.height = Math.floor(baseViewport.height * outputScale);
    DOM.pdfCanvas.style.width = Math.floor(baseViewport.width) + "px";
    DOM.pdfCanvas.style.height = Math.floor(baseViewport.height) + "px";

    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    const renderContext = {
      canvasContext: context,
      viewport: baseViewport,
      transform: transform
    };

    const renderTask = page.render(renderContext);
    await renderTask.promise;

    // Sync state text strings
    DOM.txtZoomPercent.innerText = `${Math.round(State.zoomFactor * 100)}%`;
  })();

  return {
    promise: executionPromise,
    cancel: () => {
      isCanceled = true;
    }
  };
}

/**
 * 2. Visual Layout Architecture & Sidebars
 */
function generateDocumentThumbnails() {
  DOM.sidebarThumbnails.innerHTML = '';

  for (let i = 1; i <= State.totalPages; i++) {
    const thumbWrapper = document.createElement('div');
    thumbWrapper.className = `flex flex-col items-center cursor-pointer p-2 rounded hover:bg-slate-200 border transition ${State.activePage === i ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`;
    thumbWrapper.dataset.pageIndex = i;

    const canvas = document.createElement('canvas');
    canvas.className = "shadow-sm bg-white transition-all";
    canvas.style.width = `${State.thumbnailSize}px`;

    const label = document.createElement('span');
    label.className = "text-[10px] text-slate-500 font-semibold mt-1";
    label.innerText = i;

    thumbWrapper.appendChild(canvas);
    thumbWrapper.appendChild(label);
    DOM.sidebarThumbnails.appendChild(thumbWrapper);

    // Asynchronously render onto individual thumbnail canvas spaces
    State.pdfInstance.getPage(i).then(page => {
      const viewport = page.getViewport({ scale: 0.3 });
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      page.render({ canvasContext: ctx, viewport: viewport });
    });

    thumbWrapper.addEventListener('click', () => {
      State.activePage = i;
      updateActiveThumbnailUI();
      executeRenderPipeline();
    });
  }
}

function updateActiveThumbnailUI() {
  Array.from(DOM.sidebarThumbnails.children).forEach(child => {
    const pageIdx = parseInt(child.dataset.pageIndex);
    if (pageIdx === State.activePage) {
      child.classList.add('border-blue-500', 'bg-blue-50');
    } else {
      child.classList.remove('border-blue-500', 'bg-blue-50');
    }
  });
}

/**
 * 3. Event Listeners & UI Dropdowns Integration Setup
 */
function initEventListeners() {
  // Global Dropdown click-away logic implementation matrix
  window.addEventListener('click', (e) => {
    if (!DOM.btnPageSettings.contains(e.target)) DOM.dropdownPageSettings.classList.add('hidden');
    if (!DOM.btnZoomDropdown.contains(e.target)) DOM.dropdownZoom.classList.add('hidden');
    if (!DOM.btnAppConfig.contains(e.target)) DOM.dropdownAppConfig.classList.add('hidden');
  });

  // Toggle Dropdown Displays
  DOM.btnPageSettings.addEventListener('click', (e) => { e.stopPropagation(); DOM.dropdownPageSettings.classList.toggle('hidden'); });
  DOM.btnZoomDropdown.addEventListener('click', (e) => { e.stopPropagation(); DOM.dropdownZoom.classList.toggle('hidden'); });
  DOM.btnAppConfig.addEventListener('click', (e) => { e.stopPropagation(); DOM.dropdownAppConfig.classList.toggle('hidden'); });

  // Left Sidebar Visibility Action Router
  DOM.btnToggleSidebar.addEventListener('click', () => {
    State.sidebarOpen = !State.sidebarOpen;
    if (State.sidebarOpen) {
      DOM.sidebar.classList.remove('-ml-64');
    } else {
      DOM.sidebar.classList.add('-ml-64');
    }
  });

  // Sidebar Thumbnail Scaling Continuous Slider 
  DOM.sliderThumbSize.addEventListener('input', (e) => {
    const val = e.target.value;
    State.thumbnailSize = val;
    DOM.txtThumbSize.innerText = `${val}px`;
    const targetCanvases = DOM.sidebarThumbnails.querySelectorAll('canvas');
    targetCanvases.forEach(c => c.style.width = `${val}px`);
  });

  // Page Settings Dropdown Navigation Items
  DOM.dropdownPageSettings.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      handlePageSettingAction(action, e.currentTarget);
    });
  });

  // Zoom Operations Event Handling Matrix Routines
  DOM.btnZoomIn.addEventListener('click', () => { State.zoomFactor = Math.min(64.0, State.zoomFactor + 0.25); executeRenderPipeline(); });
  DOM.btnZoomOut.addEventListener('click', () => { State.zoomFactor = Math.max(0.1, State.zoomFactor - 0.25); executeRenderPipeline(); });

  DOM.dropdownZoom.querySelectorAll('[data-zoom]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetZoom = e.currentTarget.dataset.zoom;
      processZoomTemplateSelect(targetZoom);
    });
  });

  // Tool State Modifiers triggers
  DOM.btnMarqueeTrigger.addEventListener('click', () => setToolMode('marquee'));
  DOM.btnToolHand.addEventListener('click', () => {
    if (State.currentTool === 'hand') setToolMode('default');
    else setToolMode('hand');
  });

  // Full Screen Target API Router Calls
  DOM.btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      DOM.appContainer.requestFullscreen().catch(err => console.error(`Error going fullscreen: ${err.message}`));
    } else {
      document.exitFullscreen();
    }
  });

  // Mouse Engine Hooks for Interactive Vector Canvas Viewports
  initViewportInteractionEngine();
}

/**
 * 4. Page View Configurations Logic Map Engine
 */
function handlePageSettingAction(action, element) {
  if (action === 'rotate-cw') {
    State.rotationAngle = (State.rotationAngle + 90) % 360;
    executeRenderPipeline();
    return;
  }
  if (action === 'rotate-ccw') {
    State.rotationAngle = (State.rotationAngle - 90 + 360) % 360;
    executeRenderPipeline();
    return;
  }

  // Update selection graphical checkboxes interface styling matching specs
  const parentNode = element.parentNode;
  const currentActionCategory = action.split('-')[0]; // continuous, layout, etc.

  parentNode.querySelectorAll(`[data-action^="${currentActionCategory}"]`).forEach(b => {
    b.classList.remove('bg-slate-50');
    b.querySelector('i')?.classList.add('hidden');
  });
  element.classList.add('bg-slate-50');
  element.querySelector('i')?.classList.remove('hidden');

  if (action.startsWith('layout-')) {
    State.viewMode = action.replace('layout-', '');
    // In full implementation, multi-page layouts require instantiating dynamic dual-canvas rendering architectures.
    executeRenderPipeline();
  } else if (action.startsWith('transition-')) {
    State.transitionMode = action.replace('transition-', '');
  }
}

function processZoomTemplateSelect(type) {
  if (type === 'width') {
    const parentWidth = DOM.viewport.clientWidth - 64; // pad matching margins
    State.pdfInstance.getPage(State.activePage).then(page => {
      const vp = page.getViewport({ scale: 1.0, rotation: State.rotationAngle });
      State.zoomFactor = parentWidth / vp.width;
      executeRenderPipeline();
    });
  } else if (type === 'page') {
    const parentHeight = DOM.viewport.clientHeight - 64;
    State.pdfInstance.getPage(State.activePage).then(page => {
      const vp = page.getViewport({ scale: 1.0, rotation: State.rotationAngle });
      State.zoomFactor = parentHeight / vp.height;
      executeRenderPipeline();
    });
  } else {
    State.zoomFactor = parseFloat(type);
    executeRenderPipeline();
  }
}

/**
 * 5. Advanced Dynamic Viewport Control Vectors (Pan Mode & Marquee Calculation Matrix)
 */
function setToolMode(mode) {
  State.currentTool = mode;

  // Clean up existing state styles classes from main wrappers
  DOM.viewport.classList.remove('grab-mode', 'grabbing-mode');
  DOM.viewport.style.cursor = 'default';
  DOM.btnToolHand.classList.remove('bg-blue-100', 'text-blue-600');
  DOM.marqueeContainer.classList.add('hidden');

  if (mode === 'hand') {
    DOM.viewport.classList.add('grab-mode');
    DOM.btnToolHand.classList.add('bg-blue-100', 'text-blue-600');
  } else if (mode === 'marquee') {
    DOM.viewport.style.cursor = 'crosshair';
    DOM.marqueeContainer.classList.remove('hidden');
  }
}

function initViewportInteractionEngine() {
  let isInteracting = false;
  let startX, startY;
  let scrollLeftStart, scrollTopStart;
  let marqueeBoxElement = null;

  DOM.viewport.addEventListener('mousedown', (e) => {
    // Exclude dropdown menus actions inside propagation bubble chains
    if (e.target.closest('button') || e.target.closest('#dropdown-zoom') || e.target.closest('#dropdown-page-settings')) return;

    isInteracting = true;
    startX = e.clientX - DOM.viewport.offsetLeft;
    startY = e.clientY - DOM.viewport.offsetTop;

    if (State.currentTool === 'hand') {
      DOM.viewport.classList.replace('grab-mode', 'grabbing-mode');
      scrollLeftStart = DOM.viewport.scrollLeft;
      scrollTopStart = DOM.viewport.scrollTop;
    } else if (State.currentTool === 'marquee') {
      marqueeBoxElement = document.createElement('div');
      marqueeBoxElement.className = 'marquee-box';
      marqueeBoxElement.style.left = `${e.pageX - DOM.viewport.offsetLeft + DOM.viewport.scrollLeft}px`;
      marqueeBoxElement.style.top = `${e.pageY - DOM.viewport.offsetTop + DOM.viewport.scrollTop}px`;
      DOM.marqueeContainer.appendChild(marqueeBoxElement);
    }
  });

  DOM.viewport.addEventListener('mousemove', (e) => {
    if (!isInteracting) return;

    const currentX = e.clientX - DOM.viewport.offsetLeft;
    const currentY = e.clientY - DOM.viewport.offsetTop;

    if (State.currentTool === 'hand') {
      const walkX = currentX - startX;
      const walkY = currentY - startY;
      DOM.viewport.scrollLeft = scrollLeftStart - walkX;
      DOM.viewport.scrollTop = scrollTopStart - walkY;
    } else if (State.currentTool === 'marquee' && marqueeBoxElement) {
      // Calculate dynamic geometry bounds variables
      const internalScrollX = DOM.viewport.scrollLeft;
      const internalScrollY = DOM.viewport.scrollTop;

      const absoluteStartX = startX + internalScrollX;
      const absoluteStartY = startY + internalScrollY;
      const absoluteCurrentX = currentX + internalScrollX;
      const absoluteCurrentY = currentY + internalScrollY;

      const boxWidth = Math.abs(absoluteCurrentX - absoluteStartX);
      const boxHeight = Math.abs(absoluteCurrentY - absoluteStartY);

      marqueeBoxElement.style.width = `${boxWidth}px`;
      marqueeBoxElement.style.height = `${boxHeight}px`;
      marqueeBoxElement.style.left = `${Math.min(absoluteStartX, absoluteCurrentX)}px`;
      marqueeBoxElement.style.top = `${Math.min(absoluteStartY, absoluteCurrentY)}px`;
    }
  });

  DOM.viewport.addEventListener('mouseup', (e) => {
    if (!isInteracting) return;
    isInteracting = false;

    if (State.currentTool === 'hand') {
      DOM.viewport.classList.replace('grabbing-mode', 'grab-mode');
    } else if (State.currentTool === 'marquee' && marqueeBoxElement) {
      const finalWidth = marqueeBoxElement.offsetWidth;
      const finalHeight = marqueeBoxElement.offsetHeight;

      // Remove bounding element from structural DOM node tree
      marqueeBoxElement.remove();
      marqueeBoxElement = null;

      // Only re-scale context metrics if targeted region meets threshold constraints
      if (finalWidth > 20 && finalHeight > 20) {
        calculateMarqueeZoom(finalWidth, finalHeight);
      }
      setToolMode('default');
    }
  });
}

function calculateMarqueeZoom(boxWidth, boxHeight) {
  // Analytical recalculation matrices for bounding frames scaling factors
  const viewportWidthSpace = DOM.viewport.clientWidth;
  const scaleRatioX = viewportWidthSpace / boxWidth;

  // Set new computed boundary constraint value bounding parameters securely
  State.zoomFactor = Math.min(64.0, Math.max(0.1, State.zoomFactor * scaleRatioX * 0.85));
  executeRenderPipeline();
}
