import { SchemaValidator } from './Schema.js';
import { schema } from './SchemaData.js';
import type * as protocol from './Protocol.js';
const validator: SchemaValidator = new SchemaValidator(schema);
/** Validates untrusted JSON at a protocol boundary. */
export type Validator = (value: unknown) => boolean;
/** Validates approvalRequested. */
export function approvalRequested(value: unknown): value is protocol.ApprovalRequestedData {
    return validator.validate('#/definitions/ApprovalRequestedData', value);
}
/** Validates approvalResolved. */
export function approvalResolved(value: unknown): value is protocol.ApprovalResolvedData {
    return validator.validate('#/definitions/ApprovalResolvedData', value);
}
/** Validates challenge. */
export function challenge(value: unknown): value is protocol.ConnectChallengeData {
    return validator.validate('#/definitions/ConnectChallengeData', value);
}
/** Validates changed. */
export function changed(value: unknown): value is protocol.ChangedData {
    return validator.validate('#/definitions/ChangedData', value);
}
/** Validates error. */
export function error(value: unknown): value is protocol.WireError {
    return validator.validate('#/definitions/WireError', value);
}
/** Validates historyRecord. */
export function historyRecord(value: unknown): value is protocol.SessionHistoryRecord {
    return validator.validate('#/definitions/SessionHistoryRecord', value);
}
/** Validates methods. */
export function methods(value: unknown): value is protocol.GatewayMethods {
    return validator.validate('#/definitions/GatewayMethods', value);
}
/** Validates native. */
export function native(value: unknown): value is protocol.NcapDelta {
    return validator.validate('#/definitions/NcapDelta', value);
}
/** Validates sessionHistory. */
export function sessionHistory(value: unknown): value is protocol.SessionHistoryData {
    return validator.validate('#/definitions/SessionHistoryData', value);
}
/** Validates sessionMessage. */
export function sessionMessage(value: unknown): value is protocol.SessionMessageData {
    return validator.validate('#/definitions/SessionMessageData', value);
}
/** Validates toolSites. */
export function toolSites(value: unknown): value is protocol.ToolSitesData {
    return validator.validate('#/definitions/ToolSitesData', value);
}
/** Validates turnEnd. */
export function turnEnd(value: unknown): value is protocol.TurnEndData {
    return validator.validate('#/definitions/TurnEndData', value);
}
/** Validates turnEvent. */
export function turnEvent(value: unknown): value is protocol.TurnEventData {
    return validator.validate('#/definitions/TurnEventData', value);
}
/** Validates voice. */
export function voice(value: unknown): value is protocol.VoiceCallEvent {
    return validator.validate('#/definitions/VoiceCallEvent', value);
}
/** Validates params0. */
export function params0(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/accounts.create/properties/params',
        value,
    );
}
/** Validates result0. */
export function result0(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/accounts.create/properties/result',
        value,
    );
}
/** Validates params1. */
export function params1(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/accounts.list/properties/params',
        value,
    );
}
/** Validates result1. */
export function result1(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/accounts.list/properties/result',
        value,
    );
}
/** Validates params2. */
export function params2(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/accounts.remove/properties/params',
        value,
    );
}
/** Validates result2. */
export function result2(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/accounts.remove/properties/result',
        value,
    );
}
/** Validates params3. */
export function params3(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/accounts.usage/properties/params',
        value,
    );
}
/** Validates result3. */
export function result3(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/accounts.usage/properties/result',
        value,
    );
}
/** Validates params4. */
export function params4(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agent.ask/properties/params',
        value,
    );
}
/** Validates result4. */
export function result4(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agent.ask/properties/result',
        value,
    );
}
/** Validates params5. */
export function params5(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agent.steer/properties/params',
        value,
    );
}
/** Validates result5. */
export function result5(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agent.steer/properties/result',
        value,
    );
}
/** Validates params6. */
export function params6(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agent.stream/properties/params',
        value,
    );
}
/** Validates result6. */
export function result6(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agent.stream/properties/result',
        value,
    );
}
/** Validates params7. */
export function params7(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agents.define/properties/params',
        value,
    );
}
/** Validates result7. */
export function result7(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agents.define/properties/result',
        value,
    );
}
/** Validates params8. */
export function params8(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agents.list/properties/params',
        value,
    );
}
/** Validates result8. */
export function result8(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agents.list/properties/result',
        value,
    );
}
/** Validates params9. */
export function params9(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agents.personal.list/properties/params',
        value,
    );
}
/** Validates result9. */
export function result9(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agents.personal.list/properties/result',
        value,
    );
}
/** Validates params10. */
export function params10(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agents.personal.remove/properties/params',
        value,
    );
}
/** Validates result10. */
export function result10(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agents.personal.remove/properties/result',
        value,
    );
}
/** Validates params11. */
export function params11(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agents.personal.save/properties/params',
        value,
    );
}
/** Validates result11. */
export function result11(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agents.personal.save/properties/result',
        value,
    );
}
/** Validates params12. */
export function params12(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/approvals.list/properties/params',
        value,
    );
}
/** Validates result12. */
export function result12(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/approvals.list/properties/result',
        value,
    );
}
/** Validates params13. */
export function params13(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/approvals.resolve/properties/params',
        value,
    );
}
/** Validates result13. */
export function result13(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/approvals.resolve/properties/result',
        value,
    );
}
/** Validates params14. */
export function params14(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/channels.deadLetters.list/properties/params',
        value,
    );
}
/** Validates result14. */
export function result14(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/channels.deadLetters.list/properties/result',
        value,
    );
}
/** Validates params15. */
export function params15(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/channels.list/properties/params',
        value,
    );
}
/** Validates result15. */
export function result15(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/channels.list/properties/result',
        value,
    );
}
/** Validates params16. */
export function params16(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/channels.status/properties/params',
        value,
    );
}
/** Validates result16. */
export function result16(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/channels.status/properties/result',
        value,
    );
}
/** Validates params17. */
export function params17(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/config.get/properties/params',
        value,
    );
}
/** Validates result17. */
export function result17(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/config.get/properties/result',
        value,
    );
}
/** Validates params18. */
export function params18(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/config.set/properties/params',
        value,
    );
}
/** Validates result18. */
export function result18(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/config.set/properties/result',
        value,
    );
}
/** Validates params19. */
export function params19(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/config.unset/properties/params',
        value,
    );
}
/** Validates result19. */
export function result19(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/config.unset/properties/result',
        value,
    );
}
/** Validates params20. */
export function params20(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/connect/properties/params',
        value,
    );
}
/** Validates result20. */
export function result20(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/connect/properties/result',
        value,
    );
}
/** Validates params21. */
export function params21(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.budgets/properties/params',
        value,
    );
}
/** Validates result21. */
export function result21(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.budgets/properties/result',
        value,
    );
}
/** Validates params22. */
export function params22(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.removeBudget/properties/params',
        value,
    );
}
/** Validates result22. */
export function result22(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.removeBudget/properties/result',
        value,
    );
}
/** Validates params23. */
export function params23(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.resetAllowance/properties/params',
        value,
    );
}
/** Validates result23. */
export function result23(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.resetAllowance/properties/result',
        value,
    );
}
/** Validates params24. */
export function params24(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.resetHistory/properties/params',
        value,
    );
}
/** Validates result24. */
export function result24(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.resetHistory/properties/result',
        value,
    );
}
/** Validates params25. */
export function params25(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.resets/properties/params',
        value,
    );
}
/** Validates result25. */
export function result25(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.resets/properties/result',
        value,
    );
}
/** Validates params26. */
export function params26(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.setBudget/properties/params',
        value,
    );
}
/** Validates result26. */
export function result26(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.setBudget/properties/result',
        value,
    );
}
/** Validates params27. */
export function params27(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.summary/properties/params',
        value,
    );
}
/** Validates result27. */
export function result27(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.summary/properties/result',
        value,
    );
}
/** Validates params28. */
export function params28(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.wallet/properties/params',
        value,
    );
}
/** Validates result28. */
export function result28(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.wallet/properties/result',
        value,
    );
}
/** Validates params29. */
export function params29(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.walletHistory/properties/params',
        value,
    );
}
/** Validates result29. */
export function result29(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.walletHistory/properties/result',
        value,
    );
}
/** Validates params30. */
export function params30(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/data.upload.cancel/properties/params',
        value,
    );
}
/** Validates result30. */
export function result30(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/data.upload.cancel/properties/result',
        value,
    );
}
/** Validates params31. */
export function params31(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/data.upload.chunk/properties/params',
        value,
    );
}
/** Validates result31. */
export function result31(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/data.upload.chunk/properties/result',
        value,
    );
}
/** Validates params32. */
export function params32(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/data.upload.finish/properties/params',
        value,
    );
}
/** Validates result32. */
export function result32(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/data.upload.finish/properties/result',
        value,
    );
}
/** Validates params33. */
export function params33(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/data.upload.start/properties/params',
        value,
    );
}
/** Validates result33. */
export function result33(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/data.upload.start/properties/result',
        value,
    );
}
/** Validates params34. */
export function params34(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.approve/properties/params',
        value,
    );
}
/** Validates result34. */
export function result34(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.approve/properties/result',
        value,
    );
}
/** Validates params35. */
export function params35(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.list/properties/params',
        value,
    );
}
/** Validates result35. */
export function result35(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.list/properties/result',
        value,
    );
}
/** Validates params36. */
export function params36(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.reject/properties/params',
        value,
    );
}
/** Validates result36. */
export function result36(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.reject/properties/result',
        value,
    );
}
/** Validates params37. */
export function params37(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.revoke/properties/params',
        value,
    );
}
/** Validates result37. */
export function result37(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.revoke/properties/result',
        value,
    );
}
/** Validates params38. */
export function params38(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/health/properties/params',
        value,
    );
}
/** Validates result38. */
export function result38(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/health/properties/result',
        value,
    );
}
/** Validates params39. */
export function params39(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/jobs.add/properties/params',
        value,
    );
}
/** Validates result39. */
export function result39(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/jobs.add/properties/result',
        value,
    );
}
/** Validates params40. */
export function params40(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/jobs.list/properties/params',
        value,
    );
}
/** Validates result40. */
export function result40(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/jobs.list/properties/result',
        value,
    );
}
/** Validates params41. */
export function params41(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/jobs.remove/properties/params',
        value,
    );
}
/** Validates result41. */
export function result41(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/jobs.remove/properties/result',
        value,
    );
}
/** Validates params42. */
export function params42(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/logs.tail/properties/params',
        value,
    );
}
/** Validates result42. */
export function result42(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/logs.tail/properties/result',
        value,
    );
}
/** Validates params43. */
export function params43(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/media.acknowledge/properties/params',
        value,
    );
}
/** Validates result43. */
export function result43(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/media.acknowledge/properties/result',
        value,
    );
}
/** Validates params44. */
export function params44(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/office.ownerProof/properties/params',
        value,
    );
}
/** Validates result44. */
export function result44(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/office.ownerProof/properties/result',
        value,
    );
}
/** Validates params45. */
export function params45(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/processes.input/properties/params',
        value,
    );
}
/** Validates result45. */
export function result45(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/processes.input/properties/result',
        value,
    );
}
/** Validates params46. */
export function params46(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/processes.list/properties/params',
        value,
    );
}
/** Validates result46. */
export function result46(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/processes.list/properties/result',
        value,
    );
}
/** Validates params47. */
export function params47(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/processes.log/properties/params',
        value,
    );
}
/** Validates result47. */
export function result47(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/processes.log/properties/result',
        value,
    );
}
/** Validates params48. */
export function params48(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/processes.resize/properties/params',
        value,
    );
}
/** Validates result48. */
export function result48(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/processes.resize/properties/result',
        value,
    );
}
/** Validates params49. */
export function params49(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/processes.stop/properties/params',
        value,
    );
}
/** Validates result49. */
export function result49(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/processes.stop/properties/result',
        value,
    );
}
/** Validates params50. */
export function params50(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.credentials.remove/properties/params',
        value,
    );
}
/** Validates result50. */
export function result50(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.credentials.remove/properties/result',
        value,
    );
}
/** Validates params51. */
export function params51(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.credentials.set/properties/params',
        value,
    );
}
/** Validates result51. */
export function result51(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.credentials.set/properties/result',
        value,
    );
}
/** Validates params52. */
export function params52(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.credentials.status/properties/params',
        value,
    );
}
/** Validates result52. */
export function result52(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.credentials.status/properties/result',
        value,
    );
}
/** Validates params53. */
export function params53(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.telemetry.funnel/properties/params',
        value,
    );
}
/** Validates result53. */
export function result53(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.telemetry.funnel/properties/result',
        value,
    );
}
/** Validates params54. */
export function params54(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.telemetry.performance/properties/params',
        value,
    );
}
/** Validates result54. */
export function result54(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.telemetry.performance/properties/result',
        value,
    );
}
/** Validates params55. */
export function params55(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.telemetry.projects/properties/params',
        value,
    );
}
/** Validates result55. */
export function result55(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.telemetry.projects/properties/result',
        value,
    );
}
/** Validates params56. */
export function params56(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.delete/properties/params',
        value,
    );
}
/** Validates result56. */
export function result56(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.delete/properties/result',
        value,
    );
}
/** Validates params57. */
export function params57(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.download/properties/params',
        value,
    );
}
/** Validates result57. */
export function result57(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.download/properties/result',
        value,
    );
}
/** Validates params58. */
export function params58(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.files/properties/params',
        value,
    );
}
/** Validates result58. */
export function result58(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.files/properties/result',
        value,
    );
}
/** Validates params59. */
export function params59(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.get/properties/params',
        value,
    );
}
/** Validates result59. */
export function result59(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.get/properties/result',
        value,
    );
}
/** Validates params60. */
export function params60(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.history/properties/params',
        value,
    );
}
/** Validates result60. */
export function result60(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.history/properties/result',
        value,
    );
}
/** Validates params61. */
export function params61(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.input/properties/params',
        value,
    );
}
/** Validates result61. */
export function result61(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.input/properties/result',
        value,
    );
}
/** Validates params62. */
export function params62(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.list/properties/params',
        value,
    );
}
/** Validates result62. */
export function result62(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.list/properties/result',
        value,
    );
}
/** Validates params63. */
export function params63(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.messages/properties/params',
        value,
    );
}
/** Validates result63. */
export function result63(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.messages/properties/result',
        value,
    );
}
/** Validates params64. */
export function params64(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.pin/properties/params',
        value,
    );
}
/** Validates result64. */
export function result64(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.pin/properties/result',
        value,
    );
}
/** Validates params65. */
export function params65(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.pins/properties/params',
        value,
    );
}
/** Validates result65. */
export function result65(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.pins/properties/result',
        value,
    );
}
/** Validates params66. */
export function params66(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.rename/properties/params',
        value,
    );
}
/** Validates result66. */
export function result66(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.rename/properties/result',
        value,
    );
}
/** Validates params67. */
export function params67(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.retry/properties/params',
        value,
    );
}
/** Validates result67. */
export function result67(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.retry/properties/result',
        value,
    );
}
/** Validates params68. */
export function params68(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.search/properties/params',
        value,
    );
}
/** Validates result68. */
export function result68(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.search/properties/result',
        value,
    );
}
/** Validates params69. */
export function params69(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.subscribe/properties/params',
        value,
    );
}
/** Validates result69. */
export function result69(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.subscribe/properties/result',
        value,
    );
}
/** Validates params70. */
export function params70(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.unpin/properties/params',
        value,
    );
}
/** Validates result70. */
export function result70(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.unpin/properties/result',
        value,
    );
}
/** Validates params71. */
export function params71(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.unsubscribe/properties/params',
        value,
    );
}
/** Validates result71. */
export function result71(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.unsubscribe/properties/result',
        value,
    );
}
/** Validates params72. */
export function params72(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.create/properties/params',
        value,
    );
}
/** Validates result72. */
export function result72(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.create/properties/result',
        value,
    );
}
/** Validates params73. */
export function params73(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.list/properties/params',
        value,
    );
}
/** Validates result73. */
export function result73(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.list/properties/result',
        value,
    );
}
/** Validates params74. */
export function params74(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.remove/properties/params',
        value,
    );
}
/** Validates result74. */
export function result74(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.remove/properties/result',
        value,
    );
}
/** Validates params75. */
export function params75(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.setMember/properties/params',
        value,
    );
}
/** Validates result75. */
export function result75(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.setMember/properties/result',
        value,
    );
}
/** Validates params76. */
export function params76(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.cancel/properties/params',
        value,
    );
}
/** Validates result76. */
export function result76(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.cancel/properties/result',
        value,
    );
}
/** Validates params77. */
export function params77(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.get/properties/params',
        value,
    );
}
/** Validates result77. */
export function result77(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.get/properties/result',
        value,
    );
}
/** Validates params78. */
export function params78(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.list/properties/params',
        value,
    );
}
/** Validates result78. */
export function result78(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.list/properties/result',
        value,
    );
}
/** Validates params79. */
export function params79(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.create/properties/params',
        value,
    );
}
/** Validates result79. */
export function result79(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.create/properties/result',
        value,
    );
}
/** Validates params80. */
export function params80(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.list/properties/params',
        value,
    );
}
/** Validates result80. */
export function result80(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.list/properties/result',
        value,
    );
}
/** Validates params81. */
export function params81(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.remove/properties/params',
        value,
    );
}
/** Validates result81. */
export function result81(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.remove/properties/result',
        value,
    );
}
/** Validates params82. */
export function params82(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.setMember/properties/params',
        value,
    );
}
/** Validates result82. */
export function result82(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.setMember/properties/result',
        value,
    );
}
/** Validates params83. */
export function params83(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.audio/properties/params',
        value,
    );
}
/** Validates result83. */
export function result83(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.audio/properties/result',
        value,
    );
}
/** Validates params84. */
export function params84(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.start/properties/params',
        value,
    );
}
/** Validates result84. */
export function result84(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.start/properties/result',
        value,
    );
}
/** Validates params85. */
export function params85(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.stop/properties/params',
        value,
    );
}
/** Validates result85. */
export function result85(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.stop/properties/result',
        value,
    );
}
/** Validates params86. */
export function params86(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.catalog/properties/params',
        value,
    );
}
/** Validates result86. */
export function result86(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.catalog/properties/result',
        value,
    );
}
/** Validates params87. */
export function params87(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.create/properties/params',
        value,
    );
}
/** Validates result87. */
export function result87(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.create/properties/result',
        value,
    );
}
/** Validates params88. */
export function params88(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.list/properties/params',
        value,
    );
}
/** Validates result88. */
export function result88(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.list/properties/result',
        value,
    );
}
/** Validates params89. */
export function params89(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models/properties/params',
        value,
    );
}
/** Validates result89. */
export function result89(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models/properties/result',
        value,
    );
}
/** Validates params90. */
export function params90(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.image.quote/properties/params',
        value,
    );
}
/** Validates result90. */
export function result90(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.image.quote/properties/result',
        value,
    );
}
/** Validates params91. */
export function params91(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.image.resolve/properties/params',
        value,
    );
}
/** Validates result91. */
export function result91(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.image.resolve/properties/result',
        value,
    );
}
/** Validates params92. */
export function params92(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.refresh/properties/params',
        value,
    );
}
/** Validates result92. */
export function result92(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.refresh/properties/result',
        value,
    );
}
/** Validates params93. */
export function params93(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.resolve/properties/params',
        value,
    );
}
/** Validates result93. */
export function result93(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.resolve/properties/result',
        value,
    );
}
/** Validates params94. */
export function params94(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.cancel/properties/params',
        value,
    );
}
/** Validates result94. */
export function result94(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.cancel/properties/result',
        value,
    );
}
/** Validates params95. */
export function params95(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.history/properties/params',
        value,
    );
}
/** Validates result95. */
export function result95(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.history/properties/result',
        value,
    );
}
/** Validates params96. */
export function params96(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.read/properties/params',
        value,
    );
}
/** Validates result96. */
export function result96(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.read/properties/result',
        value,
    );
}
/** Validates params97. */
export function params97(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.send/properties/params',
        value,
    );
}
/** Validates result97. */
export function result97(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.send/properties/result',
        value,
    );
}
/** Validates params98. */
export function params98(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.sources/properties/params',
        value,
    );
}
/** Validates result98. */
export function result98(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.sources/properties/result',
        value,
    );
}
/** Validates params99. */
export function params99(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.read/properties/params',
        value,
    );
}
/** Validates result99. */
export function result99(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.read/properties/result',
        value,
    );
}
/** Validates params100. */
export function params100(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.record/properties/params',
        value,
    );
}
/** Validates result100. */
export function result100(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.record/properties/result',
        value,
    );
}
/** Validates params101. */
export function params101(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.artifact/properties/params',
        value,
    );
}
/** Validates result101. */
export function result101(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.artifact/properties/result',
        value,
    );
}
/** Validates params102. */
export function params102(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.cancel/properties/params',
        value,
    );
}
/** Validates result102. */
export function result102(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.cancel/properties/result',
        value,
    );
}
/** Validates params103. */
export function params103(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.events/properties/params',
        value,
    );
}
/** Validates result103. */
export function result103(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.events/properties/result',
        value,
    );
}
/** Validates params104. */
export function params104(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.list/properties/params',
        value,
    );
}
/** Validates result104. */
export function result104(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.list/properties/result',
        value,
    );
}
/** Validates params105. */
export function params105(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.output/properties/params',
        value,
    );
}
/** Validates result105. */
export function result105(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.output/properties/result',
        value,
    );
}
/** Validates params106. */
export function params106(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.read/properties/params',
        value,
    );
}
/** Validates result106. */
export function result106(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.read/properties/result',
        value,
    );
}
/** Validates params107. */
export function params107(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.start/properties/params',
        value,
    );
}
/** Validates result107. */
export function result107(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.start/properties/result',
        value,
    );
}
/** Validates params108. */
export function params108(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.steps/properties/params',
        value,
    );
}
/** Validates result108. */
export function result108(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.steps/properties/result',
        value,
    );
}
/** Validates params109. */
export function params109(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.save/properties/params',
        value,
    );
}
/** Validates result109. */
export function result109(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.save/properties/result',
        value,
    );
}
/** Validates params110. */
export function params110(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.validate/properties/params',
        value,
    );
}
/** Validates result110. */
export function result110(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.validate/properties/result',
        value,
    );
}
/** Validates params111. */
export function params111(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.create/properties/params',
        value,
    );
}
/** Validates result111. */
export function result111(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.create/properties/result',
        value,
    );
}
/** Validates params112. */
export function params112(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.describe/properties/params',
        value,
    );
}
/** Validates result112. */
export function result112(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.describe/properties/result',
        value,
    );
}
/** Validates params113. */
export function params113(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.destroy/properties/params',
        value,
    );
}
/** Validates result113. */
export function result113(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.destroy/properties/result',
        value,
    );
}
/** Validates params114. */
export function params114(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.list/properties/params',
        value,
    );
}
/** Validates result114. */
export function result114(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.list/properties/result',
        value,
    );
}
