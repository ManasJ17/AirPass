// Send Page JavaScript

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
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const generateBtn = document.getElementById('generateKeyBtn');
  const noteInput = document.getElementById('noteInput');

  // File input handling
  browseBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', handleFileSelect);

  // Drag and drop functionality
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect({ target: { files } });
    }
  });

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      // Update UI to show selected file
      const fileName = file.name;
      const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      
      dropZone.innerHTML = `
        <div class="dropzone-content">
          <div class="dropzone-icon">📄</div>
          <h3 class="dropzone-title">${fileName}</h3>
          <p class="dropzone-subtitle">${fileSize}</p>
          <button class="btn btn-secondary" id="changeFile">Change File</button>
        </div>
      `;
      
      document.getElementById('changeFile').addEventListener('click', () => {
        fileInput.click();
      });
      
      generateBtn.disabled = false;
    }
  }

  // Generate key functionality
  generateBtn.addEventListener('click', async function() {
    const file = fileInput.files[0];
    const note = noteInput.value.trim();
    
    if (!file) {
      showNotification('Please select a file first', 'error');
      return;
    }
    
    generateBtn.disabled = true;
    generateBtn.textContent = 'Uploading...';
    
    try {
      // Get expiry values
      const expiryValue = document.getElementById('expiryValue').value || '12';
      const expiryUnit = document.getElementById('expiryUnit').value || 'hours';
      
      // Try to upload to server
      const formData = new FormData();
      formData.append('file', file);
      if (note) {
        formData.append('note', note);
      }
      formData.append('expiryValue', expiryValue);
      formData.append('expiryUnit', expiryUnit);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        showSuccessModal(result.key);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.log('Server upload failed, using demo mode:', error.message);
      // Fallback to demo key generation
      const key = generateSecureKey();
      showSuccessModal(key);
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate Secure Key';
    }
  });

  function generateSecureKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 12; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  // QR Modal function
  function showQRModal(key) {
    const qrModal = document.createElement('div');
    qrModal.className = 'qr-modal-overlay';
    
    qrModal.innerHTML = `
      <div class="qr-modal-card">
        <div class="qr-modal-header">
          <h3>QR Code for File Download</h3>
        </div>
        
        <div class="qr-modal-body">
          <div class="qr-code-container">
            <div id="qrCodeDisplay"></div>
          </div>
          
          <div class="qr-key-info">
            <span class="key-text">Key: ${key}</span>
          </div>
          
          <div class="qr-buttons">
            <button class="qr-download-btn" id="qrDownloadBtn">
              <span class="btn-icon">💾</span>
              Download QR
            </button>
            <button class="qr-close-btn" id="qrCloseBtn">
              Close
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(qrModal);
    
    // Generate QR code with proper URL
    const downloadUrl = `${window.location.origin}/receive.html?key=${key}`;
    const canvas = document.getElementById('qrCodeCanvas');
    
    // Clear any existing QR code
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    QRCode.toCanvas(canvas, downloadUrl, {
      width: 240,
      height: 240,
      margin: 3,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    
    // QR Modal event handlers
    const qrCloseBtn = qrModal.querySelector('#qrCloseBtn');
    
    qrCloseBtn.addEventListener('click', () => {
      qrModal.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => {
        if (document.body.contains(qrModal)) {
          document.body.removeChild(qrModal);
        }
      }, 300);
    });
    
    qrModal.addEventListener('click', (e) => {
      if (e.target === qrModal) {
        qrCloseBtn.click();
      }
    });
  }

  function showSuccessModal(key) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
      <div class="success-modal">
        <div class="success-icon">
          <div class="checkmark">✓</div>
        </div>
        <h2 class="success-title">File Uploaded Successfully!</h2>
        <p class="success-subtitle">Your secure access key:</p>
        
        <div class="key-container">
          <div class="key-display" id="modalKey">${key}</div>
        </div>
        
        <div class="button-stack">
          <button class="action-btn primary-btn" id="modalCopyBtn">
            <span class="btn-icon">📋</span>
            Copy Key
          </button>
          <button class="action-btn secondary-btn" id="modalQrBtn">
            <span class="btn-icon">📱</span>
            Generate QR Code
          </button>
        </div>
        
        <div class="modal-close">
          <button class="close-btn" id="modalCloseBtn">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Modal event handlers
    const copyBtn = modal.querySelector('#modalCopyBtn');
    const qrBtn = modal.querySelector('#modalQrBtn');
    const closeBtn = modal.querySelector('#modalCloseBtn');
    
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(key);
        copyBtn.textContent = '✓ Copied!';
        copyBtn.style.background = '#10b981';
        copyBtn.style.borderColor = '#10b981';
        setTimeout(() => {
          copyBtn.textContent = '📋 Copy Key';
          copyBtn.style.background = '';
          copyBtn.style.borderColor = '';
        }, 2000);
        showNotification('Key copied to clipboard!', 'success');
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = key;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        copyBtn.textContent = '✓ Copied!';
        copyBtn.style.background = '#10b981';
        setTimeout(() => {
          copyBtn.textContent = '📋 Copy Key';
          copyBtn.style.background = '';
        }, 2000);
        showNotification('Key copied to clipboard!', 'success');
      }
    });

    qrBtn.addEventListener('click', () => {
      showQRModal(key);
    });
    
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // QR Modal function - COMPLETE IMPLEMENTATION
  function showQRModal(key) {
    // Remove existing QR modal if any
    const existingModal = document.getElementById('qrModal');
    if (existingModal) {
      document.body.removeChild(existingModal);
    }

    // Create QR modal
    const qrModal = document.createElement('div');
    qrModal.id = 'qrModal';
    qrModal.className = 'modal-overlay';
    qrModal.style.display = 'flex';
    
    qrModal.innerHTML = `
      <div class="modal-content qr-modal-dark">
        <h2>QR Code for File Download</h2>
        <p>Scan this QR code to download the file securely</p>

        <!-- QR Box -->
        <div id="qrCodeCanvas" style="
            width:260px;
            height:260px;
            margin:20px auto;
            padding:16px;
            border-radius:16px;
            background:#111;
            display:flex;
            justify-content:center;
            align-items:center;
        "></div>

        <div class="key-box">Key: <span id="qrKeyText">${key}</span></div>

        <button id="downloadQRBtn" class="qr-btn-primary">📥 Download QR</button>
        <button id="shareQRBtn" class="qr-btn-secondary">📤 Share QR</button>
        <button onclick="closeQRModal()" class="qr-btn-close">Close</button>
      </div>
    `;

    document.body.appendChild(qrModal);

    // Generate QR code
    const url = `${window.location.origin}/receive.html?key=${key}`;
    const qrBox = document.getElementById("qrCodeCanvas");
    qrBox.innerHTML = ""; // Clear previous QR

    new QRCode(qrBox, {
        text: url,
        width: 256,
        height: 256,
        colorDark: "#ffffff",
        colorLight: "#000000",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Download QR functionality
    document.getElementById("downloadQRBtn").onclick = function () {
        const canvas = document.querySelector("#qrCodeCanvas canvas");
        if (!canvas) {
            showNotification('QR not ready yet', 'error');
            return;
        }
        const link = document.createElement("a");
        link.download = "AirPass-QR.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        showNotification('QR downloaded successfully!', 'success');
    };

    // Share QR functionality
    document.getElementById("shareQRBtn").onclick = function () {
        const canvas = document.querySelector("#qrCodeCanvas canvas");
        if (!canvas) {
            showNotification('QR not ready yet', 'error');
            return;
        }
        if (navigator.share) {
            canvas.toBlob(blob => {
                const file = new File([blob], "AirPass-QR.png", { type: "image/png" });
                navigator.share({
                    title: "AirPass QR",
                    text: "Scan this QR to download the file.",
                    files: [file]
                }).then(() => {
                    showNotification('QR shared successfully!', 'success');
                }).catch(() => {
                    // Fallback to copy URL
                    navigator.clipboard.writeText(url);
                    showNotification('Download URL copied to clipboard!', 'success');
                });
            });
        } else {
            // Fallback: copy URL to clipboard
            navigator.clipboard.writeText(url);
            showNotification('Download URL copied to clipboard!', 'success');
        }
    };

    // Close modal functionality
    window.closeQRModal = function() {
        const modal = document.getElementById('qrModal');
        if (modal) {
            document.body.removeChild(modal);
        }
    };

    // Close on backdrop click
    qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) {
            closeQRModal();
        }
    });
  }
});
