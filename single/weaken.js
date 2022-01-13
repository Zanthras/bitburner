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
export async function main(ns) {

    var data = JSON.parse(ns.args[1])
    if (data.Sleep > 0) {
        let start = Date.now()
        let expectedTotal = (data.Duration + data.Sleep)
        let startDelay = (expectedTotal + start) - data.ExpectedEnd
        if (startDelay > 150) {
            data.Sleep = data.Sleep - startDelay
            ns.tprintf("%s stack %d startupdelay %.2f", data.Script, data.Stack, startDelay)
        }
        await ns.sleep(data.Sleep)
        let end = Date.now()
        let actual = end - start
        let delta = actual - data.Sleep
        if (delta > global.StackDelay) {
            ns.tprintf("%s stack %d overslept by %.2f", data.Script, data.Stack, delta)
            return
        }
    }
    await ns[data.Script](data.Target)
    let endTime = Date.now()
    let delta = endTime - data.ExpectedEnd
    // ns.tprintf("%s %s %d complete overrun %.2f", new Date().toISOString(), data.Script, data.Stack, delta)
}

// DO NOT REMOVE
// Artificially inflate the cost so i can run any of the basic functions without using them all in the same script
function staticCost(ns) {
    ns.weaken("home")
}