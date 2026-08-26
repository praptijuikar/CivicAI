import sharp from "sharp";

export interface ImageValidationResult {
  valid: boolean;
  reason?: string;
  brightness?: number;
  contrast?: number;
}

/**
 * Validates an uploaded image buffer before it reaches any AI model.
 *
 * Checks (in order):
 * 1. File integrity — sharp will throw on corrupted / non-image files
 * 2. Minimum resolution — reject below 400×300
 * 3. Near-black — >95% of pixels have luminance < 10
 * 4. Too dark + low contrast — mean brightness < 15 AND std deviation < 8
 * 5. Near-white — >95% of pixels have luminance > 245
 * 6. Uniform / monotone — std deviation < 4
 */
export async function validateUploadedImage(
  buffer: Buffer
): Promise<ImageValidationResult> {
  try {
    const image = sharp(buffer, { failOn: "error" });

    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return {
        valid: false,
        reason: "Unable to read image. The file may be corrupted.",
      };
    }

    // Reject very small images
    if (metadata.width < 400 || metadata.height < 300) {
      return {
        valid: false,
        reason:
          "Image resolution is too low. Please upload a photo at least 400×300 pixels.",
      };
    }

    // Resize for fast pixel analysis
    const { data, info } = await image
      .resize({
        width: 256,
        height: 256,
        fit: "inside",
        withoutEnlargement: true,
      })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixelCount = info.width * info.height;

    let brightnessSum = 0;
    let brightnessSquaredSum = 0;
    let veryDarkPixels = 0;
    let veryBrightPixels = 0;

    for (let i = 0; i < data.length; i += 3) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Perceived luminance (ITU-R BT.709)
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      brightnessSum += luminance;
      brightnessSquaredSum += luminance * luminance;

      if (luminance < 10) {
        veryDarkPixels++;
      }
      if (luminance > 245) {
        veryBrightPixels++;
      }
    }

    const meanBrightness = brightnessSum / pixelCount;

    const variance =
      brightnessSquaredSum / pixelCount - meanBrightness * meanBrightness;

    const standardDeviation = Math.sqrt(Math.max(variance, 0));

    const darkPixelRatio = veryDarkPixels / pixelCount;
    const brightPixelRatio = veryBrightPixels / pixelCount;

    // Almost completely black
    if (darkPixelRatio > 0.95) {
      return {
        valid: false,
        reason:
          "Image is almost completely black. Please capture the issue again with adequate lighting.",
        brightness: meanBrightness,
        contrast: standardDeviation,
      };
    }

    // Too dark with insufficient visual information
    if (meanBrightness < 15 && standardDeviation < 8) {
      return {
        valid: false,
        reason:
          "Image is too dark or does not contain enough visual information. Please retake the photo.",
        brightness: meanBrightness,
        contrast: standardDeviation,
      };
    }

    // Almost completely white / blown out
    if (brightPixelRatio > 0.95) {
      return {
        valid: false,
        reason:
          "Image is almost entirely white or overexposed. Please retake the photo.",
        brightness: meanBrightness,
        contrast: standardDeviation,
      };
    }

    // Uniform / monotone image (single-colour or solid fill)
    if (standardDeviation < 4) {
      return {
        valid: false,
        reason:
          "Image does not contain enough visual detail. It appears to be a solid or near-uniform colour.",
        brightness: meanBrightness,
        contrast: standardDeviation,
      };
    }

    return {
      valid: true,
      brightness: meanBrightness,
      contrast: standardDeviation,
    };
  } catch {
    return {
      valid: false,
      reason: "Invalid or corrupted image file. Please upload a valid photo.",
    };
  }
}
