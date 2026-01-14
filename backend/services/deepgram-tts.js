const { createClient } = require('@deepgram/sdk');

class DeepgramTTS {
  constructor() {
    this.apiKey = process.env.DEEPGRAM_API_KEY;
    this.enabled = !!this.apiKey;
    
    if (this.enabled) {
      this.client = createClient(this.apiKey);
    }
  }

  async generateForVonage(text, filename, options = {}) {
    if (!this.enabled) {
      throw new Error('Deepgram API key not configured');
    }

    const voice = options.voice || 'aura-asteria-en';
    
    try {
      const response = await this.client.speak.request(
        { text },
        {
          model: voice,
          encoding: 'linear16',
          sample_rate: 16000
        }
      );

      const stream = await response.getStream();
      const buffer = await this.streamToBuffer(stream);

      // In production, save to S3 or cloud storage
      // For now, return a placeholder URL
      return {
        streamUrl: `${process.env.BASE_URL}/audio/${filename}.wav`,
        buffer: buffer
      };
    } catch (err) {
      console.error('Deepgram TTS error:', err);
      throw err;
    }
  }

  async streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}

module.exports = DeepgramTTS;
