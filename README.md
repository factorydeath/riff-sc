<p align="center">
  <img src="banner.png?v=2" alt="Riff SC - desktop SoundCloud music player and audio suite" width="100%">
</p>

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/windows8/windows8-original.svg" width="22" height="22" alt="Windows">&nbsp;&nbsp;
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/apple/apple-original.svg" width="22" height="22" alt="macOS">&nbsp;&nbsp;
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linux/linux-original.svg" width="22" height="22" alt="Linux">&nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/ios/9ca3af" width="22" height="22" alt="iOS">&nbsp;&nbsp;
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/android/android-original.svg" width="22" height="22" alt="Android">
</p>

<h1 align="center">
  <img src="github/readme/emoj2i.gif" width="48" height="48" align="absmiddle" alt="emoji">&nbsp;Riff SC
</h1>

<p align="center">
  <b>A dedicated, high-performance desktop SoundCloud client & audio suite with Material Design 3.</b><br>
  Ad-free streaming, offline lossless playback, real-time DSP audio tools, and zero telemetry.
</p>

<p align="center">
  <a href="https://github.com/factorydeath/riff-sc/releases">
    <img src="https://img.shields.io/badge/Download_Riff_SC-6750A4?style=for-the-badge&logo=download&logoColor=white" height="40" alt="Download">
  </a>
  &nbsp;
  <a href="https://soundcloud.com">
    <img src="https://img.shields.io/badge/SoundCloud-FF5500?style=for-the-badge&logo=soundcloud&logoColor=white" height="40" alt="SoundCloud">
  </a>
</p>

<p align="center">
  <a href="#what-is-riff-sc">About</a> &nbsp;·&nbsp;
  <a href="#core-features">Features</a> &nbsp;·&nbsp;
  <a href="#built-in-audio-suite">Audio Suite</a> &nbsp;·&nbsp;
  <a href="#material-design-3-floating-stage">Interface</a> &nbsp;·&nbsp;
  <a href="#download-and-install">Install</a> &nbsp;·&nbsp;
  <a href="#build-from-source">Build</a> &nbsp;·&nbsp;
  <a href="#faq">FAQ</a>
</p>

<p align="center">
  <a href="https://github.com/factorydeath/riff-sc/stargazers"><img src="https://img.shields.io/github/stars/factorydeath/riff-sc?style=flat-square&labelColor=16191C&color=CAD3F5" alt="Stars"></a>
  <a href="https://github.com/factorydeath/riff-sc/commits/main"><img src="https://img.shields.io/github/last-commit/factorydeath/riff-sc?style=flat-square&labelColor=16191C&color=94C9FF" alt="Last Commit"></a>
  <a href="https://github.com/factorydeath/riff-sc/blob/main/LICENSE"><img src="https://img.shields.io/github/license/factorydeath/riff-sc?style=flat-square&labelColor=16191C&color=8EEDD8" alt="License"></a>
  <img src="https://img.shields.io/badge/SoundCloud-Dedicated_Client-FF5500?style=flat-square&labelColor=16191C&logo=soundcloud&logoColor=white" alt="SoundCloud Client">
  <img src="https://img.shields.io/badge/Design-Material_You_M3-D0BCFF?style=flat-square&labelColor=16191C" alt="Material 3">
</p>

> [!NOTE]
> **Riff SC** is a dedicated desktop SoundCloud client and offline music player. It focuses strictly on delivering the most fluid, aesthetic, and feature-complete desktop SoundCloud experience alongside local offline music files.

---

## What is Riff SC?

**Riff SC** is an open-source, telemetry-free desktop application for **Windows, Linux, and macOS**. It delivers ad-free **SoundCloud** streaming and offline local media playback in a unified, hardware-accelerated interface without subscription paywalls or tracking.

Built with **Electron**, **Vanilla JavaScript**, and **WebGL**, Riff SC provides instant responsiveness, silky animations, and low-latency audio processing without runtime framework overhead. All playback caches, configuration, and history remain strictly on your local machine under the **MIT license**.

---

## Features

- 🎧 **Dedicated SoundCloud Streaming**: Full access to SoundCloud tracks, artists, playlists, sets, and trending music with zero ads and zero tracking.
- 📁 **Offline Local Library**: Index and play high-resolution formats including **FLAC, WAV, MP3, OGG, and M4A** with metadata reading and artwork extraction.
- 🎛️ **Built-in Audio Studio**: Visual waveform trimmer, 10-band parametric equalizer, and real-time DSP effects (tempo, pitch, reverb, overdrive).
- 🎨 **Material Design 3 Floating Stage**: Redesigned floating playbar with glassmorphism, responsive cover shapes, squiggly progress scrubber, and audio visualizer.
- ✨ **Dynamic Palette Extraction**: Automatic color extraction from track cover art, seamlessly adjusting the app's tones and ambient glows.
- 🎤 **Synchronized Lyrics & Karaoke**: Real-time synced lyrics lookup, local LRC support, manual timing offset alignment, and fullscreen TV / Karaoke mode.
- 📦 **Lossless Stream Pipeline**: Integrated downloader for SoundCloud tracks directly into local disk storage with automatic ID3 tagging and cover embedding.
- 🔒 **Zero Telemetry**: No tracking identifiers, analytics pings, or background data collection. Ever.

