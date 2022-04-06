import { Engine } from "../Engine";
import { IPlatformTexture2DArray } from "../renderingHardwareInterface";
import { TextureFilterMode } from "./enums/TextureFilterMode";
import { TextureFormat } from "./enums/TextureFormat";
import { TextureWrapMode } from "./enums/TextureWrapMode";
import { Texture } from "./Texture";

/**
 * Two-dimensional texture array.
 */
export class Texture2DArray extends Texture {
  private _depth: number;

  /**
   * The depth of the texture.
   */
  get depth(): number {
    return this._depth;
  }

  /**
   * Create Texture2D.
   * @param engine - Define the engine to use to render this texture
   * @param width - Texture width
   * @param height - Texture height
   * @param depth - Texture depth
   * @param format - Texture format. default  `TextureFormat.R8G8B8A8`
   * @param mipmap - Whether to use multi-level texture
   */
  constructor(
    engine: Engine,
    width: number,
    height: number,
    depth: number,
    format: TextureFormat = TextureFormat.R8G8B8A8,
    mipmap: boolean = true
  ) {
    super(engine);
    this._mipmap = mipmap;
    this._width = width;
    this._height = height;
    this._depth = depth;
    this._format = format;
    this._mipmapCount = this._getMipmapCount();

    this._platformTexture = engine._hardwareRenderer.createPlatformTexture2D(this);

    this.filterMode = TextureFilterMode.Bilinear;
    this.wrapModeU = this.wrapModeV = TextureWrapMode.Repeat;
  }

  /**
   * Setting pixels data through color buffer data, designated area and texture mipmapping level,it's also applicable to compressed formats.
   * @remarks If it is the WebGL1.0 platform and the texture format is compressed, the first upload must be filled with textures.
   * @param elementIndex - The texture array element index
   * @param colorBuffer - Color buffer data
   * @param mipLevel - Texture mipmapping level
   * @param x - X coordinate of area start
   * @param y - Y coordinate of area start
   * @param width - Data width. if it's empty, width is the width corresponding to mipLevel minus x , width corresponding to mipLevel is Math.max(1, this.width >> mipLevel)
   * @param height - Data height. if it's empty, height is the height corresponding to mipLevel minus y , height corresponding to mipLevel is Math.max(1, this.height >> mipLevel)
   */
  setPixelBuffer(
    elementIndex: number,
    colorBuffer: ArrayBufferView,
    mipLevel: number = 0,
    x?: number,
    y?: number,
    width?: number,
    height?: number
  ): void {
    (this._platformTexture as IPlatformTexture2DArray).setPixelBuffer(
      elementIndex,
      colorBuffer,
      mipLevel,
      x,
      y,
      width,
      height
    );
  }

  /**
   * Setting pixels data through TexImageSource, designated area and texture mipmapping level.
   * @param elementIndex - The texture array element index
   * @param imageSource - The source of texture
   * @param flipY - Whether to flip the Y axis
   * @param premultiplyAlpha - Whether to premultiply the transparent channel
   * @param x - X coordinate of area start
   * @param y - Y coordinate of area start
   */
  setImageSource(
    elementIndex: number,
    imageSource: TexImageSource | OffscreenCanvas,
    mipLevel: number = 0,
    flipY: boolean = false,
    premultiplyAlpha: boolean = false,
    x?: number,
    y?: number
  ): void {
    (this._platformTexture as IPlatformTexture2DArray).setImageSource(
      elementIndex,
      imageSource,
      mipLevel,
      flipY,
      premultiplyAlpha,
      x,
      y
    );
  }

  /**
   * Get pixel color buffer.
   * @param out - Color buffer
   */
  getPixelBuffer(elementIndex: number, out: ArrayBufferView): void;

  /**
   * Get the pixel color buffer according to the specified mip level.
   * @param elementIndex - The texture array element index
   * @param mipLevel - Tet mip level want to get
   * @param out - Color buffer
   */
  getPixelBuffer(elementIndex: number, mipLevel: number, out: ArrayBufferView): void;

  /**
   * Get the pixel color buffer according to the specified area.
   * @param elementIndex - The texture array element index
   * @param x - X coordinate of area start
   * @param y - Y coordinate of area start
   * @param width - Area width
   * @param height - Area height
   * @param out - Color buffer
   */
  getPixelBuffer(elementIndex: number, x: number, y: number, width: number, height: number, out: ArrayBufferView): void;

  /**
   * Get the pixel color buffer according to the specified area and mip level.
   * @param elementIndex - The texture array element index
   * @param x - X coordinate of area start
   * @param y - Y coordinate of area start
   * @param width - Area width
   * @param height - Area height
   * @param mipLevel - Tet mip level want to get
   * @param out - Color buffer
   */
  getPixelBuffer(
    elementIndex: number,
    x: number,
    y: number,
    width: number,
    height: number,
    mipLevel: number,
    out: ArrayBufferView
  ): void;

  getPixelBuffer(
    elementIndex: number,
    xOrMipLevelOrOut: number | ArrayBufferView,
    yOrMipLevel?: number | ArrayBufferView,
    width?: number,
    height?: number,
    mipLevelOrOut?: number | ArrayBufferView,
    out?: ArrayBufferView
  ): void {
    const argsLength = arguments.length;
    if (argsLength === 1) {
      (this._platformTexture as IPlatformTexture2DArray).getPixelBuffer(
        elementIndex,
        0,
        0,
        this._width,
        this._height,
        0,
        <ArrayBufferView>xOrMipLevelOrOut
      );
    } else if (argsLength === 2) {
      (this._platformTexture as IPlatformTexture2DArray).getPixelBuffer(
        elementIndex,
        0,
        0,
        this._width >> (<number>xOrMipLevelOrOut),
        this._height >> (<number>xOrMipLevelOrOut),
        <number>xOrMipLevelOrOut,
        <ArrayBufferView>yOrMipLevel
      );
    } else if (argsLength === 5) {
      (this._platformTexture as IPlatformTexture2DArray).getPixelBuffer(
        elementIndex,
        <number>xOrMipLevelOrOut,
        <number>yOrMipLevel,
        width,
        height,
        0,
        <ArrayBufferView>mipLevelOrOut
      );
    } else if (argsLength === 6) {
      (this._platformTexture as IPlatformTexture2DArray).getPixelBuffer(
        elementIndex,
        <number>xOrMipLevelOrOut,
        <number>yOrMipLevel,
        width,
        height,
        <number>mipLevelOrOut,
        out
      );
    }
  }
}
