export interface SupertonicStyle {
  ttl: { dims: number[] }
}

export interface SupertonicTts {
  sampleRate: number
  call(text: string, lang: string, style: SupertonicStyle, steps: number,
    speed?: number, silenceSeconds?: number): Promise<{ wav: number[]; duration: number[] }>
}

export function loadTextToSpeech(
  onnxDir: string,
  sessionOptions?: Record<string, unknown>,
  progressCallback?: (name: string, current: number, total: number) => void,
): Promise<{ textToSpeech: SupertonicTts }>
export function loadVoiceStyle(paths: string[], verbose?: boolean): Promise<SupertonicStyle>
export function writeWavFile(samples: number[], sampleRate: number): ArrayBuffer
