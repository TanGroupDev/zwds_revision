import { BoundingBox, RegionData, ProcessedImage } from '../types';
import { TARGET_COLOR, COLOR_THRESHOLD, MIN_DIMENSION_PERCENT, BACKGROUND_AREA_THRESHOLD } from '../constants';

// Euclidean distance between two colors
const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
  return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
};

export const processZwdsChart = async (file: File): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = async () => {
      try {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        
        // 1. Setup Canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error("Could not get canvas context");
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // 2. Create Cut-Out Map (Binary)
        // We need to identify pixels that match #451b7d within distance 40.
        // Matches = Lines (Black in inverted map). Non-Matches = Regions (White in inverted map).
        // The requirement: "Invert the 'Cut-Out Map' (lines become black, background/regions become white)"
        
        // Let's create a binary array: 1 for Region (White), 0 for Line (Black)
        const binaryMap = new Int8Array(width * height);
        
        // Visualization canvas for the "Cut-Out Map"
        const vizCanvas = document.createElement('canvas');
        vizCanvas.width = width;
        vizCanvas.height = height;
        const vizCtx = vizCanvas.getContext('2d');
        if(!vizCtx) throw new Error("Viz context failed");
        const vizImageData = vizCtx.createImageData(width, height);
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          const dist = colorDistance(r, g, b, TARGET_COLOR.r, TARGET_COLOR.g, TARGET_COLOR.b);
          
          const pixelIndex = i / 4;
          
          if (dist <= COLOR_THRESHOLD) {
            // It matches the purple line color.
            // In Inverted map: Lines become Black (0).
            binaryMap[pixelIndex] = 0;
            
            // For visualization: Draw Black
            vizImageData.data[i] = 0;
            vizImageData.data[i + 1] = 0;
            vizImageData.data[i + 2] = 0;
            vizImageData.data[i + 3] = 255;
          } else {
            // It does NOT match (it is background/region).
            // In Inverted map: Regions become White (1).
            binaryMap[pixelIndex] = 1;
            
            // For visualization: Draw White
            vizImageData.data[i] = 255;
            vizImageData.data[i + 1] = 255;
            vizImageData.data[i + 2] = 255;
            vizImageData.data[i + 3] = 255;
          }
        }
        
        vizCtx.putImageData(vizImageData, 0, 0);
        const cutoutMapUrl = vizCanvas.toDataURL('image/png');

        // 3. Connected Component Labeling (on binaryMap where 1 is ROI)
        const labels = new Int32Array(width * height).fill(0);
        let currentLabel = 0;
        const labelStats: Map<number, { minX: number, maxX: number, minY: number, maxY: number, count: number }> = new Map();

        // Iterative BFS to avoid stack overflow on large images
        const queue: number[] = [];
        const neighbors = [-1, 1, -width, width]; // 4-connectivity

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            
            if (binaryMap[idx] === 1 && labels[idx] === 0) {
              currentLabel++;
              labels[idx] = currentLabel;
              
              let minX = x, maxX = x, minY = y, maxY = y, count = 1;
              
              queue.push(idx);
              
              while (queue.length > 0) {
                const currIdx = queue.pop()!;
                const currX = currIdx % width;
                const currY = Math.floor(currIdx / width);
                
                // Update bbox
                if (currX < minX) minX = currX;
                if (currX > maxX) maxX = currX;
                if (currY < minY) minY = currY;
                if (currY > maxY) maxY = currY;
                
                // Check neighbors
                for (const offset of neighbors) {
                  const nIdx = currIdx + offset;
                  
                  // Boundary checks
                  if (offset === 1 && (currX + 1) >= width) continue;
                  if (offset === -1 && (currX - 1) < 0) continue;
                  if (nIdx < 0 || nIdx >= binaryMap.length) continue;
                  
                  if (binaryMap[nIdx] === 1 && labels[nIdx] === 0) {
                    labels[nIdx] = currentLabel;
                    count++;
                    queue.push(nIdx);
                  }
                }
              }
              
              labelStats.set(currentLabel, { minX, maxX, minY, maxY, count });
            }
          }
        }

        // 3b. Bounding Box Extraction & Filtering
        const boxes: BoundingBox[] = [];
        const totalArea = width * height;
        
        labelStats.forEach((stats, id) => {
          const boxWidth = stats.maxX - stats.minX + 1;
          const boxHeight = stats.maxY - stats.minY + 1;
          const boxArea = boxWidth * boxHeight;
          
          boxes.push({
            id,
            x: stats.minX,
            y: stats.minY,
            width: boxWidth,
            height: boxHeight,
            area: boxArea
          });
        });

        // Filter 1: Disregard largest bounding box if it's the background
        boxes.sort((a, b) => b.area - a.area); // Sort descending area
        
        let filteredBoxes = [...boxes];
        
        // Check if largest is background
        if (filteredBoxes.length > 0) {
           const largest = filteredBoxes[0];
           if (largest.area > totalArea * BACKGROUND_AREA_THRESHOLD) {
             // Likely background, remove it
             filteredBoxes.shift();
           }
        }

        // Filter 2: Remove Noise (Width or Height < 1%)
        filteredBoxes = filteredBoxes.filter(box => {
          return box.width >= width * MIN_DIMENSION_PERCENT && 
                 box.height >= height * MIN_DIMENSION_PERCENT;
        });

        // 4. Crop and Create Blobs
        const regions: RegionData[] = [];
        
        // Re-sort boxes by position (top-left to bottom-right usually makes sense for reading)
        // Simple sort: y then x
        filteredBoxes.sort((a, b) => {
            const rowDiff = Math.abs(a.y - b.y);
            if (rowDiff > height * 0.1) return a.y - b.y; // Significantly different rows
            return a.x - b.x; // Same row
        });

        for (let i = 0; i < filteredBoxes.length; i++) {
            const box = filteredBoxes[i];
            const regionCanvas = document.createElement('canvas');
            regionCanvas.width = box.width;
            regionCanvas.height = box.height;
            const regionCtx = regionCanvas.getContext('2d');
            
            if (regionCtx) {
                regionCtx.drawImage(canvas, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
                
                const blob = await new Promise<Blob | null>(r => regionCanvas.toBlob(r, 'image/jpeg', 0.95));
                if (blob) {
                    regions.push({
                        id: i + 1,
                        blob,
                        url: URL.createObjectURL(blob),
                        boundingBox: box
                    });
                }
            }
        }

        const endTime = performance.now();
        
        resolve({
            originalUrl: objectUrl,
            cutoutMapUrl: cutoutMapUrl,
            regions,
            resolution: { width, height },
            processingTimeMs: Math.round(endTime - startTime)
        });

      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = (e) => reject(new Error("Failed to load image"));
    img.src = objectUrl;
  });
};
