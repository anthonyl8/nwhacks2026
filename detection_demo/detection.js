import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

// MediaPipe Face Mesh landmark indices
const LANDMARKS = {
    // Eye landmarks
    LEFT_EYE_TOP: 159,
    LEFT_EYE_BOTTOM: 145,
    LEFT_EYE_LEFT: 33,
    LEFT_EYE_RIGHT: 133,
    RIGHT_EYE_TOP: 386,
    RIGHT_EYE_BOTTOM: 374,
    RIGHT_EYE_LEFT: 362,
    RIGHT_EYE_RIGHT: 263,
    
    // Face geometry
    CHIN: 18,
    FOREHEAD: 10,
    LEFT_JAW: 172,
    RIGHT_JAW: 397,
    LOWER_LIP: 14,
    UPPER_LIP: 13,
    MOUTH_LEFT: 61,
    MOUTH_RIGHT: 291,
    
    // Eyebrows
    LEFT_INNER_BROW: 107,
    RIGHT_INNER_BROW: 336,
    LEFT_OUTER_BROW: 70,
    RIGHT_OUTER_BROW: 300,
    
    // Nose
    NOSE_TIP: 4,
    NOSE_BASE: 2,
    
    // Face boundaries
    LEFT_FACE: 234,
    RIGHT_FACE: 454,
    TOP_FACE: 10,
    BOTTOM_FACE: 18
};

// State management
class FeatureExtractor {
    constructor() {
        this.faceMesh = null;
        this.camera = null;
        this.isRunning = false;
        
        // Temporal buffers (30s window at 30fps = 900 frames)
        this.bufferSize = 900;
        this.frameHistory = [];
        this.blinkHistory = [];
        this.breathingHistory = [];
        
        // Baseline (first 60s = 1800 frames at 30fps)
        this.baselineWindow = 1800;
        this.baselineData = [];
        this.baselineEstablished = false;
        
        // Current frame data
        this.currentFeatures = null;
        this.lastBlinkTime = 0;
        this.blinkCount = 0;
        this.sessionStartTime = Date.now();
        
        // Breathing tracking
        this.nosePositions = [];
        this.breathingWindow = 300; // 10s at 30fps
        
        // Speech detection
        this.mouthOpenHistory = [];
        this.speakingThreshold = 0.15;
        
        // Head pose
        this.headPoseHistory = [];
        
        this.initializeMediaPipe();
    }
    
