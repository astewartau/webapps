export type TiffSampleArray = Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array;

export interface TiffStackMetadata {
  kind: 'ome' | 'imagej' | 'baseline';
  /**
   * The file does not say whether its pages are z planes or time points: an ImageJ stack without
   * `hyperstack=true` or `frames=`, or a plain TIFF (whose sizeZ and sizeT are then null).
   */
  unlabelledStack?: boolean;
  images: number;
  dimensionOrder?: string | null;
  sizeC: number;
  sizeZ: number | null;
  sizeT: number | null;
  /** Micrometres; null when the file does not record it. */
  pixelSize: { x: number | null; y: number | null; z: number | null };
  /** Seconds between frames; null when the file does not record it. */
  frameInterval: number | null;
  description?: string;
}

export interface TiffStackInfo {
  width: number;
  height: number;
  pages: number;
  dtype: 'uint8' | 'uint16' | 'uint32' | 'int8' | 'int16' | 'int32' | 'float32' | 'float64';
  bytesPerSample: number;
  metadata: TiffStackMetadata;
}

export interface TiffStack<Data extends TiffSampleArray = TiffSampleArray> extends TiffStackInfo {
  /** The file's sample type unless `Type` chose another; `dtype` always names the file's. */
  data: Data;
}

type TiffSampleArrayConstructor<Data extends TiffSampleArray> = { new (length: number): Data; new (buffer: ArrayBufferLike): Data; readonly BYTES_PER_ELEMENT: number };

export interface ReadTiffStackOptions<Data extends TiffSampleArray = TiffSampleArray> {
  signal?: AbortSignal;
  /** Limit on the output array's bytes (in `Type` when given). */
  maxBytes?: number;
  /** Decode each page straight into an array of this type instead of the file's sample type. */
  Type?: TiffSampleArrayConstructor<Data>;
  /** Back the output with a SharedArrayBuffer. */
  shared?: boolean;
  onProgress?: (done: number, total: number) => void;
}

export function micrometresPerUnit(unit: string | null | undefined): number | null;
export function parseOmeDescription(description: string | null | undefined): Omit<TiffStackMetadata, 'description'> | null;
export function parseImagejDescription(description: string | null | undefined, resolution?: [number | null, number | null]): Omit<TiffStackMetadata, 'description'> | null;
/**
 * Size, sample type and metadata from the page directories; no pixel is decoded. `pages` counts
 * full-resolution pages (or OME planes). Refuses several OME series, OME planes in other files or
 * not all mapped by TiffData, and an ImageJ `images=` that is not the page count.
 */
export function inspectTiffStack(buffer: ArrayBuffer): Promise<TiffStackInfo>;
/**
 * Every full-resolution page of a greyscale TIFF in page (or OME plane), row, column order.
 * Reads the grey sample of grey + alpha pages, an ImageJ 8-bit palette's indices and inverted
 * WhiteIsZero integers; refuses colour, multichannel, other palette and over-budget stacks.
 */
export function readTiffStack<Data extends TiffSampleArray = TiffSampleArray>(buffer: ArrayBuffer, options?: ReadTiffStackOptions<Data>): Promise<TiffStack<Data>>;
/** ImageJ description of `frames` time points of `slices` z planes (`spacing` in `unit`s). */
export function imagejDescription(options: { frames?: number; slices?: number; frameInterval?: number | null; spacing?: number | null; unit?: string | null; min?: number | null; max?: number | null }): string;
/** Uncompressed little-endian baseline TIFF, one strip per page. */
export function writeTiffStack(stack: { width: number; height: number; data: TiffSampleArray; description?: string; pixelSize?: { x: number; y: number } | null }): Uint8Array;
