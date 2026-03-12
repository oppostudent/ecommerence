const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

async function listModels() {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
  );

  const data = await res.json();

  for (const model of data.models) {
    console.log(model.name, model.supportedGenerationMethods);
  }
}

listModels();