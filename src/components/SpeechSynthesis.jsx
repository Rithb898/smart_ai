import { useState, useEffect } from "react";

const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const handleSpeechStart = () => setIsSpeaking(true);
    const handleSpeechEnd = () => setIsSpeaking(false);

    speechSynthesis.addEventListener("start", handleSpeechStart);
    speechSynthesis.addEventListener("end", handleSpeechEnd);

    return () => {
      speechSynthesis.removeEventListener("start", handleSpeechStart);
      speechSynthesis.removeEventListener("end", handleSpeechEnd);
    };
  }, []);

  const speakText = (text) => {
    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
  };

  return { isSpeaking, speakText, stopSpeaking };
};

export default useSpeechSynthesis;