import * as global from "/module/globals.js"

// Pass the object below to use
// {
// 	"Script": "hack",
// 	"Target": "N00dles",
// 	"Sleep": 432,
// 	"Stack": 1,
//  "Duration" 28939,
// 	"ExpectedEnd": 17893627252,
//  "Loop": 0
// }

/** @param {NS} ns **/
export async function Singleton(ns) {
    var data = JSON.parse(ns.args[1])
    if (data.Sleep > 0) {
        let start = Date.now()
        let expectedTotal = (data.Duration + data.Sleep)
        let startDelay = (expectedTotal + start) - data.ExpectedEnd
        if (startDelay > data.Sleep) {
            ns.tprintf("%s %s stack %d too much startup delay %.2f", data.Target, data.Script, data.Stack, startDelay)
        }
        // shorten the sleep to manage startup delay
        if (startDelay > 5) {
            data.Sleep = data.Sleep - startDelay
        }
        await ns.sleep(data.Sleep)
        let endTime = Date.now()
        let actual = endTime - start
        let delta = actual - data.Sleep
        if (delta > global.StackDelay) {
            // ns.tprintf("%s %s stack %d overslept by %.2f", data.Target, data.Script, data.Stack, delta)
            // let metrics = { "script": data.Script, "overshoot": delta, "ts": endTime, "target": data.Target }
            // await ns.writePort(global.METRICS_PORT, JSON.stringify(metrics))
            // return
        }
    }
    await ns[data.Script](data.Target)
    // ns.tprint(new Date().toISOString(), " ", data.Script, " done")
    // if ("ExpectedEnd" in data) {
    // 	let endTime = Date.now()
    // 	let delta = endTime - data.ExpectedEnd
    // 	let metrics = { "script": data.Script, "overshoot": delta, "ts": endTime, "target": data.Target }
    // 	await ns.writePort(global.METRICS_PORT, JSON.stringify(metrics))
    // }
    // ns.tprintf("%s %s %d complete overrun %.2f", new Date().toISOString(), data.Script, data.Stack, delta)
}

// DO NOT REMOVE
// Artificially inflate the cost so i can run any of the basic functions without using them all in the same script
function staticCost(ns) {
    ns.weaken("home")
}