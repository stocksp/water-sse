// @ts-nocheck
function makeTime(seconds) {
    return (seconds / 60).toFixed(1) + " mins"
}
function differenceInHours(date1, date2) {
    const diffMs = Math.abs(date2 - date1);
    return Math.floor(diffMs / (1000 * 60 * 60));
}

function differenceInMinutes(date1, date2) {
    const diffMs = Math.abs(date2 - date1);
    return Math.floor(diffMs / (1000 * 60));
}
const getDistVal = (date, arr) => {
    const dists = arr.filter((x) => x.distance)
    let val = dists.find((d) => d.when.getTime() < date.getTime())
    return val ? val.distance : 0
}

const getWellRuntimeData = (d) => {
    if (d.length === 0) return []
    let theData = []
    let group = []
    d.map(r => {
        const what = r.distance ? "Distance" : r.state
        //console.log("what=", what)
        //console.log("r.distance",r.distance)
        //Dist column
        const dist = r.distance
            ? r.distance

            : r.runTime
                ? makeTime(r.runTime)
                : r.state === "Well running"
                    ? r.state
                    : "-----"
        theData.push({ what, when: r.when, dist })
    })
    let groups = []
    if (theData.length) {
        theData.reverse().forEach((v, i, arr) => {
            if (!group.length) {
                if (v.what === "Well starting") group.push(v)
            } else {
                if (v.what === "Well starting") {
                    // we changed the well pump resting time on 7,18,2021
                    // from less than 30 minutes to 190 plus
                    const pumpSpan = 210
                    //console.log("span", pumpSpan)
                    const previous = group[group.length - 1]
                    const diff = differenceInMinutes(v.when, previous.when)
                    if (diff < pumpSpan + parseFloat(previous.dist)) {
                        group.push(v)
                    } else {
                        groups.push(group)
                        group = []
                        group.push(v)
                    }
                }

                if (v.what === "Well ran") {
                    group.push(v)
                }
            }
        })
        // add last one
        groups.push(group)
        groups.reverse()
        //console.log("groups before", groups)
        //const distData = data.filter((d) => d.dist);
        groups = groups.map((v, i, arr) => {
            let time = v
                .filter((o) => o.what === "Well ran")
                .reduce((a, b) => {
                    return a + parseFloat(b.dist)
                }, 0)
            time = Math.round(time * 10) / 10
            //console.log("time", time)
            // frags = "49.0,9.8,7.4,1.2"
            const frags = v
                .filter((o) => o.what === "Well ran")
                .reduce((a, b) => {
                    return a + b.dist.split(" ")[0] + "+"
                }, "")
                .slice(0, -1)
            const distStr = `${getDistVal(v[0].when, d)}-${getDistVal(v[v.length - 1].when, d)}`
            /* console.log(
                "frags",
                frags,
                "start time",
                getDistVal(v[0].when, d),
                getDistVal(v[v.length - 1].when, d)
            ) */
            const sinceLastPump =
                i < arr.length - 1
                    ? differenceInHours(v[0].when, arr[i + 1][arr[i + 1].length - 1].when)
                    : 0
            return {
                time,
                frags,
                sinceLastPump,
                when: v[v.length - 1].when,
                dists: distStr,
            }
        })
        console.log("groups", groups)
    }

    return groups;
}
export default getWellRuntimeData