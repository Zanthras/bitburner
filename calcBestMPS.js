import * as script from "/module/script-functions.js"
import * as node from "/module/node-functions.js"
import * as helper from "/module/helper-functions.js"
import * as stack from "/module/stack-functions.js"
import * as global from "/module/globals.js"

/** @param {NS} ns **/
export async function main(ns) {

    ns.disableLog("getServerMaxRam")
    ns.disableLog("getServerMinSecurityLevel")
    ns.disableLog("getServerSecurityLevel")
    ns.disableLog("getServerMaxMoney")
    ns.disableLog("getServerMoneyAvailable")
    ns.disableLog("sleep")
    ns.disableLog("run")

    var allNodes = node.findAllNodes(ns)
    var hackable = node.filterNotHome(ns, allNodes)
    let targetted = node.getTargetted(ns, allNodes)

    var all = false
    if (ns.args.length > 0) {
        all = ns.args[0] == "all"
        if (!all) {
            hackable = [ns.args[0]]
        } else {
            hackable = allNodes
        }
    }

    var options = []
    for (let i = 0; i < hackable.length; i++) {

        let node = hackable[i]
        let serverPerfect = script.isServerPerfect(ns, node)
        let mps = 0
        let max = ns.getServerMaxMoney(node)
        let cur = ns.getServerMoneyAvailable(node)
        let stackData = { "Total": 0, "Stacks": 0 }
        let percent = .01
        if (max == 0 || cur == 0) {
            mps = 0 // still 0
        } else {
            let cycleTime = 0
            percent = script.GetLargestPercent(ns, node)
            stackData = stack.CalcStacks(ns, node, percent)
            let stolen = max * Math.max(percent, .01)
            if (stackData.Stacks > 1) {
                let hackTime = ns.getHackTime(node)
                let notUsedStacks = stackData.Total - stackData.Stacks
                hackTime = hackTime - (notUsedStacks * global.MinStackInterval)
                cycleTime = ns.getWeakenTime(node) + hackTime
            } else {
                if (percent == 0) {
                    let hackTime = ns.getHackTime(node)
                    cycleTime = ns.getWeakenTime(node) + hackTime
                } else {
                    cycleTime = ns.getWeakenTime(node)
                }
            }
            mps = stolen / (cycleTime / 1000)
        }
        let isTargetted = ""
        let isPerfect = ""
        if (serverPerfect) {
            isPerfect = "   Perfect   "
        } else {
            let minSecurity = ns.getServerMinSecurityLevel(node)
            let currentSecurity = ns.getServerSecurityLevel(node)
            let secPercent = (currentSecurity / minSecurity).toFixed(2)
            let maxMoney = ns.getServerMaxMoney(node)
            let currentMoney = ns.getServerMoneyAvailable(node)
            let monPercent = ((currentMoney / maxMoney) * 100).toFixed(2)
            isPerfect = ns.sprintf("S:%.2f M:%3d%%", secPercent, monPercent)
        }
        let sDat = ns.getServer(node)
        if (targetted.get(node)) {
            isTargetted = "In-Use"
        } else {
            if (sDat.hasAdminRights) {
                isTargetted = "Avail"
            } else {
                isTargetted = "NotRooted"
            }
        }
        let hackPercent = ns.hackAnalyzeChance(node)
        options.push({
            "node": node,
            "gain": mps,
            "percent": Math.floor(percent * 100),
            "stacks": stackData,
            "perfect": isPerfect,
            "targetted": isTargetted,
            "root": sDat.hasAdminRights,
            "chance": hackPercent,
            "totalGain": mps * stackData.Stacks * hackPercent
        })
    }
    options.sort(function (a, b) {
        if (a.totalGain != b.totalGain) {
            return a.totalGain - b.totalGain;
        }
        return a.gain - b.gain;
    });
    for (let i = 0; i < options.length; i++) {
        let doPrint = false
        if (all) {
            doPrint = true
        } else {
            if (options[i].root) {
                doPrint = true
            }
        }
        if (doPrint) {
            ns.tprintf("%18s %8s(%2d%%) * %3d(%3d) = %8s(%3d%%) %s %s",
                options[i].node,
                helper.readablizeMoney(options[i].gain),
                options[i].percent,
                options[i].stacks.Stacks,
                options[i].stacks.Total,
                helper.readablizeMoney(options[i].gain * options[i].stacks.Stacks * options[i].chance),
                Math.floor(options[i].chance * 100),
                options[i].perfect,
                options[i].targetted)
        }
        await ns.sleep(1)
    }
}


export function autocomplete(data, args) {
    return [...data.servers];
}