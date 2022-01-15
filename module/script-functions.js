export const hack_js = "/single/hack.js"
export const grow_js = "/single/grow.js"
export const weaken_js = "/single/weaken.js"
export const idle_js = "/single/idle.js"
export const minimal_js = "/single/minimal.js"
export const GrowWeakenThreadRatio = .9259

/** @param {NS} ns **/
export function getServerThreadMax(ns) {
    let host = ns.getHostname()
    var singleInstance = ns.getScriptRam(minimal_js, host)
    var max = ns.getServerMaxRam(host)
    if (max > 1000) {
        max = max - 128 // Massive overhead... thats really tiny on a TB class servers
    }
    let instances = Math.floor(max / singleInstance)
    return instances
}

/** @param {NS} ns **/
export function getServerThreadAvail(ns) {
    let host = ns.getHostname()
    var singleInstance = ns.getScriptRam(grow_js, host)
    var max = ns.getServerMaxRam(host)
    if (max > 1000) {
        max = max - 128 // Massive overhead... thats really tiny on a TB class servers
    } else {
        max = max - 10
    }
    var used = ns.getServerUsedRam(host)
    let instances = Math.floor((max - used) / singleInstance)
    if (instances < 0) {
        instances = 0
    }
    return instances
}

/** @param {NS} ns **/
export function calcThreadCount(ns, script) {

    let host = ns.getHostname()
    var singleInstance = ns.getScriptRam(script, host)
    var max = ns.getServerMaxRam(host)
    max = max - 128 // Massive overhead... thats really tiny on a TB class servers
    let instances = Math.floor(max / singleInstance)
    return instances
}

/** @param {NS} ns **/
export function isServerAtMaxMoney(ns, host) {
    let maxMoney = ns.getServerMaxMoney(host)
    let currentMoney = ns.getServerMoneyAvailable(host)
    return currentMoney == maxMoney
}

/** @param {NS} ns **/
export function isServerAtMinSecurity(ns, host) {
    let minSecurity = ns.getServerMinSecurityLevel(host)
    let currentSecurity = ns.getServerSecurityLevel(host)
    return currentSecurity <= minSecurity
}

/** @param {NS} ns **/
export function isServerPerfect(ns, host) {
    return isServerAtMinSecurity(ns, host) && isServerAtMaxMoney(ns, host)
}

/** @param {NS} ns **/
export async function waitforcompletion(ns, script, host) {
    // Just a small sleep just in case of spawning delay
    await ns.sleep(1000)

    while (true) {
        let found = ns.isRunning(script, ns.getHostname(), host)
        if (!found) {
            return
        }
        await ns.sleep(100)
    }
}

/** @param {NS} ns **/
export async function waitforAllSinglecompletion(ns, target) {
    // Just a small sleep just in case of spawning delay
    await ns.sleep(500)

    while (true) {
        let found = false
        let existing = ns.ps()
        for (let i = 0; i < existing.length; i++) {
            if (existing[i].filename.startsWith("/single")) {
                if (existing[i].args[0] == target) {
                    found = true
                    break
                }
            }
        }
        if (found) {
            await ns.sleep(100)
        } else {
            return
        }
    }
}

/** @param {NS} ns **/
export function GetLargestPercent(ns, target) {
    var startPercent = .00
    while (startPercent < .95) {
        startPercent += .01
        let threadCount = calcThreadstoStealNPercent(ns, target, startPercent)
        let hackSecIncrease = threadCount.Hack * 0.002
        let growSecIncrease = threadCount.Grow * 0.004
        let weakenThreadsNeeded = Math.ceil((hackSecIncrease + growSecIncrease) / .05)
        let availThreads = getServerThreadAvail(ns)
        let totalNeeded = threadCount.Hack + threadCount.Grow + weakenThreadsNeeded
        // ns.tprintf(
        // 	"Percent: %d hT:%d gT:%d wT:%d tT:%d aT:%d",
        // 	Math.floor(startPercent * 100),
        // 	threadCount.Hack,
        // 	threadCount.Grow,
        // 	weakenThreadsNeeded,
        // 	totalNeeded,
        // 	availThreads)
        if (totalNeeded > availThreads) {
            return Math.max(startPercent - .01, 0)
        }
    }
    return startPercent
}


export function calcThreadstoStealNPercent(ns, host, percent) {
    let maxMoney = ns.getServerMaxMoney(host)
    let moneyToHack = maxMoney * percent
    let hackThreads = ns.hackAnalyzeThreads(host, moneyToHack)
    hackThreads = Math.max(hackThreads, 0)
    let secIncrease = hackThreads * 0.002
    let minSec = ns.getServerMinSecurityLevel(host)
    let hackedSec = minSec + secIncrease
    let secPercent = hackedSec / minSec
    // Pad the grow a bit to help out during hack spikes
    let addition = Math.floor(percent / 40)
    percent = percent + (addition / 100)
    let growThreads = ns.growthAnalyze(host, 1 / (1 - percent))
    growThreads = growThreads * secPercent
    return { "Hack": Math.floor(hackThreads), "Grow": Math.ceil(growThreads) }
}


