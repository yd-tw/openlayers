const https = require("https");
const fs = require("fs");

const postData = JSON.stringify({
  from: "2025-05-31",
  to: "2025-06-14",
  addr: "",
});

const options = {
  hostname: "webs.water.gov.taipei",
  port: 443,
  path: "/wateroff/OWS/api/StopSupplyWater",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
  },
};

const req = https.request(options, (res) => {
  let body = "";

  res.on("data", (chunk) => {
    body += chunk;
  });

  res.on("end", () => {
    const data = JSON.parse(body);

    const geojson = {
      type: "FeatureCollection",
      features: [],
    };

    data.forEach((item) => {
      const coordinates = item.sections
        .filter(
          (section) =>
            typeof section.lon === "number" && typeof section.lat === "number",
        )
        .map((section) => [section.lon, section.lat]);

      if (coordinates.length >= 2) {
        geojson.features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
          properties: {
            swNO: item.swNO,
            swArea: item.swArea,
            fsDT: item.fsDT,
            fcDT: item.fcDT,
            fsDate: item.fsDate,
            fcDate: item.fcDate,
          },
        });
      }
    });

    fs.writeFileSync(
      "water.geojson",
      JSON.stringify(geojson, null, 2),
      "utf-8",
    );
  });
});

req.write(postData);
req.end();
