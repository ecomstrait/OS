export type { ChatMessage, ChatOptions, ChatResult, EmbeddingResult, ModelRole } from "./types";
export { resolveModel, isRoleConfigured } from "./roles";
export { chat, embed, isGatewayConfigured } from "./gateway";
export {
  embedText,
  embedBatch,
  upsertEmbedding,
  upsertEmbeddings,
  retrieve,
  GLOBAL_TENANT_ID,
  type EmbeddingSource,
  type RetrievedChunk,
  type RetrieveOptions,
} from "./rag";
export {
  createChatModel,
  createBusinessAdvisorAgent,
  createAnalyticsAgent,
  runOrchestrator,
  decideRestock,
  type OrchestratorInput,
  type OrchestratorResult,
  type RestockInput,
  type RestockDecision,
} from "./agents";
export {
  requestApproval,
  getApproval,
  resolveApproval,
  recordUsage,
  assertCostBudget,
  type Approval,
  type ApprovalStatus,
} from "./guardrails";
