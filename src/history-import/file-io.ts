export function readFileBytes(file: File): Promise<Uint8Array> {
  const arrayBuffer = (file as File & { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer;
  if (typeof arrayBuffer === "function") return arrayBuffer.call(file).then((value) => new Uint8Array(value));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("The selected file could not be read."));
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.readAsArrayBuffer(file);
  });
}

export async function readFileText(file: File): Promise<string> {
  const text = (file as File & { text?: () => Promise<string> }).text;
  if (typeof text === "function") return text.call(file);
  return new TextDecoder().decode(await readFileBytes(file));
}
