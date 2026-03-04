import fontverter from "fontverter";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Mode = "to-woff2" | "to-ttf";

function normalizeMode(value: FormDataEntryValue | null): Mode {
  const str = typeof value === "string" ? value : "";
  return str === "to-ttf" ? "to-ttf" : "to-woff2";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const mode = normalizeMode(formData.get("mode"));
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing font file" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const targetFormat = mode === "to-woff2" ? "woff2" : "sfnt";
    const outputBuffer = await fontverter.convert(inputBuffer, targetFormat);

    const isToWoff2 = mode === "to-woff2";
    const ext = isToWoff2 ? ".woff2" : ".ttf";
    const mimeType = isToWoff2 ? "font/woff2" : "font/ttf";

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const downloadName = `${baseName}${ext}`;

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${downloadName}"`,
      },
    });
  } catch (error) {
    console.error("font-converter API error", error);
    return NextResponse.json(
      { error: "Failed to convert font file" },
      { status: 500 }
    );
  }
}

