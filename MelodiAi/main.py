import librosa
import numpy as np
import matplotlib.pyplot as plt

# Load an audio file (like loading an image in web dev)
audio, sample_rate = librosa.load('song.mp3')
print(f"Audio length: {len(audio)} samples")
print(f"Duration: {len(audio)/sample_rate} seconds")

# Plot waveform (like drawing on canvas)
plt.figure(figsize=(12, 4))
plt.plot(audio)
plt.title('Audio Waveform')
plt.show()

# Extract pitch (melody line) - this is key for song matching
pitches, magnitudes = librosa.piptrack(y=audio, sr=sample_rate)

# Get the main melody
melody = []
for t in range(pitches.shape[1]):
    index = magnitudes[:, t].argmax()
    pitch = pitches[index, t]
    melody.append(pitch)

# Plot the melody
plt.figure(figsize=(12, 4))
plt.plot(melody)
plt.title('Extracted Melody')
plt.show()

input("Press Enter to exit...")