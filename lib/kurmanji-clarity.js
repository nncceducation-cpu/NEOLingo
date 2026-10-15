// Adapted from atenax/kurmanci-tts (MIT). Matches the clarity processing in the selected demo.
function audioBufferToWav(audioBuffer) {
  const channels = audioBuffer.numberOfChannels;
  const frames = audioBuffer.length;
  const bytesPerSample = 2;
  const dataSize = frames * channels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeText(offset, value) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  }

  writeText(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, dataSize, true);

  const channelData = Array.from(
    { length: channels },
    (_, channel) => audioBuffer.getChannelData(channel),
  );
  let peak = 0;
  for (const samples of channelData) {
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  }
  const gain = peak > 0 ? 0.95 / peak : 1;

  let offset = 44;
  for (let frame = 0; frame < frames; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][frame] * gain));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export async function enhanceClarity(wavFile) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AudioContextClass || !OfflineAudioContextClass) return wavFile;

  const decodingContext = new AudioContextClass();
  let decoded;
  try {
    decoded = await decodingContext.decodeAudioData(await wavFile.arrayBuffer());
  } finally {
    await decodingContext.close().catch(() => undefined);
  }

  const offline = new OfflineAudioContextClass(
    decoded.numberOfChannels,
    decoded.length,
    decoded.sampleRate,
  );
  const source = offline.createBufferSource();
  const highpass = offline.createBiquadFilter();
  const deSizzle = offline.createBiquadFilter();
  const lowpass = offline.createBiquadFilter();

  source.buffer = decoded;
  highpass.type = "highpass";
  highpass.frequency.value = 65;
  highpass.Q.value = 0.707;
  deSizzle.type = "peaking";
  deSizzle.frequency.value = 6500;
  deSizzle.Q.value = 1;
  deSizzle.gain.value = -4;
  lowpass.type = "lowpass";
  lowpass.frequency.value = 9500;
  lowpass.Q.value = 0.707;

  source.connect(highpass);
  highpass.connect(deSizzle);
  deSizzle.connect(lowpass);
  lowpass.connect(offline.destination);
  source.start();

  return audioBufferToWav(await offline.startRendering());
}

