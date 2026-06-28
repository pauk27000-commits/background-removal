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
let tokenRingType = 'gold'; // 'gold', 'silver', 'cyber', 'obsidian', 'wood', 'runic', 'custom', 'ice', 'fire'
let tokenRingColor = '#f59e0b';
let tokenBgType = 'transparent'; // 'transparent', 'color', 'gradient', 'image'
let tokenBgColor = '#ffffff';
let tokenBgGradient = 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)';
let tokenBgImageFile = null;
let tokenBgImageURL = '';
let tokenPopoutEnabled = true;
const btnTokenEraserToggle = document.getElementById('btn-token-eraser-toggle');
const tokenEraserBtnText = document.getElementById('token-eraser-btn-text');
const tokenEraserControls = document.getElementById('token-eraser-controls');
const tokenEraserSize = document.getElementById('token-eraser-size');
const btnTokenEraserClear = document.getElementById('btn-token-eraser-clear');
let isTokenEraserMode = false;
let isTokenDrawing = false;
let tokenMaskCanvas = document.createElement('canvas');
tokenMaskCanvas.width = 600;
tokenMaskCanvas.height = 600;
let tokenMaskCtx = tokenMaskCanvas.getContext('2d');

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
let tokenNoClip = false;

let tokenCutSectorEnabled = false;
let tokenBgImgObj = null;

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
    ice: 'assets/rings/ring_ice.png',
    fire: 'assets/rings/ring_fire.png',
    dragon: 'assets/rings/ring_dragon.png'
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


// Eraser elements
const btnEraser = document.getElementById('btn-eraser');
const eraserModal = document.getElementById('eraser-modal');
const eraserCanvas = document.getElementById('eraser-canvas');
const eraserSizeSlider = document.getElementById('eraser-size-slider');
const btnEraserCancel = document.getElementById('btn-eraser-cancel');
const btnEraserSave = document.getElementById('btn-eraser-save');
let isErasing = false;
let eraserCtx = null;
let eraserImgObj = null;

// Token elements
const tokenCanvas = document.getElementById('token-preview-canvas');
const tokenRingSelect = document.getElementById('token-ring-select');
const tokenRingColorGroup = document.getElementById('token-ring-color-group');
const tokenRingColorInput = document.getElementById('token-ring-color');
const tokenBgTabs = document.querySelectorAll('#token-bg-tabs .bg-tab');
const tokenBgImageZone = document.getElementById('token-bg-image-zone');
const tokenBgImageInput = document.getElementById('token-bg-image-input');
const tokenBgImageName = document.getElementById('token-bg-image-name');
const tokenNoClipToggle = document.getElementById('token-no-clip-toggle');
const tokenPopoutHeightSlider = document.getElementById('token-popout-height-slider');
const tokenPopoutHeightVal = document.getElementById('token-popout-height-val');
const tokenPopoutHeightGroup = document.getElementById('token-popout-height-group');
const btnTokenEraser = document.getElementById('btn-token-eraser');

const tokenNavTabs = document.querySelectorAll('.token-nav-tab');
const tokenNavContents = document.querySelectorAll('.token-nav-content');
const tokenTabContents = document.querySelectorAll('.token-tab-content');
const tokenColorGrid = document.getElementById('token-color-grid');
const tokenGradientGrid = document.getElementById('token-gradient-grid');
const tokenPopoutToggle = document.getElementById('token-popout-toggle');
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

