import React, { useState, useEffect } from "react";

const GROQ_API_KEY = "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";

/**
 * SmartHealthAssistant Component
 * This component provides a smart health assistant that can diagnose symptoms
 * based on user input via speech recognition or text input.
 */
function SmartHealthAssistant() {
  const [output, setOutput] = useState(
    "Press the mic to speak or type your symptoms below..."
  );
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [symptomInput, setSymptomInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    // This ensures the SpeechRecognition is accessed only in browser environment
    window.SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    // Set up event listeners for speech synthesis
    const handleSpeechStart = () => setIsSpeaking(true);
    const handleSpeechEnd = () => setIsSpeaking(false);

    speechSynthesis.addEventListener("start", handleSpeechStart);
    speechSynthesis.addEventListener("end", handleSpeechEnd);

    // Clean up event listeners
    return () => {
      speechSynthesis.removeEventListener("start", handleSpeechStart);
      speechSynthesis.removeEventListener("end", handleSpeechEnd);
    };
  }, []);

  /**
   * Start listening for speech input
   */
  const startListening = () => {
    if (!window.SpeechRecognition) {
      setOutput("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new window.SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      let command = event.results[0][0].transcript.trim().toLowerCase();
      command = command.replace(/[.,!?]$/, ""); // Remove trailing punctuation

      setOutput(`You said: "${command}"`);
      getHealthDiagnosis(command);
    };

    recognition.onerror = (event) => {
      setOutput(`Error: ${event.error}`);
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onspeechend = () => {
      recognition.stop();
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsListening(false);
    };
  };

  /**
   * Handle form submission for symptom input
   * @param {Event} e - The form submission event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (symptomInput.trim()) {
      setOutput(`You entered: "${symptomInput}"`);
      getHealthDiagnosis(symptomInput);
      setSymptomInput(""); // Clear input after submission
    }
  };

  /**
   * Get health diagnosis based on symptom input
   * @param {string} symptom - The symptom input from the user
   */
  const getHealthDiagnosis = (symptom) => {
    setIsLoading(true);
    const promptText = `
    I have the following symptoms: "${symptom}".

    Based on this, provide:
    1. SYMPTOM_DIAGNOSIS: A list of possible conditions.
    2. SYMPTOM_REMEDIES: A list of simple home remedies.
    Format the response in JSON like this:
    {
        "SYMPTOM_DIAGNOSIS": ["Condition1", "Condition2"],
        "SYMPTOM_REMEDIES": ["Remedy1", "Remedy2"]
    }
    Only return valid JSON. Do not include extra explanations or text.`;

    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [{ role: "user", content: promptText }],
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setIsLoading(false);
        let aiResponse = data.choices[0].message.content.trim();
        console.log("AI Response:", aiResponse);

        try {
          // Extract JSON from response using regex
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON found in AI response");

          const responseJSON = JSON.parse(jsonMatch[0]); // Extracted JSON

          let diagnosisText = `Diagnosis:\n${responseJSON.SYMPTOM_DIAGNOSIS.join(
            "\n"
          )}`;
          let remediesText = `\n\nRemedies:\n${responseJSON.SYMPTOM_REMEDIES.join(
            "\n"
          )}`;

          setOutput((prev) => `${prev}\n\n${diagnosisText}${remediesText}`);
          speakText(
            `Possible diagnoses: ${responseJSON.SYMPTOM_DIAGNOSIS.join(
              ", "
            )}. Remedies include: ${responseJSON.SYMPTOM_REMEDIES.join(", ")}`
          );
        } catch (error) {
          console.error("Error parsing AI response:", error);
          setOutput(
            (prev) => `${prev}\n\nAI response is not in the correct format.`
          );
        }
      })
      .catch((error) => {
        setIsLoading(false);
        setOutput((prev) => `${prev}\n\nError contacting Groq AI.`);
        console.error("Groq AI error:", error);
      });
  };

  /**
   * Speak the given text using speech synthesis
   * @param {string} text - The text to be spoken
   */
  const speakText = (text) => {
    // Cancel any ongoing speech first
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  /**
   * Stop any ongoing speech synthesis
   */
  const stopSpeaking = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className='assistant-card'>
      <h1>&#x1F52C; Smart Health Assistant</h1>

      <div className='status-box'>
        {isLoading ? (
          <div className='loading-indicator'>Analyzing symptoms...</div>
        ) : (
          output
            .split("\n")
            .map((line, index) =>
              line.includes("Diagnosis:") ? (
                <strong key={index}>{line}</strong>
              ) : line.includes("Remedies:") ? (
                <strong key={index}>{line}</strong>
              ) : (
                <p key={index}>{line}</p>
              )
            )
        )}
      </div>

      <div className='input-area'>
        <form onSubmit={handleSubmit}>
          <input
            type='text'
            value={symptomInput}
            onChange={(e) => setSymptomInput(e.target.value)}
            placeholder='Type your symptoms here...'
            className='symptom-input'
            disabled={isLoading}
          />
          <button
            type='submit'
            className='submit-button'
            disabled={!symptomInput.trim() || isLoading}
          >
            Submit
          </button>
        </form>
      </div>

      <div className='mic-area'>
        <button
          className='mic-button'
          onClick={startListening}
          disabled={isListening || isLoading}
        >
          &#x1F399;
        </button>

        {isSpeaking && (
          <button className='stop-button' onClick={stopSpeaking}>
            &#x1F507;
          </button>
        )}
      </div>

      <p className='footer-note'>
        Your AI health companion &#x2695;&#xFE0F; - Stay Healthy, Stay Smart!
      </p>
    </div>
  );
}

export default SmartHealthAssistant;