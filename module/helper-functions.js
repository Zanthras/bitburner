/** @param {NS} ns **/
export async function CopyFiles(ns, node) {
    if (node == "home") {
        return
    }
    await ns.scp(["/distribute/hack.js", "/distribute/loader.js", "/distribute/random.js"], "home", node)
    await ns.scp(["calcBestMPS.js", "targetted.js", "orchestrate.js"], "home", node)
    await ns.scp(["/single/hack.js", "/single/grow.js", "/single/weaken.js", "/single/idle.js", "/single/minimal.js"], "home", node)
    await ns.scp(["/module/helper-functions.js", "/module/node-functions.js", "/module/script-functions.js", "/module/stack-functions.js", "/module/globals.js"], "home", node)
    await ns.scp(["/background/fixup.js", "/background/mass-fix.js", "/background/idle.js", "/background/manage-hacknet.js"], "home", node)
}

export function readablizeBytes(bytes) {
    var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
    var e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
}

export function readablizeMoney(number) {
    if (number == 0) {
        return "0$"
    }
    var s = ['$', 'K$', 'M$', 'B$', 'T$', 'Q$'];
    var e = Math.floor(Math.log(number) / Math.log(1000));
    return (number / Math.pow(1000, e)).toFixed(2) + "" + s[e];
}