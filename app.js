import { removeBackground } from "https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm";
import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";

// --- Application State ---
let originalImageFile = null;
let originalImageURL = '';
let processedImageBlob = null;
let processedImageURL = '';
let filenamePrefix = 'image';

// Background parameters (Single mode)
let bgType = 'transparent'; // 'transparent', 'color', 'gradient', 'image'
let bgColor = '#ffffff';
let bgGradient = 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)';
let bgImageFile = null;
let bgImageURL = '';

// Position & Transform parameters (Single mode)
let posX = 0;
let posY = 0;
let scale = 100;
let rotation = 0;
let isDraggingObject = false;
let startX = 0;
let startY = 0;

// Comparison slider pos
let compareSliderPos = 50;

// Bulk mode state
let bulkQueue = [];
let isProcessingBulk = false;
let bulkBgType = 'transparent'; // 'transparent', 'color', 'gradient'
let bulkBgColor = '#ffffff';
let bulkBgGradient = 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)';

// Token Maker state
let tokenRingType = 'gold'; // 'gold', 'silver', 'cyber', 'obsidian', 'wood', 'runic', 'dragon', 'ice', 'fire'
let tokenBgType = 'transparent'; // 'transparent', 'color', 'gradient'
let tokenBgColor = '#ffffff';
let tokenBgGradient = 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)';
let tokenPopoutEnabled = true;
let tokenPopoutHeight = 50; // -50 to 95
let tokenRingThickness = 12; // 4 to 25
let tokenRingScaleOnCanvas = 65; // 40 to 90
let tokenScale = 100;
let tokenRotate = 0;
let tokenGlowEnabled = false;
let tokenGlowRadius = 15;
let tokenGlowColor = '#10b981';
let tokenStatusOverlay = 'none'; // 'none', 'blood', 'ice', 'fire', 'poison', 'curse'
let tokenName = '';
let tokenSourceScreen = 'studio'; // 'studio' or 'bulk'

let tokenPosX = 0;
let tokenPosY = 0;
let tokenIsDragging = false;
let tokenDragStartX = 0;
let tokenDragStartY = 0;

// Loaded cutout image cache for canvas drawing in Token screen
let tokenCutoutImage = null;

// Textured rings preloaded canvases
const ringTextures = {};
const ringPaths = {
    runic: 'assets/rings/ring_runic.png',
    dragon: 'assets/rings/ring_dragon.png',
    ice: 'assets/rings/ring_ice.png',
    fire: 'assets/rings/ring_fire.png'
};

// --- DOM Selectors ---
const uploadScreen = document.getElementById('upload-screen');
const studioScreen = document.getElementById('studio-screen');
const bulkScreen = document.getElementById('bulk-screen');
const tokenScreen = document.getElementById('token-screen');

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const btnSelectFile = document.getElementById('btn-select-file');
const btnUploadToToken = document.getElementById('btn-upload-to-token');
const demoItems = document.querySelectorAll('.demo-item');

// Single viewer elements
const mainViewer = document.getElementById('main-viewer');
const customBgLayer = document.getElementById('custom-bg-layer');
const workspaceLayer = document.getElementById('workspace-layer');
const cutoutDraggable = document.getElementById('cutout-draggable');
const layerOriginal = document.getElementById('layer-original');
const layerProcessed = document.getElementById('layer-processed');
const imgOriginal = document.getElementById('img-original');
const imgProcessed = document.getElementById('img-processed');
const sliderHandle = document.getElementById('slider-handle');

// Single settings
const scaleSlider = document.getElementById('scale-slider');
const scaleVal = document.getElementById('scale-val');
const rotateSlider = document.getElementById('rotate-slider');
const rotateVal = document.getElementById('rotate-val');
const btnResetTransform = document.getElementById('btn-reset-transform');
const transformSection = document.getElementById('transform-section');

// Single background elements
const bgTabs = document.querySelectorAll('.studio-container:not(#bulk-screen):not(#token-screen) .bg-tab');
const tabContents = document.querySelectorAll('.studio-container:not(#bulk-screen):not(#token-screen) .tab-content');
const customColorInput = document.getElementById('custom-color-input');
const bgImageZone = document.getElementById('bg-image-zone');
const bgImageInput = document.getElementById('bg-image-input');
const bgImageName = document.getElementById('bg-image-name');

// Single Action Buttons
const btnDownload = document.getElementById('btn-download');
const btnCreateToken = document.getElementById('btn-create-token');
const btnNewPhoto = document.getElementById('btn-new-photo');

// Bulk elements
const bulkQueueTitle = document.getElementById('bulk-queue-title');
const bulkGrid = document.getElementById('bulk-grid');
const bulkProgressText = document.getElementById('bulk-progress-text');
const bulkOverallProgressBar = document.getElementById('bulk-overall-progress-bar');
const bulkCurrentFileName = document.getElementById('bulk-current-file-name');
const btnBulkDownloadZip = document.getElementById('btn-bulk-download-zip');
const btnBulkAddMore = document.getElementById('btn-bulk-add-more');
const btnBulkReset = document.getElementById('btn-bulk-reset');
const bulkBgTabs = document.querySelectorAll('#bulk-bg-tabs .bg-tab');
const bulkTabContents = document.querySelectorAll('.bulk-tab-content');
const bulkColorGrid = document.getElementById('bulk-color-grid');
const bulkGradientGrid = document.getElementById('bulk-gradient-grid');

// Token elements
const tokenCanvas = document.getElementById('token-preview-canvas');
const tokenRingButtons = document.querySelectorAll('.token-ring-grid button');
const tokenBgTabs = document.querySelectorAll('#token-bg-tabs .bg-tab');
const tokenTabContents = document.querySelectorAll('.token-tab-content');
const tokenColorGrid = document.getElementById('token-color-grid');
const tokenGradientGrid = document.getElementById('token-gradient-grid');
const tokenPopoutToggle = document.getElementById('token-popout-toggle');
const tokenPopoutHeightSlider = document.getElementById('token-popout-height-slider');
const tokenPopoutHeightVal = document.getElementById('token-popout-height-val');
const tokenPopoutHeightGroup = document.getElementById('token-popout-height-group');
const tokenThicknessSlider = document.getElementById('token-thickness-slider');
const tokenThicknessVal = document.getElementById('token-thickness-val');
const tokenRingScaleSlider = document.getElementById('token-ring-scale-slider');
const tokenRingScaleVal = document.getElementById('token-ring-scale-val');
const tokenScaleSlider = document.getElementById('token-scale-slider');
const tokenScaleVal = document.getElementById('token-scale-val');
const tokenRotateSlider = document.getElementById('token-rotate-slider');
const tokenRotateVal = document.getElementById('token-rotate-val');
const btnTokenReset = document.getElementById('btn-token-reset');
const tokenGlowToggle = document.getElementById('token-glow-toggle');
const tokenGlowControls = document.getElementById('token-glow-controls');
const tokenGlowColorInput = document.getElementById('token-glow-color');
const tokenGlowRadiusSlider = document.getElementById('token-glow-radius-slider');
const tokenGlowRadiusVal = document.getElementById('token-glow-radius-val');
const tokenStatusOverlaySelect = document.getElementById('token-status-overlay');
const tokenNameInput = document.getElementById('token-name');
const btnTokenDownload = document.getElementById('btn-token-download');
const btnTokenBack = document.getElementById('btn-token-back');

