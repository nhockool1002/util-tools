export type FontConvertMode = "to-woff2" | "to-ttf";

export interface ConvertedFontFile {
  originalName: string;
  downloadName: string;
  blob: Blob;
}

export interface ConvertFontResult {
  success: boolean;
  file?: ConvertedFontFile;
  error?: string;
}

export async function convertFontFile(
  file: File,
  mode: FontConvertMode
): Promise<ConvertFontResult> {
  try {
    const formData = new FormData();
    formData.append("mode", mode);
    formData.append("file", file);

    const response = await fetch("/api/font-converter", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return {
        success: false,
        error: "Failed to convert font file.",
      };
    }

    const contentDisposition = response.headers.get("Content-Disposition") || "";
    const match = /filename="?([^"]+)"?/.exec(contentDisposition);

    const isToWoff2 = mode === "to-woff2";
    const ext = isToWoff2 ? ".woff2" : ".ttf";
    const fallbackBaseName = file.name.replace(/\.[^.]+$/, "");
    const downloadName = match?.[1] || `${fallbackBaseName}${ext}`;

    const blob = await response.blob();

    return {
      success: true,
      file: {
        originalName: file.name,
        downloadName,
        blob,
      },
    };
  } catch (error) {
    console.error("convertFontFile error", error);
    return {
      success: false,
      error: "Failed to convert font file.",
    };
  }
}

