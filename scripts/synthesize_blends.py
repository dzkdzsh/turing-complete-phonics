#!/usr/bin/env python3
"""
Coarticulation-Aware Phoneme Concatenation Engine

Based on: plan/combine.md

Pipeline:
  Input WAVs → WORLD Analysis → LPC Analysis → Stable Region Detection
  → Coarticulation Trajectory → WORLD Synthesis → Concatenation → Output WAV
"""

import sys
import os
import numpy as np
import pyworld as pw
import soundfile as sf
from scipy.signal import lfilter, freqz
from scipy.interpolate import CubicSpline

# ── Configuration ──────────────────────────────────────────────

FS = 16000                    # Target sample rate (16kHz)
FRAME_PERIOD = 5.0            # WORLD frame period in ms
TRANSITION_MS = 80            # Duration of synthesized transition (ms)
STABLE_WINDOW_MS = 100        # How much stable audio to keep from each side (ms)
NASAL_PHONEMES = {'m', 'n', 'ng'}
CORE_KEEP_MS = 250            # Max core audio to keep (after trimming silence)

# ── Phase 1: WORLD Analysis ───────────────────────────────────

def world_analyze(wav, fs):
    """Extract F0, spectral envelope, and aperiodicity using WORLD."""
    # Convert to float64 as required by pyworld
    x = wav.astype(np.float64)

    # F0 estimation
    f0, t = pw.harvest(x, fs, frame_period=FRAME_PERIOD)

    # Spectral envelope
    sp = pw.cheaptrick(x, f0, t, fs)

    # Aperiodicity
    ap = pw.d4c(x, f0, t, fs)

    return {
        'waveform': x,
        'fs': fs,
        'f0': f0,
        'sp': sp,        # spectral envelope [n_frames, fft_size//2+1]
        'ap': ap,         # aperiodicity [n_frames, fft_size//2+1]
        't': t,
    }


# ── Phase 2: LPC Analysis ─────────────────────────────────────

