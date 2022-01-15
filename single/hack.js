import * as single from "/single/minimal.js"

/** @param {NS} ns **/
export async function main(ns) {
    await single.Singleton(ns)
}