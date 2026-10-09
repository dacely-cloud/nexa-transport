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
/** Validates reverseBrowser. */
export function reverseBrowser(value: unknown): value is protocol.ReverseBrowserPage {
    return validator.validate('#/definitions/ReverseBrowserPage', value);
}
/** Validates reverseBrowserModules. */
export function reverseBrowserModules(value: unknown): value is protocol.BrowserModulePage {
    return validator.validate('#/definitions/BrowserModulePage', value);
}
/** Validates reverseBrowserScreenshot. */
export function reverseBrowserScreenshot(value: unknown): value is protocol.BrowserScreenshotPage {
    return validator.validate('#/definitions/BrowserScreenshotPage', value);
}
/** Validates reverseBrowserSources. */
export function reverseBrowserSources(value: unknown): value is protocol.BrowserSourcesPage {
    return validator.validate('#/definitions/BrowserSourcesPage', value);
}
/** Validates reverseBrowserStorage. */
export function reverseBrowserStorage(value: unknown): value is protocol.BrowserStoragePage {
    return validator.validate('#/definitions/BrowserStoragePage', value);
}
/** Validates reverseBrowserStorageComparison. */
export function reverseBrowserStorageComparison(
    value: unknown,
): value is protocol.BrowserStorageComparisonPage {
    return validator.validate('#/definitions/BrowserStorageComparisonPage', value);
}
/** Validates reverseBrowserStructure. */
export function reverseBrowserStructure(value: unknown): value is protocol.BrowserStructurePage {
    return validator.validate('#/definitions/BrowserStructurePage', value);
}
/** Validates reverseBrowserWebMcp. */
export function reverseBrowserWebMcp(value: unknown): value is protocol.BrowserWebMcpPage {
    return validator.validate('#/definitions/BrowserWebMcpPage', value);
}
/** Validates reverseCatalog. */
export function reverseCatalog(value: unknown): value is protocol.ReverseCatalogPage {
    return validator.validate('#/definitions/ReverseCatalogPage', value);
}
/** Validates reverseEvidence. */
export function reverseEvidence(value: unknown): value is protocol.ReverseEvidencePage {
    return validator.validate('#/definitions/ReverseEvidencePage', value);
}
/** Validates reverseFunctions. */
export function reverseFunctions(value: unknown): value is protocol.ReverseFunctionsPage {
    return validator.validate('#/definitions/ReverseFunctionsPage', value);
}
/** Validates reverseGraph. */
export function reverseGraph(value: unknown): value is protocol.ReverseGraphPage {
    return validator.validate('#/definitions/ReverseGraphPage', value);
}
/** Validates reverseInspection. */
export function reverseInspection(value: unknown): value is protocol.ReverseInspectResult {
    return validator.validate('#/definitions/ReverseInspectResult', value);
}
/** Validates reverseNetworkDetail. */
export function reverseNetworkDetail(value: unknown): value is protocol.ReverseNetworkDetailPage {
    return validator.validate('#/definitions/ReverseNetworkDetailPage', value);
}
/** Validates reverseNetworkDirectory. */
export function reverseNetworkDirectory(
    value: unknown,
): value is protocol.ReverseNetworkDirectoryPage {
    return validator.validate('#/definitions/ReverseNetworkDirectoryPage', value);
}
/** Validates reverseSnapshot. */
export function reverseSnapshot(value: unknown): value is protocol.ReverseRunSnapshot {
    return validator.validate('#/definitions/ReverseRunSnapshot', value);
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
        '#/definitions/GatewayMethods/properties/reverse.browser/properties/params',
        value,
    );
}
/** Validates result50. */
export function result50(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.browser/properties/result',
        value,
    );
}
/** Validates params51. */
export function params51(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.browser.modules/properties/params',
        value,
    );
}
/** Validates result51. */
export function result51(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.browser.modules/properties/result',
        value,
    );
}
/** Validates params52. */
export function params52(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.browser.screenshot/properties/params',
        value,
    );
}
/** Validates result52. */
export function result52(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.browser.screenshot/properties/result',
        value,
    );
}
/** Validates params53. */
export function params53(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.browser.sources/properties/params',
        value,
    );
}
/** Validates result53. */
export function result53(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.browser.sources/properties/result',
        value,
    );
}
/** Validates params54. */
export function params54(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.browser.storage/properties/params',
        value,
    );
}
/** Validates result54. */
export function result54(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.browser.storage/properties/result',
        value,
    );
}
/** Validates params55. */
export function params55(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.browser.storage.comparison/properties/params',
        value,
    );
}
/** Validates result55. */
export function result55(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.browser.storage.comparison/properties/result',
        value,
    );
}
/** Validates params56. */
export function params56(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.browser.structure/properties/params',
        value,
    );
}
/** Validates result56. */
export function result56(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.browser.structure/properties/result',
        value,
    );
}
/** Validates params57. */
export function params57(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.browser.webmcp/properties/params',
        value,
    );
}
/** Validates result57. */
export function result57(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.browser.webmcp/properties/result',
        value,
    );
}
/** Validates params58. */
export function params58(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.catalog/properties/params',
        value,
    );
}
/** Validates result58. */
export function result58(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.catalog/properties/result',
        value,
    );
}
/** Validates params59. */
export function params59(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.evidence/properties/params',
        value,
    );
}
/** Validates result59. */
export function result59(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.evidence/properties/result',
        value,
    );
}
/** Validates params60. */
export function params60(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.functions/properties/params',
        value,
    );
}
/** Validates result60. */
export function result60(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.functions/properties/result',
        value,
    );
}
/** Validates params61. */
export function params61(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.graph/properties/params',
        value,
    );
}
/** Validates result61. */
export function result61(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.graph/properties/result',
        value,
    );
}
/** Validates params62. */
export function params62(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.inspect/properties/params',
        value,
    );
}
/** Validates result62. */
export function result62(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.inspect/properties/result',
        value,
    );
}
/** Validates params63. */
export function params63(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.network/properties/params',
        value,
    );
}
/** Validates result63. */
export function result63(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.network/properties/result',
        value,
    );
}
/** Validates params64. */
export function params64(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.network.detail/properties/params',
        value,
    );
}
/** Validates result64. */
export function result64(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/reverse.network.detail/properties/result',
        value,
    );
}
/** Validates params65. */
export function params65(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.credentials.remove/properties/params',
        value,
    );
}
/** Validates result65. */
export function result65(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.credentials.remove/properties/result',
        value,
    );
}
/** Validates params66. */
export function params66(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.credentials.set/properties/params',
        value,
    );
}
/** Validates result66. */
export function result66(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.credentials.set/properties/result',
        value,
    );
}
/** Validates params67. */
export function params67(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.credentials.status/properties/params',
        value,
    );
}
/** Validates result67. */
export function result67(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.credentials.status/properties/result',
        value,
    );
}
/** Validates params68. */
export function params68(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.telemetry.funnel/properties/params',
        value,
    );
}
/** Validates result68. */
export function result68(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.telemetry.funnel/properties/result',
        value,
    );
}
/** Validates params69. */
export function params69(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.telemetry.performance/properties/params',
        value,
    );
}
/** Validates result69. */
export function result69(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.telemetry.performance/properties/result',
        value,
    );
}
/** Validates params70. */
export function params70(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.telemetry.projects/properties/params',
        value,
    );
}
/** Validates result70. */
export function result70(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/roblox.telemetry.projects/properties/result',
        value,
    );
}
/** Validates params71. */
export function params71(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.delete/properties/params',
        value,
    );
}
/** Validates result71. */
export function result71(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.delete/properties/result',
        value,
    );
}
/** Validates params72. */
export function params72(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.download/properties/params',
        value,
    );
}
/** Validates result72. */
export function result72(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.download/properties/result',
        value,
    );
}
/** Validates params73. */
export function params73(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.files/properties/params',
        value,
    );
}
/** Validates result73. */
export function result73(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.files/properties/result',
        value,
    );
}
/** Validates params74. */
export function params74(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.get/properties/params',
        value,
    );
}
/** Validates result74. */
export function result74(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.get/properties/result',
        value,
    );
}
/** Validates params75. */
export function params75(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.input/properties/params',
        value,
    );
}
/** Validates result75. */
export function result75(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.input/properties/result',
        value,
    );
}
/** Validates params76. */
export function params76(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.list/properties/params',
        value,
    );
}
/** Validates result76. */
export function result76(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.list/properties/result',
        value,
    );
}
/** Validates params77. */
export function params77(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.messages/properties/params',
        value,
    );
}
/** Validates result77. */
export function result77(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.messages/properties/result',
        value,
    );
}
/** Validates params78. */
export function params78(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.pin/properties/params',
        value,
    );
}
/** Validates result78. */
export function result78(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.pin/properties/result',
        value,
    );
}
/** Validates params79. */
export function params79(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.pins/properties/params',
        value,
    );
}
/** Validates result79. */
export function result79(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.pins/properties/result',
        value,
    );
}
/** Validates params80. */
export function params80(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.rename/properties/params',
        value,
    );
}
/** Validates result80. */
export function result80(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.rename/properties/result',
        value,
    );
}
/** Validates params81. */
export function params81(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.retry/properties/params',
        value,
    );
}
/** Validates result81. */
export function result81(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.retry/properties/result',
        value,
    );
}
/** Validates params82. */
export function params82(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.subscribe/properties/params',
        value,
    );
}
/** Validates result82. */
export function result82(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.subscribe/properties/result',
        value,
    );
}
/** Validates params83. */
export function params83(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.transcript/properties/params',
        value,
    );
}
/** Validates result83. */
export function result83(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.transcript/properties/result',
        value,
    );
}
/** Validates params84. */
export function params84(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.unpin/properties/params',
        value,
    );
}
/** Validates result84. */
export function result84(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.unpin/properties/result',
        value,
    );
}
/** Validates params85. */
export function params85(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.unsubscribe/properties/params',
        value,
    );
}
/** Validates result85. */
export function result85(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/sessions.unsubscribe/properties/result',
        value,
    );
}
/** Validates params86. */
export function params86(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.create/properties/params',
        value,
    );
}
/** Validates result86. */
export function result86(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.create/properties/result',
        value,
    );
}
/** Validates params87. */
export function params87(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.list/properties/params',
        value,
    );
}
/** Validates result87. */
export function result87(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.list/properties/result',
        value,
    );
}
/** Validates params88. */
export function params88(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.remove/properties/params',
        value,
    );
}
/** Validates result88. */
export function result88(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.remove/properties/result',
        value,
    );
}
/** Validates params89. */
export function params89(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.setMember/properties/params',
        value,
    );
}
/** Validates result89. */
export function result89(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/shares.setMember/properties/result',
        value,
    );
}
/** Validates params90. */
export function params90(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.cancel/properties/params',
        value,
    );
}
/** Validates result90. */
export function result90(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.cancel/properties/result',
        value,
    );
}
/** Validates params91. */
export function params91(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.get/properties/params',
        value,
    );
}
/** Validates result91. */
export function result91(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.get/properties/result',
        value,
    );
}
/** Validates params92. */
export function params92(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.list/properties/params',
        value,
    );
}
/** Validates result92. */
export function result92(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/tasks.list/properties/result',
        value,
    );
}
/** Validates params93. */
export function params93(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.create/properties/params',
        value,
    );
}
/** Validates result93. */
export function result93(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.create/properties/result',
        value,
    );
}
/** Validates params94. */
export function params94(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.list/properties/params',
        value,
    );
}
/** Validates result94. */
export function result94(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.list/properties/result',
        value,
    );
}
/** Validates params95. */
export function params95(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.remove/properties/params',
        value,
    );
}
/** Validates result95. */
export function result95(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.remove/properties/result',
        value,
    );
}
/** Validates params96. */
export function params96(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.setMember/properties/params',
        value,
    );
}
/** Validates result96. */
export function result96(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/teams.setMember/properties/result',
        value,
    );
}
/** Validates params97. */
export function params97(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.audio/properties/params',
        value,
    );
}
/** Validates result97. */
export function result97(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.audio/properties/result',
        value,
    );
}
/** Validates params98. */
export function params98(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.start/properties/params',
        value,
    );
}
/** Validates result98. */
export function result98(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.start/properties/result',
        value,
    );
}
/** Validates params99. */
export function params99(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.stop/properties/params',
        value,
    );
}
/** Validates result99. */
export function result99(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/voice.stop/properties/result',
        value,
    );
}
/** Validates params100. */
export function params100(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.attention.list/properties/params',
        value,
    );
}
/** Validates result100. */
export function result100(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.attention.list/properties/result',
        value,
    );
}
/** Validates params101. */
export function params101(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.catalog/properties/params',
        value,
    );
}
/** Validates result101. */
export function result101(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.catalog/properties/result',
        value,
    );
}
/** Validates params102. */
export function params102(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.create/properties/params',
        value,
    );
}
/** Validates result102. */
export function result102(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.create/properties/result',
        value,
    );
}
/** Validates params103. */
export function params103(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.delete/properties/params',
        value,
    );
}
/** Validates result103. */
export function result103(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.delete/properties/result',
        value,
    );
}
/** Validates params104. */
export function params104(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.list/properties/params',
        value,
    );
}
/** Validates result104. */
export function result104(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.list/properties/result',
        value,
    );
}
/** Validates params105. */
export function params105(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models/properties/params',
        value,
    );
}
/** Validates result105. */
export function result105(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models/properties/result',
        value,
    );
}
/** Validates params106. */
export function params106(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.image.quote/properties/params',
        value,
    );
}
/** Validates result106. */
export function result106(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.image.quote/properties/result',
        value,
    );
}
/** Validates params107. */
export function params107(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.image.resolve/properties/params',
        value,
    );
}
/** Validates result107. */
export function result107(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.image.resolve/properties/result',
        value,
    );
}
/** Validates params108. */
export function params108(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.refresh/properties/params',
        value,
    );
}
/** Validates result108. */
export function result108(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.refresh/properties/result',
        value,
    );
}
/** Validates params109. */
export function params109(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.resolve/properties/params',
        value,
    );
}
/** Validates result109. */
export function result109(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.models.resolve/properties/result',
        value,
    );
}
/** Validates params110. */
export function params110(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.cancel/properties/params',
        value,
    );
}
/** Validates result110. */
export function result110(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.cancel/properties/result',
        value,
    );
}
/** Validates params111. */
export function params111(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.history/properties/params',
        value,
    );
}
/** Validates result111. */
export function result111(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.history/properties/result',
        value,
    );
}
/** Validates params112. */
export function params112(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.read/properties/params',
        value,
    );
}
/** Validates result112. */
export function result112(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.read/properties/result',
        value,
    );
}
/** Validates params113. */
export function params113(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.send/properties/params',
        value,
    );
}
/** Validates result113. */
export function result113(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.send/properties/result',
        value,
    );
}
/** Validates params114. */
export function params114(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.sources/properties/params',
        value,
    );
}
/** Validates result114. */
export function result114(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.planning.sources/properties/result',
        value,
    );
}
/** Validates params115. */
export function params115(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.publications.check/properties/params',
        value,
    );
}
/** Validates result115. */
export function result115(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.publications.check/properties/result',
        value,
    );
}
/** Validates params116. */
export function params116(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.publications.list/properties/params',
        value,
    );
}
/** Validates result116. */
export function result116(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.publications.list/properties/result',
        value,
    );
}
/** Validates params117. */
export function params117(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.publications.publish/properties/params',
        value,
    );
}
/** Validates result117. */
export function result117(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.publications.publish/properties/result',
        value,
    );
}
/** Validates params118. */
export function params118(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.publications.read/properties/params',
        value,
    );
}
/** Validates result118. */
export function result118(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.publications.read/properties/result',
        value,
    );
}
/** Validates params119. */
export function params119(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.publications.run/properties/params',
        value,
    );
}
/** Validates result119. */
export function result119(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.publications.run/properties/result',
        value,
    );
}
/** Validates params120. */
export function params120(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.read/properties/params',
        value,
    );
}
/** Validates result120. */
export function result120(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.read/properties/result',
        value,
    );
}
/** Validates params121. */
export function params121(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.record/properties/params',
        value,
    );
}
/** Validates result121. */
export function result121(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.record/properties/result',
        value,
    );
}
/** Validates params122. */
export function params122(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.records/properties/params',
        value,
    );
}
/** Validates result122. */
export function result122(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.records/properties/result',
        value,
    );
}
/** Validates params123. */
export function params123(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.agent.control/properties/params',
        value,
    );
}
/** Validates result123. */
export function result123(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.agent.control/properties/result',
        value,
    );
}
/** Validates params124. */
export function params124(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.agent.input/properties/params',
        value,
    );
}
/** Validates result124. */
export function result124(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.agent.input/properties/result',
        value,
    );
}
/** Validates params125. */
export function params125(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.agent.read/properties/params',
        value,
    );
}
/** Validates result125. */
export function result125(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.agent.read/properties/result',
        value,
    );
}
/** Validates params126. */
export function params126(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.applications.check/properties/params',
        value,
    );
}
/** Validates result126. */
export function result126(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.applications.check/properties/result',
        value,
    );
}
/** Validates params127. */
export function params127(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.applications.setup/properties/params',
        value,
    );
}
/** Validates result127. */
export function result127(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.applications.setup/properties/result',
        value,
    );
}
/** Validates params128. */
export function params128(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.approval.decide/properties/params',
        value,
    );
}
/** Validates result128. */
export function result128(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.approval.decide/properties/result',
        value,
    );
}
/** Validates params129. */
export function params129(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.artifact/properties/params',
        value,
    );
}
/** Validates result129. */
export function result129(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.artifact/properties/result',
        value,
    );
}
/** Validates params130. */
export function params130(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.artifacts/properties/params',
        value,
    );
}
/** Validates result130. */
export function result130(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.artifacts/properties/result',
        value,
    );
}
/** Validates params131. */
export function params131(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.attempts/properties/params',
        value,
    );
}
/** Validates result131. */
export function result131(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.attempts/properties/result',
        value,
    );
}
/** Validates params132. */
export function params132(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.cancel/properties/params',
        value,
    );
}
/** Validates result132. */
export function result132(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.cancel/properties/result',
        value,
    );
}
/** Validates params133. */
export function params133(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.events/properties/params',
        value,
    );
}
/** Validates result133. */
export function result133(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.events/properties/result',
        value,
    );
}
/** Validates params134. */
export function params134(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.inputs/properties/params',
        value,
    );
}
/** Validates result134. */
export function result134(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.inputs/properties/result',
        value,
    );
}
/** Validates params135. */
export function params135(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.list/properties/params',
        value,
    );
}
/** Validates result135. */
export function result135(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.list/properties/result',
        value,
    );
}
/** Validates params136. */
export function params136(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.loopPricing/properties/params',
        value,
    );
}
/** Validates result136. */
export function result136(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.loopPricing/properties/result',
        value,
    );
}
/** Validates params137. */
export function params137(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.loopSpending/properties/params',
        value,
    );
}
/** Validates result137. */
export function result137(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.loopSpending/properties/result',
        value,
    );
}
/** Validates params138. */
export function params138(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.output/properties/params',
        value,
    );
}
/** Validates result138. */
export function result138(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.output/properties/result',
        value,
    );
}
/** Validates params139. */
export function params139(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.question.answer/properties/params',
        value,
    );
}
/** Validates result139. */
export function result139(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.question.answer/properties/result',
        value,
    );
}
/** Validates params140. */
export function params140(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.question.read/properties/params',
        value,
    );
}
/** Validates result140. */
export function result140(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.question.read/properties/result',
        value,
    );
}
/** Validates params141. */
export function params141(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.questions/properties/params',
        value,
    );
}
/** Validates result141. */
export function result141(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.questions/properties/result',
        value,
    );
}
/** Validates params142. */
export function params142(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.read/properties/params',
        value,
    );
}
/** Validates result142. */
export function result142(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.read/properties/result',
        value,
    );
}
/** Validates params143. */
export function params143(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.start/properties/params',
        value,
    );
}
/** Validates result143. */
export function result143(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.start/properties/result',
        value,
    );
}
/** Validates params144. */
export function params144(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.steps/properties/params',
        value,
    );
}
/** Validates result144. */
export function result144(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.steps/properties/result',
        value,
    );
}
/** Validates params145. */
export function params145(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.terminal.command/properties/params',
        value,
    );
}
/** Validates result145. */
export function result145(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.terminal.command/properties/result',
        value,
    );
}
/** Validates params146. */
export function params146(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.terminal.read/properties/params',
        value,
    );
}
/** Validates result146. */
export function result146(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.terminal.read/properties/result',
        value,
    );
}
/** Validates params147. */
export function params147(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.usage/properties/params',
        value,
    );
}
/** Validates result147. */
export function result147(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.usage/properties/result',
        value,
    );
}
/** Validates params148. */
export function params148(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.usageBreakdown/properties/params',
        value,
    );
}
/** Validates result148. */
export function result148(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.runs.usageBreakdown/properties/result',
        value,
    );
}
/** Validates params149. */
export function params149(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.save/properties/params',
        value,
    );
}
/** Validates result149. */
export function result149(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.save/properties/result',
        value,
    );
}
/** Validates params150. */
export function params150(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.schedules.disable/properties/params',
        value,
    );
}
/** Validates result150. */
export function result150(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.schedules.disable/properties/result',
        value,
    );
}
/** Validates params151. */
export function params151(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.schedules.enable/properties/params',
        value,
    );
}
/** Validates result151. */
export function result151(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.schedules.enable/properties/result',
        value,
    );
}
/** Validates params152. */
export function params152(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.schedules.preview/properties/params',
        value,
    );
}
/** Validates result152. */
export function result152(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.schedules.preview/properties/result',
        value,
    );
}
/** Validates params153. */
export function params153(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.schedules.read/properties/params',
        value,
    );
}
/** Validates result153. */
export function result153(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.schedules.read/properties/result',
        value,
    );
}
/** Validates params154. */
export function params154(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.validate/properties/params',
        value,
    );
}
/** Validates result154. */
export function result154(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workflows.validate/properties/result',
        value,
    );
}
/** Validates params155. */
export function params155(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.create/properties/params',
        value,
    );
}
/** Validates result155. */
export function result155(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.create/properties/result',
        value,
    );
}
/** Validates params156. */
export function params156(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.describe/properties/params',
        value,
    );
}
/** Validates result156. */
export function result156(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.describe/properties/result',
        value,
    );
}
/** Validates params157. */
export function params157(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.destroy/properties/params',
        value,
    );
}
/** Validates result157. */
export function result157(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.destroy/properties/result',
        value,
    );
}
/** Validates params158. */
export function params158(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.list/properties/params',
        value,
    );
}
/** Validates result158. */
export function result158(value: unknown): boolean {
    return validator.validate(
        '#/definitions/GatewayMethods/properties/workspaces.list/properties/result',
        value,
    );
}