---

## Built-in Audio Suite

Riff SC includes an integrated audio engineering toolkit accessible directly within the player interface:

### ✂️ Visual Audio Editor
- **Lossless Audio Trimming**: Set precise start and end boundaries to trim audio without transcoding loss.
- **Region Extraction**: Isolate specific hooks, beats, or vocal segments as standalone audio files.
- **Non-Destructive Processing**: Edit operations produce independent files while preserving the original source media.

### 🎚️ 10-Band Parametric Equalizer
- Dedicated frequency sliders covering 32 Hz through 16 kHz with pre-configured acoustic profiles (*Bass Boost*, *Vocal Clarity*, *Electronic*, *Flat*, *Rock*).
- Per-channel gain adjustments with real-time Web Audio API signal processing.

### ⚡ Real-Time DSP Effects Chain
- **Tempo Control**: Dynamically speed up or slow down playback rate without altering pitch.
- **Pitch Shifting**: Independent semitone pitch adjustments for rehearsal, sampling, and tuning.
- **Reverb & Spatial Effects**: Algorithmic convolution and room size simulation for spatial enhancement.
- **Distortion / Overdrive**: Adjustable wave-shaping saturation and drive harmonics.

### 💾 Offline Library & Download Pipeline
- Download SoundCloud tracks directly into local disk storage (**MP3, FLAC, Opus, WAV**).
- Automatic ID3 and metadata tagging, including high-resolution artwork embedding.
- Complete offline availability with full playlist compilation and search indexing.

---

## Material Design 3 "Floating Stage"

Riff SC implements the modern Material Design 3 (M3 Expressive) design language:

- **Redesigned Floating Playbar**: An elevated, floating playback bar with frosted glass backdrop, harmonious padding, stable controls, and smooth responsive states.
- **Dynamic Color Extraction**: Generates responsive UI tonal palettes on the fly based on the dominant and secondary hues of active album art.
- **Deep UI Customization**: Configurable banner backdrops, mesh gradients, blur filters, corner radiuses, and typography controls.
- **Integrated CSS Editor**: Built-in developer console allowing direct CSS overrides and custom style injection to personalize every aspect of the interface.
- **Optimized Layout Modes**: Compact mini-player layout, expanded desktop view, and fullscreen TV / Karaoke mode.

---

## Download and Install

Pre-built binaries are available on the [Releases page](https://github.com/factorydeath/riff-sc/releases).

Standard releases bundle all necessary runtime dependencies (`yt-dlp` and `ffmpeg` binaries). No extra configuration is required on Windows or Linux.

### Windows
1. Download `riff-sc-<version>-win-x64.exe` from [Releases](https://github.com/factorydeath/riff-sc/releases).
2. Run the installer.

### Linux
1. Download `riff-sc-<version>-x86_64.AppImage`.
2. Make it executable (`chmod +x riff-sc-*.AppImage`) and run.

### macOS
1. Download `Riff-SC-<version>-mac-arm64.dmg` (Apple Silicon) or `Riff-SC-<version>-mac-x64.dmg` (Intel).
2. Drag Riff SC to your `Applications` directory.
3. If macOS prompts an unidentified developer warning, right-click `Riff SC.app` and choose **Open**.

---

## Build from Source

Requires **Node.js 18+** and **npm**:

```bash
# Clone the repository
git clone https://github.com/factorydeath/riff-sc.git
cd riff-sc

# Install dependencies
npm install

# Run development mode
npm start

# Build production distributable
npm run dist
```

---

## FAQ

**What is Riff SC?**  
Riff SC is a dedicated desktop SoundCloud client and offline audio player featuring Material Design 3, real-time DSP effects, and lossless playback.

**Is Riff SC free?**  
Yes. Riff SC is free and open-source software published under the permissive MIT license. There are no subscriptions, paywalls, or premium tiers.

**Does Riff SC display advertisements?**  
No. Streams from SoundCloud are resolved directly and play without third-party audio advertisements.

**Is an account or sign-in required?**  
No account is required to search and listen. You can also sign in to SoundCloud if you wish to sync your personal likes and playlists.

**Which operating systems are supported?**  
Windows 10/11, modern Linux distributions, and macOS.

**Can Riff SC function as an offline local music player?**  
Yes. Riff SC natively indexes local audio files (including lossless FLAC, WAV, MP3, and OGG), reads standard metadata tags and embedded artwork, and manages playlists without altering underlying disk files.

---

## Contributing

Pull requests and issues are welcome! Feel free to report bugs, suggest features, or submit improvements via [Issues](https://github.com/factorydeath/riff-sc/issues) and [Pull Requests](https://github.com/factorydeath/riff-sc/pulls).

---

## Acknowledgments

- SoundCloud API and stream integration.
- Material Design 3 by Google.

---

## License

Distributed under the [MIT License](LICENSE).

---

<sub>Keywords: SoundCloud desktop player, SoundCloud client, ad-free music player, Material Design 3, M3 Expressive, visual audio editor, lossless audio trimmer, 10-band equalizer, DSP effects, tempo changer, pitch shift, FLAC player, WAV playback, Electron music player, Vanilla JS, WebGL audio visualizer, open source music player, MIT license, telemetry-free desktop player.</sub>
