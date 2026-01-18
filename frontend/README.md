# MediaPipe Biometric Feature Extraction Frontend

A comprehensive frontend application that uses MediaPipe Face Mesh to extract detailed biometric features from video input in real-time.

## Features Extracted

### 1. Face Geometry Features
- **Jaw openness ratio**: Distance between lower lip & chin vs face height
- **Jaw tension proxy**: Variance of jaw landmark positions over time
- **Lip compression ratio**: Upper-lower lip distance / mouth width
- **Brow furrow**: Distance between inner eyebrows
- **Facial asymmetry**: Left/right landmark deviation

### 2. Eye & Blink Features
- **Eye Aspect Ratio (EAR)**: Per-eye calculation
- **Blink detection**: Real-time blink detection
- **Blink rate**: Blinks per minute
- **Blink duration**: Duration of each blink
- **Prolonged eye closure**: Detection of extended eye closure
- **Blink suppression**: Very low blink rate detection

### 3. Mouth & Speech Proxies
- **Mouth openness**: Real-time mouth opening measurement
- **Mouth movement frequency**: Rate of mouth movements
- **Speaking likelihood**: Detection of speech patterns
- **Speech suppression**: Mouth still while face tense

### 4. Head & Posture Features
- **Head pitch/yaw/roll**: 3D head orientation
- **Head micro-movement variance**: Stability measurement
- **Forward head drift**: Posture degradation detection
- **Stillness duration**: Periods of minimal movement

### 5. Breathing Proxies
- **Breathing rate**: Breaths per minute (camera-only)
- **Breathing amplitude**: Low/medium/high classification
- **Breathing regularity**: Consistency measurement
- **Micro breath-holding detection**: Detection of breath holding

### 6. Temporal Stability Features
- **Facial variance**: Rolling window variance of landmarks
- **EAR rate of change**: Rate of change of eye aspect ratio
- **Recovery time**: Time to recover after perturbation
- **Trend slopes**: Up/down trends in features
- **Baseline normalization**: Per-session baseline (first 60s)

### 7. Derived Analyzer Features
- **Arousal proxies**: Combined signals for arousal detection
- **Cognitive load**: Low facial variance + suppressed blinking
- **Dysregulation**: Irregular breathing + jaw clenching + facial rigidity
- **Mismatch detection**: Speaking + rising tension, or calm face + physiological acceleration

## Output Schema

The application outputs features in the following JSON format:

```json
{
  "blink_rate": 18,
  "ear_mean": 0.28,
  "jaw_tension": 0.71,
  "breathing_rate": 22,
  "breathing_amplitude": "low",
  "facial_variance": 0.12,
  "speaking": true,
  "head_motion": "low",
  "timestamp": 1710000000
}
```

## Installation

1. Install dependencies:
```bash
cd frontend
npm install
```

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser to `http://localhost:3000`

3. Click "Start Camera" to begin video capture and feature extraction

4. Features will be displayed in real-time in the UI and as JSON output

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Technical Details

- **MediaPipe Face Mesh**: 468 facial landmarks
- **Frame Rate**: Optimized for 30fps processing
- **Temporal Windows**: 
  - Rolling window: 5-30 seconds
  - Baseline window: 60 seconds
  - Breathing analysis: 10-20 seconds
- **Browser Requirements**: Modern browser with WebRTC support (Chrome, Firefox, Edge, Safari)

## Notes

- The application requires camera permissions
- All processing is done client-side in the browser
- No data is sent to external servers
- Features are computed in real-time from video frames
