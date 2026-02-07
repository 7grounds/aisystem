/**
 * @MODULE_ID app.home
 * @STAGE stage-1
 * @DATA_INPUTS ["AssetIdentificationModule"]
 * @REQUIRED_TOOLS ["ModuleShell"]
 */
import { AssetIdentificationModule } from "@/features/stage-1/asset-identification/AssetIdentificationModule";

export default function Home() {
  return <AssetIdentificationModule />;
}
