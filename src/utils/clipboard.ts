/**
 * Safely copy text to the clipboard, falling back to document.execCommand('copy')
 * if navigator.clipboard is unavailable (e.g., in non-secure HTTP contexts).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Use modern Clipboard API if available and in secure context
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, trying fallback:", err);
    }
  }

  // Fallback to classic document.execCommand('copy')
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    textArea.style.pointerEvents = "none";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      return true;
    }
  } catch (err) {
    console.error("Fallback copyToClipboard failed:", err);
  }

  return false;
}
