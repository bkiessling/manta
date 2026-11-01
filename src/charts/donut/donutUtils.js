/* Scritp: Wie wird die Donut-Geometrie mathematisch berechnet? *

/*
  Wandelt Winkel + Radius in eine Position im SVG um.

  0° liegt oben.
  90° liegt rechts.
  180° liegt unten.
  270° liegt links.
*/
export function polarToCartesian(cx, cy, radius, angle) {
    const angleInRadians = ((angle - 90) * Math.PI) / 180;

    return {
        x: cx + radius * Math.cos(angleInRadians),
        y: cy + radius * Math.sin(angleInRadians),
    };
}

/*
  Erzeugt den SVG-Pfad für ein einzelnes Donut-Segment.

  Das Segment besteht aus:
  - äußerem Kreisbogen
  - gerader Kante nach innen
  - innerem Kreisbogen
  - gerader Kante zurück nach außen
*/
export function createDonutSegment(
    cx,
    cy,
    outerRadius,
    innerRadius,
    startAngle,
    endAngle
) {
    // Verhindert Probleme bei einem Segment mit praktisch 0°.
    const safeEndAngle = Math.max(endAngle, startAngle + 0.001);

    const outerStart = polarToCartesian(
        cx,
        cy,
        outerRadius,
        startAngle
    );

    const outerEnd = polarToCartesian(
        cx,
        cy,
        outerRadius,
        safeEndAngle
    );

    const innerEnd = polarToCartesian(
        cx,
        cy,
        innerRadius,
        safeEndAngle
    );

    const innerStart = polarToCartesian(
        cx,
        cy,
        innerRadius,
        startAngle
    );

    const largeArcFlag =
        safeEndAngle - startAngle > 180 ? 1 : 0;

    return `
        M ${outerStart.x} ${outerStart.y}
        A ${outerRadius} ${outerRadius}
          0 ${largeArcFlag} 1
          ${outerEnd.x} ${outerEnd.y}

        L ${innerEnd.x} ${innerEnd.y}

        A ${innerRadius} ${innerRadius}
          0 ${largeArcFlag} 0
          ${innerStart.x} ${innerStart.y}

        Z
    `;
}