/** @param {NS} ns **/
export async function main(ns) {

    var target = "";
    if (ns.args.length > 0) {
        target = ns.args[0]
    } else {
        target = "n00dles"
    }
    while (true) {
        await ns.weaken(target)
    }
}