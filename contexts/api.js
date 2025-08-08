// Utility function to convert image URI to base64 (if needed for OCR.Space)
const uriToBase64 = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]); // Extract base64 part
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Failed to convert image to base64: ${error.message}`);
  }
};

// Process image with OCR.Space API
export const processImageWithOCR = async (imageUri) => {
  try {
    const formData = new FormData();
    // Check if the URI needs to be converted to base64 or can be sent as-is
    const isLocalUri = imageUri.startsWith('file://') || imageUri.startsWith('content://');
    const imageData = isLocalUri
      ? {
          uri: imageUri,
          name: 'image.jpg',
          type: 'image/jpeg',
        }
      : { uri: imageUri, name: 'image.jpg', type: 'image/jpeg' };

    formData.append('file', imageData);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('iscreatesearchablepdf', 'false');
    formData.append('issearchablepdfhidetextlayer', 'false');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': 'K82971939488957', // Consider storing API key in environment variables
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      throw new Error(`OCR.Space API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (data.ParsedResults && data.ParsedResults.length > 0) {
      return data.ParsedResults[0].ParsedText || '';
    }
    return '';
  } catch (error) {
    console.error('OCR API Error:', error);
    throw new Error(`Unable to extract text from image: ${error.message}`);
  }
};

// Send message to AI (OpenRouter API)
export const sendMessageToAI = async (appMessages) => {
  try {
    // Map messages to OpenRouter format
    const messages = await Promise.all(
      appMessages.map(async (m) => {
        const role = m.sender === 'assistant' ? 'assistant' : 'user';
        let content = m.text ?? '';

        // Process image with OCR if present
        if (m.image) {
          const ocrText = await processImageWithOCR(m.image);
          content = `Image text: ${ocrText}\nUser message: ${content}`;
        }

        return { role, content };
      })
    );

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Devscope',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-30b-a3b-instruct-2507',
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('AI API Error:', error);
    throw new Error(`Unable to get AI response: ${error.message}`);
  }
};