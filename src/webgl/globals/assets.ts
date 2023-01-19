import { LINEAR, AssetType } from "bolt-gl";

const assets = {
  hdr: {
    // generated used ibl converter https://github.com/oframe/ibl-converter
    radiance: {
      url: "/static/textures/hdr/studio_small_09_2k-specular-RGBM.webp",
      type: AssetType.TEXTURE,
      options: {
        flipY: false,
        minFilter: LINEAR,
        magFilter: LINEAR,
      },
      // flipY: false,
    },
    irradiance: {
      url: "/static/textures/hdr/studio_small_09_2k-diffuse-RGBM.png",
      type: AssetType.TEXTURE,
      options: {
        flipY: false,
        minFilter: LINEAR,
        magFilter: LINEAR,
      },
      // flipY: false,
    },
  },
  gltf: {
    character: {
      // draco compressed
      url: "/static/models/gltf/character/running-woman.glb",
      type: AssetType.GLTF,
    },
  },
};

export default assets;