// Loading overlay & Toast elements
const loadingOverlay = document.getElementById('loading-overlay');
const loadingStatus = document.getElementById('loading-status');
const loadingPercentage = document.getElementById('loading-percentage');
const progressBar = document.getElementById('progress-bar');
const loadingSubstatus = document.getElementById('loading-substatus');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');

let directToTokenMode = false;

// --- Helper Functions ---
function showOverlay(statusText, percentage = null) {
    loadingOverlay.style.display = 'flex';
    loadingStatus.textContent = statusText;
    if (percentage !== null) {
        loadingPercentage.textContent = `${percentage}%`;
        progressBar.style.width = `${percentage}%`;
        loadingPercentage.style.display = 'block';
    } else {
        loadingPercentage.style.display = 'none';
        progressBar.style.width = '100%';
    }
}

function updateLoadingProgress(statusText, percentage) {
    loadingStatus.textContent = statusText;
    loadingPercentage.textContent = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;
}

function hideOverlay() {
    loadingOverlay.style.display = 'none';
}

function showToast(text) {
    toastText.textContent = text;
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

function downloadURL(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Preload and Process Textured Rings
function processRingTexture(img) {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 1000, 1000);
    
    const imgData = ctx.getImageData(0, 0, 1000, 1000);
    const data = imgData.data;
    const cx = 500;
    const cy = 500;
    const maxRadius = 500;
    
    const rinLimit = maxRadius * 0.68;
    const routLimit = maxRadius * 0.99;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const a = data[i+3];
        
        if (a === 0) continue;
        
        const pixelIdx = i / 4;
        const px = pixelIdx % 1000;
        const py = Math.floor(pixelIdx / 1000);
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > routLimit || dist < rinLimit || (r < 35 && g < 35 && b < 35)) {
            data[i+3] = 0; // set alpha to transparent
        }
    }
    
    ctx.putImageData(imgData, 0, 0);
    return canvas;
}

function preloadRingTextures() {
    const promises = Object.entries(ringPaths).map(([key, path]) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = path;
            img.onload = () => {
                ringTextures[key] = processRingTexture(img);
                resolve();
            };
            img.onerror = () => {
                console.error(`Failed to load ring texture: ${path}`);
                resolve();
            };
        });
    });
    return Promise.all(promises);
}

// Generate Swatches for Color and Gradient Grids
const COLOR_PALETTE = [
    '#ffffff', '#f3f4f6', '#1f2937', '#3b82f6', '#10b981', 
    '#ef4444', '#f97316', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'
];

const GRADIENT_PALETTE = [
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
    'linear-gradient(135deg, #02aab0 0%, #00cdac 100%)',
    'linear-gradient(135deg, #f83600 0%, #f9d423 100%)',
    'linear-gradient(135deg, #7028e4 0%, #e5b2ca 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)'
];

function populateSwatches() {
    // Populate Bulk Color Grid
    bulkColorGrid.innerHTML = '';
    COLOR_PALETTE.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;
        if (color === bulkBgColor) swatch.classList.add('active');
        swatch.addEventListener('click', () => {
            bulkColorGrid.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            bulkBgColor = color;
            updateBulkCardsPreviews();
        });
        bulkColorGrid.appendChild(swatch);
    });

    // Populate Bulk Gradient Grid
    bulkGradientGrid.innerHTML = '';
    GRADIENT_PALETTE.forEach(grad => {
        const swatch = document.createElement('div');
        swatch.className = 'gradient-swatch';
        swatch.style.background = grad;
        swatch.dataset.gradient = grad;
        if (grad === bulkBgGradient) swatch.classList.add('active');
        swatch.addEventListener('click', () => {
            bulkGradientGrid.querySelectorAll('.gradient-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            bulkBgGradient = grad;
            updateBulkCardsPreviews();
        });
        bulkGradientGrid.appendChild(swatch);
    });

    // Populate Token Color Grid
    tokenColorGrid.innerHTML = '';
    COLOR_PALETTE.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;
        if (color === tokenBgColor) swatch.classList.add('active');
        swatch.addEventListener('click', () => {
            tokenColorGrid.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            tokenBgColor = color;
            drawToken(tokenCanvas, 600, 600);
        });
        tokenColorGrid.appendChild(swatch);
    });

    // Populate Token Gradient Grid
    tokenGradientGrid.innerHTML = '';
    GRADIENT_PALETTE.forEach(grad => {
        const swatch = document.createElement('div');
        swatch.className = 'gradient-swatch';
        swatch.style.background = grad;
        swatch.dataset.gradient = grad;
        if (grad === tokenBgGradient) swatch.classList.add('active');
        swatch.addEventListener('click', () => {
            tokenGradientGrid.querySelectorAll('.gradient-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            tokenBgGradient = grad;
            drawToken(tokenCanvas, 600, 600);
        });
        tokenGradientGrid.appendChild(swatch);
    });
}

// Merge Cutout with Background (for Preview / Download / ZIP)
function applyBackgroundToCutout(cutoutURL, type, color, gradient) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = cutoutURL;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (type === 'color') {
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else if (type === 'gradient') {
                let gradColors = ['#ff9a9e', '#fecfef'];
                if (gradient.includes('#2b5876')) gradColors = ['#2b5876', '#4e4376'];
                else if (gradient.includes('#02aab0')) gradColors = ['#02aab0', '#00cdac'];
                else if (gradient.includes('#f83600')) gradColors = ['#f83600', '#f9d423'];
                else if (gradient.includes('#7028e4')) gradColors = ['#7028e4', '#e5b2ca'];
                else if (gradient.includes('#e0c3fc')) gradColors = ['#e0c3fc', '#8ec5fc'];
                
                const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                grad.addColorStop(0, gradColors[0]);
                grad.addColorStop(1, gradColors[1]);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                resolve(URL.createObjectURL(blob));
            }, 'image/png');
        };
        img.onerror = () => {
            resolve(cutoutURL);
        };
    });
}

