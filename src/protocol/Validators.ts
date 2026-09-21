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
/** Validates methods. */
export function methods(value: unknown): value is protocol.GatewayMethods {
    return validator.validate('#/definitions/GatewayMethods', value);
}
/** Validates native. */
export function native(value: unknown): value is protocol.NcapDelta {
    return validator.validate('#/definitions/NcapDelta', value);
}
/** Validates sessionMessage. */
export function sessionMessage(value: unknown): value is protocol.SessionMessageData {
    return validator.validate('#/definitions/SessionMessageData', value);
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
        '#/definitions/GatewayMethods/properties/agent.stream/properties/params',
        value,
    );
}
/** Validates result5. */
export function result5(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agent.stream/properties/result',
        value,
    );
}
/** Validates params6. */
export function params6(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agents.define/properties/params',
        value,
    );
}
/** Validates result6. */
export function result6(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agents.define/properties/result',
        value,
    );
}
/** Validates params7. */
export function params7(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agents.list/properties/params',
        value,
    );
}
/** Validates result7. */
export function result7(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/agents.list/properties/result',
        value,
    );
}
/** Validates params8. */
export function params8(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/approvals.list/properties/params',
        value,
    );
}
/** Validates result8. */
export function result8(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/approvals.list/properties/result',
        value,
    );
}
/** Validates params9. */
export function params9(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/approvals.resolve/properties/params',
        value,
    );
}
/** Validates result9. */
export function result9(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/approvals.resolve/properties/result',
        value,
    );
}
/** Validates params10. */
export function params10(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/channels.deadLetters.list/properties/params',
        value,
    );
}
/** Validates result10. */
export function result10(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/channels.deadLetters.list/properties/result',
        value,
    );
}
/** Validates params11. */
export function params11(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/channels.list/properties/params',
        value,
    );
}
/** Validates result11. */
export function result11(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/channels.list/properties/result',
        value,
    );
}
/** Validates params12. */
export function params12(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/channels.status/properties/params',
        value,
    );
}
/** Validates result12. */
export function result12(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/channels.status/properties/result',
        value,
    );
}
/** Validates params13. */
export function params13(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/config.get/properties/params',
        value,
    );
}
/** Validates result13. */
export function result13(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/config.get/properties/result',
        value,
    );
}
/** Validates params14. */
export function params14(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/config.set/properties/params',
        value,
    );
}
/** Validates result14. */
export function result14(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/config.set/properties/result',
        value,
    );
}
/** Validates params15. */
export function params15(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/config.unset/properties/params',
        value,
    );
}
/** Validates result15. */
export function result15(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/config.unset/properties/result',
        value,
    );
}
/** Validates params16. */
export function params16(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/connect/properties/params',
        value,
    );
}
/** Validates result16. */
export function result16(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/connect/properties/result',
        value,
    );
}
/** Validates params17. */
export function params17(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.budgets/properties/params',
        value,
    );
}
/** Validates result17. */
export function result17(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.budgets/properties/result',
        value,
    );
}
/** Validates params18. */
export function params18(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.removeBudget/properties/params',
        value,
    );
}
/** Validates result18. */
export function result18(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.removeBudget/properties/result',
        value,
    );
}
/** Validates params19. */
export function params19(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.setBudget/properties/params',
        value,
    );
}
/** Validates result19. */
export function result19(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.setBudget/properties/result',
        value,
    );
}
/** Validates params20. */
export function params20(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.summary/properties/params',
        value,
    );
}
/** Validates result20. */
export function result20(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/credit.summary/properties/result',
        value,
    );
}
/** Validates params21. */
export function params21(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.approve/properties/params',
        value,
    );
}
/** Validates result21. */
export function result21(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.approve/properties/result',
        value,
    );
}
/** Validates params22. */
export function params22(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.list/properties/params',
        value,
    );
}
/** Validates result22. */
export function result22(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.list/properties/result',
        value,
    );
}
/** Validates params23. */
export function params23(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.reject/properties/params',
        value,
    );
}
/** Validates result23. */
export function result23(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.reject/properties/result',
        value,
    );
}
/** Validates params24. */
export function params24(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.revoke/properties/params',
        value,
    );
}
/** Validates result24. */
export function result24(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/devices.revoke/properties/result',
        value,
    );
}
/** Validates params25. */
export function params25(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/health/properties/params',
        value,
    );
}
/** Validates result25. */
export function result25(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/health/properties/result',
        value,
    );
}
/** Validates params26. */
export function params26(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/jobs.add/properties/params',
        value,
    );
}
/** Validates result26. */
export function result26(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/jobs.add/properties/result',
        value,
    );
}
/** Validates params27. */
export function params27(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/jobs.list/properties/params',
        value,
    );
}
/** Validates result27. */
export function result27(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/jobs.list/properties/result',
        value,
    );
}
/** Validates params28. */
export function params28(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/jobs.remove/properties/params',
        value,
    );
}
/** Validates result28. */
export function result28(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/jobs.remove/properties/result',
        value,
    );
}
/** Validates params29. */
export function params29(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/logs.tail/properties/params',
        value,
    );
}
/** Validates result29. */
export function result29(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/logs.tail/properties/result',
        value,
    );
}
/** Validates params30. */
export function params30(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.delete/properties/params',
        value,
    );
}
/** Validates result30. */
export function result30(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.delete/properties/result',
        value,
    );
}
/** Validates params31. */
export function params31(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.get/properties/params',
        value,
    );
}
/** Validates result31. */
export function result31(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.get/properties/result',
        value,
    );
}
/** Validates params32. */
export function params32(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.list/properties/params',
        value,
    );
}
/** Validates result32. */
export function result32(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.list/properties/result',
        value,
    );
}
/** Validates params33. */
export function params33(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.messages/properties/params',
        value,
    );
}
/** Validates result33. */
export function result33(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.messages/properties/result',
        value,
    );
}
/** Validates params34. */
export function params34(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.subscribe/properties/params',
        value,
    );
}
/** Validates result34. */
export function result34(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.subscribe/properties/result',
        value,
    );
}
/** Validates params35. */
export function params35(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.unsubscribe/properties/params',
        value,
    );
}
/** Validates result35. */
export function result35(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.unsubscribe/properties/result',
        value,
    );
}
/** Validates params36. */
export function params36(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.create/properties/params',
        value,
    );
}
/** Validates result36. */
export function result36(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.create/properties/result',
        value,
    );
}
/** Validates params37. */
export function params37(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.list/properties/params',
        value,
    );
}
/** Validates result37. */
export function result37(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.list/properties/result',
        value,
    );
}
/** Validates params38. */
export function params38(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.remove/properties/params',
        value,
    );
}
/** Validates result38. */
export function result38(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.remove/properties/result',
        value,
    );
}
/** Validates params39. */
export function params39(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.setMember/properties/params',
        value,
    );
}
/** Validates result39. */
export function result39(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.setMember/properties/result',
        value,
    );
}
/** Validates params40. */
export function params40(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.cancel/properties/params',
        value,
    );
}
/** Validates result40. */
export function result40(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.cancel/properties/result',
        value,
    );
}
/** Validates params41. */
export function params41(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.get/properties/params',
        value,
    );
}
/** Validates result41. */
export function result41(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.get/properties/result',
        value,
    );
}
/** Validates params42. */
export function params42(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.list/properties/params',
        value,
    );
}
/** Validates result42. */
export function result42(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.list/properties/result',
        value,
    );
}
/** Validates params43. */
export function params43(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.create/properties/params',
        value,
    );
}
/** Validates result43. */
export function result43(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.create/properties/result',
        value,
    );
}
/** Validates params44. */
export function params44(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.list/properties/params',
        value,
    );
}
/** Validates result44. */
export function result44(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.list/properties/result',
        value,
    );
}
/** Validates params45. */
export function params45(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.remove/properties/params',
        value,
    );
}
/** Validates result45. */
export function result45(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.remove/properties/result',
        value,
    );
}
/** Validates params46. */
export function params46(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.setMember/properties/params',
        value,
    );
}
/** Validates result46. */
export function result46(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.setMember/properties/result',
        value,
    );
}
/** Validates params47. */
export function params47(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.audio/properties/params',
        value,
    );
}
/** Validates result47. */
export function result47(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.audio/properties/result',
        value,
    );
}
/** Validates params48. */
export function params48(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.start/properties/params',
        value,
    );
}
/** Validates result48. */
export function result48(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.start/properties/result',
        value,
    );
}
/** Validates params49. */
export function params49(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.stop/properties/params',
        value,
    );
}
/** Validates result49. */
export function result49(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.stop/properties/result',
        value,
    );
}
/** Validates params50. */
export function params50(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.create/properties/params',
        value,
    );
}
/** Validates result50. */
export function result50(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.create/properties/result',
        value,
    );
}
/** Validates params51. */
export function params51(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.describe/properties/params',
        value,
    );
}
/** Validates result51. */
export function result51(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.describe/properties/result',
        value,
    );
}
/** Validates params52. */
export function params52(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.destroy/properties/params',
        value,
    );
}
/** Validates result52. */
export function result52(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.destroy/properties/result',
        value,
    );
}
/** Validates params53. */
export function params53(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.list/properties/params',
        value,
    );
}
/** Validates result53. */
export function result53(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.list/properties/result',
        value,
    );
}