    initializeMediaPipe() {
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });
        
        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        this.faceMesh.onResults((results) => this.onResults(results));
    }
    
    startCamera() {
        const video = document.getElementById('input_video');
        const canvas = document.getElementById('output_canvas');
        const ctx = canvas.getContext('2d');
        
        this.camera = new Camera(video, {
            onFrame: async () => {
                await this.faceMesh.send({ image: video });
            },
            width: 640,
            height: 480
        });
        
        this.camera.start();
        this.isRunning = true;
        this.sessionStartTime = Date.now();
        
        // Update canvas size
        video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        });
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
    }
    
    stopCamera() {
        if (this.camera) {
            this.camera.stop();
            this.isRunning = false;
        }
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
    }
    
    onResults(results) {
        const canvas = document.getElementById('output_canvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            
            // Draw face mesh (optional, for visualization)
            drawConnectors(ctx, landmarks, FaceMesh.FACEMESH_TESSELATION, 
                { color: '#C0C0C070', lineWidth: 1 });
            drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 0.5, radius: 1 });
            
            // Extract all features
            const features = this.extractFeatures(landmarks);
            this.currentFeatures = features;
            
            // Update UI
            this.updateUI(features);
            
            // Store in history
            this.frameHistory.push({
                timestamp: Date.now(),
                features: features,
                landmarks: landmarks
            });
            
            // Maintain buffer size
            if (this.frameHistory.length > this.bufferSize) {
                this.frameHistory.shift();
            }
            
            // Establish baseline
            if (!this.baselineEstablished && this.frameHistory.length >= this.baselineWindow) {
                this.establishBaseline();
            }
        }
        
        ctx.restore();
    }
    
    extractFeatures(landmarks) {
        const timestamp = Date.now();
        
        return {
            timestamp,
            // Eye & blink features
            ...this.extractEyeFeatures(landmarks),
            // Face geometry
            ...this.extractFaceGeometry(landmarks),
            // Mouth & speech
            ...this.extractMouthFeatures(landmarks),
            // Head & posture
            ...this.extractHeadFeatures(landmarks),
            // Breathing
            ...this.extractBreathingFeatures(landmarks),
            // Temporal features
            ...this.extractTemporalFeatures(),
            // Derived features
            ...this.extractDerivedFeatures()
        };
    }
    
    // 1. Eye & Blink Features
    extractEyeFeatures(landmarks) {
        const leftEAR = this.calculateEAR(
            landmarks[LANDMARKS.LEFT_EYE_TOP],
            landmarks[LANDMARKS.LEFT_EYE_BOTTOM],
            landmarks[LANDMARKS.LEFT_EYE_LEFT],
            landmarks[LANDMARKS.LEFT_EYE_RIGHT]
        );
        
        const rightEAR = this.calculateEAR(
            landmarks[LANDMARKS.RIGHT_EYE_TOP],
            landmarks[LANDMARKS.RIGHT_EYE_BOTTOM],
            landmarks[LANDMARKS.RIGHT_EYE_LEFT],
            landmarks[LANDMARKS.RIGHT_EYE_RIGHT]
        );
        
        const earMean = (leftEAR + rightEAR) / 2;
        const earVariance = Math.abs(leftEAR - rightEAR);
        
        // Blink detection (EAR < 0.2 typically indicates closed eye)
        const blinkThreshold = 0.2;
        const isBlinking = earMean < blinkThreshold;
        
        if (isBlinking && this.lastBlinkTime === 0) {
            // Blink start
            this.lastBlinkTime = Date.now();
        } else if (!isBlinking && this.lastBlinkTime > 0) {
            // Blink end
            const blinkDuration = Date.now() - this.lastBlinkTime;
            this.blinkHistory.push({
                duration: blinkDuration,
                timestamp: Date.now()
            });
            this.blinkCount++;
            this.lastBlinkTime = 0;
            
            // Maintain blink history (last 60s)
            const cutoff = Date.now() - 60000;
            this.blinkHistory = this.blinkHistory.filter(b => b.timestamp > cutoff);
        }
        
        // Calculate blink rate (per minute)
        const sessionDuration = (Date.now() - this.sessionStartTime) / 1000 / 60; // minutes
        const blinkRate = sessionDuration > 0 ? this.blinkCount / sessionDuration : 0;
        
        // Prolonged eye closure detection
        const prolongedClosure = this.lastBlinkTime > 0 && 
            (Date.now() - this.lastBlinkTime) > 1000; // > 1 second
        
        // Blink suppression (very low blink rate)
        const blinkSuppression = blinkRate < 8; // Normal is ~15-20/min
        
        return {
            ear_left: leftEAR,
            ear_right: rightEAR,
            ear_mean: earMean,
            ear_variance: earVariance,
            is_blinking: isBlinking,
            blink_rate: Math.round(blinkRate * 10) / 10,
            blink_duration: this.lastBlinkTime > 0 ? Date.now() - this.lastBlinkTime : 0,
            prolonged_closure: prolongedClosure,
            blink_suppression: blinkSuppression
        };
    }
    
    calculateEAR(top, bottom, left, right) {
        const vertical1 = this.distance(top, bottom);
        const vertical2 = this.distance(left, right);
        const horizontal = this.distance(left, right);
        
        // EAR = average of two vertical distances / horizontal distance
        return ((vertical1 + vertical2) / 2) / horizontal;
    }
    
    // 2. Face Geometry Features
    extractFaceGeometry(landmarks) {
        // Jaw openness ratio
        const lowerLip = landmarks[LANDMARKS.LOWER_LIP];
        const chin = landmarks[LANDMARKS.CHIN];
        const forehead = landmarks[LANDMARKS.FOREHEAD];
        
        const jawDistance = this.distance(lowerLip, chin);
        const faceHeight = this.distance(forehead, chin);
        const jawOpennessRatio = faceHeight > 0 ? jawDistance / faceHeight : 0;
        
        // Jaw tension proxy (variance of jaw landmarks over time)
        const jawTension = this.calculateJawTension(landmarks);
        
        // Lip compression ratio
        const upperLip = landmarks[LANDMARKS.UPPER_LIP];
        const lipDistance = this.distance(upperLip, lowerLip);
        const mouthWidth = this.distance(
            landmarks[LANDMARKS.MOUTH_LEFT],
            landmarks[LANDMARKS.MOUTH_RIGHT]
        );
        const lipCompressionRatio = mouthWidth > 0 ? lipDistance / mouthWidth : 0;
        
        // Brow furrow
        const browDistance = this.distance(
            landmarks[LANDMARKS.LEFT_INNER_BROW],
            landmarks[LANDMARKS.RIGHT_INNER_BROW]
        );
        
        // Facial asymmetry
        const asymmetry = this.calculateFacialAsymmetry(landmarks);
        
        return {
            jaw_openness_ratio: jawOpennessRatio,
            jaw_tension: jawTension,
            lip_compression_ratio: lipCompressionRatio,
            brow_furrow: browDistance,
            facial_asymmetry: asymmetry
        };
    }
    
    calculateJawTension(landmarks) {
        if (this.frameHistory.length < 10) return 0;
        
        // Get recent jaw positions
        const recentJaws = this.frameHistory.slice(-30).map(frame => {
            const leftJaw = frame.landmarks[LANDMARKS.LEFT_JAW];
            const rightJaw = frame.landmarks[LANDMARKS.RIGHT_JAW];
            return {
                x: (leftJaw.x + rightJaw.x) / 2,
                y: (leftJaw.y + rightJaw.y) / 2
            };
        });
        
        // Calculate variance
        const meanX = recentJaws.reduce((sum, p) => sum + p.x, 0) / recentJaws.length;
        const meanY = recentJaws.reduce((sum, p) => sum + p.y, 0) / recentJaws.length;
        
        const variance = recentJaws.reduce((sum, p) => {
            return sum + Math.pow(p.x - meanX, 2) + Math.pow(p.y - meanY, 2);
        }, 0) / recentJaws.length;
        
        // Low variance = clenched (high tension)
        // Normalize to 0-1 scale
        return Math.min(1, variance * 1000);
    }
    
    calculateFacialAsymmetry(landmarks) {
        // Compare left and right side landmarks
        const leftPoints = [
            landmarks[LANDMARKS.LEFT_EYE_LEFT],
            landmarks[LANDMARKS.LEFT_JAW],
            landmarks[LANDMARKS.LEFT_FACE]
        ];
        
        const rightPoints = [
            landmarks[LANDMARKS.RIGHT_EYE_RIGHT],
            landmarks[LANDMARKS.RIGHT_JAW],
            landmarks[LANDMARKS.RIGHT_FACE]
        ];
        
        // Calculate average deviation
        let totalDeviation = 0;
        for (let i = 0; i < leftPoints.length; i++) {
            const leftY = leftPoints[i].y;
            const rightY = rightPoints[i].y;
            totalDeviation += Math.abs(leftY - rightY);
        }
        
        return totalDeviation / leftPoints.length;
    }
    
    // 3. Mouth & Speech Features
    extractMouthFeatures(landmarks) {
        const upperLip = landmarks[LANDMARKS.UPPER_LIP];
        const lowerLip = landmarks[LANDMARKS.LOWER_LIP];
        const mouthOpenness = this.distance(upperLip, lowerLip);
        
        // Store in history for movement frequency
        this.mouthOpenHistory.push({
            timestamp: Date.now(),
            openness: mouthOpenness
        });
        
        // Maintain window
        const cutoff = Date.now() - 2000; // 2 seconds
        this.mouthOpenHistory = this.mouthOpenHistory.filter(m => m.timestamp > cutoff);
        
        // Mouth movement frequency
        const movementFrequency = this.calculateMouthMovementFrequency();
        
        // Speaking likelihood (rapid open/close cycles)
        const speaking = this.detectSpeaking(mouthOpenness);
        
        // Speech suppression (mouth still while face tense)
        const speechSuppression = this.detectSpeechSuppression();
        
        return {
            mouth_openness: mouthOpenness,
            mouth_movement_frequency: movementFrequency,
            speaking: speaking,
            speech_suppression: speechSuppression
        };
    }
    
    calculateMouthMovementFrequency() {
        if (this.mouthOpenHistory.length < 2) return 0;
        
        // Count significant changes
        let changes = 0;
        const threshold = 0.01; // Minimum change to count
        
        for (let i = 1; i < this.mouthOpenHistory.length; i++) {
            const change = Math.abs(
                this.mouthOpenHistory[i].openness - 
                this.mouthOpenHistory[i-1].openness
            );
            if (change > threshold) {
                changes++;
            }
        }
        
        // Frequency per second
        const timeSpan = (this.mouthOpenHistory[this.mouthOpenHistory.length - 1].timestamp - 
                         this.mouthOpenHistory[0].timestamp) / 1000;
        return timeSpan > 0 ? changes / timeSpan : 0;
    }
    
    detectSpeaking(mouthOpenness) {
        // Rapid open/close cycles indicate speaking
        if (this.mouthOpenHistory.length < 10) return false;
        
        const recent = this.mouthOpenHistory.slice(-10);
        const avgOpenness = recent.reduce((sum, m) => sum + m.openness, 0) / recent.length;
        
        // Check for oscillations around threshold
        const threshold = this.speakingThreshold;
        let oscillations = 0;
        
        for (let i = 1; i < recent.length; i++) {
            const prevAbove = recent[i-1].openness > threshold;
            const currAbove = recent[i].openness > threshold;
            if (prevAbove !== currAbove) {
                oscillations++;
            }
        }
        
        return oscillations >= 3 && avgOpenness > threshold * 0.5;
    }
    
    detectSpeechSuppression() {
        if (this.frameHistory.length < 30) return false;
        
        const recent = this.frameHistory.slice(-30);
        const avgMouthMovement = recent.reduce((sum, f) => 
            sum + (f.features?.mouth_movement_frequency || 0), 0) / recent.length;
        
        const avgJawTension = recent.reduce((sum, f) => 
            sum + (f.features?.jaw_tension || 0), 0) / recent.length;
        
        // Low mouth movement + high tension = suppression
        return avgMouthMovement < 0.5 && avgJawTension > 0.6;
    }
    
    // 4. Head & Posture Features
    extractHeadFeatures(landmarks) {
        // Calculate head pose angles (simplified)
        const noseTip = landmarks[LANDMARKS.NOSE_TIP];
        const noseBase = landmarks[LANDMARKS.NOSE_BASE];
        const forehead = landmarks[LANDMARKS.FOREHEAD];
        const chin = landmarks[LANDMARKS.CHIN];
        
        // Pitch (nodding up/down)
        const pitch = Math.atan2(
            noseTip.y - noseBase.y,
            Math.abs(noseTip.z - noseBase.z) || 0.001
        ) * (180 / Math.PI);
        
        // Yaw (turning left/right) - simplified
        const leftFace = landmarks[LANDMARKS.LEFT_FACE];
        const rightFace = landmarks[LANDMARKS.RIGHT_FACE];
        const yaw = Math.atan2(
            (leftFace.x + rightFace.x) / 2 - noseTip.x,
            Math.abs(leftFace.z - rightFace.z) || 0.001
        ) * (180 / Math.PI);
        
        // Roll (tilting)
        const roll = Math.atan2(
            rightFace.y - leftFace.y,
            rightFace.x - leftFace.x
        ) * (180 / Math.PI);
        
        // Store head pose history
        this.headPoseHistory.push({
            timestamp: Date.now(),
            pitch, yaw, roll,
            position: { x: noseTip.x, y: noseTip.y, z: noseTip.z }
        });
        
        // Maintain window
        const cutoff = Date.now() - 5000; // 5 seconds
        this.headPoseHistory = this.headPoseHistory.filter(h => h.timestamp > cutoff);
        
        // Head micro-movement variance
        const headMotion = this.calculateHeadMotionVariance();
        
        // Forward head drift
        const forwardDrift = this.calculateForwardDrift();
        
        // Stillness duration
        const stillnessDuration = this.calculateStillnessDuration();
        
        return {
            head_pitch: pitch,
            head_yaw: yaw,
            head_roll: roll,
            head_motion: headMotion,
            forward_drift: forwardDrift,
            stillness_duration: stillnessDuration
        };
    }
    
    calculateHeadMotionVariance() {
        if (this.headPoseHistory.length < 10) return 'low';
        
        const recent = this.headPoseHistory.slice(-30);
        const positions = recent.map(h => h.position);
        
        const meanX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
        const meanY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
        const meanZ = positions.reduce((sum, p) => sum + p.z, 0) / positions.length;
        
        const variance = positions.reduce((sum, p) => {
            return sum + Math.pow(p.x - meanX, 2) + 
                   Math.pow(p.y - meanY, 2) + 
                   Math.pow(p.z - meanZ, 2);
        }, 0) / positions.length;
        
        if (variance < 0.0001) return 'low';
        if (variance < 0.001) return 'medium';
        return 'high';
    }
    
    calculateForwardDrift() {
        if (this.headPoseHistory.length < 60) return 0;
        
        const recent = this.headPoseHistory.slice(-60);
        const oldZ = recent[0].position.z;
        const newZ = recent[recent.length - 1].position.z;
        
        // Positive = forward drift
        return newZ - oldZ;
    }
    
    calculateStillnessDuration() {
        if (this.headPoseHistory.length < 2) return 0;
        
        const recent = this.headPoseHistory.slice(-30);
        const positions = recent.map(h => h.position);
        
        // Check if positions are stable
        const threshold = 0.01;
        let stillFrames = 0;
        
        for (let i = 1; i < positions.length; i++) {
            const dist = Math.sqrt(
                Math.pow(positions[i].x - positions[i-1].x, 2) +
                Math.pow(positions[i].y - positions[i-1].y, 2) +
                Math.pow(positions[i].z - positions[i-1].z, 2)
            );
            if (dist < threshold) {
                stillFrames++;
            }
        }
        
        // Convert to seconds (assuming 30fps)
        return stillFrames / 30;
    }
    
    // 5. Breathing Features
    extractBreathingFeatures(landmarks) {
        const noseTip = landmarks[LANDMARKS.NOSE_TIP];
        
        // Store nose position
        this.nosePositions.push({
            timestamp: Date.now(),
            y: noseTip.y
        });
        
        // Maintain breathing window (10-20s)
        const cutoff = Date.now() - 20000; // 20 seconds
        this.nosePositions = this.nosePositions.filter(n => n.timestamp > cutoff);
        
        if (this.nosePositions.length < 30) {
            return {
                breathing_rate: 0,
                breathing_amplitude: 'unknown',
                breathing_regularity: 0,
                breath_holding: false
            };
        }
        
        // Extract breathing rate using frequency analysis
        const breathingRate = this.calculateBreathingRate();
        
        // Breathing amplitude
        const breathingAmplitude = this.calculateBreathingAmplitude();
        
        // Breathing regularity
        const breathingRegularity = this.calculateBreathingRegularity();
        
        // Micro breath-holding detection
        const breathHolding = this.detectBreathHolding();
        
        return {
            breathing_rate: breathingRate,
            breathing_amplitude: breathingAmplitude,
            breathing_regularity: breathingRegularity,
            breath_holding: breathHolding
        };
    }
    
    calculateBreathingRate() {
        if (this.nosePositions.length < 60) return 0;
        
        // Simple peak detection
        const values = this.nosePositions.map(n => n.y);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        
        let peaks = 0;
        let inPeak = false;
        const threshold = 0.0005; // Minimum deviation to count as peak
        
        for (let i = 1; i < values.length - 1; i++) {
            const isPeak = values[i] > values[i-1] && values[i] > values[i+1] && 
                          values[i] > mean + threshold;
            
            if (isPeak && !inPeak) {
                peaks++;
                inPeak = true;
            } else if (values[i] < mean) {
                inPeak = false;
            }
        }
        
        // Convert to breaths per minute
        const timeSpan = (this.nosePositions[this.nosePositions.length - 1].timestamp - 
                         this.nosePositions[0].timestamp) / 1000 / 60; // minutes
        return timeSpan > 0 ? Math.round(peaks / timeSpan) : 0;
    }
    
    calculateBreathingAmplitude() {
        if (this.nosePositions.length < 10) return 'unknown';
        
        const values = this.nosePositions.map(n => n.y);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const amplitude = max - min;
        
        if (amplitude < 0.001) return 'low';
        if (amplitude < 0.003) return 'medium';
        return 'high';
    }
    
    calculateBreathingRegularity() {
        if (this.nosePositions.length < 60) return 0;
        
        // Calculate variance of inter-peak intervals
        const values = this.nosePositions.map(n => n.y);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        
        const peaks = [];
        for (let i = 1; i < values.length - 1; i++) {
            if (values[i] > values[i-1] && values[i] > values[i+1] && values[i] > mean) {
                peaks.push(this.nosePositions[i].timestamp);
            }
        }
        
        if (peaks.length < 2) return 0;
        
        const intervals = [];
        for (let i = 1; i < peaks.length; i++) {
            intervals.push(peaks[i] - peaks[i-1]);
        }
        
        const meanInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
        const variance = intervals.reduce((sum, i) => 
            sum + Math.pow(i - meanInterval, 2), 0) / intervals.length;
        
        // Normalize to 0-1 (lower variance = more regular)
        const cv = meanInterval > 0 ? Math.sqrt(variance) / meanInterval : 1;
        return Math.max(0, 1 - cv);
    }
    
    detectBreathHolding() {
        if (this.nosePositions.length < 30) return false;
        
        const recent = this.nosePositions.slice(-30);
        const values = recent.map(n => n.y);
        const variance = this.calculateVariance(values);
        
        // Very low variance = breath holding
        return variance < 0.000001;
    }
    
    // 6. Temporal Stability Features
    extractTemporalFeatures() {
        if (this.frameHistory.length < 10) {
            return {
                facial_variance: 0,
                ear_rate_of_change: 0,
                recovery_time: 0,
                trend_slope: 0,
                baseline_deviation: 0
            };
        }
        
        // Rolling window features (5-30s)
        const windowSize = Math.min(150, this.frameHistory.length); // 5s at 30fps
        const recent = this.frameHistory.slice(-windowSize);
        
        // Variance of facial landmarks
        const facialVariance = this.calculateFacialVariance(recent);
        
        // Rate of change of EAR
        const earRateOfChange = this.calculateEARRateOfChange(recent);
        
        // Recovery time after perturbation (simplified)
        const recoveryTime = this.calculateRecoveryTime();
        
        // Trend slopes
        const trendSlope = this.calculateTrendSlope(recent);
        
        // Baseline deviation
        const baselineDeviation = this.calculateBaselineDeviation();
        
        return {
            facial_variance: facialVariance,
            ear_rate_of_change: earRateOfChange,
            recovery_time: recoveryTime,
            trend_slope: trendSlope,
            baseline_deviation: baselineDeviation
        };
    }
    
    calculateFacialVariance(frames) {
        if (frames.length < 2) return 0;
        
        // Calculate variance of key landmark positions
        const keyLandmarks = [
            LANDMARKS.NOSE_TIP,
            LANDMARKS.LEFT_EYE_LEFT,
            LANDMARKS.RIGHT_EYE_RIGHT,
            LANDMARKS.MOUTH_LEFT,
            LANDMARKS.MOUTH_RIGHT
        ];
        
        let totalVariance = 0;
        for (const landmarkIdx of keyLandmarks) {
            const positions = frames.map(f => f.landmarks[landmarkIdx]);
            const xs = positions.map(p => p.x);
            const ys = positions.map(p => p.y);
            
            totalVariance += this.calculateVariance(xs);
            totalVariance += this.calculateVariance(ys);
        }
        
        return totalVariance / (keyLandmarks.length * 2);
    }
    
    calculateEARRateOfChange(frames) {
        if (frames.length < 2) return 0;
        
        const ears = frames.map(f => f.features?.ear_mean || 0).filter(e => e > 0);
        if (ears.length < 2) return 0;
        
        const changes = [];
        for (let i = 1; i < ears.length; i++) {
            changes.push(Math.abs(ears[i] - ears[i-1]));
        }
        
        return changes.reduce((sum, c) => sum + c, 0) / changes.length;
    }
    
    calculateRecoveryTime() {
        // Simplified: time since last significant change
        if (this.frameHistory.length < 30) return 0;
        
        const recent = this.frameHistory.slice(-30);
        const ears = recent.map(f => f.features?.ear_mean || 0);
        
        // Find last significant change
        const threshold = 0.05;
        for (let i = ears.length - 1; i > 0; i--) {
            if (Math.abs(ears[i] - ears[i-1]) > threshold) {
                return (recent[recent.length - 1].timestamp - recent[i].timestamp) / 1000;
            }
        }
        
        return 0;
    }
    
    calculateTrendSlope(frames) {
        if (frames.length < 10) return 0;
        
        const ears = frames.map(f => f.features?.ear_mean || 0).filter(e => e > 0);
        if (ears.length < 2) return 0;
        
        // Simple linear regression
        const n = ears.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const sumX = x.reduce((sum, xi) => sum + xi, 0);
        const sumY = ears.reduce((sum, yi) => sum + yi, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * ears[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }
    
    establishBaseline() {
        if (this.frameHistory.length < this.baselineWindow) return;
        
        this.baselineData = this.frameHistory.slice(0, this.baselineWindow).map(f => f.features);
        this.baselineEstablished = true;
    }
    
    calculateBaselineDeviation() {
        if (!this.baselineEstablished || this.frameHistory.length < 10) return 0;
        
        const current = this.frameHistory.slice(-10).map(f => f.features);
        const baselineEars = this.baselineData.map(f => f.ear_mean || 0).filter(e => e > 0);
        const currentEars = current.map(f => f.ear_mean || 0).filter(e => e > 0);
        
        if (baselineEars.length === 0 || currentEars.length === 0) return 0;
        
        const baselineMean = baselineEars.reduce((sum, e) => sum + e, 0) / baselineEars.length;
        const currentMean = currentEars.reduce((sum, e) => sum + e, 0) / currentEars.length;
        
        return Math.abs(currentMean - baselineMean) / baselineMean;
    }
    
    // 7. Derived Analyzer Features
    extractDerivedFeatures() {
        if (!this.currentFeatures) {
            return {
                arousal_proxy: 0,
                cognitive_load: 0,
                dysregulation: 0,
                mismatch_detected: false
            };
        }
        
        // Arousal proxies
        const arousalProxy = this.calculateArousalProxy();
        
        // Cognitive load
        const cognitiveLoad = this.calculateCognitiveLoad();
        
        // Dysregulation
        const dysregulation = this.calculateDysregulation();
        
        // Mismatch detection
        const mismatchDetected = this.detectMismatch();
        
        return {
            arousal_proxy: arousalProxy,
            cognitive_load: cognitiveLoad,
            dysregulation: dysregulation,
            mismatch_detected: mismatchDetected
        };
    }
    
    calculateArousalProxy() {
        if (this.frameHistory.length < 30) return 0;
        
        const recent = this.frameHistory.slice(-30);
        const avgBlinkSuppression = recent.reduce((sum, f) => 
            sum + (f.features?.blink_suppression ? 1 : 0), 0) / recent.length;
        const avgJawTension = recent.reduce((sum, f) => 
            sum + (f.features?.jaw_tension || 0), 0) / recent.length;
        const avgHeadStillness = recent.reduce((sum, f) => 
            sum + (f.features?.head_motion === 'low' ? 1 : 0), 0) / recent.length;
        const avgBreathingShallow = recent.reduce((sum, f) => 
            sum + (f.features?.breathing_amplitude === 'low' ? 1 : 0), 0) / recent.length;
        
        // Combine signals
        return (avgBlinkSuppression * 0.3 + avgJawTension * 0.3 + 
                avgHeadStillness * 0.2 + avgBreathingShallow * 0.2);
    }
    
    calculateCognitiveLoad() {
        if (this.frameHistory.length < 30) return 0;
        
        const recent = this.frameHistory.slice(-30);
        const avgFacialVariance = recent.reduce((sum, f) => 
            sum + (f.features?.facial_variance || 0), 0) / recent.length;
        const avgBlinkSuppression = recent.reduce((sum, f) => 
            sum + (f.features?.blink_suppression ? 1 : 0), 0) / recent.length;
        const avgPostureStable = recent.reduce((sum, f) => 
            sum + (f.features?.stillness_duration > 1 ? 1 : 0), 0) / recent.length;
        
        // Low variance + suppressed blinking + stable posture = high load
        const lowVariance = avgFacialVariance < 0.01 ? 1 : 0;
        return (lowVariance * 0.4 + avgBlinkSuppression * 0.4 + avgPostureStable * 0.2);
    }
    
    calculateDysregulation() {
        if (this.frameHistory.length < 30) return 0;
        
        const recent = this.frameHistory.slice(-30);
        const avgBreathingIrregular = recent.reduce((sum, f) => 
            sum + (f.features?.breathing_regularity || 0), 0) / recent.length;
        const avgJawClenching = recent.reduce((sum, f) => 
            sum + (f.features?.jaw_tension || 0), 0) / recent.length;
        const avgFacialRigidity = recent.reduce((sum, f) => 
            sum + (f.features?.facial_variance || 0), 0) / recent.length;
        
        // Irregular breathing + jaw clenching + facial rigidity
        const irregularBreathing = 1 - avgBreathingIrregular; // Invert regularity
        const highJawTension = avgJawClenching > 0.7 ? 1 : 0;
        const highRigidity = avgFacialRigidity < 0.005 ? 1 : 0;
        
        return (irregularBreathing * 0.4 + highJawTension * 0.3 + highRigidity * 0.3);
    }
    
    detectMismatch() {
        if (this.frameHistory.length < 30) return false;
        
        const recent = this.frameHistory.slice(-30);
        const avgSpeaking = recent.reduce((sum, f) => 
            sum + (f.features?.speaking ? 1 : 0), 0) / recent.length;
        const avgTension = recent.reduce((sum, f) => 
            sum + (f.features?.jaw_tension || 0), 0) / recent.length;
        const avgFacialCalm = recent.reduce((sum, f) => 
            sum + (f.features?.facial_variance || 0), 0) / recent.length;
        const avgPhysiologicalAccel = recent.reduce((sum, f) => 
            sum + (f.features?.breathing_rate || 0), 0) / recent.length;
        
        // Mismatch 1: Speaking + rising tension
        const mismatch1 = avgSpeaking > 0.5 && avgTension > 0.6;
        
        // Mismatch 2: Calm face + physiological acceleration
        const mismatch2 = avgFacialCalm < 0.01 && avgPhysiologicalAccel > 25;
        
        return mismatch1 || mismatch2;
    }
    
    // Utility functions
    distance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        const dz = (point1.z || 0) - (point2.z || 0);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    calculateVariance(values) {
        if (values.length === 0) return 0;
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        return variance;
    }
    
    // Output schema (as specified)
    getOutputSchema() {
        if (!this.currentFeatures) return null;
        
        const f = this.currentFeatures;
        return {
            blink_rate: Math.round(f.blink_rate || 0),
            ear_mean: Math.round((f.ear_mean || 0) * 100) / 100,
            jaw_tension: Math.round((f.jaw_tension || 0) * 100) / 100,
            breathing_rate: Math.round(f.breathing_rate || 0),
            breathing_amplitude: f.breathing_amplitude || 'unknown',
            facial_variance: Math.round((f.facial_variance || 0) * 100) / 100,
            speaking: f.speaking || false,
            head_motion: f.head_motion || 'unknown',
            timestamp: Math.floor(f.timestamp / 1000)
        };
    }
    
    updateUI(features) {
        // Update eye features
        const eyeDiv = document.getElementById('eye-features');
        eyeDiv.innerHTML = `
            <div class="feature-item">
                <span class="feature-label">Blink Rate:</span>
                <span class="feature-value">${Math.round(features.blink_rate || 0)}/min</span>
            </div>
            <div class="feature-item">
                <span class="feature-label">EAR Mean:</span>
                <span class="feature-value">${(features.ear_mean || 0).toFixed(3)}</span>
            </div>
            <div class="feature-item">
                <span class="feature-label">Blink Suppression:</span>
                <span class="feature-value">${features.blink_suppression ? 'Yes' : 'No'}</span>
            </div>
        `;
        
        // Update face features
        const faceDiv = document.getElementById('face-features');
        faceDiv.innerHTML = `
            <div class="feature-item">
                <span class="feature-label">Jaw Tension:</span>
                <span class="feature-value">${(features.jaw_tension || 0).toFixed(3)}</span>
            </div>
            <div class="feature-item">
                <span class="feature-label">Jaw Openness:</span>
                <span class="feature-value">${(features.jaw_openness_ratio || 0).toFixed(3)}</span>
            </div>
            <div class="feature-item">
                <span class="feature-label">Facial Asymmetry:</span>
                <span class="feature-value">${(features.facial_asymmetry || 0).toFixed(4)}</span>
            </div>
        `;
        
        // Update mouth features
        const mouthDiv = document.getElementById('mouth-features');
        mouthDiv.innerHTML = `
            <div class="feature-item">
                <span class="feature-label">Speaking:</span>
                <span class="feature-value">${features.speaking ? 'Yes' : 'No'}</span>
            </div>
            <div class="feature-item">
                <span class="feature-label">Mouth Openness:</span>
                <span class="feature-value">${(features.mouth_openness || 0).toFixed(4)}</span>
            </div>
            <div class="feature-item">
                <span class="feature-label">Movement Freq:</span>
                <span class="feature-value">${(features.mouth_movement_frequency || 0).toFixed(2)}/s</span>
            </div>
        `;
        
        // Update head features
        const headDiv = document.getElementById('head-features');
        headDiv.innerHTML = `
            <div class="feature-item">
                <span class="feature-label">Head Motion:</span>
                <span class="feature-value">${features.head_motion || 'unknown'}</span>
            </div>
            <div class="feature-item">
                <span class="feature-label">Pitch:</span>
                <span class="feature-value">${Math.round(features.head_pitch || 0)}°</span>
            </div>
            <div class="feature-item">
                <span class="feature-label">Yaw:</span>
                <span class="feature-value">${Math.round(features.head_yaw || 0)}°</span>
            </div>
        `;
        
        // Update breathing features
        const breathingDiv = document.getElementById('breathing-features');
        breathingDiv.innerHTML = `
            <div class="feature-item">
                <span class="feature-label">Breathing Rate:</span>
                <span class="feature-value">${Math.round(features.breathing_rate || 0)}/min</span>
            </div>
            <div class="feature-item">
                <span class="feature-label">Amplitude:</span>
                <span class="feature-value">${features.breathing_amplitude || 'unknown'}</span>
            </div>
            <div class="feature-item">
                <span class="feature-label">Regularity:</span>
                <span class="feature-value">${(features.breathing_regularity || 0).toFixed(2)}</span>
            </div>
        `;
        
        // Update derived features
        const derivedDiv = document.getElementById('derived-features');
        derivedDiv.innerHTML = `
            <div class="feature-item">
                <span class="feature-label">Arousal Proxy:</span>
                <span class="feature-value">${(features.arousal_proxy || 0).toFixed(2)}</span>
            </div>
            <div class="feature-item">
                <span class="feature-label">Cognitive Load:</span>
                <span class="feature-value">${(features.cognitive_load || 0).toFixed(2)}</span>
            </div>
            <div class="feature-item">
                <span class="feature-label">Dysregulation:</span>
                <span class="feature-value">${(features.dysregulation || 0).toFixed(2)}</span>
            </div>
            <div class="feature-item">
                <span class="feature-label">Mismatch:</span>
                <span class="feature-value">${features.mismatch_detected ? 'Yes' : 'No'}</span>
            </div>
        `;
        
        // Update JSON output
        const output = this.getOutputSchema();
        if (output) {
            document.getElementById('json-output').textContent = 
                JSON.stringify(output, null, 2);
        }
    }
}

// Initialize
const extractor = new FeatureExtractor();

document.getElementById('startBtn').addEventListener('click', () => {
    extractor.startCamera();
});

document.getElementById('stopBtn').addEventListener('click', () => {
    extractor.stopCamera();
});