function updateBulkCardsPreviews() {
    bulkQueue.forEach(item => {
        if (item.status === 'done') {
            renderBulkCard(item);
        }
    });
}

// --- Drag-and-drop comparison slider (Single Mode) ---
let isDraggingSlider = false;

function initCompareSlider() {
    const onDrag = (clientX) => {
        const rect = mainViewer.getBoundingClientRect();
        let x = clientX - rect.left;
        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;
        
        const percent = (x / rect.width) * 100;
        sliderHandle.style.left = `${percent}%`;
        layerOriginal.style.width = `${percent}%`;
        compareSliderPos = percent;
    };
    
    sliderHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDraggingSlider = true;
    });
    
    window.addEventListener('mousemove', (e) => {
        if (isDraggingSlider) {
            onDrag(e.clientX);
        }
    });
    
    window.addEventListener('mouseup', () => {
        isDraggingSlider = false;
    });
    
    sliderHandle.addEventListener('touchstart', (e) => {
        isDraggingSlider = true;
    });
    
    window.addEventListener('touchmove', (e) => {
        if (isDraggingSlider && e.touches[0]) {
            onDrag(e.touches[0].clientX);
        }
    });
    
    window.addEventListener('touchend', () => {
        isDraggingSlider = false;
    });
}

// --- Drag and Transform Cutout inside Single mode workspace ---
function updateCutoutTransform() {
    cutoutDraggable.style.transform = `translate(${posX}px, ${posY}px) scale(${scale / 100}) rotate(${rotation}deg)`;
}

cutoutDraggable.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDraggingObject = true;
    startX = e.clientX - posX;
    startY = e.clientY - posY;
});

window.addEventListener('mousemove', (e) => {
    if (isDraggingObject) {
        posX = e.clientX - startX;
        posY = e.clientY - startY;
        updateCutoutTransform();
    }
});

window.addEventListener('mouseup', () => {
    isDraggingObject = false;
});

// Touch Events for drag
cutoutDraggable.addEventListener('touchstart', (e) => {
    if (e.touches[0]) {
        isDraggingObject = true;
        startX = e.touches[0].clientX - posX;
        startY = e.touches[0].clientY - posY;
    }
});

window.addEventListener('touchmove', (e) => {
    if (isDraggingObject && e.touches[0]) {
        posX = e.touches[0].clientX - startX;
        posY = e.touches[0].clientY - startY;
        updateCutoutTransform();
    }
});

window.addEventListener('touchend', () => {
    isDraggingObject = false;
});

// --- File Handling (Upload and Select) ---
async function handleSingleFile(file) {
    originalImageFile = file;
    const dotIdx = file.name.lastIndexOf('.');
    filenamePrefix = dotIdx !== -1 ? file.name.substring(0, dotIdx) : file.name;
    
    originalImageURL = URL.createObjectURL(file);
    imgOriginal.src = originalImageURL;
    
    showOverlay('Инициализация нейросети...', 0);
    
    try {
        const blob = await removeBackground(file, {
            progress: (key, current, total) => {
                const percent = Math.round((current / total) * 100);
                let text = 'Идет удаление фона...';
                if (key.includes('fetch')) {
                    text = 'Загрузка ИИ-модели (это происходит один раз)...';
                }
                updateLoadingProgress(text, percent);
            }
        });
        
        processedImageBlob = blob;
        processedImageURL = URL.createObjectURL(blob);
        imgProcessed.src = processedImageURL;
        cutoutDraggable.src = processedImageURL;
        
        hideOverlay();
        showToast('Фон успешно удален!');
        
        if (directToTokenMode) {
            openTokenMaker(processedImageURL, 'studio');
        } else {
            // Reset transforms
            posX = 0;
            posY = 0;
            scale = 100;
            rotation = 0;
            updateCutoutTransform();
            
            // Switch tabs to transparent
            setActiveBgTab('transparent');
            
            uploadScreen.style.display = 'none';
            bulkScreen.style.display = 'none';
            tokenScreen.style.display = 'none';
            studioScreen.style.display = 'grid';
        }
    } catch (err) {
        console.error(err);
        hideOverlay();
        showToast(`Ошибка: ${err.message || err}`);
    }
}

// Set active tab in single editor
function setActiveBgTab(type) {
    bgType = type;
    bgTabs.forEach(btn => {
        if (btn.dataset.tab === type) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    
    tabContents.forEach(content => {
        if (content.id === `tab-${type}`) content.classList.add('active');
        else content.classList.remove('active');
    });
    
    if (type === 'transparent') {
        customBgLayer.classList.add('hidden');
        workspaceLayer.classList.add('hidden');
        layerOriginal.classList.remove('hidden');
        sliderHandle.classList.remove('hidden');
        document.getElementById('badge-original').classList.remove('hidden');
        document.getElementById('badge-processed').classList.remove('hidden');
        transformSection.classList.add('hidden');
    } else {
        customBgLayer.classList.remove('hidden');
        workspaceLayer.classList.remove('hidden');
        layerOriginal.classList.add('hidden');
        sliderHandle.classList.add('hidden');
        document.getElementById('badge-original').classList.add('hidden');
        document.getElementById('badge-processed').classList.add('hidden');
        transformSection.classList.remove('hidden');
        
        applySingleBgStyle();
    }
}

function applySingleBgStyle() {
    if (bgType === 'color') {
        customBgLayer.style.background = bgColor;
        customBgLayer.style.backgroundImage = 'none';
    } else if (bgType === 'gradient') {
        customBgLayer.style.background = bgGradient;
    } else if (bgType === 'image') {
        if (bgImageURL) {
            customBgLayer.style.background = `url(${bgImageURL}) center/cover no-repeat`;
        } else {
            customBgLayer.style.background = 'rgba(0,0,0,0.4)';
        }
    }
}

bgTabs.forEach(btn => {
    btn.addEventListener('click', () => {
        setActiveBgTab(btn.dataset.tab);
    });
});

// Single Editor: Color Picker and Gradient Swatches
document.querySelectorAll('.studio-container:not(#bulk-screen):not(#token-screen) .color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
        document.querySelectorAll('.studio-container:not(#bulk-screen):not(#token-screen) .color-swatch').forEach(s => s.classList.remove('active'));
        if (!swatch.classList.contains('custom-color-swatch')) {
            swatch.classList.add('active');
            bgColor = swatch.dataset.color;
            applySingleBgStyle();
        }
    });
});

customColorInput.addEventListener('input', (e) => {
    bgColor = e.target.value;
    applySingleBgStyle();
});

