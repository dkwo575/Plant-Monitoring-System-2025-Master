// src/api/chatbotApi.ts

export async function sendInstructionToBackend(instruction: string) {
  const response = await fetch('http://localhost:5000/handle_instruction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ instruction }),
  });

  const data = await response.json();
  return data;
}
