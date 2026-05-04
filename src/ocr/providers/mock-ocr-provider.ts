export interface OcrProviderInput {
  attachmentId: string;
  objectKey: string;
  contentType: string;
}

export interface OcrProviderOutput {
  text: string;
  confidence: number;
  provider: string;
  modelName: string;
  modelVersion: string;
}

export interface OcrProvider {
  recognize(input: OcrProviderInput): Promise<OcrProviderOutput>;
}

export class MockOcrProvider implements OcrProvider {
  async recognize(input: OcrProviderInput): Promise<OcrProviderOutput> {
    void input;
    return {
      text: "This is recognized mock OCR text for the writing answer.",
      confidence: 0.92,
      provider: "mock",
      modelName: "mock-ocr",
      modelVersion: "1.0"
    };
  }
}
