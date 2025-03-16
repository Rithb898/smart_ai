import { useState } from "react";
import { KokoroTTS } from "kokoro-js";

const KokoroTTSComponent = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const generateAudio = async () => {
    console.log("Generating audio for text:", text);
    setLoading(true);
    try {
      const model_id = "onnx-community/Kokoro-82M-ONNX";
      console.log("Loading model:", model_id);
      const tts = await KokoroTTS.from_pretrained(model_id, { dtype: "fp32" });
      console.log("Model loaded successfully");
      
      console.log("Generating speech with voice: af_bella");
      const audio = await tts.generate(text, { voice: "af_bella" });
      console.log("Audio generated successfully");
      
      const blob = new Blob([audio.buffer], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      console.log("Audio URL created:", url);
      setAudioUrl(url);
    } catch (error) {
      console.error("Error generating audio:", error);
    }
    setLoading(false);
    console.log("Audio generation process completed");
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md w-96">
      <textarea
        className="w-full p-2 border rounded"
        rows="3"
        placeholder="Enter text to convert"
        value={text}
        onChange={(e) => {
          console.log("Text updated:", e.target.value);
          setText(e.target.value);
        }}
      ></textarea>
      <button
        className="mt-2 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        onClick={generateAudio}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Audio"}
      </button>
      {audioUrl && (
        <audio className="mt-4 w-full" controls>
          <source src={audioUrl} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
};

export default KokoroTTSComponent;