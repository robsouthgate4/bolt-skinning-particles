import { LINEAR, AssetType } from "bolt-gl";

const assets = {
  gltf: {
    character: {
      // draco compressed
      url: "/static/models/gltf/character/running-woman2-draco.glb",
      type: AssetType.GLTF,
    },
  },
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
    },
    irradiance: {
      url: "/static/textures/hdr/studio_small_09_2k-diffuse-RGBM.png",
      type: AssetType.TEXTURE,
      options: {
        flipY: false,
        minFilter: LINEAR,
        magFilter: LINEAR,
      },
    },
  },
};

export default assets;
