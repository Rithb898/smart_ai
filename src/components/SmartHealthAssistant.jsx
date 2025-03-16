import React, { useState, useEffect, useRef } from "react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

function SmartHealthAssistant() {
  const [output, setOutput] = useState(
    "Press the mic to speak or type your symptoms below..."
  );
  const [status, setStatus] = useState({
    isListening: false,
    isSpeaking: false,
    isLoading: false,
  });
  const [symptomInput, setSymptomInput] = useState("");

  const recognitionRef = useRef(null); // Store SpeechRecognition instance

  useEffect(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      recognitionRef.current = new (window.SpeechRecognition ||
        window.webkitSpeechRecognition)();
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        let command = event.results[0][0].transcript
          .trim()
          .replace(/[.,!?]$/, "");
        setOutput(`🎤 You said: "${command}"`);
        getHealthDiagnosis(command);
      };

      recognitionRef.current.onerror = (event) => {
        setOutput(
          event.error === "not-allowed"
            ? "⚠️ Microphone access is blocked. Enable it in browser settings."
            : `⚠️ Error: ${event.error}`
        );
        setStatus((prev) => ({ ...prev, isListening: false }));
      };

      recognitionRef.current.onend = () =>
        setStatus((prev) => ({ ...prev, isListening: false }));
    }

    const handleSpeechStart = () =>
      setStatus((prev) => ({ ...prev, isSpeaking: true }));
    const handleSpeechEnd = () =>
      setStatus((prev) => ({ ...prev, isSpeaking: false }));

    speechSynthesis.addEventListener("start", handleSpeechStart);
    speechSynthesis.addEventListener("end", handleSpeechEnd);

    return () => {
      speechSynthesis.removeEventListener("start", handleSpeechStart);
      speechSynthesis.removeEventListener("end", handleSpeechEnd);
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const startListening = () => {
    console.log("startListening called");
    if (!recognitionRef.current) {
      setOutput("❌ Speech recognition is not supported in this browser.");
      return;
    }
    setStatus((prev) => ({ ...prev, isListening: true }));
    recognitionRef.current.start();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!symptomInput.trim()) return;
    setOutput(`You entered: "${symptomInput}"`);
    getHealthDiagnosis(symptomInput);
    setSymptomInput("");
  };

  const getHealthDiagnosis = async (symptom) => {
    setStatus((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "mixtral-8x7b-32768",
            messages: [{ role: "user", content: generatePrompt(symptom) }],
          }),
        }
      );

      const data = await response.json();
      setStatus((prev) => ({ ...prev, isLoading: false }));

      if (!data.choices || data.choices.length === 0)
        throw new Error("Invalid response from AI.");

      const aiResponse = data.choices[0].message.content.trim();
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in AI response");

      const responseJSON = JSON.parse(jsonMatch[0]);
      const diagnosisText = `Diagnosis:\n${responseJSON.SYMPTOM_DIAGNOSIS.join(
        "\n"
      )}`;
      const remediesText = `\n\nRemedies:\n${responseJSON.SYMPTOM_REMEDIES.join(
        "\n"
      )}`;

      setOutput((prev) => `${prev}\n\n${diagnosisText}${remediesText}`);
      speakText(
        `Possible diagnoses: ${responseJSON.SYMPTOM_DIAGNOSIS.join(
          ", "
        )}. Remedies include: ${responseJSON.SYMPTOM_REMEDIES.join(", ")}`
      );
    } catch (error) {
      setStatus((prev) => ({ ...prev, isLoading: false }));
      setOutput((prev) => `${prev}\n\nError contacting AI.`);
      console.error("AI error:", error);
    }
  };

  const generatePrompt = (symptom) => `
    I have the following symptoms: "${symptom}".
    
    Based on this, provide:
    1. SYMPTOM_DIAGNOSIS: A list of possible conditions (maximum 6).
    2. SYMPTOM_REMEDIES: A list of simple home remedies (maximum 6).

    Ensure that you provide no more than **6** items for each list. Fewer items are allowed if necessary.

    Format the response in JSON like this:
    {
        "SYMPTOM_DIAGNOSIS": ["Condition1", "Condition2", ..., "Condition6"],
        "SYMPTOM_REMEDIES": ["Remedy1", "Remedy2", ..., "Remedy6"]
    }

    Only return valid JSON. Do not include extra explanations or text.
`;

  const speakText = (text) => {
    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    // speechSynthesis.speak(utterance);
    responsiveVoice.speak(text, "US English Female");
    setStatus((prev) => ({ ...prev, isSpeaking: true }));
  };

  const stopSpeaking = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setStatus((prev) => ({ ...prev, isSpeaking: false }));
    }
  };

  return (
    <div className='assistant-card'>
      <h1>&#x1F52C; Smart Health Assistant</h1>

      <div className='status-box'>
        {status.isLoading ? (
          <div className='loading-indicator'>Analyzing symptoms...</div>
        ) : (
          output
            .split("\n")
            .map((line, index) =>
              line.includes("Diagnosis:") || line.includes("Remedies:") ? (
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
            disabled={status.isLoading}
          />
          <button
            type='submit'
            className='submit-button'
            disabled={!symptomInput.trim() || status.isLoading}
          >
            Submit
          </button>
        </form>
      </div>

      <div className='mic-area'>
        <button
          className='mic-button'
          onClick={startListening}
          disabled={status.isListening || status.isLoading}
        >
          &#x1F399;
        </button>

        {status.isSpeaking && (
          <button className='stop-button' onClick={stopSpeaking}>
            {" "}
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
