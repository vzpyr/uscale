import { UpscaleModelDef } from '../state/types';

export const OFFICIAL_UPSCAYL_MODELS: UpscaleModelDef[] = [
  {
    id: 'digital-art',
    scale: 4,
    sizeDisplay: '17mb',
    fileName: 'upscayl-digital-art-4x.onnx',
    repo: 'huggingworld/onnx-image-models',
  },
  {
    id: 'high-fidelity',
    scale: 4,
    sizeDisplay: '64mb',
    fileName: 'upscayl-high-fidelity-4x.onnx',
    repo: 'huggingworld/onnx-image-models',
  },
  {
    id: 'remacri',
    scale: 4,
    sizeDisplay: '64mb',
    fileName: 'upscayl-remacri-4x.onnx',
    repo: 'huggingworld/onnx-image-models',
  },
  {
    id: 'ultramix-balanced',
    scale: 4,
    sizeDisplay: '64mb',
    fileName: 'upscayl-ultramix-balanced-4x.onnx',
    repo: 'huggingworld/onnx-image-models',
  },
  {
    id: 'ultrasharp',
    scale: 4,
    sizeDisplay: '64mb',
    fileName: 'upscayl-ultrasharp-4x.onnx',
    repo: 'huggingworld/onnx-image-models',
  },
  {
    id: 'upscayl-lite',
    scale: 4,
    sizeDisplay: '4.6mb',
    fileName: 'upscayl-lite-4x.onnx',
    repo: 'huggingworld/onnx-image-models',
  },
  {
    id: 'upscayl-standard',
    scale: 4,
    sizeDisplay: '64mb',
    fileName: 'upscayl-standard-4x.onnx',
    repo: 'huggingworld/onnx-image-models',
  },
];
