import { useState } from "react";

const useSpeechRecognition = (onResult) => {
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    if (!window.SpeechRecognition) {
      onResult("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new window.SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      let command = event.results[0][0].transcript.trim().toLowerCase();
      command = command.replace(/[.,!?]$/, "");
      onResult(command);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onspeechend = () => recognition.stop();
    recognition.onend = () => setIsListening(false);
  };

  return { isListening, startListening };
};

export default useSpeechRecognition;