import * as script from "/module/script-functions.js"

/** @param {NS} ns **/
export async function main(ns) {

    var singleInstance = ns.getScriptRam("/single/weaken.js", ns.getHostname())

    var ram = ns.getServerMaxRam(ns.getHostname())
    if (ns.ps().length > 1) {
        ram = ram - ns.getServerUsedRam(ns.getHostname())
        let instances = Math.floor(ram / singleInstance)
        if (ns.args.length == 0) {
            await script.FixUpServer(ns, "joesguns")
            ns.spawn("/single/idle.js", instances)
        } else {
            await script.FixUpServer(ns, ns.args[0])
            ns.run("/single/idle.js", instances, ns.args[0])
            ns.exit()
        }
    } else {
        let instances = Math.floor(ram / singleInstance)
        if (ns.args.length == 0) {
            await script.FixUpServer(ns, "joesguns")
            ns.spawn("/single/idle.js", instances)
        } else {
            await script.FixUpServer(ns, ns.args[0])
            ns.spawn("/single/idle.js", instances, ns.args[0])
        }
    }

}