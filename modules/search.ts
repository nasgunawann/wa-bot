/**
 * Google Search Grounding Tool definition for Gemini API
 */
export const googleSearchTool = {
  googleSearch: {}
};

/**
 * Extracts and formats web search citations from the Gemini response metadata.
 * Returns a beautifully formatted numbered list of references or empty string.
 * @param response Candidate metadata from Gemini generateContent
 */
export function formatSearchCitations(response: any): string {
  const candidate = response.candidates?.[0];
  const metadata = candidate?.groundingMetadata;
  const chunks = metadata?.groundingChunks;

  if (chunks && chunks.length > 0) {
    let citations = "\n\n🌐 *Sumber Referensi:*";
    const uniqueSources = new Map<string, string>();
    for (const chunk of chunks) {
      if (chunk.web?.uri && chunk.web?.title) {
        uniqueSources.set(chunk.web.uri, chunk.web.title);
      }
    }
    let index = 1;
    uniqueSources.forEach((title, uri) => {
      citations += `\n${index}. *${title}*\n   👉 ${uri}`;
      index++;
    });
    return citations;
  }
  return "";
}
