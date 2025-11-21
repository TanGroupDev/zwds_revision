export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  id: number;
}

export interface ProcessedImage {
  originalUrl: string;
  cutoutMapUrl: string;
  regions: RegionData[];
  resolution: { width: number; height: number };
  processingTimeMs: number;
}

export interface RegionData {
  id: number;
  blob: Blob;
  url: string;
  boundingBox: BoundingBox;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export enum AppView {
  UPLOAD = 'UPLOAD',
  RESULTS = 'RESULTS',
}