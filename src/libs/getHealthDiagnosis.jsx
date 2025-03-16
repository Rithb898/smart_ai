export const getHealthDiagnosis = async (symptom, setIsLoading, setOutput, speakText) => {
    const GROQ_API_KEY = "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"; // Store API key in .env
  
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
  
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: [{ role: "user", content: promptText }],
        }),
      });
  
      const data = await response.json();
      setIsLoading(false);
      
      let aiResponse = data.choices?.[0]?.message?.content?.trim() || "";
      console.log("AI Response:", aiResponse);
  
      // Extract JSON using regex
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in AI response");
  
      const responseJSON = JSON.parse(jsonMatch[0]);
  
      let diagnosisText = `Diagnosis:\n${responseJSON.SYMPTOM_DIAGNOSIS.join("\n")}`;
      let remediesText = `\n\nRemedies:\n${responseJSON.SYMPTOM_REMEDIES.join("\n")}`;
  
      setOutput((prev) => `${prev}\n\n${diagnosisText}${remediesText}`);
  
      if (speakText) {
        speakText(
          `Possible diagnoses: ${responseJSON.SYMPTOM_DIAGNOSIS.join(
            ", "
          )}. Remedies include: ${responseJSON.SYMPTOM_REMEDIES.join(", ")}`
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
      setOutput((prev) => `${prev}\n\nError contacting Groq AI.`);
    }
  };
  