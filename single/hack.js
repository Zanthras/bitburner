/** @param {NS} ns **/
export async function main(ns) {
    var target = ns.args[0]
    if (ns.args.length > 1) {
        let sleepTime = parseFloat(ns.args[1])
        let start = Date.now()
        await ns.sleep(sleepTime)
        let end = Date.now()
        let actual = end - start
        let delta = actual - sleepTime
        if (delta > 100) {
            ns.tprint("overslept by " + delta)
        }
    }
    await ns.hack(target)
    if (ns.args.length > 3) {
        var expectedEndTime = parseFloat(ns.args[3])
        let endTime = Date.now()
        let delta = endTime - expectedEndTime
        if (delta > 200) {
            ns.tprint("delta " + delta + " stack " + ns.args[2])
        }
    }
}