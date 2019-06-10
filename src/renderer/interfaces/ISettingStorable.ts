
export type SubtitleStyle = {
  chosenStyle: string,
  chosenSize: string,
  enabledSecondarySub: boolean
}

export type PlaybackStates = {
  volume: number,
  muted: boolean
}

export interface ISettingStorable {
  updateSubtitleStyle(data: SubtitleStyle): Promise<boolean>
  updatePlaybackStates(data: PlaybackStates): Promise<boolean>
}