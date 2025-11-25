import { useCallback, useRef, useEffect } from 'react';

// NOT: Bu ses dosyalarını public/assets/sounds klasörüne koymalısın
const SOUNDS = {
    join: '/assets/sounds/join.mp3',
    leave: '/assets/sounds/leave.mp3',
    muteOn: '/assets/sounds/mute_on.mp3',
    muteOff: '/assets/sounds/mute_off.mp3',
    message: '/assets/sounds/notification.mp3',
};

export const useSoundFx = () => {
    const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

    useEffect(() => {
        Object.entries(SOUNDS).forEach(([key, path]) => {
            const audio = new Audio(path);
            audio.volume = 0.4;
            audioRefs.current.set(key, audio);
        });
    }, []);

    const play = useCallback((soundName: keyof typeof SOUNDS) => {
        const audio = audioRefs.current.get(soundName);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.warn("Ses hatası:", e));
        }
    }, []);

    return {
        playJoin: () => play('join'),
        playLeave: () => play('leave'),
        playMute: (isMuted: boolean) => play(isMuted ? 'muteOn' : 'muteOff'),
        playMessage: () => play('message'),
    };
};