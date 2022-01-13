import * as script from "/module/script-functions.js"

/** @param {NS} ns **/
export async function main(ns) {

    ns.disableLog("getServerMaxRam")
    ns.disableLog("getServerMinSecurityLevel")
    ns.disableLog("getServerSecurityLevel")
    ns.disableLog("getServerMaxMoney")
    ns.disableLog("getServerMoneyAvailable")
    ns.disableLog("sleep")
    ns.disableLog("run")


    var target = ns.args[0]
    await script.FixUpServer(ns, target)
}


export function autocomplete(data, args) {
    return [...data.servers];
}