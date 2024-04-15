function convertUtcToGmt7(utcDateString, gmt = null, end = null) {
    const utcDate = new Date(utcDateString);

    let gmt7Date = new Date(utcDate.getTime() + 7 * 3600 * 1000);
    if (end) {
        gmt7Date = new Date(utcDate.getTime() + 30 * 3600 * 1000 + 59 * 61 * 1000);
    }

    if (gmt) {
        return gmt7Date;
    }

    const formattedDate = gmt7Date.toISOString().slice(0, 10);

    return formattedDate;
}

function getCreatedTimezone(utcDateString) {
    const utcDate = new Date(utcDateString);
    utcDate.setUTCHours(0, 0, 0, 0);
    return new Date(utcDate.getTime() - 7 * 3600 * 1000);
}

module.exports = { convertUtcToGmt7, getCreatedTimezone }