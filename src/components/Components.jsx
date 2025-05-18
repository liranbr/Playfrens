import React from "react";
import "./Components.css";

export function OutlinedIcon({ children, stroke = "black", strokeWidth = 1 }) {
    const baseProps = {
        style: {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            stroke,
            strokeWidth,
            pointerEvents: "none",
            fill: "none"
        }
    };

    const topProps = {
        style: {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
        }
    };

    return (
        <div style={{ position: "relative", display: "inline-block", width: "100%", height: "100%" }}>
            {React.cloneElement(children, baseProps)}
            {React.cloneElement(children, topProps)}
        </div>
    );
}