/** @param {NS} ns **/
export async function main(ns) {

    ns.disableLog("grow")
    ns.disableLog("weaken")

    var target = "";
    var execution = "";
    if (ns.args.length > 0) {
        target = ns.args[0]
        execution = "weaken"
    } else {
        target = "joesguns"
        execution = "grow"
    }
    while (true) {
        await ns[execution](target)
    }
}


async function cheater(ns) {
    await ns.weaken("home")
}