function trimTransparentBorders(blob) {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.src = url;
        img.onload = () => {
            URL.revokeObjectURL(url);
            const width = img.width;
            const height = img.height;
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            let imgData;
            try {
                imgData = ctx.getImageData(0, 0, width, height);
            } catch (e) {
                console.error("Failed to get image data for trimming:", e);
                resolve(blob);
                return;
            }
            
            const data = imgData.data;
            let minY = height, maxY = -1, minX = width, maxX = -1;
            
            const ALPHA_THRESHOLD = 10; // Ignore near-transparent pixels (noise, dust, faint glow)
            const PADDING = 4;           // Retain small margin for smooth anti-aliasing
            
            // Find top border (minY)
            let found = false;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (data[((y * width) + x) * 4 + 3] > ALPHA_THRESHOLD) {
                        minY = y;
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            
            if (!found) {
                // Image is completely transparent
                resolve(blob);
                return;
            }
            
            // Find bottom border (maxY)
            found = false;
            for (let y = height - 1; y >= minY; y--) {
                for (let x = 0; x < width; x++) {
                    if (data[((y * width) + x) * 4 + 3] > ALPHA_THRESHOLD) {
                        maxY = y;
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            
            // Find left border (minX)
            found = false;
            for (let x = 0; x < width; x++) {
                for (let y = minY; y <= maxY; y++) {
                    if (data[((y * width) + x) * 4 + 3] > ALPHA_THRESHOLD) {
                        minX = x;
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            
            // Find right border (maxX)
            found = false;
            for (let x = width - 1; x >= minX; x--) {
                for (let y = minY; y <= maxY; y++) {
                    if (data[((y * width) + x) * 4 + 3] > ALPHA_THRESHOLD) {
                        maxX = x;
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }

            // Apply padding to preserve subpixel anti-aliasing
            minX = Math.max(0, minX - PADDING);
            minY = Math.max(0, minY - PADDING);
            maxX = Math.min(width - 1, maxX + PADDING);
            maxY = Math.min(height - 1, maxY + PADDING);
            
            const cropWidth = maxX - minX + 1;
            const cropHeight = maxY - minY + 1;
            
            // Create a new canvas with cropped dimensions
            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = cropWidth;
            cropCanvas.height = cropHeight;
            const cropCtx = cropCanvas.getContext('2d');
            
            // Draw the cropped area
            cropCtx.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
            
            // Apply soft feathering along the transparent boundaries
            const finalCanvas = featherEdges(cropCanvas, 1.5);
            
            finalCanvas.toBlob((croppedBlob) => {
                if (croppedBlob) {
                    resolve(croppedBlob);
                } else {
                    resolve(blob);
                }
            }, 'image/png');
        };
        img.onerror = (err) => {
            console.error("Image loading failed for trimming:", err);
            URL.revokeObjectURL(url);
            resolve(blob);
        };
    });
}

function featherEdges(canvas, radius) {
    const width = canvas.width;
    const height = canvas.height;
    
    // 1. Create a mask of the image's transparency
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    maskCtx.drawImage(canvas, 0, 0);
    maskCtx.globalCompositeOperation = 'source-in';
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, width, height);
    
    // 2. Create a blurred version of that mask
    const blurredMaskCanvas = document.createElement('canvas');
    blurredMaskCanvas.width = width;
    blurredMaskCanvas.height = height;
    const blurredMaskCtx = blurredMaskCanvas.getContext('2d');
    if (typeof blurredMaskCtx.filter === 'string') {
        blurredMaskCtx.filter = `blur(${radius}px)`;
    }
    blurredMaskCtx.drawImage(maskCanvas, 0, 0);
    
    // 3. Mask the original image with the blurred transparency mask
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = width;
    resultCanvas.height = height;
    const resultCtx = resultCanvas.getContext('2d');
    resultCtx.drawImage(canvas, 0, 0);
    resultCtx.globalCompositeOperation = 'destination-in';
    resultCtx.drawImage(blurredMaskCanvas, 0, 0);
    
    return resultCanvas;
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
        layerOriginal.style.clipPath = `polygon(0 0, ${percent}% 0, ${percent}% 100%, 0 100%)`;
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
    
    const exportFilenameInput = document.getElementById('export-filename');
    if (exportFilenameInput) {
        exportFilenameInput.value = filenamePrefix;
    }
    
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
        
        showOverlay('Обрезание пустых полей...', 95);
        const trimmedBlob = await trimTransparentBorders(blob);
        
        processedImageBlob = trimmedBlob;
        processedImageURL = URL.createObjectURL(trimmedBlob);
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
        layerProcessed.classList.remove('hidden');
        sliderHandle.classList.remove('hidden');
        document.getElementById('badge-original').classList.remove('hidden');
        document.getElementById('badge-processed').classList.remove('hidden');
        transformSection.classList.add('hidden');
    } else {
        customBgLayer.classList.remove('hidden');
        workspaceLayer.classList.remove('hidden');
        layerOriginal.classList.add('hidden');
        layerProcessed.classList.add('hidden');
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
        const customNameInput = document.getElementById('export-filename');
        let finalName = customNameInput && customNameInput.value.trim() !== '' ? customNameInput.value.trim() : filenamePrefix;
        if (!finalName.toLowerCase().endsWith('.png')) finalName += '.png';
        downloadURL(finalURL, finalName);
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
        
        const trimmedBlob = await trimTransparentBorders(blob);
        
        nextItem.status = 'done';
        nextItem.processedBlob = trimmedBlob;
        nextItem.processedURL = URL.createObjectURL(trimmedBlob);
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

    // 1. Draw Token background inside the circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    
    if (tokenBgType === 'color') {
        ctx.fillStyle = tokenBgColor;
        ctx.fill();
    } else if (tokenBgType === 'gradient') {
        let gradColors = ['#ff9a9e', '#fecfef'];
        if (tokenBgGradient && tokenBgGradient.includes('#2b5876')) gradColors = ['#2b5876', '#4e4376'];
        else if (tokenBgGradient && tokenBgGradient.includes('#02aab0')) gradColors = ['#02aab0', '#00cdac'];
        else if (tokenBgGradient && tokenBgGradient.includes('#f83600')) gradColors = ['#f83600', '#f9d423'];
        else if (tokenBgGradient && tokenBgGradient.includes('#7028e4')) gradColors = ['#7028e4', '#e5b2ca'];
        else if (tokenBgGradient && tokenBgGradient.includes('#e0c3fc')) gradColors = ['#e0c3fc', '#8ec5fc'];
        
        const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        grad.addColorStop(0, gradColors[0]);
        grad.addColorStop(1, gradColors[1]);
        ctx.fillStyle = grad;
        ctx.fill();
    } else if (tokenBgType === 'image' && tokenBgImgObj) {
        ctx.save();
        ctx.clip();
        const imgScale = Math.max(r * 2 / tokenBgImgObj.width, r * 2 / tokenBgImgObj.height);
        const dw = tokenBgImgObj.width * imgScale;
        const dh = tokenBgImgObj.height * imgScale;
        ctx.drawImage(tokenBgImgObj, cx - dw / 2, cy - dh / 2, dw, dh);
        ctx.restore();
    }
    ctx.restore();

    // 2. Prepare Character on temporary canvas (to apply eraser mask strictly to character only)
    let tempCanvas = null;
    if (tokenCutoutImage) {
        tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.save();
        tempCtx.translate(cx + tokenPosX * scaleFactor, cy + tokenPosY * scaleFactor);
        if (typeof tokenRotate !== 'undefined') tempCtx.rotate((tokenRotate * Math.PI) / 180);
        
        const imgScale = (tokenScale / 100) * (r * 2 / Math.min(tokenCutoutImage.width, tokenCutoutImage.height));
        const drawW = tokenCutoutImage.width * imgScale;
        const drawH = tokenCutoutImage.height * imgScale;
        const drawX = -drawW / 2;
        const drawY = -drawH / 2;
        
        tempCtx.drawImage(tokenCutoutImage, drawX, drawY, drawW, drawH);
        tempCtx.restore();
        
        // Apply Eraser Mask strictly to character
        if (typeof tokenMaskCanvas !== 'undefined' && tokenMaskCanvas) {
            tempCtx.save();
            tempCtx.globalCompositeOperation = 'destination-out';
            tempCtx.drawImage(tokenMaskCanvas, 0, 0, width, height);
            tempCtx.restore();
        }
    }

    // Draw Character (clipped inside circle)
    if (tempCanvas) {
        ctx.save();
        if (!tokenNoClip) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.clip();
        }
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();

        // 3. Draw Ring
        ctx.save();
        if (ringTextures[tokenRingType]) {
            const ringSize = r * 2.9411; // 2 * r / 0.68
            ctx.drawImage(ringTextures[tokenRingType], cx - ringSize / 2, cy - ringSize / 2, ringSize, ringSize);
        } else {
            ctx.lineWidth = thickness;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(cx, cy, r + thickness / 2, 0, Math.PI * 2);
            
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
            } else if (tokenRingType === 'custom') {
                ctx.strokeStyle = typeof tokenRingColor !== 'undefined' ? tokenRingColor : '#f59e0b';
                ctx.stroke();
                ctx.lineWidth = 1 * scaleFactor;
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx, cy, r + thickness, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.strokeStyle = '#9ca3af';
                ctx.stroke();
            }
        }
        ctx.restore();

        // 4. Draw outer Cutout Popout
        if (tempCanvas && (tokenPopoutEnabled || tokenNoClip)) {
            ctx.save();
            
            if (!tokenNoClip) {
                ctx.beginPath();
                // Height slider: 0 = everything cut, 100 = nothing cut
                let hVal = typeof tokenPopoutHeight !== 'undefined' ? tokenPopoutHeight : 50;
                let rectHeight = cy - r + (r * 2) * ((100 - hVal) / 100);
                
                ctx.rect(0, 0, width, rectHeight);
                ctx.clip();
            }
            
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.restore();
        }
    }
}

// Helper for token coordinates
function getTokenCanvasPos(clientX, clientY) {
    const rect = tokenCanvas.getBoundingClientRect();
    const scaleX = 600 / rect.width;
    const scaleY = 600 / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// Token Drag & Eraser handlers
tokenCanvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (isTokenEraserMode) {
        isTokenDrawing = true;
        const pos = getTokenCanvasPos(e.clientX, e.clientY);
        tokenMaskCtx.beginPath();
        tokenMaskCtx.moveTo(pos.x, pos.y);
        tokenMaskCtx.lineWidth = parseInt(tokenEraserSize.value);
        tokenMaskCtx.lineCap = 'round';
        tokenMaskCtx.lineJoin = 'round';
        tokenMaskCtx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        const rect = tokenCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        tokenIsDragging = true;
        tokenDragStartX = x - tokenPosX;
        tokenDragStartY = y - tokenPosY;
    }
});

window.addEventListener('mousemove', (e) => {
    if (isTokenEraserMode && isTokenDrawing) {
        const pos = getTokenCanvasPos(e.clientX, e.clientY);
        tokenMaskCtx.lineTo(pos.x, pos.y);
        tokenMaskCtx.stroke();
        drawToken(tokenCanvas, 600, 600);
    } else if (tokenIsDragging) {
        const rect = tokenCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        tokenPosX = x - tokenDragStartX;
        tokenPosY = y - tokenDragStartY;
        drawToken(tokenCanvas, 600, 600);
    }
});

window.addEventListener('mouseup', () => {
    if (isTokenDrawing) {
        isTokenDrawing = false;
        tokenMaskCtx.closePath();
    }
    tokenIsDragging = false;
});

// Touch support for Token drag & eraser
tokenCanvas.addEventListener('touchstart', (e) => {
    if (e.touches[0]) {
        e.preventDefault();
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;
        if (isTokenEraserMode) {
            isTokenDrawing = true;
            const pos = getTokenCanvasPos(clientX, clientY);
            tokenMaskCtx.beginPath();
            tokenMaskCtx.moveTo(pos.x, pos.y);
            tokenMaskCtx.lineWidth = parseInt(tokenEraserSize.value);
            tokenMaskCtx.lineCap = 'round';
            tokenMaskCtx.lineJoin = 'round';
            tokenMaskCtx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            const rect = tokenCanvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            tokenIsDragging = true;
            tokenDragStartX = x - tokenPosX;
            tokenDragStartY = y - tokenPosY;
        }
    }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) {
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;
        if (isTokenEraserMode && isTokenDrawing) {
            e.preventDefault();
            const pos = getTokenCanvasPos(clientX, clientY);
            tokenMaskCtx.lineTo(pos.x, pos.y);
            tokenMaskCtx.stroke();
            drawToken(tokenCanvas, 600, 600);
        } else if (tokenIsDragging) {
            const rect = tokenCanvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            tokenPosX = x - tokenDragStartX;
            tokenPosY = y - tokenDragStartY;
            drawToken(tokenCanvas, 600, 600);
        }
    }
}, { passive: false });

window.addEventListener('touchend', () => {
    if (isTokenDrawing) {
        isTokenDrawing = false;
        tokenMaskCtx.closePath();
    }
    tokenIsDragging = false;
});

// Token controls listeners
if (tokenRingSelect) {
    tokenRingSelect.addEventListener('change', (e) => {
        tokenRingType = e.target.value;
        if (tokenRingType === 'custom') {
            tokenRingColorGroup.style.display = 'flex';
        } else {
            tokenRingColorGroup.style.display = 'none';
        }
        drawToken(tokenCanvas, 600, 600);
    });
}
if (tokenRingColorInput) {
    tokenRingColorInput.addEventListener('input', (e) => {
        tokenRingColor = e.target.value;
        drawToken(tokenCanvas, 600, 600);
    });
}


if (tokenPopoutHeightSlider) {
    tokenPopoutHeightSlider.addEventListener('input', (e) => {
        tokenPopoutHeight = parseInt(e.target.value);
        tokenPopoutHeightVal.textContent = tokenPopoutHeight + '%';
        drawToken(tokenCanvas, 600, 600);
    });
}


tokenNavTabs.forEach(btn => {
    btn.addEventListener('click', () => {
        const nav = btn.dataset.nav;
        tokenNavTabs.forEach(b => {
            if (b === btn) {
                b.classList.add('active');
                b.style.borderBottomColor = 'var(--primary)';
                b.style.color = 'white';
            } else {
                b.classList.remove('active');
                b.style.borderBottomColor = 'transparent';
                b.style.color = 'var(--color-text-muted)';
            }
        });
        
        tokenNavContents.forEach(content => {
            if (content.id === 'nav-' + nav) content.style.display = 'block';
            else content.style.display = 'none';
        });
    });
});

if (tokenBgImageZone) {
    tokenBgImageZone.addEventListener('click', () => tokenBgImageInput.click());
    tokenBgImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            tokenBgImageFile = file;
            tokenBgImageName.textContent = file.name;
            tokenBgImageName.classList.remove('hidden');
            tokenBgImageURL = URL.createObjectURL(file);
            tokenBgImgObj = new Image();
            tokenBgImgObj.onload = () => drawToken(tokenCanvas, 600, 600);
            tokenBgImgObj.src = tokenBgImageURL;
        }
    });
}

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
    const tokenPopoutControls = document.getElementById('token-popout-controls');
    if (tokenPopoutControls) {
        tokenPopoutControls.style.display = tokenPopoutEnabled ? 'block' : 'none';
    }
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


