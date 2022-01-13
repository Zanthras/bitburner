import * as script from "/module/script-functions.js"
import * as node from "/module/node-functions.js"
// import * as helper from "/module/helper-functions.js"

/** @param {NS} ns **/
export async function main(ns) {

    ns.disableLog("getServerMaxRam")
    ns.disableLog("getServerMinSecurityLevel")
    ns.disableLog("getServerSecurityLevel")
    ns.disableLog("getServerMaxMoney")
    ns.disableLog("getServerMoneyAvailable")
    ns.disableLog("getServerUsedRam")
    ns.disableLog("sleep")
    ns.disableLog("scan")
    // ns.disableLog("run")

    while (true) {
        let tAvail = script.getServerThreadAvail(ns)
        if (tAvail < 2) {
            ns.print("Waiting for free threads")
            await ns.sleep(1000 * 15)
            continue
        }
        let ownedNodes = node.filterRootedNodes(ns, node.AllRemoteServers)
        ownedNodes = node.sortBySpeed(ns, ownedNodes)
        let targetted = node.getTargetted(ns, node.findAllHomeNodes(ns))
        let perfect = 0
        let touched = 0
        for (let i = 0; i < ownedNodes.length; i++) {
            let target = ownedNodes[i]
            let tAvail = script.getServerThreadAvail(ns)
            // Dont touch perfect servers
            if (script.isServerPerfect(ns, target)) {
                perfect++
                continue
            }
            // When we cant do anything break out of the server check to go wait for a sleep to complete
            if (tAvail < 2) {
                break
            }
            // Any server that has work being done to it should be ignored
            if (targetted.get(target)) {
                continue
            }
            if (!script.isServerAtMinSecurity(ns, target)) {
                ns.print("Lowering security on " + target)
                let tNeed = script.calcThreadstoMinSecurity(ns, target)
                if (tNeed > tAvail) {
                    tNeed = tAvail
                    ns.run(script.weaken_js, tNeed, target)
                    touched++
                    continue
                } else {
                    // I have some free threads... lets grow it a bit if needed
                    if (script.isServerAtMaxMoney(ns, target)) {
                        // No grow needed just do the weaken
                        ns.run(script.weaken_js, tNeed, target)
                        touched++
                        continue
                    } else {
                        let threads = calcBalancedGrow(ns, target, tAvail - tNeed)
                        let tOvershoot = (tNeed + threads.Grow + threads.Weaken) - tAvail
                        if (tOvershoot > 0) {
                            threads.Grow = threads.Grow - tOvershoot
                        }
                        ns.run(script.grow_js, threads.Grow, target)
                        ns.run(script.weaken_js, threads.Weaken + tNeed, target)
                        touched++
                        continue
                    }
                }
            }
            if (!script.isServerAtMaxMoney(ns, target)) {
                ns.print("Balanced grow on " + target)
                let threads = calcBalancedGrow(ns, target, tAvail)
                let tOvershoot = (threads.Grow + threads.Weaken) - tAvail
                if (tOvershoot > 0) {
                    threads.Grow = threads.Grow - tOvershoot
                }
                ns.run(script.grow_js, threads.Grow, target)
                ns.run(script.weaken_js, threads.Weaken, target)
                touched++
                continue
            }
        }
        let msg = ""
        if (touched == 0) {
            msg = "Waiting for all servers to complete"
        }
        if (perfect == ownedNodes.length) {
            msg = "Waiting for new servers"
        }
        if (msg != "") {
            ns.print(msg)
            await ns.sleep(1000 * 60)
        }
    }
}

/** @param {NS} ns **/
function calcBalancedGrow(ns, target, threadsAvail) {
    if (threadsAvail == 0) {
        threadsAvail = script.getServerThreadAvail(ns)
    }
    // Grow the max I can instantly counter with weaken
    let maxGrowThreads = Math.floor(threadsAvail * script.GrowWeakenThreadRatio)
    let tNeed = script.calcThreadstoFullMoney(ns, target)
    tNeed = Math.min(tNeed, maxGrowThreads)
    let wNeed = Math.ceil((tNeed * .004) / .05)
    // both numbers are ceil'ed so could end up at either perfectly max, 1 or 2 over max
    if ((wNeed + tNeed) > threadsAvail) {
        diff = threadsAvail - (wNeed + tNeed)
        tNeed = tNeed - diff
    }
    return { "Grow": tNeed, "Weaken": wNeed }
}