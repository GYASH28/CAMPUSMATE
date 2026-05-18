import { handleAiRequest } from './_aiCore.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ success: false, error: 'Method not allowed.' });
    return;
  }

  const result = await handleAiRequest(request.body, process.env);
  response.status(result.status).json(result.body);
}
