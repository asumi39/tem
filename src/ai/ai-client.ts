export interface AiClient {
  complete(prompt: string): Promise<string>;
  completeJson<T>(prompt: string, schema: object): Promise<T>;
}

export type AiProvider = "mock" | "anthropic" | "openai";

export function createAiClient(provider: AiProvider = "mock"): AiClient {
  if (provider === "mock") {
    return {
      complete: async (prompt: string) => prompt,
      completeJson: async <T>(_prompt: string, _schema: object) => {
        return {} as T;
      }
    };
  }

  throw new Error(`AI provider ${provider} not implemented`);
}