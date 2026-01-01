import { useCallback } from 'react';

export const useSuccessSound = () => {
  const playSuccessSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant success chime (two-tone)
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      // Play ascending two-note chime
      playTone(523.25, now, 0.15); // C5
      playTone(659.25, now + 0.1, 0.25); // E5
      playTone(783.99, now + 0.2, 0.35); // G5
      
    } catch (error) {
      console.log('Could not play success sound:', error);
    }
  }, []);

  return { playSuccessSound };
};
