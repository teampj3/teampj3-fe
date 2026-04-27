const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof body === 'string' ? body : body.message;
    throw new Error(message || `요청 실패: ${response.status}`);
  }

  return body;
}

export async function uploadFeatureFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/reports/generate`, {
    method: 'POST',
    body: formData,
  });

  return parseResponse(response);
}

export async function fetchReports() {
  const response = await fetch(`${API_BASE_URL}/api/reports`);
  return parseResponse(response);
}
