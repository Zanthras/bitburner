/** @param {NS} ns **/
export async function main(ns) {

    // reset the global store when augmented
    var nodeCount = ns.hacknet.numNodes()
    if (nodeCount == 0) {
        ns.rm("/background/hacknet_moneyspent.txt")
        await ns.write("/background/hacknet_moneyspent.txt", 0, "w")
    }

    ns.disableLog("sleep")
    while (true) {
        let waitTime = await buyLevel(ns)
        await ns.sleep(waitTime)
    }
}
/** @param {NS} ns **/
async function buyLevel(ns) {
    var moneySpent = ns.read("/background/hacknet_moneyspent.txt")
    moneySpent = parseFloat(moneySpent)
    var newNodeCost = getNewNodeCost(ns)
    var nodeCount = ns.hacknet.numNodes()
    var cheapestNode = -1;
    var cheapestCost = 1e300;
    var myMoney = ns.getPlayer().money

    let reserved = Math.floor(moneySpent*.4)
    myMoney = myMoney - reserved

    for (let i = 0; i < nodeCount; i++) {
        let cost = getCheapestNodeCost(ns, i)

        if (cost < cheapestCost) {
            cheapestCost = cost
            cheapestNode = i
        }
    }
    if (cheapestCost < newNodeCost) {
        if (cheapestCost > myMoney) {
            ns.print("Cant afford " + cheapestCost - " node upgrade cost have " + myMoney)
            return 10000
        } else {
            moneySpent = cheapestCost + moneySpent
            await ns.write("/background/hacknet_moneyspent.txt", moneySpent, "w")
            ns.print("Upgrade node " + cheapestNode + " it will cost " + cheapestCost)
            upgradeNode(ns, cheapestNode)
            return 250
        }
    } else {
        if (newNodeCost > myMoney) {
            ns.print("Cant afford " + cheapestCost - " new node cost have " + myMoney)
            return 10000
        } else {
            moneySpent = newNodeCost + moneySpent
            await ns.write("/background/hacknet_moneyspent.txt", moneySpent, "w")
            ns.print("buy new node it will cost " + newNodeCost)
            ns.hacknet.purchaseNode()
            return 1000
        }
    }
}

/** @param {NS} ns **/
function getNewNodeCost(ns) {
    var cost = 1e300
    var maxNodes = ns.hacknet.maxNumNodes()
    var nodeCount = ns.hacknet.numNodes()
    if (maxNodes == nodeCount) {
        return Math.floor(cost)
    }
    return Math.floor(ns.hacknet.getPurchaseNodeCost())
}

/** @param {NS} ns **/
function getCheapestNodeCost(ns, nodeNum) {
    var lcost = ns.hacknet.getLevelUpgradeCost(nodeNum)
    var rcost = ns.hacknet.getRamUpgradeCost(nodeNum)
    var ccost = ns.hacknet.getCoreUpgradeCost(nodeNum)
    return Math.floor(Math.min(lcost, rcost, ccost))
}

/** @param {NS} ns **/
function upgradeNode(ns, nodeNum) {
    var lcost = ns.hacknet.getLevelUpgradeCost(nodeNum)
    var rcost = ns.hacknet.getRamUpgradeCost(nodeNum)
    var ccost = ns.hacknet.getCoreUpgradeCost(nodeNum)
    var mincost = Math.min(lcost, rcost, ccost)
    if (mincost == lcost) {
        ns.hacknet.upgradeLevel(nodeNum, 1)
        return
    }
    if (mincost == rcost) {
        ns.hacknet.upgradeRam(nodeNum, 1)
        return
    }
    if (mincost == ccost) {
        ns.hacknet.upgradeCore(nodeNum, 1)
        return
    }
}