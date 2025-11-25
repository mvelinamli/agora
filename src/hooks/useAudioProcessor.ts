import { useEffect, useState } from 'react';

export const useAudioProcessor = () => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

    useEffect(() => {
        const initAudio = async () => {
            try {
                const rawStream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true },
                    video: false
                });
                setStream(rawStream);

                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const source = ctx.createMediaStreamSource(rawStream);
                const filter = ctx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.value = 100;

                const analyserNode = ctx.createAnalyser();
                analyserNode.fftSize = 256;

                source.connect(filter);
                filter.connect(analyserNode);
                setAnalyser(analyserNode);
            } catch (err) {
                console.error("Mikrofon hatası:", err);
            }
        };
        initAudio();
        return () => stream?.getTracks().forEach(track => track.stop());
    }, []);

    return { stream, analyser };
};