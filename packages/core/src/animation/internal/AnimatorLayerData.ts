import { AnimatorStateTransition } from "../AnimatorTransition";
import { LayerState } from "../enums/LayerState";
import { AnimatorStateData } from "./AnimatorStateData";
import { AnimatorStatePlayData } from "./AnimatorStatePlayData";

/**
 * @internal
 */
export interface AnimatorStateTransitionInfo {
  transition: AnimatorStateTransition;
  duration: number;
  offset: number;
}

/**
 * @internal
 */
export class AnimatorLayerData {
  animatorStateDataMap: Record<string, AnimatorStateData> = {};
  srcPlayData: AnimatorStatePlayData = new AnimatorStatePlayData();
  destPlayData: AnimatorStatePlayData = new AnimatorStatePlayData();
  layerState: LayerState = LayerState.Standby;
  crossCurveMark: number = 0;
  manuallyTransition: AnimatorStateTransition = new AnimatorStateTransition();
  crossFadeTransitionInfo: AnimatorStateTransitionInfo = {
    transition: null,
    duration: 0,
    offset: 0
  };

  switchPlayData(): void {
    const srcPlayData = this.destPlayData;
    const switchTemp = this.srcPlayData;
    this.srcPlayData = srcPlayData;
    this.destPlayData = switchTemp;
  }
}
