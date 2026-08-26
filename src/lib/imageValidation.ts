export interface ClientImageValidationResult {
  valid: boolean;
  reason?: string;
  brightness?: number;
  contrast?: number;
}

/**
 * Client-side image validation using an HTML canvas.
 *
 * Runs before the server round-trip to give instant feedback for obviously
 * bad images (black screens, solid-colour photos, tiny images).
 *
 * The server-side `sharp`-based validation in server/imageValidation.ts
 * performs the authoritative check — this is a fast pre-screen.
 */
export function validateImage(
  imageElement: HTMLImageElement
): ClientImageValidationResult {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (
    !context ||
    imageElement.naturalWidth === 0 ||
    imageElement.naturalHeight === 0
  ) {
    return {
      valid: false,
      reason: "Unable to read image. The file may be corrupted.",
    };
  }

  // Resolution check
  if (imageElement.naturalWidth < 400 || imageElement.naturalHeight < 300) {
    return {
      valid: false,
      reason:
        "Image resolution is too low. Please upload a photo at least 400×300 pixels.",
    };
  }

  // Use a smaller canvas for performance — analyse at max 256×256
  const scale = Math.min(
    256 / imageElement.naturalWidth,
    256 / imageElement.naturalHeight,
    1
  );
  canvas.width = Math.round(imageElement.naturalWidth * scale);
  canvas.height = Math.round(imageElement.naturalHeight * scale);
  context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixelCount = canvas.width * canvas.height;

  let brightnessSum = 0;
  let brightnessSquaredSum = 0;
  let veryDarkPixels = 0;
  let veryBrightPixels = 0;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];

    // Perceived luminance (ITU-R BT.709)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    brightnessSum += luminance;
    brightnessSquaredSum += luminance * luminance;

    if (luminance < 10) veryDarkPixels++;
    if (luminance > 245) veryBrightPixels++;
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

  // Uniform / monotone image
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
}

/**
 * @deprecated Use `validateImage()` instead for structured results.
 * Kept for backward-compatibility — returns true when the image is too dark.
 */
export function isImageTooDark(imageElement: HTMLImageElement): boolean {
  return !validateImage(imageElement).valid;
}