// ==========================================
// IFC File Parser (Backend Connected)
// ==========================================

import { MEPElement } from './clashEngine';

export interface IFCModel {
  filename: string;
  schema: string;
  elements: MEPElement[];
  metadata: {
    project: string;
    author: string;
    organization: string;
    timestamp: string;
    elementCount: number;
    disciplines: string[];
    levels: string[];
  };
}

export interface ParseProgress {
  stage: string;
  progress: number;
  detail: string;
}

const BACKEND_URL = 'http://localhost:3001';

// Parse IFC file via backend
export async function parseIFCFile(
  file: File,
  onProgress?: (progress: ParseProgress) => void
): Promise<IFCModel> {
  onProgress?.({ stage: 'Uploading', progress: 0.1, detail: `Sending ${file.name} to server...` });

  const formData = new FormData();
  formData.append('file', file);

  try {
    onProgress?.({ stage: 'Converting', progress: 0.4, detail: 'Converting IFC to JSON format...' });
    
    const response = await fetch(`${BACKEND_URL}/api/convert`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
    }

    onProgress?.({ stage: 'Processing', progress: 0.8, detail: 'Finalizing model data...' });
    
    const model = await response.json();
    
    onProgress?.({ stage: 'Complete', progress: 1, detail: 'Model parsed successfully' });
    
    return model;
  } catch (error) {
    console.error('Error parsing IFC via backend:', error);
    const hint =
      'Is the API running? From the project folder run: npm run dev (starts Vite + API), or npm run server in a second terminal.';
    onProgress?.({
      stage: 'Error',
      progress: 0,
      detail: `Failed to connect to backend at ${BACKEND_URL}. ${hint}`,
    });
    throw error;
  }
}
