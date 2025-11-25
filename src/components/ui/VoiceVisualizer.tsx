import React, { useRef, useEffect } from 'react';

interface Props { analyser: AnalyserNode | null; isActive: boolean; }

export const VoiceVisualizer: React.FC<Props> = ({ analyser, isActive }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !analyser) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let animationId: number;

        const draw = () => {
            animationId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 3;
            ctx.strokeStyle = isActive ? '#6366f1' : '#4b5563';
            ctx.shadowBlur = isActive ? 10 : 0;
            ctx.shadowColor = '#6366f1';
            ctx.beginPath();

            const sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = isActive ? (canvas.height / 2) + Math.sin(i * 0.2) * (dataArray[i] / 3) : canvas.height / 2;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                x += sliceWidth;
            }
            ctx.stroke();
        };
        draw();
        return () => cancelAnimationFrame(animationId);
    }, [analyser, isActive]);

    return <canvas ref={canvasRef} width={200} height={40} className="w-full h-full" />;
};