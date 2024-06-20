let img; 
let squares = []; // Array to store squares drawn
let scale = 0.75;

document.getElementById('uploadImage').addEventListener('change', function(event) {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        img = new Image();
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);
    squares = [];
});

function rgbToXyz(rgb) {
    let [r, g, b] = rgb.map(val => val / 255);
    [r, g, b] = [r, g, b].map(val => (val > 0.04045 ? Math.pow((val + 0.055) / 1.055, 2.4) : val / 12.92));
    const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100;
    const y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) * 100;
    const z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) * 100;
    return [x, y, z];
}

function xyzToLab(xyz) {
    const [x, y, z] = xyz.map(val => val / 100);
    const fx = x > 0.008856 ? Math.cbrt(x) : (7.787 * x) + (16 / 116);
    const fy = y > 0.008856 ? Math.cbrt(y) : (7.787 * y) + (16 / 116);
    const fz = z > 0.008856 ? Math.cbrt(z) : (7.787 * z) + (16 / 116);
    const l = (116 * fy) - 16;
    const a = 500 * (fx - fy);
    const b = 200 * (fy - fz);
    return [l, a, b];
}

function labToXyz(lab) {
    const [l, a, b] = lab;
    const fy = (l + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;
    const [xr, yr, zr] = [fx, fy, fz].map(val => Math.pow(val, 3) > 0.008856 ? Math.pow(val, 3) : (val - 16 / 116) / 7.787);
    const x = xr * 100;
    const y = yr * 100;
    const z = zr * 100;
    return [x, y, z];
}

function xyzToRgb(xyz) {
    const [x, y, z] = xyz.map(val => val / 100);
    const r = (x * 3.2404542 + y * -1.5371385 + z * -0.4985314);
    const g = (x * -0.9692660 + y * 1.8760108 + z * 0.0415560);
    const b = (x * 0.0556434 + y * -0.2040259 + z * 1.0572252);
    const [r2, g2, b2] = [r, g, b].map(val => (val > 0.0031308 ? 1.055 * Math.pow(val, 1 / 2.4) - 0.055 : val * 12.92));
    return [r2, g2, b2].map(val => Math.max(0, Math.min(1, val)) * 255);
}

function rgbToYuv(rgb) {
    let [r, g, b] = rgb;
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const u = -0.14713 * r - 0.28886 * g + 0.436 * b;
    const v = 0.615 * r - 0.51499 * g - 0.10001 * b;
    return [y, u, v];
}

function yuvToRgb(yuv) {
    const [y, u, v] = yuv;
    const r = y + 1.13983 * v;
    const g = y - 0.39465 * u - 0.58060 * v;
    const b = y + 2.03211 * u;
    return [Math.round(r), Math.round(g), Math.round(b)];
}

function rgbToLab(rgb) {
    return xyzToLab(rgbToXyz(rgb));
}

function labToRgb(lab) {
    return xyzToRgb(labToXyz(lab));
}

function drawSquare(x, y, size, selectedYuv, data, canvas) {
    for (let i = x - size / 2; i < x + size / 2; i++) {
        for (let j = y - size / 2; j < y + size / 2; j++) {
            if (i >= 0 && i < canvas.width && j >= 0 && j < canvas.height) {
                const index = (j * canvas.width + i) * 4;
                const rgb = [data[index], data[index + 1], data[index + 2]];
                const yuv = rgbToYuv(rgb);

                yuv[1] = selectedYuv[1];
                yuv[2] = selectedYuv[2];

                const newRgb = yuvToRgb(yuv);

                data[index] = newRgb[0];
                data[index + 1] = newRgb[1];
                data[index + 2] = newRgb[2];
            }
        }
    } 
}

let selectedColor = [255, 0, 0];

document.querySelectorAll('.color').forEach(colorDiv => {
    colorDiv.addEventListener('click', function() {
        selectedColor = this.getAttribute('data-color').match(/\d+/g).map(Number);
        selectedColor[0] = scale*128 + selectedColor[0]*(1-scale);
        selectedColor[1] = scale*128 + selectedColor[1]*(1-scale);
        selectedColor[2] = scale*128 + selectedColor[2]*(1-scale);
    });
});

document.getElementById('imageCanvas').addEventListener('click', function(event) {
    const canvas = this;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const size = 20;  // Size of the square

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        const selectedYuv = rgbToYuv(selectedColor);
        drawSquare(x, y, size, selectedYuv, data, canvas);
        squares.push({ x: x, y: y, size: size, color: selectedYuv });
        ctx.putImageData(imageData, 0, 0);
    }
});

document.getElementById('undoButton').addEventListener('click', function() {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let square of squares) {
            console.log(square)
            drawSquare(square.x, square.y, square.size, square.color, data, canvas);
            ctx.putImageData(imageData, 0, 0);
        }
    }
    if (squares.length > 0) {
        squares.pop();
        redrawCanvas();
    } else {
        alert('Nothing to undo.');
    }
});

document.getElementById('saveImage').addEventListener('click', function() {
    const canvas = document.getElementById('imageCanvas');
    const fileNameInput = document.getElementById('fileName');
    const fileName = fileNameInput.value || 'colored-image';  // Default name if input is empty
    const link = document.createElement('a');
    link.download = fileName + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});
