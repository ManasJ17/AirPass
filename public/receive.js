// Receive Page JavaScript

// Notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#2563eb'};
    color: white;
    border-radius: 8px;
    font-family: 'Blanka', sans-serif;
    font-size: 0.9rem;
    z-index: 10000;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
  const keyInput = document.getElementById('keyInput');
  const pasteBtn = document.getElementById('pasteBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  // Check for auto-fill from URL parameters (QR code functionality)
  const urlParams = new URLSearchParams(window.location.search);
  const autoKey = urlParams.get('key');
  if (autoKey) {
    keyInput.value = autoKey.trim();
    validateKey();
    showNotification('Key auto-filled from QR code!', 'success');
    
    // Optional: Auto-download after a short delay
    setTimeout(() => {
      if (validateKeyFormat(autoKey.trim().toUpperCase())) {
        downloadFile(autoKey.trim().toUpperCase());
      }
    }, 1500);
  }

  // Paste functionality
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      keyInput.value = text.trim();
      validateKey();
    } catch (err) {
      showNotification('Failed to paste from clipboard', 'error');
    }
  });

  // QR Upload functionality
  const qrUploadArea = document.getElementById('qrUploadArea');
  const qrFileInput = document.getElementById('qrFileInput');
  const qrStatus = document.getElementById('qrStatus');
  const qrStatusIcon = document.getElementById('qrStatusIcon');
  const qrStatusText = document.getElementById('qrStatusText');

  if (qrUploadArea && qrFileInput) {
    // Click to upload
    qrUploadArea.addEventListener('click', () => {
      qrFileInput.click();
    });

    // File selection
    qrFileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        handleQRUpload(file);
      }
    });

    // Drag and drop
    qrUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      qrUploadArea.classList.add('drag-over');
    });

    qrUploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      qrUploadArea.classList.remove('drag-over');
    });

    qrUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      qrUploadArea.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleQRUpload(files[0]);
      }
    });
  }

  // Key validation
  keyInput.addEventListener('input', validateKey);

  function validateKey() {
    const key = keyInput.value.trim();
    const isValid = /^[A-Z0-9]{8,12}$/i.test(key);
    
    downloadBtn.disabled = !isValid;
    
    if (key.length > 0 && !isValid) {
      keyInput.style.borderColor = '#ef4444';
    } else {
      keyInput.style.borderColor = '';
    }
  }

  // Download functionality
  downloadBtn.addEventListener('click', function() {
    const key = keyInput.value.trim().toUpperCase();
    
    if (validateKeyFormat(key)) {
      downloadFile(key);
    } else {
      showNotification('Please enter a valid key (8-12 characters)', 'error');
    }
  });
  // QR Upload handler using jsQR - Complete rewrite for reliability
  async function handleQRUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      showNotification('Please select a valid image file', 'error');
      return;
    }

    showQRStatus('Processing QR code...', '🔍', 'info');

    try {
      console.log('🚀 Starting QR decode with jsQR for file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Check if jsQR library is loaded
      if (typeof jsQR === 'undefined') {
        throw new Error('jsQR library not loaded');
      }
      console.log('✅ jsQR library loaded successfully');

      // Load the image using proper Image() object
      const imageDataUrl = await readFileAsDataURL(file);
      console.log('📄 File converted to data URL');
      
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageDataUrl;
      });

      console.log(`📐 Image loaded: ${img.width}x${img.height}`);

      // Draw the QR image to canvas at full resolution
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match image resolution (no distortion)
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image to canvas
      ctx.drawImage(img, 0, 0, img.width, img.height);
      console.log('✅ Image drawn to canvas at full resolution');
      
      // Read pixel data using getImageData
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      console.log('✅ Pixel data extracted:', imageData.data.length, 'bytes');
      
      // Pass the pixel data to jsQR with inversionAttempts
      const qr = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth"
      });
      
      if (qr === null) {
        // If decoding fails → Show toast error
        console.log('❌ jsQR returned null - no QR code found');
        hideQRStatus();
        showNotification('No valid QR code found in this image. Please try another image.', 'error');
        return;
      }
      
      // If decoding succeeds → Extract the decoded text
      const decodedText = qr.data.trim();
      console.log('🎉 QR Successfully decoded:', decodedText);
      hideQRStatus();
      
      // Process the decoded text according to validation rules
      processDecodedQR(decodedText);
      
    } catch (error) {
      console.error('QR decode error:', error);
      hideQRStatus();
      showNotification('Unable to decode QR code. Please ensure the image is clear and contains a valid QR code.', 'error');
    }
  }
  
  // Helper function to read file as data URL
  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Process decoded QR text with exact validation rules as specified
  function processDecodedQR(decodedText) {
    console.log('🔍 Processing decoded QR text:', decodedText);
    
    // URL Validation Rules (exact implementation as requested)
    if (decodedText.startsWith("http")) {
      // Case A — A full URL → Automatically redirect to this link
      console.log('✅ Full URL detected, redirecting:', decodedText);
      showNotification('QR code contains URL, redirecting...', 'success');
      window.location.href = decodedText;
    } 
    else if (/^[A-F0-9]{8}$/i.test(decodedText)) {
      // Case B — Only a key (8-character hex-like key) → Redirect manually
      console.log('✅ Valid 8-character key detected:', decodedText);
      showNotification('QR code decoded successfully! Redirecting...', 'success');
      window.location.href = `/receive?key=${decodedText.trim()}`;
    }
    else {
      // Neither matches → show error
      console.log('❌ Invalid QR content - not a URL or valid key:', decodedText);
      showNotification('This QR does not contain a valid AirPass key or URL.', 'error');
    }
  }

  // QR Status functions
  function showQRStatus(message, icon = '⏳', type = 'info') {
    if (qrStatus && qrStatusIcon && qrStatusText) {
      qrStatusIcon.textContent = icon;
      qrStatusText.textContent = message;
      qrStatus.style.display = 'block';
      qrStatus.className = `qr-status ${type}`;
    }
  }

  function hideQRStatus() {
    if (qrStatus) {
      qrStatus.style.display = 'none';
    }
  }
  function validateKeyFormat(key) {
    return /^[A-Z0-9]{8,12}$/.test(key);
  }

  async function downloadFile(key) {
    downloadBtn.textContent = 'Downloading...';
    downloadBtn.disabled = true;
    
    // Create progress indicator
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    progressContainer.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <div class="progress-text">Connecting...</div>
    `;
    
    progressContainer.style.cssText = `
      margin-top: 1rem;
      padding: 1rem;
      background: #0a0a0a;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
    `;
    
    const progressBarStyle = `
      .progress-bar {
        width: 100%;
        height: 6px;
        background: #2a2a2a;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #2563EB, #3B82F6);
        width: 0%;
        transition: width 0.5s ease;
      }
      .progress-text {
        font-size: 0.9rem;
        color: #8a8a8a;
        text-align: center;
      }
    `;
    
    if (!document.getElementById('progressStyles')) {
      const style = document.createElement('style');
      style.id = 'progressStyles';
      style.textContent = progressBarStyle;
      document.head.appendChild(style);
    }
    
    downloadBtn.parentNode.appendChild(progressContainer);
    const progressFill = progressContainer.querySelector('#progressFill');
    const progressText = progressContainer.querySelector('.progress-text');
    
    try {
      // Try to download from server first
      const response = await fetch(`/api/download/${key}`);
      
      if (response.ok) {
        // Real file download
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'download';
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        // Simulate progress for better UX
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 25 + 10;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            progressText.textContent = 'Download complete!';
            setTimeout(() => {
              showNotification('File downloaded successfully!', 'success');
              resetDownloadState();
            }, 1000);
          } else {
            progressFill.style.width = progress + '%';
            progressText.textContent = `Downloading... ${Math.floor(progress)}%`;
          }
        }, 150);
      } else if (response.status === 404) {
        resetDownloadState();
        showNotification('Invalid key. Please check and try again.', 'error');
        return;
      } else if (response.status === 410) {
        // Handle expired keys - check for structured JSON error
        try {
          const errorData = await response.json();
          if (errorData.error === 'expired') {
            resetDownloadState();
            showExpiredModal();
            return;
          }
        } catch (jsonError) {
          console.log('Could not parse error response:', jsonError);
        }
        resetDownloadState();
        showExpiredModal();
        return;
      } else {
        resetDownloadState();
        showNotification('Download failed. Please try again.', 'error');
        return;
      }
    } catch (error) {
      resetDownloadState();
      console.error('Download error:', error);
      showNotification('Connection error. Please check your internet and try again.', 'error');
    }
  }
  
  function resetDownloadState() {
    downloadBtn.textContent = 'Download File';
    downloadBtn.disabled = false;
    
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
      progressContainer.remove();
    }
    
    // Reset form
    keyInput.value = '';
    validateKey();
  }
});

// Expired key modal functions
function showExpiredModal() {
  const modal = document.getElementById('expiredModal');
  if (modal) {
    modal.classList.add('show');
  }
}

function closeExpiredModal() {
  const modal = document.getElementById('expiredModal');
  if (modal) {
    modal.classList.remove('show');
  }
}
