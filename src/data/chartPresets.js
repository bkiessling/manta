
export const chartPresets = {
  donut: {
    data: {
      minRows: 1,
      maxRows: null,
      minValue: 0,
      maxValue: null,
    },

    defaults: {
      format: "percent",

      animation: {
        style: "linear",
        duration: 2,
        speed: 50,
        bounce: 35,
      },

      appearance: {
        size: 70,
        positionX: 50,
        positionY: 28,
        thickness: 30,
        gap: 3,
        rotation: 0,
      },

      labels: {
        showCategory: false,
        showValue: false,
        fontSize: 12,
      },
    },

    options: {
      animation: {
        styles: [
          "linear",
          "easeOut",
          "easeInOut",
          "spring",
        ],
        controls: [
          "style",
          "duration",
          "speed",
          "bounce",
        ],
      },

      appearance: {
        controls: [
          "size",
          "positionX",
          "positionY",
          "thickness",
          "gap",
          "rotation",
        ],
      },

      labels: {
        controls: [
          "showCategory",
          "showValue",
          "fontSize",
        ],
      },
    },
  },

  welle: {
    data: {
      minRows: 1,
      maxRows: 1,
      minValue: 0,
      maxValue: 100,
    },

    defaults: {
      format: "percent",

      animation: {
        style: "easeInOut",
        duration: 3,
        speed: 50,
        bounce: 35,
      },

      appearance: {
        waveHeight: 12,
        waveSpeed: 50,
      },

      labels: {
        showCategory: false,
        showValue: false,
        fontSize: 12,
      },
    },

    options: {
      animation: {
        styles: [
          "linear",
          "easeOut",
          "easeInOut",
        ],
        controls: [
          "style",
          "duration",
        ],
      },

      appearance: {
        controls: [
          "waveHeight",
          "waveSpeed",
        ],
      },

      labels: {
        controls: [
          "showCategory",
          "showValue",
          "fontSize",
        ],
      },
    },
  },

  explosion: {
    data: {
      minRows: 1,
      maxRows: 1,
      minValue: 0,
      maxValue: null,
    },

    defaults: {
      format: "number",

      animation: {
        style: "easeInOut",
        duration: 3,
        speed: 50,
        bounce: 35,
      },

      appearance: {
        size: 80,
        growth: 100,
        particleCount: 24,
      },

      labels: {
        showCategory: false,
        showValue: false,
        fontSize: 12,
      },
    },

    options: {
      animation: {
        styles: [
          "linear",
          "easeOut",
          "easeInOut",
        ],
        controls: [
          "style",
          "duration",
        ],
      },

      appearance: {
        controls: [
          "size",
          "growth",
          "particleCount",
        ],
      },

      labels: {
        controls: [],
      },
    },
  },
};


for (const preset of Object.values(chartPresets)) {
  preset.defaults.labels.positions = {};
  preset.defaults.labels.color = "#111111";
  preset.defaults.output = { transparent: true, backgroundColor: "#f5f5f3" };
}
for (const [type, maxRows] of [["bar", 12], ["group", 8]]) {
  chartPresets[type] = {
    data: { minRows: 1, maxRows, minValue: 0, maxValue: type === "group" ? 100 : null },
    defaults: {
      format: "number",
      animation: { style: "linear", duration: 2, speed: 50, bounce: 35 },
      appearance: { size: 85, positionX: 50, positionY: type === "group" ? 35 : 40,
        gap: type === "group" ? 3 : 8, ...(type === "group" ? { peopleCount: 100 } : {}) },
      labels: { showCategory: true, showValue: true, fontSize: 12, positions: {}, color: "#111111" },
      output: { transparent: true, backgroundColor: "#f5f5f3" },
    },
    options: { animation: { styles: ["linear", "easeOut", "easeInOut", "spring"] } },
  };
}

// Preserve the existing visual sizes while using actual design-pixel font sizes.
chartPresets.welle.defaults.labels.fontSize = 24;
chartPresets.explosion.defaults.labels.fontSize = 80;
chartPresets.explosion.options.appearance.controls = ["growth", "particleCount"];
chartPresets.bar.defaults.appearance.orientation = "horizontal";
chartPresets.group.defaults.animation.groupMode = "individual";
chartPresets.group.defaults.animation.pulse = false;
for (const preset of Object.values(chartPresets)) {
  if (preset.options.labels) preset.options.labels.controls = ["showCategory", "showValue", "fontSize"];
}
