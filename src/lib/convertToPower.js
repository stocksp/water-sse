// @ts-nocheck
import { browser } from '$app/environment'
function parseJSON(dateString) {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

function compareDesc(dateA, dateB) {
  return dateB.getTime() - dateA.getTime();
}
let power = []
const converter = (d) => {
  console.log('running convert!!');
  if (browser) {
    power = d.powerDocs.map((doc) => {
      doc.when = parseJSON(doc.when);
      return doc;
    });
  }

  let foundFirstPressure = false;
  let foundFirstWell = false;

  power = d.powerDocs.reduce((acc, cur, index) => {
    if (!foundFirstPressure && cur.state === "on" && cur.pump === "pressure") {
      cur.state = "Pressure running";
      foundFirstPressure = true;
      acc.push(cur);
      return acc;
    } else if (!foundFirstWell && cur.state === "on" && cur.pump === "well") {
      cur.state = "Well running";
      foundFirstWell = true;
      acc.push(cur);
      return acc;
    } else if (cur.state === "off" && cur.pump === "well") {
      cur.state = "Well ran";
      foundFirstWell = true;
      acc.push(cur);
    } else if (cur.state === "on" && cur.pump === "well") {
      cur.state = "Well starting";
      acc.push(cur);
    } else if (cur.state === "off" && cur.pump === "pressure") {
      cur.state = "Pressure ran";
      foundFirstPressure = true;
      acc.push(cur);
    }
    return acc;
  }, []);
  let dist = []
  if (browser) {
    dist = d.distDocs.map((doc) => {
      doc.when = parseJSON(doc.when); // Assuming 'when' is already a Date object
      return doc;
    });
  } else {
    dist = d.distDocs
  }

  return power.concat(dist).sort((a, b) => compareDesc(a.when, b.when));
};

export default converter;