document.querySelectorAll('.studio-container:not(#bulk-screen):not(#token-screen) .gradient-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
        document.querySelectorAll('.studio-container:not(#bulk-screen):not(#token-screen) .gradient-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        bgGradient = swatch.dataset.gradient;
        applySingleBgStyle();
    });
});

// Upload BG Image in Single
bgImageZone.addEventListener('click', () => bgImageInput.click());
bgImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        bgImageFile = file;
        bgImageName.textContent = file.name;
        bgImageName.classList.remove('hidden');
        bgImageURL = URL.createObjectURL(file);
        applySingleBgStyle();
    }
});

// Single Transform Controls
scaleSlider.addEventListener('input', (e) => {
    scale = e.target.value;
    scaleVal.textContent = `${scale}%`;
    updateCutoutTransform();
});

rotateSlider.addEventListener('input', (e) => {
    rotation = e.target.value;
    rotateVal.textContent = `${rotation}°`;
    updateCutoutTransform();
});

btnResetTransform.addEventListener('click', () => {
    posX = 0;
    posY = 0;
    scale = 100;
    rotation = 0;
    scaleSlider.value = 100;
    scaleVal.textContent = '100%';
    rotateSlider.value = 0;
    rotateVal.textContent = '0°';
    updateCutoutTransform();
});

// Download Single Image
btnDownload.addEventListener('click', async () => {
    showOverlay('Подготовка файла к скачиванию...', 0);
    try {
        const finalURL = await applyBackgroundToCutout(processedImageURL, bgType, bgColor, bgGradient);
        downloadURL(finalURL, `bgrem-${filenamePrefix}.png`);
        hideOverlay();
        showToast('Изображение успешно скачано!');
    } catch (e) {
        console.error(e);
        hideOverlay();
    }
});

btnCreateToken.addEventListener('click', () => {
    openTokenMaker(processedImageURL, 'studio');
});

btnNewPhoto.addEventListener('click', () => {
    uploadScreen.style.display = 'block';
    studioScreen.style.display = 'none';
    bulkScreen.style.display = 'none';
    tokenScreen.style.display = 'none';
});

// --- Bulk Queue Mode Logic ---
async function handleBulkFiles(files) {
    uploadScreen.style.display = 'none';
    studioScreen.style.display = 'none';
    tokenScreen.style.display = 'none';
    bulkScreen.style.display = 'grid';
    
    // Add files to queue
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const id = Date.now() + '-' + i;
        bulkQueue.push({
            id: id,
            file: file,
            status: 'pending',
            progress: 0,
            originalURL: URL.createObjectURL(file),
            processedBlob: null,
            processedURL: ''
        });
    }
    
    // Render the grid
    bulkQueue.forEach(item => renderBulkCard(item));
    updateBulkOverallProgress();
    
    // Start sequence
    if (!isProcessingBulk) {
        processNextInBulkQueue();
    }
}

async function processNextInBulkQueue() {
    const nextItem = bulkQueue.find(item => item.status === 'pending');
    if (!nextItem) {
        isProcessingBulk = false;
        updateBulkOverallProgress();
        showToast('Пакетная обработка завершена!');
        btnBulkDownloadZip.disabled = false;
        return;
    }
    
    isProcessingBulk = true;
    nextItem.status = 'processing';
    nextItem.progress = 0;
    renderBulkCard(nextItem);
    updateBulkOverallProgress();
    
    bulkCurrentFileName.textContent = `Обработка: ${nextItem.file.name}`;
    
    try {
        const blob = await removeBackground(nextItem.file, {
            progress: (key, current, total) => {
                const percent = Math.round((current / total) * 100);
                nextItem.progress = percent;
                renderBulkCard(nextItem);
            }
        });
        
        nextItem.status = 'done';
        nextItem.processedBlob = blob;
        nextItem.processedURL = URL.createObjectURL(blob);
        renderBulkCard(nextItem);
        
    } catch (err) {
        console.error(err);
        nextItem.status = 'error';
        nextItem.errorMsg = err.message || 'Ошибка ИИ';
        renderBulkCard(nextItem);
    }
    
    updateBulkOverallProgress();
    processNextInBulkQueue();
}

function renderBulkCard(item) {
    let card = document.getElementById(`bulk-card-${item.id}`);
    if (!card) {
        card = document.createElement('div');
        card.id = `bulk-card-${item.id}`;
        card.className = 'bulk-card';
        bulkGrid.appendChild(card);
    }
    
    card.innerHTML = '';
    
    const thumbWrapper = document.createElement('div');
    thumbWrapper.className = 'bulk-card-thumb-wrapper transparency-grid';
    
    const img = document.createElement('img');
    img.className = 'bulk-card-thumb';
    
    if (item.status === 'done' && item.processedURL) {
        // Draw thumbnail with background preview
        applyBackgroundToCutout(item.processedURL, bulkBgType, bulkBgColor, bulkBgGradient).then(previewURL => {
            img.src = previewURL;
        });
    } else {
        img.src = item.originalURL;
    }
    thumbWrapper.appendChild(img);
    card.appendChild(thumbWrapper);
    
    const badge = document.createElement('div');
    badge.className = `bulk-card-badge-status status-badge-${item.status}`;
    if (item.status === 'pending') badge.textContent = 'В очереди';
    else if (item.status === 'processing') badge.textContent = `${item.progress}%`;
    else if (item.status === 'done') badge.textContent = 'Готово';
    else if (item.status === 'error') badge.textContent = 'Ошибка';
    card.appendChild(badge);
    
    if (item.status === 'done') {
        const btnDownloadCard = document.createElement('button');
        btnDownloadCard.className = 'bulk-card-btn-download';
        btnDownloadCard.title = 'Скачать';
        btnDownloadCard.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
        `;
        btnDownloadCard.addEventListener('click', async (e) => {
            e.stopPropagation();
            const finalURL = await applyBackgroundToCutout(item.processedURL, bulkBgType, bulkBgColor, bulkBgGradient);
            downloadURL(finalURL, `no-bg-${item.file.name}`);
        });
        card.appendChild(btnDownloadCard);
        
        const btnTokenCard = document.createElement('button');
        btnTokenCard.className = 'bulk-card-btn-token';
        btnTokenCard.title = 'Создать токен';
        btnTokenCard.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M12 7v10M7 12h10" stroke="currentColor" stroke-width="2"/>
            </svg>
            Токен
        `;
        btnTokenCard.addEventListener('click', (e) => {
            e.stopPropagation();
            openTokenMaker(item.processedURL, 'bulk');
        });
        card.appendChild(btnTokenCard);
    } else if (item.status === 'processing') {
        const overlay = document.createElement('div');
        overlay.className = 'bulk-card-overlay';
        overlay.innerHTML = `
            <div class="bulk-card-status-text">Обработка...</div>
            <div class="bulk-card-progress-bar">
                <div class="bulk-card-progress-fill" style="width: ${item.progress}%;"></div>
            </div>
        `;
        card.appendChild(overlay);
    } else if (item.status === 'error') {
        const overlay = document.createElement('div');
        overlay.className = 'bulk-card-overlay';
        overlay.innerHTML = `
            <div class="bulk-card-status-text" style="color: #ef4444;">Ошибка</div>
            <div style="font-size: 0.65rem; color: #f87171;">${item.errorMsg || ''}</div>
        `;
        card.appendChild(overlay);
    }
}

