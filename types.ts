export type UserArguments = {
  wallpapersDirectory: string;
  setRandomWallpaper: boolean;
  imageSize: [number, number];
  enableLightTheme: boolean;
  padding: [number, number];
  enablePagination: boolean;
  gridSize: [number, number];
  downloadThemeExtensionScripts: boolean;
  downloadWallpaperDaemonHandlerScript: boolean;
  browseWallpaperOnline: boolean;
  wallpaperRepositoryUrls: string[];
  githubApiKey: string;
  showKeyMap: boolean;
  disableNotification: boolean;
  disableAutoScaling: boolean;
  processLimit: number;
};
