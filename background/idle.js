/** @param {NS} ns **/
export async function main(ns) {
    var singleInstance = ns.getScriptRam("/single/weaken.js", ns.getHostname())
    var max = ns.getServerMaxRam(ns.getHostname())
    let instances = Math.floor(max / singleInstance)
    ns.spawn("/single/idle.js", instances)
}