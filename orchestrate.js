import * as script from "/module/script-functions.js"
import * as stack from "/module/stack-functions.js"
import * as helper from "/module/helper-functions.js"

/** @param {NS} ns **/
export async function main(ns) {

    ns.disableLog("getServerMaxRam")
    ns.disableLog("getServerMinSecurityLevel")
    ns.disableLog("getServerSecurityLevel")
    ns.disableLog("getServerMaxMoney")
    ns.disableLog("getServerMoneyAvailable")
    ns.disableLog("getServerUsedRam")
    ns.disableLog("sleep")

    var node = ns.args[0]
    var percent = script.GetLargestPercent(ns, node)
    var loops = 0

    var host = ns.getHostname()
    var scriptName = ns.getScriptName()

    await script.FixUpServer(ns, node)

    let stackCount = 0;
    var fixedStack = false
    if (ns.args.length > 1) {
        stackCount = parseFloat(ns.args[1])
        fixedStack = true
    } else {
        let stackData = stack.CalcStacks(ns, node, percent)
        stackCount = stackData.Stacks
    }
    ns.tprintf("%s Starting an orchestration with %d stacks of %d%% steal", new Date().toISOString(), stackCount, Math.floor(percent * 100))

    if (stackCount <= 1) {
        await runSimpleStacks(ns, node)
    }

    var busts = 0
    while (true) {
        if (!script.isServerPerfect(ns, node)) {
            busts++
            await script.waitforAllSinglecompletion(ns, node)
            await script.FixUpServer(ns, node)
            continue
        }
        let stackData = stack.CalcStacks(ns, node, percent)
        if (!fixedStack) {
            stackCount = stackData.Stacks
        }
        let hackTime = ns.getHackTime(node)
        let notUsedStacks = stackData.Total - stackData.Stacks
        hackTime = hackTime - (notUsedStacks * stack.MinStackInterval)
        let cycleTime = ns.getWeakenTime(node) + hackTime
        let runTime = 0
        let moneyGained = 0
        if (ns.args.length > 1) {
            let dets = ns.getRunningScript(scriptName, host, node, stackCount)
            runTime = dets.onlineRunningTime
            moneyGained = dets.onlineMoneyMade
        } else {
            let dets = ns.getRunningScript(scriptName, host, node)
            runTime = dets.onlineRunningTime
            moneyGained = dets.onlineMoneyMade
        }
        let loopCounter = ns.sprintf("(%d/%d)", busts, loops)
        let income = helper.readablizeMoney((moneyGained / runTime))
        ns.tprintf("%s %18s: %8s loops - Income Per Second %6s", new Date().toISOString(), node, loopCounter, income)
        // ns.tprint(node + " loops: ", loops + " " + new Date().toISOString() + " " + income)
        loops++
        let startTime = Date.now()
        let stackInfo = stack.generateStack(ns, percent, node)
        for (let i = 0; i < stackCount; i++) {
            let cycleStartTime = Date.now()
            if (script.isServerPerfect(ns, node)) {
                startStack(ns, i, node, stackInfo)
            } else {
                ns.tprintf("Skipping stack " + i)
            }
            let cycleEndTime = Date.now()
            let timeToKill = stack.MinStackInterval - (cycleEndTime - cycleStartTime)
            await ns.sleep(timeToKill)
        }
        let endTime = Date.now()
        if (endTime < startTime + cycleTime) {
            let sleepTime = (startTime + cycleTime) - endTime
            sleepTime = sleepTime + 1000
            // ns.tprint("sleeping for " + sleepTime / 1000)
            await ns.sleep(sleepTime)
        } else {
            let actual = endTime - startTime
            ns.tprint("Overshot by " + actual - cycleTime)
        }
    }
}

/** @param {NS} ns **/
function startStack(ns, sID, node, stackInfo) {
    let start = Date.now()
    let tohack = stackInfo.h
    let togrow = stackInfo.g
    let toweak = stackInfo.w
    tohack["ExpectedEnd"] = start + toweak.Duration - (stack.ScriptDelay * 2)
    togrow["ExpectedEnd"] = start + toweak.Duration - stack.ScriptDelay
    toweak["ExpectedEnd"] = start + toweak.Duration
    tohack["Stack"] = sID
    togrow["Stack"] = sID
    toweak["Stack"] = sID
    ns.run(script.hack_js, tohack.Threads, node, JSON.stringify(tohack))
    ns.run(script.grow_js, togrow.Threads, node, JSON.stringify(togrow))
    ns.run(script.weaken_js, toweak.Threads, node, JSON.stringify(toweak))
}

/** @param {NS} ns **/
async function simpleStack(ns, node, percent) {
    let hackThreads = script.calcThreadstoDrainNPercentMoney(ns, node, percent)
    let growThreads = script.calcThreadstoRestoreFromNPercentDrained(ns, node, percent)
    let hackSecIncrease = hackThreads * 0.002
    let growSecIncrease = growThreads * 0.004
    let weakenThreads = Math.ceil((hackSecIncrease + growSecIncrease) / .05)
    let tAvail = script.getServerThreadAvail(ns)
    let tTotal = (hackThreads + growThreads + weakenThreads)
    if (tAvail < tTotal) {
        if (percent == .01) {
            ns.tprint("Need " + (tTotal - tAvail) + " more threads to run stacks")
            ns.exit()
        } else {
            if (tTotal - tAvail == 1) {
                hackThreads -= 1
            }
        }
    }
    let tohack = { "Script": "hack", "Target": node, "Sleep": 0 }
    let togrow = { "Script": "grow", "Target": node, "Sleep": 0 }
    let toweak = { "Script": "weaken", "Target": node, "Sleep": 0 }
    ns.run(script.hack_js, hackThreads, node, JSON.stringify(tohack))
    ns.run(script.grow_js, growThreads, node, JSON.stringify(togrow))
    ns.run(script.weaken_js, weakenThreads, node, JSON.stringify(toweak))
    await script.waitforAllSinglecompletion(ns, node)
    // await script.waitforcompletion(ns, script.hack_js, node)
    // await script.waitforcompletion(ns, script.grow_js, node)
    // await script.waitforcompletion(ns, script.weaken_js, node)
}


/** @param {NS} ns **/
async function runSimpleStacks(ns, node) {
    let percent = script.GetLargestPercent(ns, node)
    while (true) {
        // min percent is 1% so.... in case we cant actually do 1% lets just do a serial fix
        if (percent == .01) {
            await script.FixUpServer(ns, node)
            let hackThreads = script.calcThreadstoDrainNPercentMoney(ns, node, percent)
            let tohack = { "Script": "hack", "Target": target, "Sleep": 0 }
            ns.run(script.hack_js, hackThreads, node, JSON.stringify(tohack))
            await script.waitforAllSinglecompletion(ns, node)
        } else {
            await script.FixUpServer(ns, node)
            await simpleStack(ns, node, percent)
        }
    }
}

export function autocomplete(data, args) {
    return [...data.servers];
}