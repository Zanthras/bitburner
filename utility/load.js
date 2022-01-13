import * as script from "/module/script-functions.js"
import * as node from "/module/node-functions.js"
import * as helper from "/module/helper-functions.js"

/** @param {NS} ns **/
export async function main(ns) {
    var allNodes = node.findAllNodes(ns)
    for (let i = 0; i < allNodes.length; i++) {
        await helper.CopyFiles(ns, allNodes[i])
    }
    ns.toast("Loading done")
}