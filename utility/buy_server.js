import * as helper from "/module/helper-functions.js"

/** @param {NS} ns **/
export async function main(ns) {

    if (ns.args.length == 0) {
        ns.tprint("Specify small|medium|large|max")
    }
    let maxRam = ns.getPurchasedServerMaxRam()
    let ram = 0;
    if (ns.args[0] == "micro") {
        ram = 128
    }
    if (ns.args[0] == "small") {
        ram = 512
    }
    if (ns.args[0] == "medium") {
        ram = 32768
    }
    if (ns.args[0] == "large") {
        ram = 524288
    }
    if (ns.args[0] == "afford") {
        ram = 16
        let money = ns.getPlayer().money
        while (true) {
            if (ram > maxRam) {
                ram = maxRam
                break
            }
            let cost = ns.getPurchasedServerCost(ram * 2)
            if (cost > money) {
                break
            }
            ram = ram * 2
            await ns.sleep(0)
        }
    }
    if (ns.args[0] == "max") {
        ram = maxRam
    }

    let cost = ns.getPurchasedServerCost(ram)
    let bytes = ram * 1024 * 1024 * 1024

    let nextCost = ns.getPurchasedServerCost(ram * 2)

    let approved = await ns.prompt("Ram: " + helper.readablizeBytes(bytes) + " Cost: " + helper.readablizeMoney(cost) + " Next: " + helper.readablizeMoney(nextCost))
    if (!approved) {
        ns.exit()
    }
    let newServer = ns.purchaseServer("home", ram)
    if (newServer == "") {
        ns.toast("Server purchase failed need " + helper.readablizeMoney(cost), "error", 60000)
    } else {
        ns.toast("Purchased server " + newServer + " " + helper.readablizeBytes(bytes) + " for " + helper.readablizeMoney(cost), "success", 60000)
        await helper.CopyFiles(ns, newServer)
    }
}