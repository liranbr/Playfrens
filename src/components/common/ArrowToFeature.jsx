import { ImArrowUpRight2 } from "react-icons/im";
import "./ArrowToFeature.css";

export function ArrowToFeature({ size = 32, enable, children }) {
    return (
        <div className="arrow-container">
            {children}
            {enable && (
                <ImArrowUpRight2 className="arrow-to-feature" style={{ "--sizePx": size + "px" }} />
            )}
        </div>
    );
}