function updateBulkOverallProgress() {
    const total = bulkQueue.length;
    const done = bulkQueue.filter(item => item.status === 'done' || item.status === 'error').length;
    
    bulkQueueTitle.textContent = `Очередь обработки (${total} файлов)`;
    bulkProgressText.textContent = `${done} / ${total}`;
    
    const overallPercent = total > 0 ? Math.round((done / total) * 100) : 0;
    bulkOverallProgressBar.style.width = `${overallPercent}%`;
    
    if (total === 0) {
        bulkCurrentFileName.textContent = 'Очередь пуста';
        btnBulkDownloadZip.disabled = true;
    } else if (done === total) {
        bulkCurrentFileName.textContent = 'Обработка завершена';
    }
}

// Bulk background tabs click
bulkBgTabs.forEach(btn => {
    btn.addEventListener('click', () => {
        bulkBgType = btn.dataset.bulkTab;
        bulkBgTabs.forEach(b => {
            if (b === btn) b.classList.add('active');
            else b.classList.remove('active');
        });
        
        bulkTabContents.forEach(content => {
            if (content.id === `bulk-tab-${bulkBgType}`) content.style.display = 'block';
            else content.style.display = 'none';
        });
        
        updateBulkCardsPreviews();
    });
});

// ZIP Batch downloader
btnBulkDownloadZip.addEventListener('click', async () => {
    const doneItems = bulkQueue.filter(item => item.status === 'done');
    if (doneItems.length === 0) return;
    
    showOverlay('Создание ZIP архива...', 0);
    const zip = new JSZip();
    let count = 0;
    
    for (const item of doneItems) {
        const finalURL = await applyBackgroundToCutout(item.processedURL, bulkBgType, bulkBgColor, bulkBgGradient);
        const res = await fetch(finalURL);
        const blob = await res.blob();
        
        const originalName = item.file.name;
        const dotIdx = originalName.lastIndexOf('.');
        const nameWithoutExt = dotIdx !== -1 ? originalName.substring(0, dotIdx) : originalName;
        
        zip.file(`no-bg-${nameWithoutExt}.png`, blob);
        
        count++;
        updateLoadingProgress('Компиляция ZIP архива...', Math.round((count / doneItems.length) * 100));
    }
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadURL(URL.createObjectURL(zipBlob), 'batch-images-bgrem.zip');
    hideOverlay();
    showToast('Архив ZIP успешно загружен!');
});

btnBulkAddMore.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
});

btnBulkReset.addEventListener('click', () => {
    bulkQueue.forEach(item => {
        if (item.originalURL) URL.revokeObjectURL(item.originalURL);
        if (item.processedURL) URL.revokeObjectURL(item.processedURL);
    });
    bulkQueue = [];
    bulkGrid.innerHTML = '';
    updateBulkOverallProgress();
});

// --- Token Maker Screen Logic ---
function openTokenMaker(imageURL, source = 'studio') {
    tokenSourceScreen = source;
    
    uploadScreen.style.display = 'none';
    studioScreen.style.display = 'none';
    bulkScreen.style.display = 'none';
    tokenScreen.style.display = 'grid';
    
    // Set initial canvas position values
    tokenPosX = 0;
    tokenPosY = 0;
    tokenScale = 100;
    tokenRotate = 0;
    
    tokenScaleSlider.value = 100;
    tokenScaleVal.textContent = '100%';
    tokenRotateSlider.value = 0;
    tokenRotateVal.textContent = '0°';
    
    showOverlay('Загрузка токен-редактора...', 0);
    
    tokenCutoutImage = new Image();
    tokenCutoutImage.crossOrigin = 'anonymous';
    tokenCutoutImage.src = imageURL;
    tokenCutoutImage.onload = () => {
        hideOverlay();
        drawToken(tokenCanvas, 600, 600);
    };
    tokenCutoutImage.onerror = () => {
        hideOverlay();
        showToast('Ошибка загрузки вырезанного объекта');
    };
}

