const vidRegex = new RegExp('\\.(3g2|3gp|3gp2|3gpp|amv|asf|avi|bik|bin|crf|divx|drc|dv|dvr-ms|evo|f4v|flv|gvi|gxf|iso|m1v|m2v|m2t|m2ts|m4v|mkv|mov|mp2|mp2v|mp4|mp4v|mpe|mpeg|mpeg1|mpeg2|mpeg4|mpg|mpv2|mts|mtv|mxf|mxg|nsv|nuv|ogg|ogm|ogv|ogx|ps|rec|rm|rmvb|rpl|thp|tod|tp|ts|tts|txd|vob|vro|webm|wm|wmv|wtv|xesc)$');
export function getValidVideoExtensions() {
  return vidRegex;
}

export default {
  getValidVideoExtensions,
};
