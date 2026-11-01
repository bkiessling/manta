import { motion } from "motion/react";

export default function BarChart({
    data,
    barHeight = 16,
    color = "#111111",
}) {
    const sortedData = [...data.data].sort((a, b) => b.value - a.value);
    return (
        <div>
            {sortedData.map((item, index) => (
                <div key={item.label}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "300px",
                        }}
                    >
                        <span>{item.label}</span>
                        <span>
                            {item.value}{data.unit === "percent" ? "%" : ""}
                        </span>
                    </div>

                    <div
                        style={{
                            width: "300px",
                            height: `${barHeight}px`,
                        }}
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{
                                duration: 1,
                                delay: index * 0.15,
                            }}
                            style={{
                                height: "100%",
                                background: color,
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}