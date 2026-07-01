import sharp, { type Metadata } from "sharp";

export const MAX_WARDROBE_MEDIA_FILE_SIZE = 10 * 1024 * 1024;

const MIN_IMAGE_DIMENSION = 64;
const MAX_IMAGE_DIMENSION = 12_000;
const MAX_IMAGE_PIXELS = 40_000_000;

const supportedFormats = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
} as const;

type SupportedImageFormat = keyof typeof supportedFormats;
export type WardrobeImageMediaType = (typeof supportedFormats)[SupportedImageFormat];

export type ValidatedWardrobeImage = {
  data: Buffer;
  mediaType: WardrobeImageMediaType;
  width: number;
  height: number;
};

export class WardrobeImageValidationError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "WardrobeImageValidationError";
  }
}

function invalidImage(): WardrobeImageValidationError {
  return new WardrobeImageValidationError(
    "INVALID_IMAGE_FILE",
    400,
    "The uploaded file is not a valid JPEG, PNG, or WebP image."
  );
}

function getSupportedFormat(metadata: Metadata): SupportedImageFormat {
  if (metadata.format === "jpeg" || metadata.format === "png" || metadata.format === "webp") {
    return metadata.format;
  }

  throw new WardrobeImageValidationError(
    "UNSUPPORTED_IMAGE_FORMAT",
    415,
    "Only JPEG, PNG, and WebP images are supported."
  );
}

function validateDimensions(metadata: Metadata): void {
  const { width, height } = metadata;

  if (width === undefined || height === undefined) {
    throw invalidImage();
  }

  if (
    width < MIN_IMAGE_DIMENSION ||
    height < MIN_IMAGE_DIMENSION ||
    width > MAX_IMAGE_DIMENSION ||
    height > MAX_IMAGE_DIMENSION ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    throw new WardrobeImageValidationError(
      "IMAGE_DIMENSIONS_OUT_OF_RANGE",
      400,
      `Image dimensions must be between ${MIN_IMAGE_DIMENSION} and ${MAX_IMAGE_DIMENSION} pixels, with no more than ${MAX_IMAGE_PIXELS} total pixels.`
    );
  }
}

function createOutputPipeline(data: Buffer, format: SupportedImageFormat) {
  const pipeline = sharp(data, {
    failOn: "warning",
    limitInputPixels: MAX_IMAGE_PIXELS,
    sequentialRead: true
  }).autoOrient();

  switch (format) {
    case "jpeg":
      return pipeline.jpeg({ quality: 95 });
    case "png":
      return pipeline.png({ compressionLevel: 9 });
    case "webp":
      return pipeline.webp({ quality: 95 });
  }
}

export async function validateAndNormalizeWardrobeImage(
  data: Buffer,
  declaredMediaType: WardrobeImageMediaType
): Promise<ValidatedWardrobeImage> {
  if (data.byteLength === 0) {
    throw invalidImage();
  }

  if (data.byteLength > MAX_WARDROBE_MEDIA_FILE_SIZE) {
    throw new WardrobeImageValidationError(
      "WARDROBE_MEDIA_TOO_LARGE",
      413,
      "Wardrobe images must be 10 MB or smaller."
    );
  }

  let metadata: Metadata;

  try {
    metadata = await sharp(data, {
      failOn: "warning",
      limitInputPixels: MAX_IMAGE_PIXELS,
      sequentialRead: true
    }).metadata();
  } catch {
    throw invalidImage();
  }

  const format = getSupportedFormat(metadata);
  const detectedMediaType = supportedFormats[format];

  if (detectedMediaType !== declaredMediaType) {
    throw new WardrobeImageValidationError(
      "IMAGE_MEDIA_TYPE_MISMATCH",
      415,
      "The uploaded image content does not match its declared media type."
    );
  }

  if ((metadata.pages ?? 1) > 1) {
    throw new WardrobeImageValidationError(
      "ANIMATED_IMAGE_NOT_SUPPORTED",
      415,
      "Animated images are not supported."
    );
  }

  validateDimensions(metadata);

  try {
    const output = await createOutputPipeline(data, format).toBuffer({
      resolveWithObject: true
    });

    if (
      output.info.width < MIN_IMAGE_DIMENSION ||
      output.info.height < MIN_IMAGE_DIMENSION ||
      output.info.width > MAX_IMAGE_DIMENSION ||
      output.info.height > MAX_IMAGE_DIMENSION ||
      output.info.width * output.info.height > MAX_IMAGE_PIXELS
    ) {
      throw new WardrobeImageValidationError(
        "IMAGE_DIMENSIONS_OUT_OF_RANGE",
        400,
        "Normalized image dimensions are outside the supported range."
      );
    }

    if (output.data.byteLength > MAX_WARDROBE_MEDIA_FILE_SIZE) {
      throw new WardrobeImageValidationError(
        "WARDROBE_MEDIA_TOO_LARGE",
        413,
        "The normalized wardrobe image exceeds the 10 MB storage limit."
      );
    }

    return {
      data: output.data,
      mediaType: detectedMediaType,
      width: output.info.width,
      height: output.info.height
    };
  } catch (error) {
    if (error instanceof WardrobeImageValidationError) {
      throw error;
    }

    throw invalidImage();
  }
}
