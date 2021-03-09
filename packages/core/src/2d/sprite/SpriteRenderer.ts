import { Color, Vector3, Vector4 } from "@oasis-engine/math";
import { Camera } from "../../Camera";
import { Entity } from "../../Entity";
import { Material, RenderQueueType } from "../../material";
import { Renderer } from "../../Renderer";
import { BlendFactor, BlendOperation, CullMode, Shader } from "../../shader";
import { DrawMode } from "../enums/DrawMode";
import { Sprite } from "./Sprite";
import "./SpriteMaterial";

/**
 * 2d sprite renderer.
 */
export class SpriteRenderer extends Renderer {
  private static _tempVec4: Vector4 = new Vector4();
  private static _defaultMaterial: Material = null;

  private static _FLIP_X_FLAG = 0x1;
  private static _FLIP_Y_FLAG = 0x2;
  private static _SPRITE_FLAG = 0x4;
  /** SpriteRenderer._FLIP_X_FLAG | SpriteRenderer._FLIP_Y_FLAG */
  private static _FLIP_FLAG = 0x3;
  /** SpriteRenderer._FLIP_X_FLAG | SpriteRenderer._FLIP_Y_FLAG | SpriteRenderer._SPRITE_FLAG */
  private static _ALL_FLAG = 0x7;

  /** The array containing sprite mesh vertex positions in world space */
  private _vertices: Vector3[] = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
  /** The current draw mode of the Sprite Renderer. */
  private _drawMode: DrawMode;
  /** The Sprite to render. */
  private _sprite: Sprite;
  /** Rendering color for the Sprite graphic. */
  private _color: Color;
  /** Flips the sprite on the X axis. */
  private _flipX: boolean;
  /** Flips the sprite on the Y axis. */
  private _flipY: boolean;
  /** The dirty flag to determine whether flip vertices. */
  private _dirtyFlag: number;

  /**
   * Create a sprite renderer instance.
   * @param entity - Entity to which the sprite renderer belongs
   */
  constructor(entity: Entity) {
    super(entity);

    this._drawMode = DrawMode.Simple;
    this._sprite = null;
    this._color = new Color(1, 1, 1, 1);
    this._flipX = false;
    this._flipY = false;
    this._dirtyFlag = SpriteRenderer._ALL_FLAG;
  }

  /**
   * Push the render data of the sprite to render queue.
   * @param camera - Camera which is rendering
   */
  _render(camera: Camera): void {
    const { entity, sprite, _vertices } = this;
    if (!sprite) {
      return;
    }

    const { transform } = entity;
    const modelMatrix = transform.worldMatrix;

    // Update sprite data.
    const needUpdate = sprite.updateMeshData();
    const { triangles, uv, vertices, texture } = sprite;

    // Update vertices position in world space.
    const posZ = transform.position.z;
    for (let i = 0; i < 4; ++i) {
      const curVertex = vertices[i];
      const tempPos = SpriteRenderer._tempVec4;
      tempPos.setValue(curVertex.x, curVertex.y, posZ, 1);
      Vector4.transform(tempPos, modelMatrix, tempPos);
      _vertices[i].setValue(tempPos.x, tempPos.y, tempPos.z);
    }

    if (this._isContainDirtyFlag(SpriteRenderer._SPRITE_FLAG) || needUpdate) {
      !this._flipX && this._setDirtyFlagFalse(SpriteRenderer._FLIP_X_FLAG);
      !this._flipY && this._setDirtyFlagFalse(SpriteRenderer._FLIP_Y_FLAG);

      this._setDirtyFlagFalse(SpriteRenderer._SPRITE_FLAG);
    }

    // Flip _vertices.
    if (this._isContainDirtyFlag(SpriteRenderer._FLIP_FLAG)) {
      const flipX = this._isContainDirtyFlag(SpriteRenderer._FLIP_X_FLAG);
      const flipY = this._isContainDirtyFlag(SpriteRenderer._FLIP_Y_FLAG);
      const pivot = transform.worldPosition;
      const { x: px, y: py } = pivot;

      for (let i = 0, len = _vertices.length; i < len; ++i) {
        const vertex = _vertices[i];
        const { x, y } = vertex;

        if (flipX) {
          vertex.x = px * 2 - x;
        }

        if (flipY) {
          vertex.y = py * 2 - y;
        }
      }

      this._setDirtyFlagFalse(SpriteRenderer._FLIP_FLAG);
    }

    // @ts-ignore
    this.shaderData.setTexture("u_texture", texture);
    const material = this.getMaterial() || this._getDefaultMaterial();
    camera._renderPipeline.pushSprite(this, _vertices, uv, triangles, this.color, material, camera);
  }

  /**
   * The current draw mode of the Sprite Renderer.
   */
  get drawMode(): DrawMode {
    return this._drawMode;
  }

  // TODO
  set drawMode(value: DrawMode) {}

  /**
   * The Sprite to render.
   */
  get sprite(): Sprite {
    return this._sprite;
  }

  set sprite(value: Sprite | null) {
    if (this._sprite !== value) {
      this._sprite = value;
      this._setDirtyFlagTrue(SpriteRenderer._SPRITE_FLAG);
    }
  }

  /**
   * Rendering color for the Sprite graphic.
   */
  get color(): Color {
    return this._color;
  }

  set color(value: Color) {
    if (this._color !== value) {
      value.cloneTo(this._color);
    }
  }

  /**
   * Flips the sprite on the X axis.
   */
  get flipX(): boolean {
    return this._flipX;
  }

  set flipX(value: boolean) {
    if (this._flipX !== value) {
      this._flipX = value;
      this._setDirtyFlagTrue(SpriteRenderer._FLIP_X_FLAG);
    }
  }

  /**
   * Flips the sprite on the Y axis.
   */
  get flipY(): boolean {
    return this._flipY;
  }

  set flipY(value: boolean) {
    if (this._flipY !== value) {
      this._flipY = value;
      this._setDirtyFlagTrue(SpriteRenderer._FLIP_Y_FLAG);
    }
  }

  private _isContainDirtyFlag(type: number): boolean {
    return (this._dirtyFlag & type) != 0;
  }

  private _setDirtyFlagTrue(type: number) {
    this._dirtyFlag |= type;
  }

  private _setDirtyFlagFalse(type: number) {
    this._dirtyFlag &= ~type;
  }

  private _getDefaultMaterial() {
    if (!SpriteRenderer._defaultMaterial) {
      // Create default material
      const material = (SpriteRenderer._defaultMaterial = new Material(
        this.scene.engine,
        Shader.find("Sprite-Default")
      ));
      const target = material.renderState.blendState.targetBlendState;
      target.sourceColorBlendFactor = target.sourceAlphaBlendFactor = BlendFactor.SourceAlpha;
      target.destinationColorBlendFactor = target.destinationAlphaBlendFactor = BlendFactor.OneMinusSourceAlpha;
      target.colorBlendOperation = target.alphaBlendOperation = BlendOperation.Add;
      material.renderState.depthState.writeEnabled = false;
      material.renderQueueType = RenderQueueType.Transparent;
      material.renderState.rasterState.cullMode = CullMode.Off;
    }

    return SpriteRenderer._defaultMaterial;
  }
}
