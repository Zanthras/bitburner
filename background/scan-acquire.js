import * as script from "/module/script-functions.js"
import * as node from "/module/node-functions.js"
import * as helper from "/module/helper-functions.js"

var results = [];

export async function main(ns) {
    ns.disableLog("scp")
    ns.disableLog("scan")
    ns.disableLog("sleep")
    ns.disableLog("getServerMinSecurityLevel")
    ns.disableLog("getServerMaxMoney")
    ns.disableLog("getServerMaxRam")
    ns.disableLog("getServerGrowth")
    ns.disableLog("getServerSecurityLevel")
    ns.disableLog("getServerMoneyAvailable")

    var nodes = node.AllRemoteServers

    while (true) {
        results = [];
        await ns.write("server_status.txt", "", "w")
        for (let i = 0; i < nodes.length; i++) {
            await ns.sleep(1)
            await OwnAndStatus(ns, nodes[i])
        }
        results.sort(function (a, b) {
            return a.Sec - b.Sec;
        });
        for (let i = 0; i < results.length; i++) {
            await ns.write("server_status.txt", results[i].Status, "a")
        }
        // Sleep for 1 minute between each scan
        await ns.sleep(60 * 1000)
    }
}

/** @param {NS} ns **/
async function OwnAndStatus(ns, node) {
    if (node.startsWith("home")) {
        return
    }
    let hackStatus = tryHack(ns, node)
    await helper.CopyFiles(ns, node)
    let nodeCol = node.padEnd(20, " ")
    let secCol = ("Sec: " + ns.getServerMinSecurityLevel(node)).padEnd(10, " ")
    let moneyCol = ("Money: " + helper.readablizeMoney(ns.getServerMaxMoney(node))).padEnd(18, " ")
    let growCol = ("Grow: " + ns.getServerGrowth(node)).padEnd(11, " ")
    let perfectCol = ("Perfect: " + script.isServerPerfect(ns, node)).padEnd(16, " ")
    let statLine = nodeCol + "| " + secCol + "| " + moneyCol + "| " + growCol + "| " + perfectCol + "| " + hackStatus + "\n"
    var status = {
        "Sec": ns.getServerMinSecurityLevel(node),
        "Money": ns.getServerMaxMoney(node),
        "Grow": ns.getServerGrowth(node),
        "Status": statLine
    }
    results.push(status)
}


/** @param {NS} ns **/
function tryHack(ns, node) {
    var serverdat = ns.getServer(node)
    var playerdat = ns.getPlayer()
    if (serverdat.requiredHackingSkill > playerdat.hacking) {
        let need = serverdat.requiredHackingSkill - playerdat.hacking
        return "Need " + need + " more hacking skill"
    }
    if (!serverdat.sshPortOpen) {
        if (ns.fileExists("brutessh.exe", "home")) {
            ns.brutessh(node)
        }
    }
    if (!serverdat.ftpPortOpen) {
        if (ns.fileExists("ftpcrack.exe", "home")) {
            ns.ftpcrack(node)
        }
    }
    if (!serverdat.smtpPortOpen) {
        if (ns.fileExists("relaysmtp.exe", "home")) {
            ns.relaysmtp(node)
        }
    }
    if (!serverdat.httpPortOpen) {
        if (ns.fileExists("httpworm.exe", "home")) {
            ns.httpworm(node)
        }
    }
    if (!serverdat.sqlPortOpen) {
        if (ns.fileExists("sqlinject.exe", "home")) {
            ns.sqlinject(node)
        }
    }
    serverdat = ns.getServer(node)
    if (serverdat.numOpenPortsRequired > serverdat.openPortCount) {
        let need = serverdat.numOpenPortsRequired - serverdat.openPortCount
        return "Need to open more ports: " + need
    }

    if (!serverdat.backdoorInstalled) {
        // ns.installBackdoor()
    }
    if (!serverdat.hasAdminRights) {
        ns.nuke(node)
        // if (ns.getServerMaxRam(ns.getHostname()) > 128) {
        // ns.run("/background/fixup.js", 1, node)
        // }
        ns.toast("Owned " + node, "success", 30000)
    }

    return "Owned"
}