function drawToken(canvas, width, height, isExport = false) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    // Radius of the inner circle based on ring scale slider
    const r = (Math.min(width, height) / 2) * (tokenRingScaleOnCanvas / 100); 
    
    // Export scale factor (1000px export, 600px preview)
    const scaleFactor = isExport ? (width / 600) : 1;
    const thickness = r * (tokenRingThickness / 100);

    // 1. Draw Outer Glow (if enabled)
    if (tokenGlowEnabled && tokenGlowRadius > 0) {
        ctx.save();
        ctx.shadowColor = tokenGlowColor;
        ctx.shadowBlur = tokenGlowRadius * scaleFactor * 1.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, r + thickness, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = (tokenGlowRadius / 2) * scaleFactor * 1.5;
        ctx.fill();
        ctx.restore();

        // Clear the inside so it's a true outer glow
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(cx, cy, r + thickness - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 2. Draw Token background inside the circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    
    if (tokenBgType === 'color') {
        ctx.fillStyle = tokenBgColor;
        ctx.fill();
    } else if (tokenBgType === 'gradient') {
        let gradColors = ['#ff9a9e', '#fecfef'];
        if (tokenBgGradient.includes('#2b5876')) gradColors = ['#2b5876', '#4e4376'];
        else if (tokenBgGradient.includes('#02aab0')) gradColors = ['#02aab0', '#00cdac'];
        else if (tokenBgGradient.includes('#f83600')) gradColors = ['#f83600', '#f9d423'];
        else if (tokenBgGradient.includes('#7028e4')) gradColors = ['#7028e4', '#e5b2ca'];
        else if (tokenBgGradient.includes('#e0c3fc')) gradColors = ['#e0c3fc', '#8ec5fc'];
        
        const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        grad.addColorStop(0, gradColors[0]);
        grad.addColorStop(1, gradColors[1]);
        ctx.fillStyle = grad;
        ctx.fill();
    }
    ctx.restore();

    // 3. Draw Character (clipped inside circle)
    if (tokenCutoutImage) {
        ctx.save();
        
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        
        ctx.translate(cx + tokenPosX * scaleFactor, cy + tokenPosY * scaleFactor);
        ctx.rotate((tokenRotate * Math.PI) / 180);
        
        const imgScale = (tokenScale / 100) * (r * 2 / Math.min(tokenCutoutImage.width, tokenCutoutImage.height));
        const dw = tokenCutoutImage.width * imgScale;
        const dh = tokenCutoutImage.height * imgScale;
        ctx.drawImage(tokenCutoutImage, -dw / 2, -dh / 2, dw, dh);
        
        ctx.restore();
    }

    // 4. Draw Ring (Frame)
    ctx.save();
    const isCustomRing = ['runic', 'dragon', 'ice', 'fire'].includes(tokenRingType);
    if (isCustomRing && ringTextures[tokenRingType]) {
        const texture = ringTextures[tokenRingType];
        const outerRadius = r + thickness;
        ctx.drawImage(texture, cx - outerRadius, cy - outerRadius, outerRadius * 2, outerRadius * 2);
    } else {
        // Procedural vector rings: gold, silver, cyber, obsidian, wood
        ctx.beginPath();
        ctx.arc(cx, cy, r + thickness / 2, 0, Math.PI * 2);
        ctx.lineWidth = thickness;
        
        if (tokenRingType === 'gold') {
            const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
            grad.addColorStop(0, '#ffe066');
            grad.addColorStop(0.3, '#f59e0b');
            grad.addColorStop(0.5, '#fffbeb');
            grad.addColorStop(0.7, '#d97706');
            grad.addColorStop(1, '#ffe066');
            ctx.strokeStyle = grad;
            ctx.stroke();
            
            ctx.lineWidth = 1.5 * scaleFactor;
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, r + thickness, 0, Math.PI * 2);
            ctx.stroke();
        } else if (tokenRingType === 'silver') {
            const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
            grad.addColorStop(0, '#f3f4f6');
            grad.addColorStop(0.3, '#9ca3af');
            grad.addColorStop(0.5, '#ffffff');
            grad.addColorStop(0.7, '#4b5563');
            grad.addColorStop(1, '#f3f4f6');
            ctx.strokeStyle = grad;
            ctx.stroke();
            
            ctx.lineWidth = 1.5 * scaleFactor;
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, r + thickness, 0, Math.PI * 2);
            ctx.stroke();
        } else if (tokenRingType === 'cyber') {
            ctx.strokeStyle = '#6366f1';
            ctx.stroke();
            ctx.lineWidth = 2 * scaleFactor;
            ctx.strokeStyle = '#a5b4fc';
            ctx.beginPath();
            ctx.arc(cx, cy, r + thickness / 2, 0, Math.PI * 2);
            ctx.stroke();
        } else if (tokenRingType === 'obsidian') {
            const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
            grad.addColorStop(0, '#111827');
            grad.addColorStop(0.5, '#374151');
            grad.addColorStop(1, '#030712');
            ctx.strokeStyle = grad;
            ctx.stroke();
            ctx.lineWidth = 1 * scaleFactor;
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        } else if (tokenRingType === 'wood') {
            const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
            grad.addColorStop(0, '#78350f');
            grad.addColorStop(0.5, '#b45309');
            grad.addColorStop(1, '#451a03');
            ctx.strokeStyle = grad;
            ctx.stroke();
        }
    }
    ctx.restore();

    // 5. Draw 3D Popout (if enabled)
    const Ycut = cy + r * (tokenPopoutHeight / 100);
    
    if (tokenPopoutEnabled && tokenCutoutImage) {
        ctx.save();
        
        ctx.beginPath();
        ctx.rect(0, 0, width, Ycut);
        ctx.clip();
        
        ctx.translate(cx + tokenPosX * scaleFactor, cy + tokenPosY * scaleFactor);
        ctx.rotate((tokenRotate * Math.PI) / 180);
        
        const imgScale = (tokenScale / 100) * (r * 2 / Math.min(tokenCutoutImage.width, tokenCutoutImage.height));
        const dw = tokenCutoutImage.width * imgScale;
        const dh = tokenCutoutImage.height * imgScale;
        ctx.drawImage(tokenCutoutImage, -dw / 2, -dh / 2, dw, dh);
        
        ctx.restore();
    }

    // 6. Draw Status Effects (Procedural overlays, clipped inside circle)
    if (tokenStatusOverlay !== 'none') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();

        if (tokenStatusOverlay === 'blood') {
            ctx.fillStyle = 'rgba(185, 28, 28, 0.4)';
            ctx.strokeStyle = 'rgba(153, 27, 27, 0.8)';
            ctx.lineWidth = 3 * scaleFactor;
            
            ctx.beginPath();
            ctx.moveTo(cx - r*0.7, cy - r*0.2);
            ctx.lineTo(cx - r*0.2, cy + r*0.3);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(cx - r*0.6, cy - r*0.1);
            ctx.lineTo(cx - r*0.15, cy + r*0.4);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx - r*0.4, cy + r*0.2, 8 * scaleFactor, 0, Math.PI*2);
            ctx.arc(cx + r*0.5, cy - r*0.3, 12 * scaleFactor, 0, Math.PI*2);
            ctx.arc(cx + r*0.3, cy + r*0.5, 15 * scaleFactor, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
            ctx.beginPath();
            ctx.arc(cx + r*0.35, cy + r*0.55, 6 * scaleFactor, 0, Math.PI*2);
            ctx.arc(cx + r*0.2, cy + r*0.42, 4 * scaleFactor, 0, Math.PI*2);
            ctx.fill();
        } else if (tokenStatusOverlay === 'ice') {
            const numPoints = 16;
            ctx.fillStyle = 'rgba(147, 197, 253, 0.35)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1.5 * scaleFactor;
            
            ctx.beginPath();
            for (let i = 0; i <= numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 2;
                const distOffset = r * (0.8 + 0.1 * Math.sin(angle * 5));
                const px = cx + Math.cos(angle) * distOffset;
                const py = cy + Math.sin(angle) * distOffset;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(cx - r*0.8, cy + r*0.6);
            ctx.lineTo(cx - r*0.6, cy + r*0.3);
            ctx.lineTo(cx - r*0.4, cy + r*0.7);
            
            ctx.moveTo(cx + r*0.7, cy + r*0.5);
            ctx.lineTo(cx + r*0.5, cy + r*0.1);
            ctx.lineTo(cx + r*0.3, cy + r*0.6);
            ctx.stroke();
            ctx.fillStyle = 'rgba(219, 234, 254, 0.5)';
            ctx.fill();
        } else if (tokenStatusOverlay === 'fire') {
            const grad = ctx.createLinearGradient(cx, cy + r, cx, cy - r*0.2);
            grad.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
            grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.6)');
            grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(cx - r, cy + r);
            ctx.quadraticCurveTo(cx - r*0.7, cy + r*0.2, cx - r*0.5, cy - r*0.1);
            ctx.quadraticCurveTo(cx - r*0.3, cy + r*0.3, cx, cy - r*0.3);
            ctx.quadraticCurveTo(cx + r*0.3, cy + r*0.2, cx + r*0.6, cy - r*0.05);
            ctx.quadraticCurveTo(cx + r*0.8, cy + r*0.4, cx + r, cy + r);
            ctx.closePath();
            ctx.fill();
        } else if (tokenStatusOverlay === 'poison') {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
            ctx.lineWidth = 1 * scaleFactor;
            
            const bubbles = [
                { x: cx - r*0.5, y: cy + r*0.4, size: 12 },
                { x: cx - r*0.3, y: cy + r*0.6, size: 8 },
                { x: cx + r*0.2, y: cy + r*0.5, size: 16 },
                { x: cx + r*0.5, y: cy + r*0.3, size: 10 },
                { x: cx - r*0.1, y: cy + r*0.2, size: 6 },
                { x: cx + r*0.4, y: cy + r*0.6, size: 14 }
            ];
            
            bubbles.forEach(b => {
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.size * scaleFactor, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.beginPath();
                ctx.arc(b.x - b.size*0.3 * scaleFactor, b.y - b.size*0.3 * scaleFactor, b.size*0.2 * scaleFactor, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
            });
        } else if (tokenStatusOverlay === 'curse') {
            const grad = ctx.createRadialGradient(cx, cy, r*0.1, cx, cy, r);
            grad.addColorStop(0, 'rgba(124, 58, 237, 0)');
            grad.addColorStop(0.7, 'rgba(124, 58, 237, 0.25)');
            grad.addColorStop(1, 'rgba(88, 28, 135, 0.6)');
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI*2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(196, 181, 253, 0.8)';
            ctx.lineWidth = 2 * scaleFactor;
            
            const drawCross = (x, y, size) => {
                ctx.beginPath();
                ctx.moveTo(x - size, y);
                ctx.lineTo(x + size, y);
                ctx.moveTo(x, y - size);
                ctx.lineTo(x, y + size*1.5);
                ctx.stroke();
            };
            
            drawCross(cx - r*0.4, cy - r*0.3, 8 * scaleFactor);
            drawCross(cx + r*0.5, cy + r*0.2, 10 * scaleFactor);
            drawCross(cx - r*0.2, cy + r*0.5, 6 * scaleFactor);
        }

        ctx.restore();
    }

    // 7. Draw Character Nameplate Banner
    if (tokenName && tokenName.trim().length > 0) {
        ctx.save();
        
        const nameStr = tokenName.trim().toUpperCase();
        const fontSize = Math.max(12, Math.floor(r * 0.13)) * scaleFactor;
        ctx.font = `800 ${fontSize}px 'Outfit', 'Inter', sans-serif`;
        
        const textWidth = ctx.measureText(nameStr).width;
        const bannerPaddingX = 16 * scaleFactor;
        const bannerPaddingY = 6 * scaleFactor;
        const bannerW = Math.min(r * 1.7, textWidth + bannerPaddingX * 2);
        const bannerH = fontSize + bannerPaddingY * 2;
        
        const bannerX = cx - bannerW / 2;
        const bannerY = cy + r * 0.78 - bannerH / 2;
        
        // Clip to inner circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8 * scaleFactor;
        ctx.shadowOffsetY = 2 * scaleFactor;
        
        ctx.fillStyle = 'rgba(10, 12, 20, 0.85)';
        
        const radius = bannerH / 2;
        ctx.beginPath();
        ctx.moveTo(bannerX + radius, bannerY);
        ctx.lineTo(bannerX + bannerW - radius, bannerY);
        ctx.quadraticCurveTo(bannerX + bannerW, bannerY, bannerX + bannerW, bannerY + radius);
        ctx.lineTo(bannerX + bannerW, bannerY + bannerH - radius);
        ctx.quadraticCurveTo(bannerX + bannerW, bannerY + bannerH, bannerX + bannerW - radius, bannerY + bannerH);
        ctx.lineTo(bannerX + radius, bannerY + bannerH);
        ctx.quadraticCurveTo(bannerX, bannerY + bannerH, bannerX, bannerY + bannerH - radius);
        ctx.lineTo(bannerX, bannerY + radius);
        ctx.quadraticCurveTo(bannerX, bannerY, bannerX + radius, bannerY);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 1 * scaleFactor;
        
        if (tokenRingType === 'gold') {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        } else if (tokenRingType === 'silver') {
            ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
        } else if (tokenRingType === 'cyber') {
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
        } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        }
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(bannerX + bannerPaddingX, bannerY, bannerW - bannerPaddingX * 2, bannerH);
        ctx.clip();
        ctx.fillText(nameStr, cx, bannerY + bannerH / 2 + 1 * scaleFactor);
        ctx.restore();
        
        ctx.restore();
    }
}

