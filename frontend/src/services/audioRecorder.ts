/**
 * Audio Recorder Service
 * Captures microphone input and encodes genuine 16kHz 16-bit mono PCM Linear WAV blobs.
 * Compatible with Chrome, Edge, Firefox, and Safari without relying on browser-dependent WebM/Opus.
 */

export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private pcmChunks: Float32Array[] = [];
  private recordingStartTime = 0;
  private isRecording = false;

  async start(): Promise<void> {
    this.pcmChunks = [];
    this.isRecording = true;
    this.recordingStartTime = Date.now();

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported in this browser.');
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.audioContext = new AudioContextClass();
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Buffer size 4096 gives smooth processing with ~90ms latency
    this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processorNode.onaudioprocess = (event: AudioProcessingEvent) => {
      if (!this.isRecording) return;
      const inputBuffer = event.inputBuffer.getChannelData(0);
      // Clone input float32 array
      const chunk = new Float32Array(inputBuffer.length);
      chunk.set(inputBuffer);
      this.pcmChunks.push(chunk);
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);
  }

  async stop(): Promise<{ blob: Blob; durationSeconds: number }> {
    this.isRecording = false;
    const durationSeconds = Math.max(0.1, (Date.now() - this.recordingStartTime) / 1000);
    const sourceRate = this.audioContext ? this.audioContext.sampleRate : 44100;

    // Disconnect and release audio nodes
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch {}
      this.processorNode = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Merge PCM chunks
    const totalSamples = this.pcmChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const merged = new Float32Array(totalSamples);
    let offset = 0;
    for (const chunk of this.pcmChunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    // Downsample to 16,000 Hz if context sampleRate is different (e.g. 44100 or 48000)
    const targetRate = 16000;
    const resampled = this.resampleAudio(merged, sourceRate, targetRate);

    // Encode to standard 16-bit PCM WAV
    const wavBlob = this.encodeWAV(resampled, targetRate);
    return { blob: wavBlob, durationSeconds };
  }

  private resampleAudio(source: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate || source.length === 0) return source;
    const ratio = fromRate / toRate;
    const newLength = Math.round(source.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const srcIdx = i * ratio;
      const left = Math.floor(srcIdx);
      const right = Math.min(left + 1, source.length - 1);
      const frac = srcIdx - left;
      result[i] = source[left] * (1 - frac) + source[right] * frac;
    }
    return result;
  }

  private encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    const numChannels = 1;
    const bytesPerSample = 2; // 16-bit PCM
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat 1 = PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // BitsPerSample = 16

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write 16-bit PCM samples
    let sampleOffset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(sampleOffset, intSample, true);
      sampleOffset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
