import * as script from "/module/script-functions.js"
import * as stack from "/module/stack-functions.js"
import * as helper from "/module/helper-functions.js"
import * as global from "/module/globals.js"

var host = ""
var scriptName = ""

/** @param {NS} ns **/
export async function main(ns) {

    ns.disableLog("getServerMaxRam")
    ns.disableLog("getServerMinSecurityLevel")
    ns.disableLog("getServerSecurityLevel")
    ns.disableLog("getServerMaxMoney")
    ns.disableLog("getServerMoneyAvailable")
    ns.disableLog("getServerUsedRam")
    ns.disableLog("sleep")
    ns.disableLog("run")

    var node = ns.args[0]
    var percent = 0
    if (ns.args.length > 1) {
        percent = script.GetLimitedPercent(ns, node, parseFloat(ns.args[1]))
    } else {
        percent = script.GetLargestPercent(ns, node)
    }

    host = ns.getHostname()
    scriptName = ns.getScriptName()

    await script.FixUpServer(ns, node)

    let stackCount = 0;
    let stackData = stack.CalcStacks(ns, node, percent)
    stackCount = stackData.Stacks
    ns.tprintf("%s Starting an orchestration on %s targetting %s with %d stacks of %d%% steal", new Date().toISOString(), host, node, stackCount, Math.floor(percent * 100))

    if (stackCount <= 1) {
        await runSimpleStacks(ns, node, percent)
    }

    while (true) {
        let perfect = script.isServerPerfect(ns, node)

        // let threadCount = script.calcThreadstoStealNPercent(ns, node, percent)
        let stackData = stack.CalcStacks(ns, node, percent)
        let threadCount = stackData.Threads
        let timing = {
            "h": ns.getHackTime(node),
            "g": ns.getGrowTime(node),
            "w": ns.getWeakenTime(node)
        }
        let startTime = Date.now()
        for (let i = 0; i < stackData.Stacks; i++) {
            startStack(ns, i, node, threadCount, startTime, timing, perfect)
            // give up control back to the game so it can start the newly created threads
            await ns.sleep(0)
        }
        let TotalTime = (global.MinStackInterval * (stackData.Stacks - 1)) + timing.w
        // Sleep till the weaken is for sure done
        await ns.sleep(TotalTime + 50)

        // Make sure they are done
        await script.waitforAllSinglecompletionNoDelay(ns, node)

        // Send Metrics
        let dets = ns.getRunningScript(scriptName, host, ...ns.args)
        let moneyGained = dets.onlineMoneyMade

        let lineformat = ns.sprintf("bitburner_income,server=%s,target=%s money=%.2f,stacks=%vi,percent=%.2f", host, node, moneyGained, stackData.Stacks, percent)
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://172.20.0.3:15001/telegraf", true);
        xhr.send(lineformat);
    }
}

/** @param {NS} ns **/
function startStack(ns, sID, node, threadCount, cycleStart, timings, perfect) {

    let stackDelay = global.MinStackInterval * sID

    // hack needs to hit two delays before stack end
    let hackDelay = ((timings.w - timings.h) - (global.ScriptDelay * 2)) + stackDelay
    // grow needs to hit one delay before stack end
    let growDelay = ((timings.w - timings.g) - (global.ScriptDelay * 1)) + stackDelay
    // weaken needs to hit at stack end
    let weakDelay = stackDelay

    let tohack = { "Target": node, "Sleep": hackDelay, "Duration": timings.h, "Threads": threadCount.Hack, "Stack": sID, "Script": "hack" }
    let togrow = { "Target": node, "Sleep": growDelay, "Duration": timings.g, "Threads": threadCount.Grow, "Stack": sID, "Script": "grow" }
    let toweak = { "Target": node, "Sleep": weakDelay, "Duration": timings.w, "Threads": threadCount.Weak, "Stack": sID, "Script": "weaken" }

    tohack["ExpectedEnd"] = cycleStart + hackDelay + timings.h
    togrow["ExpectedEnd"] = cycleStart + growDelay + timings.g
    toweak["ExpectedEnd"] = cycleStart + weakDelay + timings.w

    let shouldSkip = (!perfect && sID == 0)
    if (!shouldSkip) {
        if (tohack.Threads > 0) {
            ns.run(script.hack_js, tohack.Threads, node, JSON.stringify(tohack))
        }
    }
    if (togrow.Threads > 0) {
        ns.run(script.grow_js, togrow.Threads, node, JSON.stringify(togrow))
    }

    if (toweak.Threads > 0) {
        ns.run(script.weaken_js, toweak.Threads, node, JSON.stringify(toweak))
    }

}

/** @param {NS} ns **/
async function simpleStack(ns, node, percent) {
    let threadCount = script.calcThreadstoStealNPercent(ns, node, percent)
    let timing = {
        "h": ns.getHackTime(node),
        "g": ns.getGrowTime(node),
        "w": ns.getWeakenTime(node)
    }
    let startTime = Date.now()
    startStack(ns, 0, node, threadCount, startTime, timing, true)
    await script.waitforAllSinglecompletion(ns, node)
}

/** @param {NS} ns **/
async function runSimpleStacks(ns, node, percent) {
    while (true) {
        // If I cant even do a 1% stack then alternate between hacking and fixing
        if (percent < .01) {
            await script.FixUpServer(ns, node)
            let hackThreads = script.calcThreadstoHack1Percent(ns, node)
            hackThreads = Math.min(hackThreads, 1)
            let tohack = { "Script": "hack", "Target": node, "Sleep": 0 }
            ns.run(script.hack_js, hackThreads, node, JSON.stringify(tohack))
            await script.waitforAllSinglecompletion(ns, node)
        } else {
            await script.FixUpServer(ns, node)
            await simpleStack(ns, node, percent)
        }
        let dets = ns.getRunningScript(scriptName, host, ...ns.args)
        let moneyGained = dets.onlineMoneyMade
        let lineformat = ns.sprintf("bitburner_income,server=%s,target=%s money=%.2f,stacks=1i,percent=%.2f", host, node, moneyGained, percent)
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://172.20.0.3:15001/telegraf", true);
        xhr.send(lineformat);
    }
}

export function autocomplete(data, args) {
    return [...data.servers];
}