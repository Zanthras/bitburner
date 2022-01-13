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
    var startPercent = .01
    while (startPercent < .95) {
        let hackThreads = calcThreadstoDrainNPercentMoney(ns, target, startPercent)
        let growThreads = calcThreadstoRestoreFromNPercentDrained(ns, target, startPercent)
        let hackSecIncrease = hackThreads * 0.002
        let growSecIncrease = growThreads * 0.004
        let weakenThreadsNeeded = Math.ceil((hackSecIncrease + growSecIncrease) / .05)
        let availThreads = getServerThreadAvail(ns)
        let totalNeeded = hackThreads + growThreads + weakenThreadsNeeded
        if (totalNeeded > availThreads) {
            // ns.tprintf(
            // 	"Percent: %d hT:%d gT:%d wT:%d tT:%d aT:%d",
            // 	Math.floor(startPercent*100),
            // 	calcThreadstoDrainNPercentMoney(ns, target, startPercent),
            // 	calcThreadstoRestoreFromNPercentDrained(ns, target, startPercent),
            // 	weakenThreads,
            // 	totalNeeded,
            // 	availThreads)
            return startPercent - .01
        }
        startPercent += .01
    }
    return startPercent
}


/** @param {NS} ns **/
export function calcThreadstoDrainNPercentMoney(ns, host, percent) {
    let maxMoney = ns.getServerMaxMoney(host)
    let needed = maxMoney * percent
    let threadsNeeded = ns.hackAnalyzeThreads(host, needed)
    threadsNeeded = Math.max(threadsNeeded, 0)
    return Math.floor(threadsNeeded)
}


/** @param {NS} ns **/
export function calcThreadstoRestoreFromNPercentDrained(ns, host, percent) {
    let threadsNeeded = ns.growthAnalyze(host, 1 / (1 - percent))
    // pad the number by 20% to hopefully... not be fucked
    threadsNeeded = threadsNeeded * 1.2
    return Math.ceil(threadsNeeded)
}

/** @param {NS} ns **/
export function calcThreadstoFullMoney(ns, host) {
    let maxMoney = ns.getServerMaxMoney(host)
    let currentMoney = ns.getServerMoneyAvailable(host)
    let needed = maxMoney / currentMoney
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
                ns.run(weaken_js, tNeed, target)
                await waitforcompletion(ns, weaken_js, target)
                continue
            } else {
                // I have some free threads... lets grow it a bit if needed
                if (isServerAtMaxMoney(ns, target)) {
                    // No grow needed just do the weaken
                    ns.run(weaken_js, tNeed, target)
                    await waitforcompletion(ns, weaken_js, target)
                    continue
                } else {
                    let threads = calcBalancedGrow(ns, target, tAvail - tNeed)
                    let tOvershoot = (tNeed + threads.Grow + threads.Weaken) - tAvail
                    if (tOvershoot > 0) {
                        threads.Grow = threads.Grow - tOvershoot
                    }
                    ns.run(grow_js, threads.Grow, target)
                    ns.run(weaken_js, threads.Weaken + tNeed, target)
                    await waitforcompletion(ns, grow_js, target)
                    await waitforcompletion(ns, weaken_js, target)
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
            ns.run(grow_js, threads.Grow, target)
            ns.run(weaken_js, threads.Weaken, target)
            await waitforcompletion(ns, grow_js, target)
            await waitforcompletion(ns, weaken_js, target)
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