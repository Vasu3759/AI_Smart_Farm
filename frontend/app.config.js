export default ({ config }) => {
  return {
    ...config,
    android: {
      ...config.android,
      package: "com.agriyield",
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || "AIzaSyFakeKeyFakeKeyFakeKeyFakeKey"
        }
      }
    }
  };
};