// Token Drag handlers
tokenCanvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const rect = tokenCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    tokenIsDragging = true;
    tokenDragStartX = x - tokenPosX;
    tokenDragStartY = y - tokenPosY;
});

window.addEventListener('mousemove', (e) => {
    if (tokenIsDragging) {
        const rect = tokenCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        tokenPosX = x - tokenDragStartX;
        tokenPosY = y - tokenDragStartY;
        drawToken(tokenCanvas, 600, 600);
    }
});

window.addEventListener('mouseup', () => {
    tokenIsDragging = false;
});

// Touch support for Token drag
tokenCanvas.addEventListener('touchstart', (e) => {
    if (e.touches[0]) {
        const rect = tokenCanvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        
        tokenIsDragging = true;
        tokenDragStartX = x - tokenPosX;
        tokenDragStartY = y - tokenPosY;
    }
});

window.addEventListener('touchmove', (e) => {
    if (tokenIsDragging && e.touches[0]) {
        const rect = tokenCanvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        
        tokenPosX = x - tokenDragStartX;
        tokenPosY = y - tokenDragStartY;
        drawToken(tokenCanvas, 600, 600);
    }
});

window.addEventListener('touchend', () => {
    tokenIsDragging = false;
});

// Token controls listeners
tokenRingButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tokenRingButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tokenRingType = btn.dataset.ring;
        drawToken(tokenCanvas, 600, 600);
    });
});