def lpc_analysis(wav, fs, order=20):
    """
    Extract LPC coefficients per frame.
    Returns LPC spectral envelopes reshaped to match WORLD sp dimensions.
    """
    frame_len = int(fs * FRAME_PERIOD / 1000)
    hop_len = frame_len
    n_frames = (len(wav) - frame_len) // hop_len + 1

    if n_frames <= 0:
        return None

    # WORLD sp has fft_size//2+1 bins
    fft_size = 1024
    lpc_envs = np.zeros((n_frames, fft_size // 2 + 1))

    for i in range(n_frames):
        start = i * hop_len
        frame = wav[start:start + frame_len]

        if len(frame) < order:
            continue

        # Autocorrelation method for LPC
        r = np.correlate(frame, frame, mode='full')
        r = r[len(r)//2:]  # Positive lags only

        # Levinson-Durbin recursion via scipy
        from scipy.linalg import solve_toeplitz
        R = r[:order]
        r_vec = r[1:order+1]

        try:
            a = solve_toeplitz(R, -r_vec)
            # Prepend a[0] = 1
            a_full = np.concatenate([[1.0], a])

            # Compute frequency response of LPC filter
            w, h = freqz(1.0, a_full, worN=fft_size // 2 + 1, fs=fs)
            # Convert to dB magnitude
            mag = 20 * np.log10(np.abs(h) + 1e-10)
            # Normalize
            mag = mag - np.max(mag) + 60
            mag = np.maximum(mag, 0)
            lpc_envs[i, :] = mag
        except np.linalg.LinAlgError:
            lpc_envs[i, :] = lpc_envs[i-1, :] if i > 0 else np.zeros(fft_size // 2 + 1)

    return lpc_envs


# ── Phase 3: Stable Region Detection ──────────────────────────

def find_stable_region(features):
    """Find stable (sustained) portion of phoneme based on RMS energy."""
    wav = features['waveform']
    frame_len = int(features['fs'] * FRAME_PERIOD / 1000)
    hop_len = frame_len

    rms = []
    for i in range(0, len(wav) - frame_len, hop_len):
        frame = wav[i:i + frame_len]
        rms.append(np.sqrt(np.mean(frame ** 2)))

    if not rms:
        return 0, len(wav)

    rms = np.array(rms)
    threshold = 0.3 * np.max(rms)
    active = np.where(rms > threshold)[0]

    if len(active) == 0:
        return 0, len(wav)

    start_frame = active[0]
    end_frame = active[-1]

    start_sample = start_frame * hop_len
    end_sample = min((end_frame + 1) * hop_len, len(wav))

    return start_sample, end_sample


def extract_transition_region(features, is_source):
    """
    Extract the transition-relevant portion of a phoneme.
    For source (e.g., /m/): use the last STABLE_WINDOW_MS of the stable region.
    For target (e.g., /e/): use the first STABLE_WINDOW_MS of the stable region.
    """
    wav = features['waveform']
    fs = features['fs']

    stable_start, stable_end = find_stable_region(features)
    window_samples = int(STABLE_WINDOW_MS / 1000 * fs)

    if is_source:
        # Last N ms of stable region
        start = max(stable_start, stable_end - window_samples)
        end = stable_end
    else:
        # First N ms of stable region
        start = stable_start
        end = min(stable_end, stable_start + window_samples)

    start = max(0, start)
    end = min(len(wav), end)

    # Ensure minimum length
    if end - start < fs * 0.01:
        mid = len(wav) // 2
        start = max(0, mid - window_samples // 2)
        end = min(len(wav), mid + window_samples // 2)

    return wav[start:end]


# ── Phase 4: Coarticulation Trajectory Generation ──────────────

def generate_coarticulation_trajectory(source_features, target_features, n_frames=30):
    """
    Generate WORLD parameters for transition frames using
    log-domain spectral interpolation + LPC constraint.
    """
    f0_s = source_features['f0']
    sp_s = source_features['sp']
    ap_s = source_features['ap']

    f0_t = target_features['f0']
    sp_t = target_features['sp']
    ap_t = target_features['ap']

    # Use last frames of source and first frames of target
    tail_frames = min(15, len(f0_s))
    head_frames = min(15, len(f0_t))

    # Get representative frames
    sp_s_end = sp_s[-tail_frames:, :] if tail_frames > 0 else sp_s
    sp_t_start = sp_t[:head_frames, :] if head_frames > 0 else sp_t

    # Average over the selected frames for stable representation
    sp_s_avg = np.mean(sp_s_end, axis=0)
    sp_t_avg = np.mean(sp_t_start, axis=0)

    f0_s_end = f0_s[-tail_frames:] if tail_frames > 0 else f0_s
    f0_t_start = f0_t[:head_frames] if head_frames > 0 else f0_t

    ap_s_end = ap_s[-tail_frames:, :] if tail_frames > 0 else ap_s
    ap_t_start = ap_t[:head_frames, :] if head_frames > 0 else ap_t

    # Generate transition frames
    transition_f0 = np.zeros(n_frames)
    transition_sp = np.zeros((n_frames, sp_s.shape[1]))
    transition_ap = np.zeros((n_frames, ap_s.shape[1]))

    for i in range(n_frames):
        alpha = i / (n_frames - 1) if n_frames > 1 else 0.5

        # ── F0 interpolation ──
        f0_s_val = np.mean(f0_s_end[f0_s_end > 0]) if np.any(f0_s_end > 0) else 0
        f0_t_val = np.mean(f0_t_start[f0_t_start > 0]) if np.any(f0_t_start > 0) else 0

        if f0_s_val > 0 and f0_t_val > 0:
            transition_f0[i] = (1 - alpha) * f0_s_val + alpha * f0_t_val
        elif f0_s_val > 0:
            transition_f0[i] = f0_s_val * (1 - alpha)
        elif f0_t_val > 0:
            transition_f0[i] = f0_t_val * alpha

        # ── Spectral envelope: LOG-domain interpolation ──
        # Avoid log(0) with small epsilon
        eps = 1e-8
        log_sp_s = np.log(sp_s_avg + eps)
        log_sp_t = np.log(sp_t_avg + eps)
        sp_interp = np.exp((1 - alpha) * log_sp_s + alpha * log_sp_t)
        transition_sp[i, :] = sp_interp

        # ── Aperiodicity interpolation (linear) ──
        ap_s_avg = np.mean(ap_s_end, axis=0)
        ap_t_avg = np.mean(ap_t_start, axis=0)
        transition_ap[i, :] = (1 - alpha) * ap_s_avg + alpha * ap_t_avg

    return transition_f0, transition_sp, transition_ap


# ── Phase 5: Nasal-to-Oral Transition ─────────────────────────

def apply_nasal_decay(source_phoneme, sp_transition, alpha_values):
    """
    For nasal → vowel transitions, apply exponential nasal decay
    to low-frequency spectral peaks.
    """
    if source_phoneme not in NASAL_PHONEMES:
        return sp_transition

    sp_modified = sp_transition.copy()
    for i, alpha in enumerate(alpha_values):
        nasal_factor = np.exp(-4 * alpha)
        # Attenuate low-frequency bins (approx 0-800 Hz for 16kHz, fft_size=1024)
        low_bins = int(800 / (FS / 1024))
        sp_modified[i, :low_bins] *= (1.0 - nasal_factor * 0.6)

    return sp_modified


# ── Phase 6: Formant Tracking ─────────────────────────────────

def constrain_formants_lpc(source_features, target_features, sp_transition, alpha_values):
    """
    Use LPC-derived formant estimates to constrain spectral envelope.
    For simplicity, use LPC spectra for low-frequency shaping.
    """
    sp_constrained = sp_transition.copy()

    # Extract LPC from stable ends of source and target
    fs = source_features['fs']
    wav_s = source_features['waveform']
    wav_t = target_features['waveform']

    # Get last stable frames of source and first of target
    stable_start_s, stable_end_s = find_stable_region(source_features)
    stable_start_t, stable_end_t = find_stable_region(target_features)

    tail_ms = int(50 / 1000 * fs)
    head_ms = int(50 / 1000 * fs)

    frame_s = wav_s[max(0, stable_end_s - tail_ms):stable_end_s]
    frame_t = wav_t[stable_start_t:min(len(wav_t), stable_start_t + head_ms)]

    if len(frame_s) < 20 or len(frame_t) < 20:
        return sp_constrained

    # Compute LPC for representative frames
    lpc_order = 20

    # Source LPC
    r_s = np.correlate(frame_s, frame_s, mode='full')
    r_s = r_s[len(r_s)//2:]
    from scipy.linalg import solve_toeplitz
    try:
        R_s = r_s[:lpc_order]
        r_vec_s = r_s[1:lpc_order+1]
        a_s = solve_toeplitz(R_s, -r_vec_s)
        a_s_full = np.concatenate([[1.0], a_s])
        w, h_s = freqz(1.0, a_s_full, worN=sp_transition.shape[1], fs=fs)
        mag_s = np.abs(h_s)
    except np.linalg.LinAlgError:
        return sp_constrained

    # Target LPC
    r_t = np.correlate(frame_t, frame_t, mode='full')
    r_t = r_t[len(r_t)//2:]
    try:
        R_t = r_t[:lpc_order]
        r_vec_t = r_t[1:lpc_order+1]
        a_t = solve_toeplitz(R_t, -r_vec_t)
        a_t_full = np.concatenate([[1.0], a_t])
        w, h_t = freqz(1.0, a_t_full, worN=sp_transition.shape[1], fs=fs)
        mag_t = np.abs(h_t)
    except np.linalg.LinAlgError:
        return sp_constrained

    # Blend LPC envelopes and fuse with WORLD envelope
    for i, alpha in enumerate(alpha_values):
        lpc_env = (1 - alpha) * mag_s + alpha * mag_t
        # Normalize LPC envelope
        lpc_env = lpc_env / (np.max(lpc_env) + 1e-8) * np.max(sp_transition[i, :])
        # Fuse: 70% WORLD + 30% LPC
        sp_constrained[i, :] = 0.7 * sp_transition[i, :] + 0.3 * lpc_env

    return sp_constrained


# ── Phase 7: WORLD Resynthesis ─────────────────────────────────

def synthesize_transition(f0, sp, ap, fs):
    """Generate transition audio segment using WORLD synthesis."""
    # Ensure valid inputs
    f0 = np.ascontiguousarray(f0, dtype=np.float64)
    sp = np.ascontiguousarray(sp, dtype=np.float64)
    ap = np.ascontiguousarray(ap, dtype=np.float64)

    # pyworld synthesize returns float64 samples
    y = pw.synthesize(f0, sp, ap, fs, frame_period=FRAME_PERIOD)
    return y.astype(np.float64)


# ── Phase 8: Final Assembly ────────────────────────────────────

def assemble_final(source_wav, transition_wav, target_wav, fs):
    """
    Concatenate: source_core + transition + target_core.
    No crossfade needed — the transition already contains the coarticulation.
    """
    # Trim to core lengths
    core_len = int(CORE_KEEP_MS / 1000 * fs)
    source_core = source_wav[:min(len(source_wav), core_len)]
    target_core = target_wav[:min(len(target_wav), core_len)]

    # Remove tails/heads that overlap with transition
    tail_cut = int(TRANSITION_MS * 0.4 / 1000 * fs)  # Remove 40% of transition from each side
    if len(source_core) > tail_cut:
        source_core = source_core[:-tail_cut]
    if len(target_core) > tail_cut:
        target_core = target_core[tail_cut:]

    # Concatenate
    output = np.concatenate([source_core, transition_wav, target_core])

    # Normalize to prevent clipping
    peak = np.max(np.abs(output))
    if peak > 0.95:
        output = output / peak * 0.95

    return output


# ── Main Pipeline ──────────────────────────────────────────────

def synthesize_blend(project_root, phoneme1, phoneme2, output_path, phoneme3=None):
    """
    Synthesize a blended phoneme sequence using WORLD coarticulation.
    Handles both 2-phoneme (ma, sa) and 3-phoneme (kat) blends.
    """
    base_dir = os.path.join(project_root, 'public', 'assets', 'audio', 'phonemes')
    phonemes = [phoneme1, phoneme2]
    if phoneme3:
        phonemes.append(phoneme3)

    print(f"\n{'='*60}")
    print(f"Synthesizing: {'+'.join(phonemes)} → {output_path}")
    print(f"{'='*60}")

    # ── Load and resample input WAVs ──
    features_list = []
    for phoneme in phonemes:
        wav_path = os.path.join(base_dir, f'{phoneme}.wav')
        if not os.path.exists(wav_path):
            print(f"  ERROR: Phoneme file not found: {wav_path}")
            return False

        wav, orig_fs = sf.read(wav_path)

        # Convert to mono
        if wav.ndim > 1:
            wav = wav[:, 0]

        # Resample to 16kHz if needed
        if orig_fs != FS:
            import scipy.signal
            duration = len(wav) / orig_fs
            new_len = int(duration * FS)
            wav = scipy.signal.resample(wav, new_len)

        # Normalize
        peak = np.max(np.abs(wav))
        if peak > 0:
            wav = wav / peak * 0.9

        print(f"  Loaded /{phoneme}/: {len(wav)} samples @ {orig_fs}Hz → {FS}Hz")

        # WORLD analysis
        features = world_analyze(wav, FS)
        features['phoneme'] = phoneme
        features_list.append(features)

    # ── Generate all transitions ──
    transitions = []
    for idx in range(len(phonemes) - 1):
        src = features_list[idx]
        tgt = features_list[idx + 1]
        pair_name = f"{src['phoneme']}+{tgt['phoneme']}"
        print(f"\n  Transition {idx+1}: {pair_name}")

        # Extract transition region audio
        src_core = extract_transition_region(src, is_source=True)
        tgt_core = extract_transition_region(tgt, is_source=False)
        print(f"    Source core: {len(src_core)} samples ({len(src_core)/FS*1000:.0f}ms)")
        print(f"    Target core: {len(tgt_core)} samples ({len(tgt_core)/FS*1000:.0f}ms)")

        # Generate coarticulation trajectory
        n_trans_frames = int(TRANSITION_MS / FRAME_PERIOD)
        f0_trans, sp_trans, ap_trans = generate_coarticulation_trajectory(
            src, tgt, n_frames=n_trans_frames
        )

        # Alpha values for nasal decay
        alpha_vals = np.linspace(0, 1, n_trans_frames)

        # Apply nasal decay if source is nasal
        sp_trans = apply_nasal_decay(src['phoneme'], sp_trans, alpha_vals)

        # Apply LPC formant constraint
        sp_trans = constrain_formants_lpc(src, tgt, sp_trans, alpha_vals)

        # Synthesize transition
        transition = synthesize_transition(f0_trans, sp_trans, ap_trans, FS)
        transitions.append(transition)
        print(f"    Transition: {len(transition)} samples ({len(transition)/FS*1000:.0f}ms)")

    # ── Assemble: phoneme[0] + transition(0→1) + phoneme[1] + ... + phoneme[N-1] ──
    n = len(features_list)
    output_segments = []
    tail_cut = int(TRANSITION_MS * 0.3 / 1000 * FS)
    head_cut = int(TRANSITION_MS * 0.3 / 1000 * FS)

    for idx in range(n):
        feat = features_list[idx]
        wav = feat['waveform'].copy()

        if idx == 0:
            # First phoneme: trim tail only
            if len(wav) > tail_cut:
                wav = wav[:-tail_cut]
            output_segments.append(wav)
        elif idx == n - 1:
            # Last phoneme: trim head only
            if len(wav) > head_cut:
                wav = wav[head_cut:]
            output_segments.append(wav)
        else:
            # Middle phoneme: trim both ends
            if len(wav) > head_cut + tail_cut:
                wav = wav[head_cut:-tail_cut]
            output_segments.append(wav)

        # Append transition after each phoneme except the last
        if idx < n - 1:
            output_segments.append(transitions[idx])

    # ── Final assembly: concatenate all segments ──
    full_output = np.concatenate(output_segments)

    # Normalize
    peak = np.max(np.abs(full_output))
    if peak > 0.95:
        full_output = full_output / peak * 0.95

    # Write output
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    sf.write(output_path, full_output, FS)
    print(f"\n  ✓ Written: {output_path} ({len(full_output)/FS:.2f}s, {len(full_output)} samples)")
    return True


# ── Entry Point ────────────────────────────────────────────────

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(project_root, 'public', 'assets', 'audio', 'blended')

    blends = [
        (['m', 'a'], 'ma.wav'),
        (['s', 'a'], 'sa.wav'),
        (['k', 'ae', 't'], 'kat.wav'),
    ]

    success = True
    for phoneme_list, filename in blends:
        output_path = os.path.join(output_dir, filename)
        if len(phoneme_list) == 2:
            ok = synthesize_blend(project_root, phoneme_list[0], phoneme_list[1], output_path)
        else:
            ok = synthesize_blend(project_root, phoneme_list[0], phoneme_list[1], output_path, phoneme_list[2])
        if not ok:
            success = False

    if success:
        print(f"\n{'='*60}")
        print("All blends synthesized successfully!")
        print(f"{'='*60}")
    else:
        print(f"\n{'='*60}")
        print("WARNING: Some blends failed!")
        print(f"{'='*60}")
        sys.exit(1)


if __name__ == '__main__':
    main()