/** @param {NS} ns **/
export function calcThreadstoFullMoney(ns, host) {
    let maxMoney = ns.getServerMaxMoney(host)
    let currentMoney = ns.getServerMoneyAvailable(host)
    let needed = maxMoney / Math.max(currentMoney, 1)
    let threadsNeeded = ns.growthAnalyze(host, needed)
    return Math.ceil(threadsNeeded)
}

/** @param {NS} ns **/
export function calcThreadstoMinSecurity(ns, host) {
    let minSecurity = ns.getServerMinSecurityLevel(host)
    let currentSecurity = ns.getServerSecurityLevel(host)
    let threadsNeeded = currentSecurity - minSecurity
    threadsNeeded = threadsNeeded / .05
    return Math.ceil(threadsNeeded)
}

/** @param {NS} ns **/
export async function FixUpServer(ns, target) {
    var notified = false
    while (true) {
        if (isServerPerfect(ns, target)) {
            return
        }
        if (!notified) {
            ns.print("fixing up " + target)
            notified = true
        }
        let tAvail = getServerThreadAvail(ns)
        if (tAvail < 2) {
            // Sleep for a minute to wait for more threads
            await ns.sleep(60 * 1000)
            continue
        }
        if (!isServerAtMinSecurity(ns, target)) {
            let tNeed = calcThreadstoMinSecurity(ns, target)
            if (tNeed > tAvail) {
                tNeed = tAvail
                let toweak = { "Script": "weaken", "Target": target, "Sleep": 0 }
                ns.run(weaken_js, tNeed, target, JSON.stringify(toweak))
                await waitforAllSinglecompletion(ns, target)
                continue
            } else {
                // I have some free threads... lets grow it a bit if needed
                if (isServerAtMaxMoney(ns, target)) {
                    // No grow needed just do the weaken
                    let toweak = { "Script": "weaken", "Target": target, "Sleep": 0 }
                    ns.run(weaken_js, tNeed, target, JSON.stringify(toweak))
                    await waitforAllSinglecompletion(ns, target)
                    continue
                } else {
                    let threads = calcBalancedGrow(ns, target, tAvail - tNeed)
                    let tOvershoot = (tNeed + threads.Grow + threads.Weaken) - tAvail
                    if (tOvershoot > 0) {
                        threads.Grow = threads.Grow - tOvershoot
                    }
                    let toweak = { "Script": "weaken", "Target": target, "Sleep": 0 }
                    ns.run(weaken_js, threads.Weaken + tNeed, target, JSON.stringify(toweak))
                    let togrow = { "Script": "grow", "Target": target, "Sleep": 0 }
                    ns.run(grow_js, threads.Grow, target, JSON.stringify(togrow))
                    await waitforAllSinglecompletion(ns, target)
                    continue
                }
            }
        }
        if (!isServerAtMaxMoney(ns, target)) {
            // Grow the max I can instantly counter with weaken
            let threads = calcBalancedGrow(ns, target, tAvail)
            let tOvershoot = (threads.Grow + threads.Weaken) - tAvail
            if (tOvershoot > 0) {
                threads.Grow = threads.Grow - tOvershoot
            }
            let toweak = { "Script": "weaken", "Target": target, "Sleep": 0 }
            ns.run(weaken_js, threads.Weaken, target, JSON.stringify(toweak))
            let togrow = { "Script": "grow", "Target": target, "Sleep": 0 }
            ns.run(grow_js, threads.Grow, target, JSON.stringify(togrow))
            await waitforAllSinglecompletion(ns, target)
        }
    }
}


/** @param {NS} ns **/
function calcBalancedGrow(ns, target, threadsAvail) {
    if (threadsAvail == 0) {
        threadsAvail = getServerThreadAvail(ns)
    }
    // Grow the max I can instantly counter with weaken
    let maxGrowThreads = Math.floor(threadsAvail * GrowWeakenThreadRatio)
    let tNeed = calcThreadstoFullMoney(ns, target)
    tNeed = Math.min(tNeed, maxGrowThreads)
    let wNeed = Math.ceil((tNeed * .004) / .05)
    // both numbers are ceil'ed so could end up at either perfectly max, 1 or 2 over max
    if ((wNeed + tNeed) > threadsAvail) {
        diff = threadsAvail - (wNeed + tNeed)
        tNeed = tNeed - diff
    }
    return { "Grow": tNeed, "Weaken": wNeed }
}