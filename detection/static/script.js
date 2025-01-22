// 拖拽上传功能
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');

dropZone.addEventListener('click', () => {
    imageInput.click();
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

['dragleave', 'dragend'].forEach(type => {
    dropZone.addEventListener(type, (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length) {
        imageInput.files = files;
        handleImageSelect(files[0]);
    }
});

// 图片选择处理
imageInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleImageSelect(e.target.files[0]);
    }
});

function handleImageSelect(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('originalImage').src = e.target.result;
    }
    reader.readAsDataURL(file);
}

// 检测功能
async function detectObjects() {
    const imageInput = document.getElementById('imageInput');
    const resultImage = document.getElementById('resultImage');
    const detectButton = document.getElementById('detectButton');
    const selectedModel = document.querySelector('input[name="model"]:checked').value;

    if (!imageInput.files || !imageInput.files[0]) {
        alert('请先选择图片');
        return;
    }

    // 添加加载状态
    detectButton.disabled = true;
    detectButton.innerHTML = '<span class="spinner"></span>检测中...';
    resultImage.src = '';

    const formData = new FormData();
    formData.append('image', imageInput.files[0]);
    formData.append('model_name', selectedModel);

    try {
        const response = await fetch('/detect', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('检测失败');
        }

        const blob = await response.blob();
        resultImage.src = URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error:', error);
        alert('检测失败：' + error.message);
    } finally {
        detectButton.disabled = false;
        detectButton.innerHTML = '<i class="material-icons">search</i>开始检测';
    }
} 