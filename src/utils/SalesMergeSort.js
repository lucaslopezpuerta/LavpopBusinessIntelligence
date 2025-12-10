const txtY = input.yesterdayCsv
    .replace(/^IMTString\(\d+\):\s*/, "")
    .replace(/^\uFEFF/, "")
    .trim();
const txtM = input.masterCsv.replace(/^\uFEFF/, "").trim();

const linesY = txtY.split(/\r?\n/).filter((l) => l.trim());
const linesM = txtM.split(/\r?\n/).filter((l) => l.trim());

if (linesY.length < 2) throw new Error("No data in yesterdayCsv");
if (linesM.length < 1) throw new Error("No data in masterCsv");

const sepY = linesY[0].includes(";") ? ";" : ",";
const sepM = linesM[0].includes(";") ? ";" : ",";

function splitCSV(line, sep) {
    let out = [],
        cur = "",
        inQ = false;
    for (const ch of line) {
        if (ch === '"') {
            inQ = !inQ;
            continue;
        }
        if (ch === sep && !inQ) {
            out.push(cur);
            cur = "";
            continue;
        }
        cur += ch;
    }
    out.push(cur);
    return out;
}

const hdrY = splitCSV(linesY.shift(), sepY).map((h) => h.replace(/^"|"$/g, ""));
const rowsY = linesY.map((l) =>
    splitCSV(l, sepY).map((c) => c.replace(/^"|"$/g, ""))
);

const hdrM = splitCSV(linesM.shift(), sepM).map((h) => h.replace(/^"|"$/g, ""));
const rowsM = linesM.map((l) =>
    splitCSV(l, sepM).map((c) => c.replace(/^"|"$/g, ""))
);

const idxDate = hdrY.indexOf("Data_Hora");
if (idxDate < 0)
    throw new Error("Header 'Data_Hora' not found in Yesterday CSV");

function parseDateTime(dt) {
    const [date, time] = dt.split(" ");
    const [DD, MM, YYYY] = date.split("/");
    return new Date(`${YYYY}-${MM}-${DD}T${time}`);
}

rowsY.sort((a, b) => parseDateTime(a[idxDate]) - parseDateTime(b[idxDate]));

const mergedRows = rowsM.concat(rowsY);

const outLines = [
    hdrM.map((h) => `"${h}"`).join(sepM),
    ...mergedRows.map((r) => r.map((c) => `"${c}"`).join(sepM)),
];

return outLines.join("\r\n");
