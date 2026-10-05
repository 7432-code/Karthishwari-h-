export async function generateComic(payload) {
  const response = await fetch("/api/comic/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Comic generation failed.");
  }

  return data;
}

export async function checkHealth() {
  const response = await fetch("/api/health");
  if (!response.ok) throw new Error("Backend is not reachable.");
  return response.json();
}
