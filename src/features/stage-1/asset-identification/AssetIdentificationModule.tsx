/**
 * @MODULE_ID stage-1.asset-identification.module
 * @STAGE stage-1
 * @DATA_INPUTS ["assetIdentificationTasks"]
 * @REQUIRED_TOOLS ["ModuleShell"]
 */
import { ModuleShell } from "@/shared/components/ModuleShell";
import { assetIdentificationTasks } from "./tasks.config";

export const AssetIdentificationModule = () => {
  return (
    <ModuleShell
      moduleId="asset-identification"
      stageId="stage-1"
      title="Asset Identification"
      subtitle="Ground the wealth engine with a clear inventory of your assets."
      tasks={assetIdentificationTasks}
    />
  );
};