if (tokenNoClipToggle) {
    tokenNoClipToggle.addEventListener('change', (e) => {
        tokenNoClip = e.target.checked;
        drawToken(tokenCanvas, 600, 600);
    });
}


if (btnTokenEraserToggle) {
    btnTokenEraserToggle.addEventListener('click', () => {
        isTokenEraserMode = !isTokenEraserMode;
        if (isTokenEraserMode) {
            btnTokenEraserToggle.style.background = 'rgba(99, 102, 241, 0.2)';
            tokenEraserBtnText.textContent = 'Режим Ластика: ВКЛ';
            tokenEraserControls.style.display = 'flex';
        } else {
            btnTokenEraserToggle.style.background = 'transparent';
            tokenEraserBtnText.textContent = 'Режим Ластика: ВЫКЛ';
            tokenEraserControls.style.display = 'none';
        }
    });
}
if (btnTokenEraserClear) {
    btnTokenEraserClear.addEventListener('click', () => {
        tokenMaskCtx.clearRect(0, 0, 600, 600);
        drawToken(tokenCanvas, 600, 600);
    });
}

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


// --- Eraser Tool Logic ---
if (btnEraser) {
    btnEraser.addEventListener('click', () => {
        if (!processedImageURL) return;
        
        eraserImgObj = new Image();
        eraserImgObj.onload = () => {
            // Set canvas size to match image aspect ratio, capped at 800px width/height
            const MAX_DIM = 800;
            let w = eraserImgObj.width;
            let h = eraserImgObj.height;
            if (w > MAX_DIM || h > MAX_DIM) {
                const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
                w = w * ratio;
                h = h * ratio;
            }
            
            eraserCanvas.width = w;
            eraserCanvas.height = h;
            
            eraserCtx = eraserCanvas.getContext('2d');
            eraserCtx.drawImage(eraserImgObj, 0, 0, w, h);
            
            eraserModal.style.display = 'flex';
        };
        eraserImgObj.src = processedImageURL;
    });
}

