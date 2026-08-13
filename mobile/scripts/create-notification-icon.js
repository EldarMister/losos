const sharp = require("sharp");

const source = "assets/logo.png";
const destination = "assets/notification-icon.png";

async function main() {
  const { data, info } = await sharp(source)
    .extract({ left: 170, top: 55, width: 560, height: 440 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let offset = 0; offset < data.length; offset += info.channels) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const sourceAlpha = data[offset + 3];
    const nearWhite = red > 242 && green > 242 && blue > 242;
    const alpha = nearWhite ? 0 : sourceAlpha;
    data[offset] = 255;
    data[offset + 1] = 255;
    data[offset + 2] = 255;
    data[offset + 3] = alpha;
  }

  const trimmed = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).trim({ background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer();

  await sharp(trimmed)
    .resize(76, 76, { fit: "contain", kernel: sharp.kernel.lanczos3 })
    .extend({
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(destination);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
