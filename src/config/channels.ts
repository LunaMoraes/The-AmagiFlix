export interface ChannelConfig {
  handle: string;
  name: string;
  isPrimary: boolean;
}

export const CHANNELS: ChannelConfig[] = [
  { handle: "@TheAmagiYT", name: "The Amagi", isPrimary: true },
  { handle: "@vadersorder", name: "Vader's Order", isPrimary: false },
];

export const PRIMARY_CHANNEL = CHANNELS.find((channel) => channel.isPrimary)!;
export const EXTENDED_CHANNELS = CHANNELS.filter((channel) => !channel.isPrimary);