if (btnEraserCancel) {
    btnEraserCancel.addEventListener('click', () => {
        eraserModal.style.display = 'none';
    });
}



if (btnEraserSave) {
    btnEraserSave.addEventListener('click', () => {
        if (!eraserCanvas) return;
        
        eraserCanvas.toBlob((blob) => {
            if (processedImageURL) URL.revokeObjectURL(processedImageURL);
            processedImageURL = URL.createObjectURL(blob);
            
            imgProcessed.src = processedImageURL;
            cutoutDraggable.src = processedImageURL;
            
            if (tokenSourceScreen) {
                tokenCutoutImage.src = processedImageURL;
                tokenCutoutImage.onload = () => drawToken(tokenCanvas, 600, 600);
            }
            
            eraserModal.style.display = 'none';
            showToast('Изменения сохранены');
        }, 'image/png');
    });
}

// Eraser Drawing Handlers
function getEraserPos(e) {
    const rect = eraserCanvas.getBoundingClientRect();
    const scaleX = eraserCanvas.width / rect.width;
    const scaleY = eraserCanvas.height / rect.height;
    
    let clientX = e.clientX;
    let clientY = e.clientY;
    
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

if (eraserCanvas) {
    const startErasing = (e) => {
        e.preventDefault();
        isErasing = true;
        const pos = getEraserPos(e);
        eraserCtx.globalCompositeOperation = 'destination-out';
        eraserCtx.lineCap = 'round';
        eraserCtx.lineJoin = 'round';
        eraserCtx.lineWidth = parseInt(eraserSizeSlider.value);
        eraserCtx.beginPath();
        eraserCtx.moveTo(pos.x, pos.y);
    };

    const erase = (e) => {
        if (!isErasing) return;
        e.preventDefault();
        const pos = getEraserPos(e);
        eraserCtx.lineTo(pos.x, pos.y);
        eraserCtx.stroke();
    };

    const stopErasing = () => {
        if (!isErasing) return;
        isErasing = false;
        eraserCtx.closePath();
    };

    eraserCanvas.addEventListener('mousedown', startErasing);
    eraserCanvas.addEventListener('mousemove', erase);
    window.addEventListener('mouseup', stopErasing);
    
    eraserCanvas.addEventListener('touchstart', startErasing, {passive: false});
    eraserCanvas.addEventListener('touchmove', erase, {passive: false});
    window.addEventListener('touchend', stopErasing);
}

// Update cursor preview on slider change
if (eraserSizeSlider) {
    eraserSizeSlider.addEventListener('input', (e) => {
        const size = parseInt(e.target.value);
        // Not adding custom cursor, default crosshair is fine
    });
}


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
