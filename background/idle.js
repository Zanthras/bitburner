import * as script from "/module/script-functions.js"

/** @param {NS} ns **/
export async function main(ns) {

    var singleInstance = ns.getScriptRam("/single/weaken.js", ns.getHostname())
    var max = ns.getServerMaxRam(ns.getHostname())
    let instances = Math.floor(max / singleInstance)

    if (ns.args.length == 0) {
        await script.FixUpServer(ns, "joesguns")
        ns.spawn("/single/idle.js", instances)
    } else {
        await script.FixUpServer(ns, ns.args[0])
        ns.spawn("/single/idle.js", instances, ns.args[0])
    }
}