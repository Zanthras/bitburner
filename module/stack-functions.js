import * as script from "/module/script-functions.js"
import * as global from "/module/globals.js"


/** @param {NS} ns **/
export function CalcStacks(ns, node, percent) {
    let threadCount = script.calcThreadstoStealNPercent(ns, node, percent)
    let hackSecIncrease = threadCount.Hack * 0.002
    let growSecIncrease = threadCount.Grow * 0.004
    let weakenThreads = Math.ceil((hackSecIncrease + growSecIncrease) / .05)
    let cycleTime = ns.getHackTime(node)
    cycleTime = cycleTime + global.StackDelay
    let maxCycles = Math.floor(cycleTime / global.MinStackInterval)
    maxCycles = Math.max(maxCycles, 1)
    let maxAvailableThreads = script.getServerThreadMax(ns)
    let stackThreads = threadCount.Hack + threadCount.Grow + weakenThreads
    let stacks = Math.floor(maxAvailableThreads / stackThreads)
    let final = Math.min(stacks, maxCycles)
    if (percent == 0) {
        final = 0
    }
    // ns.tprintf("%18s hT: %d gT: %d wT %d AvailT: %d stacks:%d tN:%d percent:%d%%", node, threadCount.Hack, threadCount.Grow, weakenThreads, maxAvailableThreads, final, stackThreads, percent*100)
    return { "Total": maxCycles, "Stacks": final }
}

/** @param {NS} ns **/
export function generateStack(ns, percent, node) {
    let hackTime = ns.getHackTime(node)
    let growTime = ns.getGrowTime(node)
    let weakenTime = ns.getWeakenTime(node)
    let growDelay = (weakenTime - growTime) - global.ScriptDelay
    let hackDelay = (weakenTime - hackTime) - (global.ScriptDelay * 2)
    let threadCount = script.calcThreadstoStealNPercent(ns, node, percent)
    let hackSecIncrease = threadCount.Hack * 0.002
    let growSecIncrease = threadCount.Grow * 0.004
    let weakenThreads = Math.ceil((hackSecIncrease + growSecIncrease) / .05)
    let tohack = { "Script": "hack", "Target": node, "Sleep": hackDelay, "Duration": hackTime, "Threads": threadCount.Hack }
    let togrow = { "Script": "grow", "Target": node, "Sleep": growDelay, "Duration": growTime, "Threads": threadCount.Grow }
    let toweak = { "Script": "weaken", "Target": node, "Sleep": 0, "Duration": weakenTime, "Threads": weakenThreads }
    return {
        "h": tohack,
        "g": togrow,
        "w": toweak
    }
}