tokenBgTabs.forEach(btn => {
    btn.addEventListener('click', () => {
        tokenBgType = btn.dataset.tokenTab;
        tokenBgTabs.forEach(b => {
            if (b === btn) b.classList.add('active');
            else b.classList.remove('active');
        });
        
        tokenTabContents.forEach(content => {
            if (content.id === `token-tab-${tokenBgType}`) content.classList.add('active');
            else content.classList.remove('active');
        });
        
        drawToken(tokenCanvas, 600, 600);
    });
});

// Popout controls
tokenPopoutToggle.addEventListener('change', (e) => {
    tokenPopoutEnabled = e.target.checked;
    if (tokenPopoutEnabled) {
        tokenPopoutHeightGroup.style.display = 'block';
    } else {
        tokenPopoutHeightGroup.style.display = 'none';
    }
    drawToken(tokenCanvas, 600, 600);
});

tokenPopoutHeightSlider.addEventListener('input', (e) => {
    tokenPopoutHeight = e.target.value;
    tokenPopoutHeightVal.textContent = `${tokenPopoutHeight}%`;
    drawToken(tokenCanvas, 600, 600);
});

tokenThicknessSlider.addEventListener('input', (e) => {
    tokenRingThickness = e.target.value;
    tokenThicknessVal.textContent = `${tokenRingThickness}%`;
    drawToken(tokenCanvas, 600, 600);
});

tokenRingScaleSlider.addEventListener('input', (e) => {
    tokenRingScaleOnCanvas = e.target.value;
    tokenRingScaleVal.textContent = `${tokenRingScaleOnCanvas}%`;
    drawToken(tokenCanvas, 600, 600);
});

tokenScaleSlider.addEventListener('input', (e) => {
    tokenScale = e.target.value;
    tokenScaleVal.textContent = `${tokenScale}%`;
    drawToken(tokenCanvas, 600, 600);
});

tokenRotateSlider.addEventListener('input', (e) => {
    tokenRotate = e.target.value;
    tokenRotateVal.textContent = `${tokenRotate}°`;
    drawToken(tokenCanvas, 600, 600);
});

btnTokenReset.addEventListener('click', () => {
    tokenPosX = 0;
    tokenPosY = 0;
    tokenScale = 100;
    tokenRotate = 0;
    tokenScaleSlider.value = 100;
    tokenScaleVal.textContent = '100%';
    tokenRotateSlider.value = 0;
    tokenRotateVal.textContent = '0°';
    drawToken(tokenCanvas, 600, 600);
});

// Glow controls
tokenGlowToggle.addEventListener('change', (e) => {
    tokenGlowEnabled = e.target.checked;
    if (tokenGlowEnabled) {
        tokenGlowControls.style.display = 'block';
    } else {
        tokenGlowControls.style.display = 'none';
    }
    drawToken(tokenCanvas, 600, 600);
});

tokenGlowColorInput.addEventListener('input', (e) => {
    tokenGlowColor = e.target.value;
    drawToken(tokenCanvas, 600, 600);
});

tokenGlowRadiusSlider.addEventListener('input', (e) => {
    tokenGlowRadius = e.target.value;
    tokenGlowRadiusVal.textContent = `${tokenGlowRadius}px`;
    drawToken(tokenCanvas, 600, 600);
});

// Status Overlay & Name
tokenStatusOverlaySelect.addEventListener('change', (e) => {
    tokenStatusOverlay = e.target.value;
    drawToken(tokenCanvas, 600, 600);
});

tokenNameInput.addEventListener('input', (e) => {
    tokenName = e.target.value;
    drawToken(tokenCanvas, 600, 600);
});

// Token Action Buttons
btnTokenDownload.addEventListener('click', () => {
    showOverlay('Экспорт токена высокой четкости...', 0);
    setTimeout(() => {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = 1000;
        exportCanvas.height = 1000;
        
        drawToken(exportCanvas, 1000, 1000, true);
        
        exportCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            downloadURL(url, `token-${tokenName.trim() || 'avatar'}.png`);
            hideOverlay();
            showToast('Токен успешно сохранен!');
        }, 'image/png');
    }, 100);
});

btnTokenBack.addEventListener('click', () => {
    if (tokenSourceScreen === 'bulk') {
        uploadScreen.style.display = 'none';
        studioScreen.style.display = 'none';
        tokenScreen.style.display = 'none';
        bulkScreen.style.display = 'grid';
    } else {
        uploadScreen.style.display = 'none';
        studioScreen.style.display = 'grid';
        tokenScreen.style.display = 'none';
        bulkScreen.style.display = 'none';
    }
});

// --- Upload Drag and Drop Binding ---
function initUploadZone() {
    dropzone.addEventListener('click', () => {
        directToTokenMode = false;
        fileInput.click();
    });
    btnSelectFile.addEventListener('click', (e) => {
        e.stopPropagation();
        directToTokenMode = false;
        fileInput.click();
    });
    btnUploadToToken.addEventListener('click', (e) => {
        e.stopPropagation();
        directToTokenMode = true;
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 1) {
            handleBulkFiles(files);
        } else if (files.length === 1) {
            handleSingleFile(files[0]);
        }
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 1) {
            handleBulkFiles(files);
        } else if (files.length === 1) {
            handleSingleFile(files[0]);
        }
    });
    
    // Paste from clipboard
    window.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                handleSingleFile(file);
                break;
            }
        }
    });

    // Demo Items click
    demoItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.stopPropagation();
            const url = item.dataset.url;
            showOverlay('Скачивание примера...', 0);
            try {
                const res = await fetch(url);
                const blob = await res.blob();
                const file = new File([blob], 'demo.jpg', { type: 'image/jpeg' });
                handleSingleFile(file);
            } catch (err) {
                console.error(err);
                hideOverlay();
                showToast('Не удалось загрузить пример.');
            }
        });
    });
}

// Logo click to reset
document.getElementById('logo-link').addEventListener('click', (e) => {
    e.preventDefault();
    uploadScreen.style.display = 'block';
    studioScreen.style.display = 'none';
    bulkScreen.style.display = 'none';
    tokenScreen.style.display = 'none';
});

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Populate color/gradient palettes
    populateSwatches();
    
    // 2. Load custom textured rings
    showOverlay('Загрузка текстур колец...');
    await preloadRingTextures();
    hideOverlay();
    
    // 3. Setup sliders and compare viewer
    initCompareSlider();
    initUploadZone();
});
