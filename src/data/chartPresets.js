
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
        distance: 24,
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
          "distance",
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
        distance: 24,
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
          "distance",
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
        distance: 24,
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
