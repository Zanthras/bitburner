import * as script from "/module/script-functions.js"


export const ScriptDelay = 200
export const StackDelay = 200
export const MinStackInterval = (ScriptDelay * 2) + StackDelay


/** @param {NS} ns **/
export function CalcStacks(ns, node, percent) {
    let hackThreads = script.calcThreadstoDrainNPercentMoney(ns, node, percent)
    // For lots of reasons we might overhack and undergrow, so lets add a safety margin
    let gP = percent + .4
    gP = Math.min(gP, .99)
    let growThreads = script.calcThreadstoRestoreFromNPercentDrained(ns, node, gP)
    let hackSecIncrease = hackThreads * 0.002
    let growSecIncrease = growThreads * 0.004
    let weakenThreads = Math.ceil((hackSecIncrease + growSecIncrease) / .05)
    let cycleTime = ns.getHackTime(node)
    cycleTime = cycleTime + StackDelay
    let maxCycles = Math.floor(cycleTime / MinStackInterval)
    maxCycles = Math.max(maxCycles, 1)
    let maxAvailableThreads = script.getServerThreadMax(ns)
    let stackThreads = hackThreads + growThreads + weakenThreads
    let stacks = Math.floor(maxAvailableThreads / stackThreads)
    let final = Math.min(stacks, maxCycles)
    // ns.tprintf("%18s hT: %d gT: %d wT %d AvailT: %d stacks", node, hackThreads, growThreads, weakenThreads, maxAvailableThreads, stacks)
    return { "Total": maxCycles, "Stacks": final }
}


export function generateStack(ns, percent, node) {
    let hackTime = ns.getHackTime(node)
    let growTime = ns.getGrowTime(node)
    let weakenTime = ns.getWeakenTime(node)
    let growDelay = (weakenTime - growTime) - ScriptDelay
    let hackDelay = (weakenTime - hackTime) - (ScriptDelay * 2)
    let hackThreads = script.calcThreadstoDrainNPercentMoney(ns, node, percent)
    // For lots of reasons we might overhack and undergrow, so lets add a safety margin
    let gP = percent + .4
    gP = Math.min(gP, .99)
    let growThreads = script.calcThreadstoRestoreFromNPercentDrained(ns, node, gP)
    let hackSecIncrease = hackThreads * 0.002
    let growSecIncrease = growThreads * 0.004
    let weakenThreads = Math.ceil((hackSecIncrease + growSecIncrease) / .05)
    let tohack = { "Script": "hack", "Target": node, "Sleep": hackDelay, "Duration": hackTime, "Threads": hackThreads }
    let togrow = { "Script": "grow", "Target": node, "Sleep": growDelay, "Duration": growTime, "Threads": growThreads }
    let toweak = { "Script": "weaken", "Target": node, "Sleep": 0, "Duration": weakenTime, "Threads": weakenThreads }
    return {
        "h": tohack,
        "g": togrow,
        "w": toweak
    }
}