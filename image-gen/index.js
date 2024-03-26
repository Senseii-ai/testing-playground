const fs = require('fs');
const OpenAI = require('openai');
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: apiKey });

async function main() {
  const image = await openai.images.generate({
    model: 'dall-e-3',
    prompt:
      'A banner image that is made up using repeating patterns and the color should be shades of neon purple lights. the pattern should be minimalist but concentrated with details and considering that I am a software engineer',
  });

  console.log(image.data);
}
main();
