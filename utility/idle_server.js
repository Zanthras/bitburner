import * as helper from "/module/helper-functions.js"

/** @param {NS} ns **/
export async function main(ns) {

    let newServer = ns.purchaseServer("home", ns.getPurchasedServerMaxRam())
    if (newServer == "") {
        ns.toast("Server purchase failed need " + helper.readablizeMoney(cost), "error", 15000)
    } else {
        ns.toast("Purchased idle server " + newServer, "success", 15000)
        await helper.CopyFiles(ns, newServer)
        ns.exec("/background/idle.js", newServer)
    }
}