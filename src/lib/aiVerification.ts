import EXIF from "exif-js";

export interface AIVerificationResult {
  valid: boolean;
  reason?: string;
  categoryPrediction?: string;
  confidenceScore?: number;
  generativeScore?: number;
  exifTags?: any;
}

export async function verifyCivicDefect(file: File): Promise<AIVerificationResult> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      // 1. Canvas Checks for blank/black/solid color (32x32)
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ valid: false, reason: "Image verification failed: Cannot read image data." });
        return;
      }
      
      ctx.drawImage(img, 0, 0, 32, 32);
      const imageData = ctx.getImageData(0, 0, 32, 32);
      const data = imageData.data;
      
      let rSum = 0, gSum = 0, bSum = 0;
      let rSqSum = 0, gSqSum = 0, bSqSum = 0;
      const numPixels = 32 * 32;
      
      let brightnessSum = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        
        rSum += r;
        gSum += g;
        bSum += b;
        
        rSqSum += r * r;
        gSqSum += g * g;
        bSqSum += b * b;
        
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        brightnessSum += brightness;
      }
      
      const rMean = rSum / numPixels;
      const gMean = gSum / numPixels;
      const bMean = bSum / numPixels;
      
      const rVar = (rSqSum / numPixels) - (rMean * rMean);
      const gVar = (gSqSum / numPixels) - (gMean * gMean);
      const bVar = (bSqSum / numPixels) - (bMean * bMean);
      
      const meanBrightness = brightnessSum / numPixels;
      
      if (meanBrightness < 10 || (rVar < 10 && gVar < 10 && bVar < 10)) {
        resolve({ valid: false, reason: "Image verification failed: Dark or blank image detected." });
        return;
      }

      // 2. EXIF Metadata Inspection
      EXIF.getData(img as any, function(this: any) {
        const software = EXIF.getTag(this, "Software") || "";
        const make = EXIF.getTag(this, "Make") || "";
        const model = EXIF.getTag(this, "Model") || "";
        
        const softwareLower = String(software).toLowerCase();
        
        const isAIorManipulated = 
          softwareLower.includes("stable diffusion") ||
          softwareLower.includes("midjourney") ||
          softwareLower.includes("dall-e") ||
          softwareLower.includes("photoshop");
          
        let generativeScore = isAIorManipulated ? 0.95 : 0.05;
        if (!make && !model) {
          // Missing camera tags, slight penalty
          generativeScore = Math.max(generativeScore, 0.4);
        }
        
        if (generativeScore > 0.8) {
          resolve({ valid: false, reason: "Image verification failed: AI-generated or manipulated image detected." });
          return;
        }
        
        // Mock AI Prediction
        const categories = ["Roads & Infrastructure", "Water & Sewage", "Electrical & Lighting", "Sanitation & Waste"];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        
        const confidenceScore = Math.floor(Math.random() * 10) + 85; // 85 to 94%

        resolve({
          valid: true,
          categoryPrediction: randomCategory,
          confidenceScore: confidenceScore,
          generativeScore,
          exifTags: {
            lat: EXIF.getTag(this, "GPSLatitude"),
            latRef: EXIF.getTag(this, "GPSLatitudeRef"),
            lng: EXIF.getTag(this, "GPSLongitude"),
            lngRef: EXIF.getTag(this, "GPSLongitudeRef")
          }
        });
      });
    };
    
    img.onerror = () => resolve({ valid: false, reason: "Image verification failed: Invalid image format." });
    img.src = url;
  });
}
