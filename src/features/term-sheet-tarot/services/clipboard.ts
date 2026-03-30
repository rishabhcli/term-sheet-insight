export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
  return text;
}

export async function copyTextWithPromptFallback(
  text: string,
  promptMessage = "Copy this link:",
) {
  try {
    await copyText(text);
    return true;
  } catch {
    window.prompt(promptMessage, text);
    return false;
  }
}
