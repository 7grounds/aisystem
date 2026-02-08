/**
 * @MODULE_ID stage-1.asset-coach.module
 * @STAGE stage-1
 * @DATA_INPUTS ["assetCoachTasks"]
 * @REQUIRED_TOOLS ["TaskRenderer"]
 */
import { TaskRenderer } from "./TaskRenderer";
import { assetCoachTasks } from "./tasks.config";

export const AssetCoachModule = () => {
  return (
    <TaskRenderer
      moduleId="asset-coach"
      stageId="stage-1"
      tasks={assetCoachTasks}
    />
  );
};
