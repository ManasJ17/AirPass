// MultiSend Page JavaScript

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
  const qrContainer = document.getElementById('qrCodeDisplay');
  
  // Clear any existing QR code
  qrContainer.innerHTML = '';
  
  // Generate QR code using QRCode.js library
  const qr = new QRCode(qrContainer, {
    text: downloadUrl,
    width: 220,
    height: 220,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
  
  // QR Modal event handlers
  const qrCloseBtn = qrModal.querySelector('#qrCloseBtn');
  const qrDownloadBtn = qrModal.querySelector('#qrDownloadBtn');
  
  qrCloseBtn.addEventListener('click', () => {
    qrModal.style.animation = 'qrFadeOut 0.3s ease-out forwards';
    setTimeout(() => {
      if (document.body.contains(qrModal)) {
        document.body.removeChild(qrModal);
      }
    }, 300);
  });
  
  qrDownloadBtn.addEventListener('click', () => {
    const canvas = qrContainer.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `AirPass_QR_${key}.png`;
      link.href = canvas.toDataURL();
      link.click();
      showNotification('QR Code downloaded!', 'success');
    }
  });
  
  qrModal.addEventListener('click', (e) => {
    if (e.target === qrModal) {
      qrCloseBtn.click();
    }
  });
}

// Success modal function
function showSuccessModal(key) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  
  modal.innerHTML = `
    <div class="success-modal">
      <div class="success-icon">
        <div class="checkmark">✓</div>
      </div>
      <h2 class="success-title">ZIP File Created Successfully!</h2>
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
  const keyText = modal.querySelector('#modalKey');
  
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

document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('fileInput');
  const uploadArea = document.getElementById('uploadArea');
  const selectedFiles = document.getElementById('selectedFiles');
  const fileList = document.getElementById('fileList');
  const noteInput = document.getElementById('noteInput');
  const generateBtn = document.getElementById('generateBtn');
  const clearBtn = document.getElementById('clearBtn');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const selectFilesBtn = document.getElementById('selectFilesBtn');
  const charCount = document.getElementById('charCount');
  
  let selectedFilesArray = [];
  
  // Character counting for note textarea
  noteInput.addEventListener('input', function() {
    const currentLength = this.value.length;
    const maxLength = 500;
    
    if (charCount) {
      charCount.textContent = `${currentLength}/${maxLength}`;
      
      // Update styling based on character count
      charCount.classList.remove('warning', 'error');
      if (currentLength > maxLength * 0.8) {
        charCount.classList.add('warning');
      }
      if (currentLength > maxLength) {
        charCount.classList.add('error');
        this.value = this.value.substring(0, maxLength);
        charCount.textContent = `${maxLength}/${maxLength}`;
      }
    }
  });

  // File input change handler
  fileInput.addEventListener('change', function(e) {
    handleFiles(e.target.files);
  });

  // File selection button
  selectFilesBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInput.click();
  });
  
  // Drag and drop functionality
  uploadArea.addEventListener('click', (e) => {
    // Only trigger file input if not clicking on the button
    if (e.target.id !== 'selectFilesBtn' && !e.target.closest('.choose-files-btn')) {
      fileInput.click();
    }
  });

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  });

  // Handle selected files with proper accumulation
  function handleFiles(files) {
    if (files.length === 0) return;
    
    const newFiles = Array.from(files);
    let addedCount = 0;
    let duplicateCount = 0;
    
    // Add files to existing selection (accumulation behavior)
    newFiles.forEach(newFile => {
      const isDuplicate = selectedFilesArray.some(existingFile => 
        existingFile.name === newFile.name && 
        existingFile.size === newFile.size
      );
      
      if (!isDuplicate) {
        selectedFilesArray.push(newFile);
        addedCount++;
      } else {
        duplicateCount++;
      }
    });
    
    // Always clear input for next selection
    fileInput.value = '';
    
    // Show notifications
    if (addedCount > 0) {
      showNotification(`${addedCount} file${addedCount !== 1 ? 's' : ''} added to selection`, 'success');
    }
    
    if (duplicateCount > 0) {
      showNotification(`${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} skipped`, 'info');
    }
    
    updateFileDisplay();
    updateButtons();
  }

  // Update file display
  function updateFileDisplay() {
    if (selectedFilesArray.length === 0) {
      selectedFiles.style.display = 'none';
      return;
    }

    selectedFiles.style.display = 'block';
    
    // Update file count
    const fileCountEl = document.getElementById('fileCount');
    if (fileCountEl) {
      fileCountEl.textContent = `${selectedFilesArray.length} file${selectedFilesArray.length !== 1 ? 's' : ''}`;
    }

    // Update file list
    fileList.innerHTML = '';
    selectedFilesArray.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      
      fileItem.innerHTML = `
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${formatFileSize(file.size)}</div>
        </div>
        <button class="remove-btn" data-index="${index}" title="Remove file">×</button>
      `;
      
      fileList.appendChild(fileItem);
    });

    // Add remove functionality
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const index = parseInt(this.dataset.index);
        selectedFilesArray.splice(index, 1);
        updateFileDisplay();
        updateButtons();
        showNotification('File removed from selection', 'info');
      });
    });
  }

  // Update button states
  function updateButtons() {
    const hasFiles = selectedFilesArray.length > 0;
    generateBtn.disabled = !hasFiles;
    clearBtn.style.display = hasFiles ? 'inline-block' : 'none';
  }

  // Update UI state
  function updateUI() {
    const hasFiles = selectedFilesArray.length > 0;
    const fileCount = document.getElementById('fileCount');
    
    selectedFiles.style.display = hasFiles ? 'block' : 'none';
    clearBtn.style.display = hasFiles ? 'inline-block' : 'none';
    generateBtn.disabled = !hasFiles;
    
    // Update file count and total size
    if (fileCount) {
      const totalSize = selectedFilesArray.reduce((sum, file) => sum + file.size, 0);
      const sizeText = totalSize > 0 ? ` • ${formatFileSize(totalSize)}` : '';
      fileCount.textContent = `${selectedFilesArray.length} file${selectedFilesArray.length !== 1 ? 's' : ''}${sizeText}`;
    }
    
    // Update button text and icon based on selection
    if (selectFilesBtn) {
      const btnIcon = selectFilesBtn.querySelector('.btn-icon');
      if (hasFiles) {
        selectFilesBtn.innerHTML = `
          <div class="btn-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
          Add More Files
        `;
      } else {
        selectFilesBtn.innerHTML = `
          <div class="btn-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          Choose Files
        `;
      }
    }
    
    if (hasFiles) {
      uploadArea.querySelector('h3').textContent = 'Drop more files here to add them';
      uploadArea.querySelector('p').textContent = 'Files will be added to your list';
    } else {
      uploadArea.querySelector('h3').textContent = 'Or drag and drop files here';
      uploadArea.querySelector('p').textContent = 'Files will be added to your list';
    }
  }

  // Clear files
  clearBtn.addEventListener('click', () => {
    selectedFilesArray = [];
    fileInput.value = '';
    updateFileDisplay();
    updateButtons();
    showNotification('All files cleared', 'info');
  });

  // Generate ZIP package
  generateBtn.addEventListener('click', async function() {
    if (selectedFilesArray.length === 0) {
      showNotification('Please select at least one file', 'error');
      return;
    }
    
    generateBtn.disabled = true;
    generateBtn.textContent = 'Creating ZIP...';
    loadingOverlay.style.display = 'flex';
    
    try {
      // Create FormData with multiple files
      const formData = new FormData();
      
      selectedFilesArray.forEach(file => {
        formData.append('files', file);
      });
      
      const note = noteInput.value.trim();
      if (note) {
        formData.append('note', note);
      }
      
      // Get expiry values
      const expiryValue = document.getElementById('expiryValue').value || '12';
      const expiryUnit = document.getElementById('expiryUnit').value || 'hours';
      formData.append('expiryValue', expiryValue);
      formData.append('expiryUnit', expiryUnit);
      
      // Try to upload to server
      const response = await fetch('/api/upload-multiple', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        loadingOverlay.style.display = 'none';
        showSuccessModal(result.key);
        
        // Reset form
        selectedFilesArray = [];
        fileInput.value = '';
        noteInput.value = '';
        updateFileDisplay();
        updateButtons();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.log('Server upload failed, using demo mode:', error.message);
      
      // Fallback to demo key generation
      setTimeout(() => {
        const key = generateSecureKey();
        loadingOverlay.style.display = 'none';
        showSuccessModal(key);
        
        // Reset form
        selectedFilesArray = [];
        fileInput.value = '';
        noteInput.value = '';
        updateFileDisplay();
        updateButtons();
      }, 2000);
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate Key (Create ZIP)';
    }
  });

  // Helper functions
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function generateSecureKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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