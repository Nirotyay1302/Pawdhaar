# Pawdhaar 🐾
> An Indian Aadhaar-style Digital Identity Card Generator for your pets. Made for fun and pet lovers!

Pawdhaar is a completely client-side web application designed to generate, print, and verify custom Aadhaar cards for pets (dogs, cats, birds, and other animals). 

---

## Features
- **Aadhaar-Style UI Elements**: Integrates headers, saffron-white-green tricolor ribbons, circular paw stamps, and standard identity details.
- **Three-Column Card Layout**: 
  - **Front Side**: Pet photo portrait (left), inline bold details (middle), and Vaccination/Deworming status indicators with a black print paw mark (right).
  - **Back Side**: Guideline terms, helpline footer, and a live scannable verification QR Code.
- **Dynamic 12-Digit UID Generator**: Auto-calculates a unique 12-digit Aadhaar number based on your pet's year of birth and contact number.
- **Database-Less QR Verification**: Generates a compressed Base64 URL payload inside the QR code. When scanned, it loads the website's digital verification portal to securely decode and display the pet's certificate.
- **Dynamic Sounds**: Synthesizes real animal noises (barking, meowing, chirping, popping) natively in the browser via the Web Audio API.
- **Export Formats**: High-resolution image downloads for Front, Back, or Combined cards, plus optimized print layout formatting.

---

## How to Deploy (100% Free)

### Option A: Netlify Drag-and-Drop
1. Drag the project folder and drop it into the deployment box on [Netlify App](https://app.netlify.com).
2. Instantly live with a public HTTPS link!

### Option B: GitHub Pages
1. Go to your repository settings on GitHub.
2. Select **Settings > Pages**.
3. Under Build and deployment, choose the `main` branch and `/root` folder, then click **Save**.

---

## Credits & License
- Designed by **Nirotyay Mukherjee** ([LinkedIn](https://www.linkedin.com/in/nirotyay-mukherjee-560632230)).
- Built purely for fun and educational purposes.
