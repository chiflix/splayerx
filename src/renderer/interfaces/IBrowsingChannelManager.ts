type channelInfo = {
  channels: channelDetails[],
  availableChannels: string[],
}

type channelDetails = {
  channel: string,
  url: string,
  icon: string,
  title: string,
  path: string,
}

type category = {
  type: string,
  locale: string,
}

export interface IBrowsingChannelManager {
  getChannelInfoByCategory(category: string): channelInfo
  setChannelAvailable(channel: string, available: boolean): void
  getAllCategories(): category[]
  getAllChannels(): Map<string, channelInfo>
  getAllAvailableChannels(): channelDetails[]
  repositionChannels(from: number, to: number): channelDetails[]
  initAvailableChannels(channels: channelDetails[]): channelDetails[]
}
