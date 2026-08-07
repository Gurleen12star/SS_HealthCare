import numpy as np
from scipy.signal import butter, lfilter, find_peaks

# Simulate a 10-second PPG signal at 30 FPS with a heart rate of 72 BPM (1.2 Hz)
fs = 30
duration = 10
t = np.linspace(0, duration, fs * duration)
# Base signal (1.2 Hz) + noise + baseline wander (0.1 Hz)
signal = np.sin(2 * np.pi * 1.2 * t) + 0.5 * np.random.randn(len(t)) + 2 * np.sin(2 * np.pi * 0.1 * t)

# Bandpass filter (0.7 to 3.0 Hz)
nyq = 0.5 * fs
low = 0.7 / nyq
high = 3.0 / nyq
b, a = butter(2, [low, high], btype='band')
filtered_signal = lfilter(b, a, signal)

# Find peaks
peaks, _ = find_peaks(filtered_signal, distance=fs/3.0) # min distance between peaks
if len(peaks) > 1:
    bpm = 60.0 * fs / np.mean(np.diff(peaks))
    print(f"Calculated BPM: {bpm:.1f} (Expected: 72.0)")
else:
    print("Not enough peaks found.")

# FFT method
fft = np.fft.rfft(filtered_signal)
freqs = np.fft.rfftfreq(len(filtered_signal), 1.0/fs)
fft_bpm = freqs[np.argmax(np.abs(fft))] * 60
print(f"FFT BPM: {fft_bpm:.1f}")

