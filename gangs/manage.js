/** @param {NS} ns **/
export async function main(ns) {
    // ns.disableLog("purchaseEquipment")
    while (true) {
        if (ns.gang.canRecruitMember()) {
            let memberCount = ns.gang.getMemberNames().length
            memberCount++
            let newName = "Faceless-" + String(memberCount).padStart(3, "0")
            let attempted = ns.gang.recruitMember(newName)
            if (attempted) {
                ns.toast("Recruited a dude " + newName, "info", 30 * 1000)
            } else {
                ns.toast("Failed to recruit a dude " + newName, "error", 30 * 1000)
            }
            continue
        }
        await AscendGangMembers(ns)
        await EquipGangMembers(ns)
        let orderedMembers = getSortedGangMembers(ns)
        if (orderedMembers.length == 1) {
            ns.toast("Write the code for a single gang member!", "info", 1000 * 10)
            continue
        }
        let trainingHalf = Math.ceil(orderedMembers.length / 2)
        if (orderedMembers.length == 12) {
            trainingHalf = 8
        }
        for (let i = 0; i < trainingHalf; i++) {
            let trainingMember = orderedMembers.pop()
            ns.gang.setMemberTask(trainingMember, "Train Combat")
        }
        if (orderedMembers.length == 1) {
            ns.toast("Write the code for a single gang member not training!", "info", 1000 * 10)
            await ns.sleep(60 * 1000)
            continue
        }
        // wanted pentaly of 1 is no deduction 0 is everything
        if (ns.gang.getGangInformation().wantedPenalty < .98) {
            let robin = orderedMembers.pop()
            ns.gang.setMemberTask(robin, "Vigilante Justice")
        }
        if (ns.gang.getGangInformation().wantedPenalty < .9) {
            let batman = orderedMembers.pop()
            ns.gang.setMemberTask(batman, "Vigilante Justice")
        }
        if (ns.gang.getGangInformation().wantedPenalty < .7) {
            let catgirl = orderedMembers.pop()
            ns.gang.setMemberTask(catgirl, "Vigilante Justice")
        }
        // if (ns.gang.getMemberNames().length == 12) {
        // 	let guard = orderedMembers.pop()
        // 	ns.gang.setMemberTask(guard, "Territory Warfare")
        // }
        for (let i = 0; i < orderedMembers.length; i++) {
            let missionMember = orderedMembers[i]
            let member = ns.gang.getMemberInformation(missionMember)
            let stats = gangMemberTotalStats(member)
            let task = "Mug People"
            if (stats > 2200) {
                task = "Strongarm Civilians"
            }
            if (stats > 4000) {
                task = "Human Trafficking"
            }
            ns.gang.setMemberTask(missionMember, task)
        }
        await ns.sleep(60 * 1000)
    }
}

/** @param {NS} ns **/
function getSortedGangMembers(ns) {

    let members = ns.gang.getMemberNames()
    let topName = ""
    let toSort = []
    for (let i = 0; i < members.length; i++) {
        let member = ns.gang.getMemberInformation(members[i])
        toSort.push({
            "Name": members[i],
            "Stats": gangMemberTotalStats(member)
        })
    }
    toSort.sort(function (a, b) {
        return b.Stats - a.Stats;
    });
    let final = []
    for (let i = 0; i < toSort.length; i++) {
        final.push(toSort[i].Name)
    }

    return final
}

function gangMemberTotalStats(member) {
    let total = 0
    total = total + member.agi
    total = total + member.cha
    total = total + member.def
    total = total + member.dex
    total = total + member.hack
    total = total + member.str
    return total
}

/** @param {NS} ns **/
async function EquipGangMembers(ns) {
    let members = ns.gang.getMemberNames()
    let allEquip = ns.gang.getEquipmentNames()
    for (let m = 0; m < members.length; m++) {
        let minion = members[m]
        for (let i = 0; i < allEquip.length; i++) {
            await ns.sleep(1)
            let cost = ns.gang.getEquipmentCost(allEquip[i])
            let myMoney = ns.getPlayer().money
            ns.gang.geteq
            if ((cost / myMoney) < .01) {
                ns.gang.purchaseEquipment(minion, allEquip[i])
            }
        }
    }
}

/** @param {NS} ns **/
async function AscendGangMembers(ns) {
    let members = ns.gang.getMemberNames()
    for (let i = 0; i < members.length; i++) {
        await ns.sleep(1)
        let possibleResults = ns.gang.getAscensionResult(members[i])
        if (typeof possibleResults == 'undefined') {
            continue
        }
        if (possibleResults.agi > 1.6) {
            ns.toast("Ascending " + members[i], "success", 15 * 1000)
            ns.gang.ascendMember(members[i])
            continue
        }
        if (possibleResults.cha > 1.6) {
            ns.toast("Ascending " + members[i], "success", 15 * 1000)
            ns.gang.ascendMember(members[i])
            continue
        }
        if (possibleResults.def > 1.6) {
            ns.toast("Ascending " + members[i], "success", 15 * 1000)
            ns.gang.ascendMember(members[i])
            continue
        }
        if (possibleResults.dex > 1.6) {
            ns.toast("Ascending " + members[i], "success", 15 * 1000)
            ns.gang.ascendMember(members[i])
            continue
        }
        if (possibleResults.hack > 1.6) {
            ns.toast("Ascending " + members[i], "success", 15 * 1000)
            ns.gang.ascendMember(members[i])
            continue
        }
        if (possibleResults.str > 1.6) {
            ns.toast("Ascending " + members[i], "success", 15 * 1000)
            ns.gang.ascendMember(members[i])
            continue
        }
    }
}