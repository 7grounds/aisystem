/**
 * @MODULE_ID core.governance
 * @STAGE global
 * @DATA_INPUTS ["executive_approval"]
 * @REQUIRED_TOOLS []
 */
export const EXECUTIVE_APPROVAL_TOKEN = "CHECK-OK";

export const assertExecutiveApproval = (token?: string | null) => {
  if (token !== EXECUTIVE_APPROVAL_TOKEN) {
    throw new Error("Executive approval missing.");
  }
};
