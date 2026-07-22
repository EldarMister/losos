import { NextResponse } from "next/server";

const interFonts = {
  cyrillic: "https://mnogolososya.ru/_nuxt/Inter-normal-400-cyrillic.DqGufNeO.woff2",
  latin: "https://mnogolososya.ru/_nuxt/Inter-normal-400-latin.Dx4kXJAl.woff2",
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ subset: string }> },
) {
  const { subset } = await params;
  const source = interFonts[subset as keyof typeof interFonts];
  if (!source) return NextResponse.json({ message: "Font not found" }, { status: 404 });

  const response = await fetch(source, { next: { revalidate: 86_400 } });
  if (!response.ok || !response.body) {
    return NextResponse.json({ message: "Font is temporarily unavailable" }, { status: 502 });
  }

  return new NextResponse(response.body, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "font/woff2",
    },
  });
}
