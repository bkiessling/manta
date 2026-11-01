
export const chartPresets = {
    donut: {
      data: {
        minRows: 1,
        maxRows: null,
        minValue: 0,
        maxValue: null,
      },
  
      defaults: {
        diagram: {
          mode: "distribution",
        },
  
        animation: {
          style: "linear",
          duration: 2,
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
          showCategory: true,
          showValue: true,
          fontSize: 12,
          distance: 24,
        },
      },
  
      options: {
        diagram: {
          modes: ["distribution", "progress"],
        },
  
        animation: {
          styles: [
            "linear",
            "easeOut",
            "easeInOut",
            "spring",
            "bounce",
          ],
  
          controls: [
            "style",
            "duration",
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
  };
  