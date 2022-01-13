/** @param {NS} ns **/

export var AllRemoteServers = ["iron-gym", "max-hardware", "omega-net", "avmnite-02h", "I.I.I.I", "rho-construction", "global-pharm", "lexo-corp", "aerocorp", "zb-institute", "millenium-fitness", "snap-fitness", "unitalife", "solaris", "deltaone", "zeus-med", "nova-med", "microdyne", "univ-energy", "icarus", "defcomm", "zb-def", "applied-energetics", "vitalife", "stormtech", "kuai-gong", "blade", "4sigma", "powerhouse-fitness", "clarkinc", "ecorp", "titan-labs", "helios", ".", "b-and-a", "megacorp", "taiyang-digital", "run4theh111z", "fulcrumtech", "omnitek", "nwo", "The-Cave", "fulcrumassets", "infocomm", "alpha-ent", "netlink", "rothman-uni", "the-hub", "summit-uni", "aevum-police", "galactic-cyber", "omnia", "harakiri-sushi", "hong-fang-tea", "joesguns", "CSEC", "nectar-net", "neo-net", "crush-fitness", "johnson-ortho", "catalyst", "syscore", "sigma-cosmetics", "foodnstuff", "n00dles", "zer0", "phantasy", "comptek", "silver-helix"]

export function findAllNodes(ns) {
    let scanned = new Map();
    scanned.set("home", "true")
    let toscan = ns.scan("home")
    while (toscan.length > 0) {
        let next = toscan.pop()
        let alreadyScanned = scanned.has(next)
        if (alreadyScanned) {
            continue
        } else {
            scanned.set(next, "true")
            let nextScan = ns.scan(next)
            nextScan.forEach(elem => toscan.push(elem))
        }
    }
    var nodes = Array.from(scanned.keys());
    return nodes
}

/** @param {NS} ns **/
export function findAllHomeNodes(ns) {
    let nodes = [];
    nodes.push("home")
    let neighbors = ns.scan("home")
    for (let i = 0; i < neighbors.length; i++) {
        if (neighbors[i].startsWith("home")) {
            nodes.push(neighbors[i])
        }
    }
    return nodes
}

/** @param {NS} ns **/
export function filterRootedNodes(ns, nodes) {
    var owned = [];
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].startsWith("home")) {
            continue
        }
        let sDat = ns.getServer(nodes[i])
        if (sDat.hasAdminRights) {
            owned.push(nodes[i])
        }
    }
    return owned
}

/** @param {NS} ns **/
export function filterNotHome(ns, nodes) {
    var other = [];
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].startsWith("home")) {
            continue
        }
        other.push(nodes[i])
    }
    return other
}


/** @param {NS} ns **/
export function getTargetted(ns, nodes) {
    var t = new Map();
    for (let i = 0; i < nodes.length; i++) {
        let processes = ns.ps(nodes[i])
        // let allArgs = [];
        for (let j = 0; j < processes.length; j++) {
            for (let p = 0; p < processes[j].args.length; p++) {
                let arg = processes[j].args[p]
                t.set(arg, true)
                // allArgs.push(arg)
            }
        }
        // if (nodes[i].startsWith("home-")) {
        // 	ns.tprint(allArgs)
        // }
    }
    return t
}

/** @param {NS} ns **/
export function getTargettedOnNode(ns, node) {
    var t = new Map();
    let processes = ns.ps(node)
    // let allArgs = [];
    for (let j = 0; j < processes.length; j++) {
        for (let p = 0; p < processes[j].args.length; p++) {
            let arg = processes[j].args[p]
            t.set(arg, true)
            // allArgs.push(arg)
        }
    }
    return t
}

/** @param {NS} ns **/
export function getHackingNodes(ns, nodes) {
    var t = new Map();
    for (let i = 0; i < nodes.length; i++) {
        if (!nodes[i].startsWith("home-")) {
            continue
        }
        let processes = ns.ps(nodes[i])
        for (let j = 0; j < processes.length; j++) {
            if (processes[j].filename != "targetted.js") {
                continue
            }
            for (let p = 0; p < processes[j].args.length; p++) {
                let arg = processes[j].args[p]
                t.set(arg, true)
            }
        }
    }
    return t
}

/** @param {NS} ns **/
export function filterUntargetted(ns, nodes, args) {

    var free = [];
    for (let i = 0; i < nodes.length; i++) {
        if (args.get(nodes[i])) {
            // ns.tprint("skipping " + nodes[i])
        } else {
            free.push(nodes[i])
        }
    }
    return free
}

/** @param {NS} ns **/
export function sortBySpeed(ns, nodes) {

    let results = []
    for (let i = 0; i < nodes.length; i++) {
        results.push({
            "node": nodes[i],
            "time": ns.getWeakenTime(nodes[i])
        })
    }
    results.sort(function (a, b) {
        return a.time - b.time;
    });

    let final = []
    for (let i = 0; i < results.length; i++) {
        final.push(results[i].node)
    }
    return final
}