/* ==========================================================================
    Pawdhaar - Client-Side App Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // 1. State Variables & Audio Synth Setup
  // ==========================================================================
  let isSoundEnabled = true;
  let audioCtx = null;
  let qrCodeInstance = null;
  let qrTimeout = null;

  // Sound Synthesizers using Web Audio API (100% Offline and Lightweight)
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSynthSound(type) {
    if (!isSoundEnabled) return;
    try {
      initAudio();
      const now = audioCtx.currentTime;

      if (type === 'dog') {
        // Dog Bark: Double pulse, fast frequency slide down
        const playBarkPulse = (startTime) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, startTime);
          osc.frequency.exponentialRampToValueAtTime(100, startTime + 0.12);
          
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + 0.13);
        };
        playBarkPulse(now);
        playBarkPulse(now + 0.15); // Second bark after 150ms

      } else if (type === 'cat') {
        // Cat Meow: Frequency slides up then down, soft volume curve
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.quadraticRampToValueAtTime(680, now + 0.25);
        osc.frequency.quadraticRampToValueAtTime(500, now + 0.5);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.55);

      } else if (type === 'bird') {
        // Bird Chirp: High pitch sweeps
        const playChirp = (startTime) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1800, startTime);
          osc.frequency.exponentialRampToValueAtTime(3200, startTime + 0.06);
          
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.06);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + 0.07);
        };
        playChirp(now);
        playChirp(now + 0.08);
        playChirp(now + 0.16);

      } else if (type === 'rabbit' || type === 'other') {
        // Bubble Pop: Soft sine pop
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(550, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.09);

      } else if (type === 'success') {
        // Celebration Success Chime: Arpeggio (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + index * 0.08);
          
          gain.gain.setValueAtTime(0, now + index * 0.08);
          gain.gain.linearRampToValueAtTime(0.12, now + index * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.25);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(now + index * 0.08);
          osc.stop(now + index * 0.08 + 0.28);
        });
      }
    } catch (e) {
      console.warn("AudioContext block or not supported:", e);
    }
  }

  // ==========================================================================
  // 2. DOM Elements Selection
  // ==========================================================================
  const appMain = document.getElementById('appMain');
  const verificationPanel = document.getElementById('verificationPanel');
  const aadhaarForm = document.getElementById('aadhaarForm');
  
  // Form Inputs
  const petNameInput = document.getElementById('petName');
  const guardianNameInput = document.getElementById('guardianName');
  const petGenderSelect = document.getElementById('petGender');
  const petDobInput = document.getElementById('petDob');
  const contactInput = document.getElementById('contactNumber');
  const addressInput = document.getElementById('petAddress');
  const petPhotoInput = document.getElementById('petPhotoInput');
  const petVaccinatedSelect = document.getElementById('petVaccinated');
  const petDewormedSelect = document.getElementById('petDewormed');
  const uploadZone = document.getElementById('uploadZone');
  const uploadPrompt = document.getElementById('uploadPrompt');
  const uploadPreviewContainer = document.getElementById('uploadPreviewContainer');
  const uploadPreviewImage = document.getElementById('uploadPreviewImage');
  const removePhotoBtn = document.getElementById('removePhotoBtn');
  
  // Card Preview Values (Front)
  const cardNameVal = document.getElementById('cardNameVal');
  const cardDobVal = document.getElementById('cardDobVal');
  const cardGenderVal = document.getElementById('cardGenderVal');
  const cardGuardianVal = document.getElementById('cardGuardianVal');
  const cardContactValFront = document.getElementById('cardContactValFront');
  const cardVaccinationRow = document.getElementById('cardVaccinationRow');
  const cardDewormingRow = document.getElementById('cardDewormingRow');
  const cardVaccinationVal = document.getElementById('cardVaccinationVal');
  const cardDewormingVal = document.getElementById('cardDewormingVal');
  const cardAadhaarNoVal = document.getElementById('cardAadhaarNoVal');
  const cardPetPhoto = document.getElementById('cardPetPhoto');
  const photoPlaceholder = document.getElementById('photoPlaceholder');
  const cardPhotoFrame = document.getElementById('cardPhotoFrame');

  // Card Preview Values (Back)
  const cardAddressVal = document.getElementById('cardAddressVal');
  const cardContactVal = document.getElementById('cardContactVal');
  const cardAadhaarNoValBack = document.getElementById('cardAadhaarNoValBack');
  const cardQrCodeContainer = document.getElementById('cardQrCode');

  // Control Buttons
  const soundToggle = document.getElementById('soundToggle');
  const themeToggle = document.getElementById('themeToggle');
  const cardContainer = document.getElementById('cardContainer');
  const cardInner = document.getElementById('cardInner');
  const flipBtn = document.getElementById('flipBtn');
  const printBtn = document.getElementById('printBtn');
  const resetFormBtn = document.getElementById('resetFormBtn');
  const generateBtn = document.getElementById('generateBtn');

  // Download Dropdown
  const downloadDropdownBtn = document.getElementById('downloadDropdownBtn');
  const downloadMenu = document.getElementById('downloadMenu');
  const downloadFrontBtn = document.getElementById('downloadFrontBtn');
  const downloadBackBtn = document.getElementById('downloadBackBtn');
  const downloadCombinedBtn = document.getElementById('downloadCombinedBtn');
  const printLayoutContainer = document.getElementById('printLayoutContainer');

  // Verification Portal Elements
  const verifAadhaar = document.getElementById('verifAadhaar');
  const verifName = document.getElementById('verifName');
  const verifType = document.getElementById('verifType');
  const verifGender = document.getElementById('verifGender');
  const verifDob = document.getElementById('verifDob');
  const verifGuardian = document.getElementById('verifGuardian');
  const verifContact = document.getElementById('verifContact');
  const verifVaccinated = document.getElementById('verifVaccinated');
  const verifDewormed = document.getElementById('verifDewormed');
  const verifAddress = document.getElementById('verifAddress');
  const verifiedPetAvatar = document.getElementById('verifiedPetAvatar');
  const verificationTime = document.getElementById('verificationTime');
  const goToGeneratorBtn = document.getElementById('goToGeneratorBtn');

  // Mobile Save Modal Elements
  const saveModal = document.getElementById('saveModal');
  const saveModalImage = document.getElementById('saveModalImage');
  const closeSaveModalBtn = document.getElementById('closeSaveModalBtn');
  const closeSaveModalBtn2 = document.getElementById('closeSaveModalBtn2');

  // Alert Container
  const alertContainer = document.getElementById('alertContainer');

  // ==========================================================================
  // 3. Helper Functions (Alerts, Formatting, Theme)
  // ==========================================================================
  
  // Custom Toaster Alert System
  function showAlert(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert-toast ${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-triangle-exclamation';
    
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
    alertContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Format Date to DD/MM/YYYY
  function formatDate(dateStr) {
    if (!dateStr) return '01/01/2026';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  // Theme Toggler
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  themeToggle.addEventListener('click', () => {
    initAudio();
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
    showAlert(`Switched to ${theme} theme!`, 'info');
    playSynthSound('rabbit');
  });

  function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    if (theme === 'dark') {
      icon.className = 'fa-solid fa-sun';
    } else {
      icon.className = 'fa-solid fa-moon';
    }
  }

  // Sound Toggler
  soundToggle.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    const icon = soundToggle.querySelector('i');
    if (isSoundEnabled) {
      icon.className = 'fa-solid fa-volume-high';
      initAudio();
      playSynthSound('rabbit');
      showAlert('Sound effects enabled!', 'success');
    } else {
      icon.className = 'fa-solid fa-volume-xmark';
      showAlert('Sound effects muted!', 'info');
    }
  });

  // ==========================================================================
  // 4. Form Logic & Card Synchronization
  // ==========================================================================
  
  // Real-Time Value Syncing
  function updateCardPreview() {
    const petName = petNameInput.value.trim() || "Rocky";
    const guardianName = guardianNameInput.value.trim() || "Rahul Sharma";
    const gender = petGenderSelect.value;
    const dob = petDobInput.value;
    const phone = contactInput.value.trim() || "9876543210";
    const address = addressInput.value.trim() || "C/O Rahul Sharma, House No. 42, Bark Street, Sector 7, Pawtown, Delhi - 110001";
    const vaccinated = petVaccinatedSelect.value;
    const dewormed = petDewormedSelect.value;
    
    // Generate Aadhaar Number
    const year = dob ? dob.split('-')[0] : '2026';
    const first4Phone = phone.slice(0, 4).padEnd(4, 'X');
    const last4Phone = phone.slice(-4).padEnd(4, 'X');
    const generatedAadhaar = `${year} ${first4Phone} ${last4Phone}`;

    // Sync Text values to preview card front
    cardNameVal.textContent = petName;
    cardDobVal.textContent = formatDate(dob);
    cardGenderVal.textContent = gender ? `${gender.toUpperCase()} / ${getGenderHindi(gender)}` : "MALE / पुरुष";
    cardGuardianVal.textContent = guardianName.toUpperCase();
    cardContactValFront.textContent = phone;
    cardAadhaarNoVal.textContent = generatedAadhaar;

    // Sync Vaccination Status
    if (vaccinated === 'hide') {
      cardVaccinationRow.style.display = 'none';
    } else {
      cardVaccinationRow.style.display = 'flex';
      cardVaccinationVal.textContent = vaccinated === 'done' ? 'Done ✅' : 'Pending ❌';
      cardVaccinationVal.className = vaccinated === 'done' ? 'value-status' : 'value-status pending';
    }

    // Sync Deworming Status
    if (dewormed === 'hide') {
      cardDewormingRow.style.display = 'none';
    } else {
      cardDewormingRow.style.display = 'flex';
      cardDewormingVal.textContent = dewormed === 'done' ? 'Done ✅' : 'Pending ❌';
      cardDewormingVal.className = dewormed === 'done' ? 'value-status' : 'value-status pending';
    }

    // Sync Text values to preview card back
    cardAddressVal.textContent = address;
    cardContactVal.textContent = phone;
    cardAadhaarNoValBack.textContent = generatedAadhaar;

    // Trigger QR code regeneration
    debounceGenerateQR();
  }

  function getGenderHindi(gender) {
    if (gender === 'Male') return 'पुरुष';
    if (gender === 'Female') return 'महिला';
    return 'अन्य';
  }

  // Get selected pet type (Dog, Cat, etc.)
  function getSelectedPetType() {
    const selected = document.querySelector('input[name="petType"]:checked');
    return selected ? selected.value : 'dog';
  }

  // Input listeners
  petNameInput.addEventListener('input', updateCardPreview);
  guardianNameInput.addEventListener('input', updateCardPreview);
  petGenderSelect.addEventListener('change', updateCardPreview);
  petDobInput.addEventListener('input', updateCardPreview);
  contactInput.addEventListener('input', (e) => {
    // Only allow numbers
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    updateCardPreview();
  });
  addressInput.addEventListener('input', updateCardPreview);
  petVaccinatedSelect.addEventListener('change', updateCardPreview);
  petDewormedSelect.addEventListener('change', updateCardPreview);

  // Sound triggering on pet type selection
  const petTypeRadios = document.querySelectorAll('input[name="petType"]');
  petTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const type = e.target.value;
      playSynthSound(type);
      updateCardPreview();
    });
  });

  // ==========================================================================
  // 5. Drag and Drop Photo Upload
  // ==========================================================================
  
  // Click on zone triggers input file picker
  uploadZone.addEventListener('click', (e) => {
    if (e.target.id !== 'removePhotoBtn' && !removePhotoBtn.contains(e.target)) {
      petPhotoInput.click();
    }
  });

  // Drag over effects
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--primary-color)';
    uploadZone.style.backgroundColor = 'rgba(230, 126, 34, 0.05)';
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.style.borderColor = 'var(--border-color)';
    uploadZone.style.backgroundColor = 'var(--bg-input)';
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--border-color)';
    uploadZone.style.backgroundColor = 'var(--bg-input)';
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  });

  petPhotoInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  });

  function handleImageFile(file) {
    initAudio();
    if (!file.type.startsWith('image/')) {
      showAlert('Please upload an image file!', 'error');
      playSynthSound('rabbit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to passport proportions (max 300px) to prevent memory crashes on mobile devices
        const maxDim = 300;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        // Set to upload preview
        uploadPreviewImage.src = optimizedDataUrl;
        uploadPrompt.style.display = 'none';
        uploadPreviewContainer.style.display = 'flex';
        
        // Set to Aadhaar card image preview
        cardPetPhoto.src = optimizedDataUrl;
        cardPetPhoto.style.display = 'block';
        photoPlaceholder.style.display = 'none';
        
        showAlert('Pet photo loaded and optimized!', 'success');
        playSynthSound('success');
        updateCardPreview();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Remove Photo handler
  removePhotoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    initAudio();
    petPhotoInput.value = '';
    
    // Reset Upload Container
    uploadPreviewImage.src = '';
    uploadPreviewContainer.style.display = 'none';
    uploadPrompt.style.display = 'block';
    
    // Reset Card Image
    cardPetPhoto.src = '';
    cardPetPhoto.style.display = 'none';
    photoPlaceholder.style.display = 'flex';
    
    showAlert('Photo removed.', 'info');
    playSynthSound('rabbit');
    updateCardPreview();
  });

  // ==========================================================================
  // 6. QR Code Generation
  // ==========================================================================
  function debounceGenerateQR() {
    clearTimeout(qrTimeout);
    qrTimeout = setTimeout(generateVerificationQR, 400); // 400ms debounce
  }

  function generateVerificationQR() {
    const petName = petNameInput.value.trim() || "Rocky";
    const guardianName = guardianNameInput.value.trim() || "Rahul Sharma";
    const gender = petGenderSelect.value || "Male";
    const dob = petDobInput.value || "2026-01-01";
    const phone = contactInput.value.trim() || "9876543210";
    const address = addressInput.value.trim() || "C/O Rahul Sharma, House No. 42, Bark Street, Sector 7, Pawtown, Delhi - 110001";
    const petType = getSelectedPetType();

    // Create 12 digit Aadhaar Number
    const year = dob.split('-')[0];
    const first4Phone = phone.slice(0, 4).padEnd(4, 'X');
    const last4Phone = phone.slice(-4).padEnd(4, 'X');
    const generatedAadhaar = `${year}${first4Phone}${last4Phone}`;

    // Pack pet details into a short JSON object (shorter keys to save bytes)
    const petData = {
      n: petName,
      t: petType,
      g: gender,
      d: dob,
      u: guardianName,
      p: phone,
      a: address,
      v: generatedAadhaar,
      vc: petVaccinatedSelect.value,
      dw: petDewormedSelect.value
    };

    try {
      // Use URLSearchParams to generate a clean, short, URL-safe query string payload
      const params = new URLSearchParams({
        n: petName,
        t: petType,
        g: gender,
        d: dob,
        u: guardianName,
        p: phone,
        a: address,
        v: generatedAadhaar,
        vc: petVaccinatedSelect.value,
        dw: petDewormedSelect.value
      });
      
      // Verification URL
      const verifyUrl = `https://pawdhaar.vercel.app/#verify?${params.toString()}`;

      // Reset QR container
      cardQrCodeContainer.innerHTML = '';
      
      // Generate using qrcode.js (from CDN)
      qrCodeInstance = new QRCode(cardQrCodeContainer, {
        text: verifyUrl,
        width: 84,
        height: 84,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.L
      });
    } catch (e) {
      console.error("QR Code generation error:", e);
    }
  }

  // ==========================================================================
  // 7. QR Code / Hash Router (Verification Screen)
  // ==========================================================================
  function handleHashRoute() {
    const hash = window.location.hash;
    if (hash.startsWith('#verify?') || hash.startsWith('#verify/')) {
      let petAadhaarNo = '2026XXXXXXXX';
      let petNameVal = 'Rocky';
      let petTypeVal = 'dog';
      let petGenderVal = 'Male';
      let petDobVal = '2026-01-01';
      let petGuardianVal = 'Rahul Sharma';
      let petContactVal = '9876543210';
      let petAddressVal = '';
      let petVacVal = 'done';
      let petDewVal = 'done';

      try {
        if (hash.startsWith('#verify?')) {
          // Parse query string (New format - low pixel density)
          const params = new URLSearchParams(hash.substring(8)); // Skip "#verify?"
          petAadhaarNo = params.get('v') || petAadhaarNo;
          petNameVal = params.get('n') || petNameVal;
          petTypeVal = params.get('t') || petTypeVal;
          petGenderVal = params.get('g') || petGenderVal;
          petDobVal = params.get('d') || petDobVal;
          petGuardianVal = params.get('u') || petGuardianVal;
          petContactVal = params.get('p') || petContactVal;
          petAddressVal = params.get('a') || petAddressVal;
          petVacVal = params.get('vc') || petVacVal;
          petDewVal = params.get('dw') || petDewVal;
        } else {
          // Decode legacy base64 payload (Old format fallback)
          const b64Data = hash.substring(8); // Skip "#verify/"
          const decodedStr = decodeURIComponent(escape(atob(b64Data)));
          const data = JSON.parse(decodedStr);
          petAadhaarNo = data.v || petAadhaarNo;
          petNameVal = data.n || petNameVal;
          petTypeVal = data.t || petTypeVal;
          petGenderVal = data.g || petGenderVal;
          petDobVal = data.d || petDobVal;
          petGuardianVal = data.u || petGuardianVal;
          petContactVal = data.p || petContactVal;
          petAddressVal = data.a || petAddressVal;
          petVacVal = data.vc || petVacVal;
          petDewVal = data.dw || petDewVal;
        }

        // Hide generator, show verification screen
        appMain.style.display = 'none';
        verificationPanel.style.display = 'flex';
        
        // Render verification values
        verifAadhaar.textContent = petAadhaarNo.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
        verifName.textContent = petNameVal;
        verifType.textContent = petTypeVal.charAt(0).toUpperCase() + petTypeVal.slice(1);
        verifGender.textContent = `${petGenderVal.toUpperCase()} / ${getGenderHindi(petGenderVal)}`;
        verifDob.textContent = formatDate(petDobVal);
        verifGuardian.textContent = petGuardianVal;
        verifContact.textContent = petContactVal;
        
        // Render health details
        verifVaccinated.textContent = petVacVal === 'done' ? 'Done ✅' : (petVacVal === 'pending' ? 'Pending ❌' : 'Not Added ➖');
        verifDewormed.textContent = petDewVal === 'done' ? 'Done ✅' : (petDewVal === 'pending' ? 'Pending ❌' : 'Not Added ➖');
        
        verifAddress.textContent = petAddressVal;

        // Set animal avatar symbol according to type
        let avatarHtml = '<i class="fa-solid fa-paw"></i>';
        if (petTypeVal === 'dog') avatarHtml = '<i class="fa-solid fa-dog" style="color: var(--primary-color)"></i>';
        else if (petTypeVal === 'cat') avatarHtml = '<i class="fa-solid fa-cat" style="color: #9b59b6"></i>';
        else if (petTypeVal === 'rabbit') avatarHtml = '<i class="fa-solid fa-carrot" style="color: #e67e22"></i>';
        else if (petTypeVal === 'bird') avatarHtml = '<i class="fa-solid fa-crow" style="color: #3498db"></i>';
        verifiedPetAvatar.innerHTML = avatarHtml;

        // Display current scan timestamp
        const scanTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        verificationTime.textContent = `Scanned on: ${scanTime} IST`;

        showAlert('Pawdhaar verification successful!', 'success');
        playSynthSound('success');
      } catch (err) {
        console.error("Decoding error:", err);
        showAlert('Invalid verification link.', 'error');
        window.location.hash = '';
      }
    } else {
      // Normal generator view
      verificationPanel.style.display = 'none';
      appMain.style.display = 'flex';
    }
  }

  // Listeners for routing
  window.addEventListener('hashchange', handleHashRoute);
  // Initial check on load
  handleHashRoute();

  // Reset hash button
  goToGeneratorBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = '';
    location.reload(); // Refresh to ensure pure clean state
  });

  // ==========================================================================
  // 8. Interactive Card Operations
  // ==========================================================================
  
  // 3D Flip function
  function toggleFlipCard() {
    initAudio();
    cardContainer.classList.toggle('flipped');
    playSynthSound('rabbit');
  }

  cardContainer.addEventListener('click', toggleFlipCard);
  flipBtn.addEventListener('click', toggleFlipCard);

  // Form Reset
  resetFormBtn.addEventListener('click', () => {
    initAudio();
    aadhaarForm.reset();
    
    // Clear photo upload
    petPhotoInput.value = '';
    uploadPreviewImage.src = '';
    uploadPreviewContainer.style.display = 'none';
    uploadPrompt.style.display = 'block';
    
    cardPetPhoto.src = '';
    cardPetPhoto.style.display = 'none';
    photoPlaceholder.style.display = 'flex';
    
    showAlert('Form has been reset.', 'info');
    playSynthSound('rabbit');
    
    // Reset to default preview values
    updateCardPreview();
  });

  // Submit button triggers download / feedback
  generateBtn.addEventListener('click', () => {
    initAudio();
    if (aadhaarForm.checkValidity()) {
      showAlert('Pawdhaar generated! Click download to save cards.', 'success');
      playSynthSound('success');
      // Smooth flip to front first
      cardContainer.classList.remove('flipped');
    } else {
      // Trigger native HTML5 validation tooltips
      aadhaarForm.reportValidity();
      playSynthSound('rabbit');
    }
  });

  // ==========================================================================
  // 9. Download Export (html2canvas)
  // ==========================================================================
  
  // Device detection to handle mobile export restrictions
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Dropdown Toggler
  downloadDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    downloadMenu.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    downloadMenu.classList.remove('show');
  });

  // Export utility helper
  function downloadCardFace(elementId, filename) {
    const element = document.getElementById(elementId);
    
    // Create a temporary clone for clean capturing without 3D transforms
    const clone = element.cloneNode(true);
    
    // Remove 3D transform rotations that cause mirroring/flipping in html2canvas
    clone.style.transform = 'none';
    clone.style.webkitTransform = 'none';
    clone.style.backfaceVisibility = 'visible';
    clone.style.webkitBackfaceVisibility = 'visible';
    
    // Copy computed viewport dimensions
    clone.style.width = '440px';
    clone.style.height = '277px';
    
    // Copy complete QR code DOM elements directly if capturing back side
    if (elementId === 'cardBackSide') {
      const clonedQRContainer = clone.querySelector('#cardQrCode');
      if (clonedQRContainer) {
        clonedQRContainer.innerHTML = cardQrCodeContainer.innerHTML;
        const qrImg = clonedQRContainer.querySelector('img');
        if (qrImg) {
          qrImg.style.width = '84px';
          qrImg.style.height = '84px';
        }
      }
    }

    // Create a parent hierarchy wrapper to ensure CSS selectors apply correctly
    const containerWrapper = document.createElement('div');
    containerWrapper.className = 'flip-card-container';
    containerWrapper.style.width = '440px';
    containerWrapper.style.height = '277px';
    
    const innerWrapper = document.createElement('div');
    innerWrapper.className = 'flip-card-inner';
    innerWrapper.style.width = '100%';
    innerWrapper.style.height = '100%';
    innerWrapper.style.transform = 'none';
    innerWrapper.style.webkitTransform = 'none';
    
    innerWrapper.appendChild(clone);
    containerWrapper.appendChild(innerWrapper);
    
    // Hide wrapper in active viewport so mobile browsers render it
    containerWrapper.style.position = 'fixed';
    containerWrapper.style.top = '0';
    containerWrapper.style.left = '0';
    containerWrapper.style.opacity = '0.001';
    containerWrapper.style.pointerEvents = 'none';
    containerWrapper.style.zIndex = '-9999';
    
    document.body.appendChild(containerWrapper);
    
    showAlert('Rendering card high-res canvas...', 'info');
    
    setTimeout(() => {
      html2canvas(clone, {
        scale: 2.5,             // High resolution for clear text
        useCORS: true,          // Allow loading external images
        backgroundColor: null   // Maintain transparent card corners
      }).then(canvas => {
        // Remove wrapper from DOM
        document.body.removeChild(containerWrapper);
        
        try {
          const imgData = canvas.toDataURL('image/png');
          
          if (isMobile) {
            // Show mobile save modal
            saveModalImage.src = imgData;
            saveModal.style.display = 'flex';
            showAlert('Card ready! Press & hold image to save.', 'success');
            playSynthSound('success');
          } else {
            // Trigger direct desktop download
            const link = document.createElement('a');
            link.download = filename;
            link.href = imgData;
            link.click();
            showAlert('Download started!', 'success');
            playSynthSound('success');
          }
        } catch (e) {
          showAlert('Failed to convert canvas to image.', 'error');
          console.error(e);
        }
      }).catch(err => {
        if (document.body.contains(containerWrapper)) {
          document.body.removeChild(containerWrapper);
        }
        showAlert('Error generating card image.', 'error');
        console.error(err);
      });
    }, 250);
  }

  // Front download
  downloadFrontBtn.addEventListener('click', () => {
    initAudio();
    const petName = petNameInput.value.trim() || 'pet';
    downloadCardFace('cardFrontSide', `${petName.toLowerCase()}_pawdhaar_front.png`);
  });

  // Back download
  downloadBackBtn.addEventListener('click', () => {
    initAudio();
    const petName = petNameInput.value.trim() || 'pet';
    downloadCardFace('cardBackSide', `${petName.toLowerCase()}_pawdhaar_back.png`);
  });

  // Combined (Front + Back side-by-side) download
  downloadCombinedBtn.addEventListener('click', () => {
    initAudio();
    const petName = petNameInput.value.trim() || 'pet';
    showAlert('Composing combined canvas...', 'info');

    // Create a temporary container hierarchy wrapper in the DOM
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.opacity = '0.001';
    wrapper.style.zIndex = '-9999';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'row';
    wrapper.style.flexWrap = 'nowrap';
    wrapper.style.gap = '20px';
    wrapper.style.padding = '20px';
    wrapper.style.background = '#f8f6f0';
    wrapper.style.borderRadius = '16px';
    wrapper.style.border = '1px solid #e5e0d4';
    wrapper.style.width = '960px'; // Lock exact layout dimensions
    wrapper.style.minWidth = '960px';

    // Clone Front and Back faces
    const frontClone = document.getElementById('cardFrontSide').cloneNode(true);
    const backClone = document.getElementById('cardBackSide').cloneNode(true);

    // Override transforms & sizes for clones so they stand flat side-by-side
    frontClone.style.position = 'relative';
    frontClone.style.transform = 'none';
    frontClone.style.webkitTransform = 'none';
    frontClone.style.backfaceVisibility = 'visible';
    frontClone.style.webkitBackfaceVisibility = 'visible';
    frontClone.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
    frontClone.style.width = '440px';
    frontClone.style.height = '277px';

    backClone.style.position = 'relative';
    backClone.style.transform = 'none';
    backClone.style.webkitTransform = 'none';
    backClone.style.backfaceVisibility = 'visible';
    backClone.style.webkitBackfaceVisibility = 'visible';
    backClone.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
    backClone.style.width = '440px';
    backClone.style.height = '277px';

    // Copy complete QR code HTML directly to prevent missing QR code on mobile
    const clonedQRContainer = backClone.querySelector('#cardQrCode');
    if (clonedQRContainer) {
      clonedQRContainer.innerHTML = cardQrCodeContainer.innerHTML;
      const qrImg = clonedQRContainer.querySelector('img');
      if (qrImg) {
        qrImg.style.width = '84px';
        qrImg.style.height = '84px';
      }
    }

    // Wrap clones inside standard flip containers to preserve CSS styles
    const frontContainer = document.createElement('div');
    frontContainer.className = 'flip-card-container';
    frontContainer.style.width = '440px';
    frontContainer.style.height = '277px';
    const frontInner = document.createElement('div');
    frontInner.className = 'flip-card-inner';
    frontInner.style.width = '100%';
    frontInner.style.height = '100%';
    frontInner.style.transform = 'none';
    frontInner.appendChild(frontClone);
    frontContainer.appendChild(frontInner);

    const backContainer = document.createElement('div');
    backContainer.className = 'flip-card-container';
    backContainer.style.width = '440px';
    backContainer.style.height = '277px';
    const backInner = document.createElement('div');
    backInner.className = 'flip-card-inner';
    backInner.style.width = '100%';
    backInner.style.height = '100%';
    backInner.style.transform = 'none';
    backInner.appendChild(backClone);
    backContainer.appendChild(backInner);

    wrapper.appendChild(frontContainer);
    wrapper.appendChild(backContainer);
    document.body.appendChild(wrapper);

    setTimeout(() => {
      html2canvas(wrapper, {
        scale: 2.2,
        useCORS: true,
        backgroundColor: '#f8f6f0'
      }).then(canvas => {
        document.body.removeChild(wrapper);
        try {
          const imgData = canvas.toDataURL('image/png');
          
          if (isMobile) {
            // Show mobile save modal
            saveModalImage.src = imgData;
            saveModal.style.display = 'flex';
            showAlert('Card ready! Press & hold image to save.', 'success');
            playSynthSound('success');
          } else {
            // Trigger direct desktop download
            const link = document.createElement('a');
            link.download = `${petName.toLowerCase()}_pawdhaar_combined.png`;
            link.href = imgData;
            link.click();
            showAlert('Combined download started!', 'success');
            playSynthSound('success');
          }
        } catch (e) {
          showAlert('Failed to download combined image.', 'error');
          console.error(e);
        }
      }).catch(err => {
        if (document.body.contains(wrapper)) {
          document.body.removeChild(wrapper);
        }
        showAlert('Error composing combined image.', 'error');
        console.error(err);
      });
    }, 300);
  });

  // Close Save Modal Event Listeners
  const closeSaveModal = () => {
    saveModal.style.display = 'none';
    saveModalImage.src = '';
  };
  
  closeSaveModalBtn.addEventListener('click', closeSaveModal);
  closeSaveModalBtn2.addEventListener('click', closeSaveModal);
  
  saveModal.addEventListener('click', (e) => {
    if (e.target === saveModal) {
      closeSaveModal();
    }
  });

  // ==========================================================================
  // 10. Print Card Feature
  // ==========================================================================
  printBtn.addEventListener('click', () => {
    initAudio();
    showAlert('Preparing card layouts for printing...', 'info');

    // Clear print container
    printLayoutContainer.innerHTML = '';

    // Clone Front and Back faces
    const frontClone = document.getElementById('cardFrontSide').cloneNode(true);
    const backClone = document.getElementById('cardBackSide').cloneNode(true);

    // Flatten clones
    frontClone.style.transform = 'none';
    backClone.style.transform = 'none';

    // Transfer cloned QR Code image contents
    const originalQRImg = cardQrCodeContainer.querySelector('img');
    if (originalQRImg) {
      const clonedQRContainer = backClone.querySelector('#cardQrCode');
      clonedQRContainer.innerHTML = '';
      const qrCopy = originalQRImg.cloneNode(true);
      clonedQRContainer.appendChild(qrCopy);
    }

    // Append to printing layout container
    printLayoutContainer.appendChild(frontClone);
    printLayoutContainer.appendChild(backClone);

    // Trigger printing
    setTimeout(() => {
      window.print();
    }, 300);
  });

  // Clean print buffer container after action
  window.addEventListener('afterprint', () => {
    printLayoutContainer.innerHTML = '';
  });

  // ==========================================================================
  // 11. Initial Run Sync
  // ==========================================================================
  updateCardPreview();
});
