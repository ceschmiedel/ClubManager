// Gera o payload EMV "PIX Copia e Cola" (BR Code) estático a partir da chave PIX.
function emv(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function normalizar(s: string, max: number) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toUpperCase()
    .slice(0, max)
    .trim();
}

export function gerarPayloadPix(opts: {
  chave: string;
  nome: string;
  cidade?: string;
  valor?: number;
  txid?: string;
}) {
  const gui = emv("00", "br.gov.bcb.pix") + emv("01", opts.chave);
  const payload =
    emv("00", "01") +
    emv("26", gui) +
    emv("52", "0000") +
    emv("53", "986") +
    (opts.valor ? emv("54", opts.valor.toFixed(2)) : "") +
    emv("58", "BR") +
    emv("59", normalizar(opts.nome || "CLUBE", 25)) +
    emv("60", normalizar(opts.cidade || "BRASIL", 15)) +
    emv("62", emv("05", (opts.txid || "***").slice(0, 25)));
  const comCrc = payload + "6304";
  return comCrc + crc16(comCrc);
}
