import { AMAGI_CHANNEL_HANDLE } from "../config/app";
import type { CatalogMovie, CatalogShow, CatalogTitle } from "../types/catalog";

export const isShow = (title: CatalogTitle): title is CatalogShow => "showId" in title;
export const titleId = (title: CatalogTitle) => isShow(title) ? title.showId : title.videoId;
export const titlePublishedAt = (title: CatalogTitle) => isShow(title) ? title.latestPublishedAt : title.publishedAt;
export const titleThumbnail = (title: CatalogTitle) => title.thumbnails.maxres ?? title.thumbnails.standard ?? title.thumbnails.high ?? title.thumbnails.medium ?? title.thumbnails.default;
export const asMovie = (title: CatalogTitle): CatalogMovie | undefined => isShow(title) ? undefined : title;

export const isExtendedTitle = (title: CatalogTitle): boolean => {
  if (title.isExtended === true) return true;
  if (title.channelHandle && title.channelHandle !== AMAGI_CHANNEL_HANDLE) return true;
  if (isShow(title) && title.episodes?.length > 0) {
    return title.episodes.some((ep) => ep.isExtended === true || (ep.channelHandle && Boolean(ep.channelHandle) && ep.channelHandle !== AMAGI_CHANNEL_HANDLE));
  }
  return false;
};
