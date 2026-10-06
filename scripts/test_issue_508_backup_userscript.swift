import Foundation
import wBlockCoreService

@main
struct Issue508BackupUserScriptTests {
    static func main() {
        var stable = UserScript(name: "Display Override", content: "source")
        stable.isLocal = true
        stable.localImportIdentity = "file:/tmp/source.user.js"
        stable.category = .custom
        var other = UserScript(name: "Display Override", content: "other")
        other.isLocal = true
        other.localImportIdentity = "file:/tmp/other.user.js"
        check(UserScriptRestoreMatcher.matchingIndex(for: stable, in: [other, stable]) == 1,
              "backup host restoration must prefer stable identity over display name")
        var legacyOne = UserScript(name: "Duplicate", content: "one")
        legacyOne.isLocal = true
        var legacyTwo = UserScript(name: "Duplicate", content: "two")
        legacyTwo.isLocal = true
        var legacy = UserScript(name: "Duplicate", content: "backup")
        legacy.isLocal = true
        check(UserScriptRestoreMatcher.matchingIndex(for: legacy, in: [legacyOne, legacyTwo]) == nil,
              "duplicate legacy names must not cross-apply backup host exclusions")
        var remote = UserScript(name: "Display Override", url: URL(string: "https://example.com/script.user.js"), content: "remote")
        remote.isLocal = false
        check(UserScriptRestoreMatcher.matchingIndex(for: remote, in: [stable]) == nil,
              "a remote backup entry must not match a local script")
        print("PASS: issue 508 backup userscript matching")
    }
    private static func check(_ condition: @autoclosure () -> Bool, _ message: String) {
        guard condition() else { fputs("FAIL: \(message)\n", stderr); exit(1) }
    }
}
