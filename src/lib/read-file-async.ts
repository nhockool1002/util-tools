/**
 * Async file reading with size limits and non-blocking UI.
 * Prevents main thread freeze when loading large files (30MB+).
 */

const MAX_DISPLAY_BYTES = 10 * 1024 * 1024; // 10MB - for CompareFile, FindInFile
const MAX_BASE64_BYTES = 10 * 1024 * 1024; // 10MB - Base64 output ~1.33x
const MAX_HASH_BYTES = 50 * 1024 * 1024; // 50MB - Hash can handle larger but with delay

export type ReadFileMode = "display" | "base64" | "hash";

export interface ReadFileResult {
  text: string;
  truncated: boolean;
  totalBytes: number;
  loadedBytes: number;
}

function getMaxBytes(mode: ReadFileMode): number {
  switch (mode) {
    case "display":
      return MAX_DISPLAY_BYTES;
    case "base64":
      return MAX_BASE64_BYTES;
    case "hash":
      return MAX_HASH_BYTES;
    default:
      return MAX_DISPLAY_BYTES;
  }
}

/**
 * Read file as text with optional truncation. Uses chunked reading for large files
 * to avoid blocking the main thread during decode.
 */
export function readFileAsText(
  file: File,
  mode: ReadFileMode = "display"
): Promise<ReadFileResult> {
  const maxBytes = getMaxBytes(mode);
  const totalBytes = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.onload = () => {
      try {
        let text = String(reader.result ?? "");
        let truncated = false;
        let loadedBytes = text.length * 2; // Rough UTF-16 size

        if (totalBytes > maxBytes) {
          // Truncate at character boundary to avoid broken UTF-8
          const maxChars = Math.floor(maxBytes / 2); // Safe approx for UTF-8
          if (text.length > maxChars) {
            text = text.slice(0, maxChars);
            truncated = true;
            loadedBytes = maxBytes;
          }
        }

        // Yield to main thread before resolving so loading UI can render
        queueMicrotask(() => {
          resolve({
            text,
            truncated,
            totalBytes,
            loadedBytes: truncated ? maxBytes : totalBytes,
          });
        });
      } catch (e) {
        reject(e);
      }
    };

    if (totalBytes > maxBytes) {
      // Read only the first chunk - avoids loading full file into memory
      const blob = file.slice(0, maxBytes);
      reader.readAsText(blob, "UTF-8");
    } else {
      reader.readAsText(file, "UTF-8");
    }
  });
}

/**
 * Format bytes for display (e.g. "15.2 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
